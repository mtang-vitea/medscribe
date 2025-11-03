from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict
import asyncio
import uuid

from extraction_service import ExtractionService
from prompt_clinical_extraction import CATEGORIES

app = FastAPI(title="Medical AI Scribe API", version="1.0.0")

# CORS for local Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve project assets (logos) under /assets
# This maps to the repository root so the existing logo files are accessible.
app.mount("/assets", StaticFiles(directory="."), name="assets")

# Initialize service
extraction_service = ExtractionService()

# In-memory status tracking for mock jobs
processing_jobs: Dict[str, Dict] = {}


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
    async def transcribe_audio(file: UploadFile = File(...)):
        """POST /api/transcript/transcribe — Transcribe audio to text."""
        processing_id = str(uuid.uuid4())

        # Mock asynchronous job creation
        processing_jobs[processing_id] = {
            "status": "processing",
            "filename": file.filename,
            "createdAt": asyncio.get_event_loop().time()
        }

        # Simulate delayed transcription task
        asyncio.create_task(TranscriptController._simulate_transcription(processing_id))
        return JSONResponse(content={"processingId": processing_id, "status": "started"})

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
async def transcribe_audio(file: UploadFile = File(...)):
    return await TranscriptController.transcribe_audio(file)


@app.get("/api/transcript/status/{processing_id}")
async def get_processing_status(processing_id: str):
    return await TranscriptController.get_processing_status(processing_id)


@app.get("/api/transcript/health")
async def health_check():
    return await TranscriptController.health_check()


@app.get("/api/transcript/categories")
async def get_categories():
    return await TranscriptController.get_categories()
