from typing import Literal

from pydantic import BaseModel


ReportSentiment = Literal["positive", "neutral", "negative"]
AgentType = Literal["tech", "finance", "consulting", "other"]
#modified score report request to include agentType

class ScoreReportRequest(BaseModel):
    userText: str = ""
    transcriptSummary: str = ""
    jobDescription: str = ""
    agentType: str = ""


class ReportFeedback(BaseModel):
    clarityScore: int
    confidenceRating: int
    topImprovements: list[str]
    sentiment: ReportSentiment


class ClassifyJobRequest(BaseModel):
    jobDescription: str


class ClassifyJobResponse(BaseModel):
    agentType: AgentType
    reasoning: str