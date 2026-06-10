import logging

from fastapi import APIRouter, HTTPException

from app.models.report import ClassifyJobRequest, ClassifyJobResponse, ReportFeedback, ScoreReportRequest
from app.services.report_service import classify_job_description, score_interview_feedback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/report", tags=["report"])

# Both endpoints depend on upstream LLM providers. Provider/parsing failures are
# 502s (our upstream failed), not 400s; the raw error is logged server-side
# instead of being leaked to the client. Malformed request bodies are already
# rejected by pydantic with a 422 before these handlers run.


@router.post("/score", response_model=ReportFeedback)
async def score_report_route(payload: ScoreReportRequest) -> ReportFeedback:
    try:
        return await score_interview_feedback(payload)
    except (RuntimeError, ValueError) as error:
        logger.error("Report scoring failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail="Scoring is temporarily unavailable. Please try again.",
        ) from error


@router.post("/classify", response_model=ClassifyJobResponse)
async def classify_route(payload: ClassifyJobRequest) -> ClassifyJobResponse:
    """Classify a job description into an interview agent type.

    Unparseable LLM output already falls back to "other" in the service layer,
    so errors here mean every LLM provider was unreachable. Classification is a
    non-critical nicety, so degrade gracefully instead of failing the request.
    """
    try:
        return await classify_job_description(payload.jobDescription)
    except (RuntimeError, ValueError) as error:
        logger.error("Job classification failed: %s", error)
        return ClassifyJobResponse(
            agentType="other",
            reasoning="Classification is unavailable; defaulting to general interviewer.",
        )
