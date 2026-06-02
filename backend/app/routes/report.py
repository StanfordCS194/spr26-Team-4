from fastapi import APIRouter, HTTPException

from app.models.report import ClassifyJobRequest, ClassifyJobResponse, ReportFeedback, ScoreReportRequest
from app.services.report_service import classify_job_description, score_interview_feedback


router = APIRouter(prefix="/api/report", tags=["report"])


@router.post("/score", response_model=ReportFeedback)
async def score_report_route(payload: ScoreReportRequest) -> ReportFeedback:
    try:
        return await score_interview_feedback(payload)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/classify", response_model=ClassifyJobResponse)
# this function exposes POST /api/report/classify; it takes in the job description and returns the recommended agent to interview
# we have an agent type and a one-sentence reasoning string from the classify_job_description service
async def classify_route(payload: ClassifyJobRequest) -> ClassifyJobResponse:
    try:
        return await classify_job_description(payload.jobDescription)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error