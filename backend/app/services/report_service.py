import json
import math
import re
from typing import Any

from app.models.report import ReportFeedback, ReportSentiment, ScoreReportRequest
from app.services.gemini import generate_gemini_text


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


def _parse_model_json(text: str) -> dict[str, Any] | None:
    trimmed = text.strip()
    if not trimmed:
        return None
    try:
        return json.loads(trimmed)
    except json.JSONDecodeError:
        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", trimmed, re.I)
        if not fenced:
            return None
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            return None


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


async def score_interview_feedback(payload: ScoreReportRequest) -> ReportFeedback:
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
- Improvements: actionable, specific, and tailored to this transcript.

Candidate transcript:
{payload.transcriptSummary or payload.userText or "(empty transcript)"}"""

    text = await generate_gemini_text(prompt)

    parsed = _parse_model_json(text)
    if parsed is None:
        raise ValueError("Ollama returned invalid scoring JSON.")

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
        raise ValueError("Ollama scoring response is missing required fields.")

    return ReportFeedback(
        clarityScore=clarity_score,
        confidenceRating=confidence_rating,
        sentiment=sentiment,
        sentimentSummary=sentiment_summary,
        topImprovements=top_improvements,
    )
