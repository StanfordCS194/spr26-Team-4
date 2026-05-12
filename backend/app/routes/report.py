from fastapi import APIRouter, HTTPException

from app.models.report import ReportFeedback, ScoreReportRequest
from app.services.report_service import score_interview_feedback


router = APIRouter(prefix="/api/report", tags=["report"])


@router.post("/score", response_model=ReportFeedback)
async def score_report_route(payload: ScoreReportRequest) -> ReportFeedback:
    try:
        return await score_interview_feedback(payload)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
