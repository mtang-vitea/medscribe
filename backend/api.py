import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uuid import uuid4
from datetime import datetime

app = FastAPI(title="Vitea test suite - MedAI scribe (FastAPI)")

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Categories mirrored from src/prompts/clinical-extraction.js
CATEGORIES = [
    'Chief Complaint/Reason for Visit',
    'History of Present Illness (HPI)',
    'Current Medications',
    'Allergies',
    'Vital Signs',
    'Past Medical History',
    'Surgical History',
    'Family History',
    'Social History',
    'Review of Systems',
    'Physical Exam Findings',
    'Previous Test Results',
    'Assessment/Differential Diagnosis',
    'Diagnostic Plan',
    'Treatment Plan',
    'Patient Education',
    'Follow-up Instructions',
    'Referrals'
]


def _basic_extraction(transcript: str):
    """Very lightweight mock extraction that returns simple structured data.
    This mirrors the response shape expected by the frontend without requiring
    Node services or external AI.
    """
    items = []

    # Naive parsing: split transcript into sentences and map first few to categories
    sentences = [s.strip() for s in transcript.replace("\n", " ").split(".") if s.strip()]
    for idx, cat in enumerate(CATEGORIES[:min(5, len(CATEGORIES))]):
        details = []
        if idx < len(sentences):
            details.append(sentences[idx])
        items.append({
            "category": cat,
            "details": details
        })

    total_points = sum(len(x.get("details", [])) for x in items)
    return {
        "categories": items,
        "summary": {
            "totalDataPoints": total_points,
            "categoriesFound": [x["category"] for x in items if x.get("details")],
            "confidenceScore": None
        }
    }


@app.post("/api/transcript/process")
async def process_transcript(payload: dict):
    transcript = payload.get("transcript")
    options = payload.get("options", {}) or {}

    if transcript is None:
        raise HTTPException(status_code=400, detail={
            "error": "Transcript is required",
            "code": "MISSING_TRANSCRIPT"
        })
    if not isinstance(transcript, str):
        raise HTTPException(status_code=400, detail={
            "error": "Transcript must be a string",
            "code": "INVALID_TRANSCRIPT_TYPE"
        })

    processing_id = str(uuid4())

    # In this Python port we provide a simple local extraction. If options.mockResponse is True,
    # we still follow the same path but it's already effectively a mock implementation.
    data = _basic_extraction(transcript)

    validation = {
        "isValid": True,
        "warnings": [],
        "errors": []
    }

    return JSONResponse({
        "success": True,
        "processingId": processing_id,
        "data": data,
        "validation": validation,
        "metadata": {
            "processedAt": datetime.utcnow().isoformat() + "Z",
            "transcriptLength": len(transcript),
            "extractionMethod": options.get("method", "python-basic")
        }
    })


@app.get("/api/transcript/status/{processing_id}")
async def get_processing_status(processing_id: str):
    return {"processingId": processing_id, "status": "completed", "message": "Status tracking not implemented yet"}


@app.get("/api/transcript/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Vitea test suite - AI scribe Transcript Processor (FastAPI)",
        "timestamp": datetime.now().isoformat() + "Z",
        "version": os.getenv("APP_VERSION", "1.0.0")
    }


@app.get("/api/transcript/categories")
async def get_categories():
    return {
        "categories": CATEGORIES,
        "description": "Clinical data extraction categories with weightage levels"
    }


@app.post("/api/transcript/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    mockTranscription: bool = Form(False),
):
    # We do not perform real transcription here. Provide a safe mock.
    if audio is None:
        raise HTTPException(status_code=400, detail={
            "error": "No audio file provided",
            "code": "NO_FILE"
        })

    # Basic validations similar to Node (size limits aren't directly available here without reading)
    # Accept the upload and return a mock transcript
    transcript_text = (
        "This is a mock transcription of the uploaded audio file for demonstration purposes. "
        "The patient reports intermittent chest discomfort over the past two days."
    ) if mockTranscription else (
        "Transcription service is not configured; returning placeholder transcript from FastAPI."
    )

    return {
        "success": True,
        "transcript": transcript_text,
        "filename": audio.filename,
        "mimetype": audio.content_type,
    }


# Uvicorn entry point guidance (optional)
# To run: uvicorn backend.api:app --reload --port 8000
