import logging

from fastapi import APIRouter, HTTPException

from app.models.transcript import TranscriptAnalysisRequest, TranscriptAnalysisResponse
from app.services.transcript_service import analyze_transcript

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/transcript", tags=["transcript"])


@router.post("/analyze", response_model=TranscriptAnalysisResponse)
async def analyze_transcript_route(
    payload: TranscriptAnalysisRequest,
) -> TranscriptAnalysisResponse:
    """
    Analyze an interview transcript and return structured feedback.

    This route is meant to support the live transcript feature by giving the
    frontend a backend endpoint that can turn captured transcript text into
    measurable feedback signals.
    """
    try:
        return await analyze_transcript(payload)
    except ValueError as error:
        logger.info("Transcript analysis rejected user input: %s", error)
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        logger.error("Transcript analysis failed: %s", error)
        raise HTTPException(
            status_code=500,
            detail="Transcript analysis is temporarily unavailable. Please try again.",
        ) from error