import json
import math
import re
from typing import Any

from app.models.report import ClassifyJobResponse, ReportFeedback, ReportSentiment, ScoreReportRequest
from app.services.llm_router import generate_text_with_fallback


def _clamp_score(value: Any) -> int | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not math.isfinite(value):
        return None
    return max(1, min(10, round(value)))


def _normalize_sentiment(value: Any) -> ReportSentiment | None:
    if value in ("positive", "neutral", "negative"):
        return value
    return None


def _loads_dict(text: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return None
    # The LLM may return a JSON array or scalar; only an object is usable.
    return parsed if isinstance(parsed, dict) else None


def _parse_model_json(text: str) -> dict[str, Any] | None:
    trimmed = text.strip()
    if not trimmed:
        return None
    parsed = _loads_dict(trimmed)
    if parsed is not None:
        return parsed
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", trimmed, re.I)
    if not fenced:
        return None
    return _loads_dict(fenced.group(1))


_IMPROVEMENT_PLACEHOLDER = "Review your response for clarity and conciseness."


def _normalize_sentiment_summary(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _normalize_improvements(value: Any) -> list[str] | None:
    if not isinstance(value, list):
        return None
    cleaned = [item.strip() for item in value if isinstance(item, str) and item.strip()]
    if not cleaned:
        return None
    # Pad to exactly 3 if Gemini returns fewer than expected.
    while len(cleaned) < 3:
        cleaned.append(_IMPROVEMENT_PLACEHOLDER)
    return cleaned[:3]


# this function builds a Gemini scoring prompt that includes job description and agent type context; it's the eprompt we feed for scoring
# the returned improvements are tailored to the specific role this time, instead of being generic
async def score_interview_feedback(payload: ScoreReportRequest) -> ReportFeedback:
    job_ctx = ""
    if payload.jobDescription.strip():
        job_ctx = f"\nThe candidate was interviewing for this role:\n{payload.jobDescription.strip()[:2000]}\n"

    agent_ctx = ""
    if payload.agentType.strip():
        agent_ctx = f"\nInterview type: {payload.agentType} domain.\n"

    prompt = f"""You are scoring a candidate's behavioral interview transcript.
Return JSON only with this schema:
{{
  "clarityScore": number (1-10),
  "confidenceRating": number (1-10),
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentSummary": string,
  "topImprovements": [string, string, string]
}}

Scoring guidance:
- Clarity: structure, directness, completeness, concision.
- Confidence: ownership language, certainty, assertiveness without arrogance.
- Sentiment: overall tone of the candidate's interview answers (not the interviewer's mood).
- sentimentSummary: one actionable sentence about how the candidate came across in the interview (e.g. energy, initiative, specificity). Address the candidate as "you".
- Improvements: actionable, specific, and tailored to this transcript and role.
{job_ctx}{agent_ctx}
Candidate transcript:
{(payload.transcriptSummary or payload.userText or "(empty transcript)")[:8000]}"""

    text = await generate_text_with_fallback(prompt)

    parsed = _parse_model_json(text)
    if parsed is None:
        raise ValueError("LLM returned invalid scoring JSON.")

    clarity_score = _clamp_score(parsed.get("clarityScore"))
    confidence_rating = _clamp_score(parsed.get("confidenceRating"))
    sentiment = _normalize_sentiment(parsed.get("sentiment"))
    sentiment_summary = _normalize_sentiment_summary(parsed.get("sentimentSummary"))
    top_improvements = _normalize_improvements(parsed.get("topImprovements"))

    if (
        clarity_score is None
        or confidence_rating is None
        or sentiment is None
        or sentiment_summary is None
        or top_improvements is None
    ):
        raise ValueError("LLM scoring response is missing required fields.")

    return ReportFeedback(
        clarityScore=clarity_score,
        confidenceRating=confidence_rating,
        sentiment=sentiment,
        sentimentSummary=sentiment_summary,
        topImprovements=top_improvements,
    )


# then we send the job description to gemini with the classification prompt
# the function also parses the JSON response to return one of the four agent types and defaults to "other" in case Gemini's output is not parseable
async def classify_job_description(job_description: str) -> ClassifyJobResponse:
    prompt = f"""You are classifying a job description into one of four interview categories.
Return JSON only with this schema:
{{
"agentType": "tech" | "finance" | "consulting" | "other",
"reasoning": string (one short sentence)
}}

Categories:
- "tech": software engineering, product, data science, ML, IT, hardware
- "finance": investment banking, asset management, private equity, accounting, fintech
- "consulting": management consulting, strategy, operations consulting, advisory
- "other": anything that doesn't clearly fit the above

Job description:
{job_description.strip()[:3000]}"""

    text = await generate_text_with_fallback(prompt)

    parsed = _parse_model_json(text)
    if parsed is None or parsed.get("agentType") not in ("tech", "finance", "consulting", "other"):
        return ClassifyJobResponse(agentType="other", reasoning="Could not classify; defaulting to general interviewer.")

    return ClassifyJobResponse(
        agentType=parsed["agentType"],
        reasoning=parsed.get("reasoning", ""),
    )
