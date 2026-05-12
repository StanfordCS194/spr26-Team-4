from fastapi import APIRouter, HTTPException

from app.models.resume import ParseResumeRequest, ParseResumeResponse
from app.services.resume_service import parse_resume


router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/parse", response_model=ParseResumeResponse)
async def parse_resume_route(payload: ParseResumeRequest) -> ParseResumeResponse:
    try:
        return await parse_resume(payload)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
