from typing import Literal

from pydantic import BaseModel


ReportSentiment = Literal["positive", "neutral", "negative"]


class ScoreReportRequest(BaseModel):
    userText: str = ""
    transcriptSummary: str = ""


class ReportFeedback(BaseModel):
    clarityScore: int
    confidenceRating: int
    topImprovements: list[str]
    sentiment: ReportSentiment
