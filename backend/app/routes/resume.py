import logging

from fastapi import APIRouter, HTTPException

from app.models.resume import ParseResumeRequest, ParseResumeResponse
from app.services.resume_service import parse_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/parse", response_model=ParseResumeResponse)
async def parse_resume_route(payload: ParseResumeRequest) -> ParseResumeResponse:
    try:
        return await parse_resume(payload)
    except ValueError as error:
        # The service raises ValueError with user-actionable messages
        # (bad base64, empty file, unsupported type, unreadable PDF).
        logger.info("Resume parse rejected: %s", error)
        raise HTTPException(status_code=400, detail=str(error)) from error
