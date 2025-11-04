from fastapi import FastAPI, UploadFile, File, Form, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional
import asyncio
import uuid
import os
import tempfile

from extraction_service import ExtractionService
from prompt_clinical_extraction import CATEGORIES

app = FastAPI(title="Medical AI Scribe API", version="1.0.0")

# CORS for local Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve project assets (logos) under /assets
# This maps to the repository root so the existing logo files are accessible.
app.mount("/assets", StaticFiles(directory="."), name="assets")

# Initialize service
extraction_service = ExtractionService()

# In-memory status tracking for mock jobs (retained for backward compatibility)
processing_jobs: Dict[str, Dict] = {}


def _to_jsonable(obj):
    """Recursively convert SDK objects (e.g., OpenAI TranscriptionSegment) into JSON-serializable primitives."""
    import collections.abc

    # Primitive types
    if obj is None or isinstance(obj, (bool, int, float, str)):
        return obj

    # Collections
    if isinstance(obj, (list, tuple, set)):
        return [_to_jsonable(x) for x in obj]

    if isinstance(obj, dict):
        return {str(k): _to_jsonable(v) for k, v in obj.items()}

    # Objects from SDKs (pydantic-like or simple attribute containers)
    try:
        if hasattr(obj, "model_dump") and callable(getattr(obj, "model_dump")):
            return _to_jsonable(obj.model_dump())
        if hasattr(obj, "dict") and callable(getattr(obj, "dict")):
            return _to_jsonable(obj.dict())
        # Fallback to public attributes
        return _to_jsonable({k: v for k, v in vars(obj).items() if not k.startswith("_")})
    except Exception:
        # Last resort: string representation
        try:
            return str(obj)
        except Exception:
            return None


class TranscriptController:
    """Controller handling transcript-related operations."""

    @staticmethod
    async def process_transcript(request_data: Dict):
        """POST /api/transcript/process — Extract clinical data from a transcript."""
        transcript = request_data.get("transcript")
        options = request_data.get("options", {})

        if not transcript:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Missing transcript text."}
            )

        result = await extraction_service.process_transcript(transcript, options)
        return JSONResponse(content=result)

    @staticmethod
    async def transcribe_audio(
        file: UploadFile = File(...),
        language: Optional[str] = Form(None),
        deleteAfterTranscription: Optional[bool] = Form(False),
    ):
        """POST /api/transcript/transcribe — Transcribe audio to text using OpenAI Whisper API."""
        try:
            # Check if OpenAI API key is available
            if not os.getenv("OPENAI_API_KEY"):
                raise RuntimeError("OPENAI_API_KEY not configured. Audio transcription requires OpenAI API access.")

            # Save uploaded file to a temporary location
            if not file:
                return JSONResponse(status_code=400, content={"success": False, "error": "No file uploaded"})

            suffix = os.path.splitext(file.filename or "audio")[1] or ".mp3"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                temp_path = tmp.name
                content = await file.read()
                tmp.write(content)

            # Check if file exists
            if not os.path.exists(temp_path):
                raise FileNotFoundError("Audio file not found")

            # Get file size
            file_size_mb = os.path.getsize(temp_path) / (1024 * 1024)
            if file_size_mb > 25:
                # Clean up temp file before raising
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass
                raise ValueError("Audio file is too large. Maximum size is 25MB.")

            print(f"Transcribing audio file: {os.path.basename(temp_path)} ({file_size_mb:.2f} MB)")

            # Use ExtractionService's OpenAI client
            client = extraction_service.openai_client
            if client is None:
                raise RuntimeError("OpenAI client not initialized.")

            # Open a stream for the audio file
            with open(temp_path, "rb") as audio_stream:
                transcription = client.audio.transcriptions.create(
                    file=audio_stream,
                    model=os.getenv("OPENAI_TRANSCRIBE_MODEL", "whisper-1"),
                    language=language or "en",
                    response_format="verbose_json",
                    prompt=(
                        "This is a medical consultation between a doctor and patient. "
                        "Please transcribe accurately including medical terminology."
                    ),
                )

            # Delete temp file if requested (default false per signature)
            if deleteAfterTranscription:
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass

            # Prepare response
            return JSONResponse(
                content={
                    "success": True,
                    "transcript": getattr(transcription, "text", None),
                    "duration": getattr(transcription, "duration", None),
                    "language": getattr(transcription, "language", language or "en"),
                    "segments": _to_jsonable(getattr(transcription, "segments", None)),
                    "metadata": {
                        "fileSize": f"{file_size_mb:.2f} MB",
                        "processedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                        "model": os.getenv("OPENAI_TRANSCRIBE_MODEL", "whisper-1"),
                    },
                }
            )

        except Exception as error:  # Map to detailed error messages
            print("Transcription error:", error)

            # Derive status code if present
            status = getattr(getattr(error, "response", None), "status_code", None) or getattr(error, "status_code", None)
            code = getattr(error, "code", None)

            message = None
            if code == "invalid_api_key":
                message = "Invalid OpenAI API key for transcription."
            elif code == "insufficient_quota":
                message = "OpenAI API quota exceeded. Please check your account."
            elif status == 413:
                message = "Audio file is too large for transcription."
            elif status == 415:
                message = "Unsupported audio format. Please use MP3, MP4, MPEG, MPGA, M4A, WAV, or WEBM."
            elif isinstance(error, FileNotFoundError):
                message = str(error)
            elif isinstance(error, ValueError):
                message = str(error)
            else:
                message = f"Failed to transcribe audio: {str(error)}"

            return JSONResponse(status_code=400, content={"success": False, "error": message})

    @staticmethod
    async def get_processing_status(processing_id: str):
        """GET /api/transcript/status/{processing_id} — Check transcription job status."""
        job = processing_jobs.get(processing_id)
        if not job:
            return JSONResponse(status_code=404, content={"error": "Processing ID not found."})
        return JSONResponse(content=job)

    @staticmethod
    async def health_check():
        """GET /api/transcript/health — API health check."""
        return JSONResponse(content={"status": "healthy", "service": "Medical AI Scribe"})

    @staticmethod
    async def get_categories():
        """GET /api/transcript/categories — List available extraction categories."""
        return JSONResponse(content={"categories": CATEGORIES})

    @staticmethod
    async def _simulate_transcription(processing_id: str):
        """Simulate background transcription (mock)."""
        await asyncio.sleep(3)
        processing_jobs[processing_id]["status"] = "completed"
        processing_jobs[processing_id]["transcript"] = (
            "Doctor: Hello, how are you today? "
            "Patient: I've had chest pain for two days..."
        )

@app.post("/api/transcript/process")
async def process_transcript(request_data: Dict):
    return await TranscriptController.process_transcript(request_data)


@app.post("/api/transcript/transcribe")
async def transcribe_audio(file: UploadFile = File(...), language: Optional[str] = Form(None), deleteAfterTranscription: Optional[bool] = Form(False)):
    return await TranscriptController.transcribe_audio(file, language, deleteAfterTranscription)


@app.get("/api/transcript/status/{processing_id}")
async def get_processing_status(processing_id: str):
    return await TranscriptController.get_processing_status(processing_id)


@app.get("/api/transcript/health")
async def health_check():
    return await TranscriptController.health_check()


@app.get("/api/transcript/categories")
async def get_categories():
    return await TranscriptController.get_categories()
