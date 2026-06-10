from typing import Literal

from pydantic import BaseModel, Field


ReportSentiment = Literal["positive", "neutral", "negative"]
AgentType = Literal["tech", "finance", "consulting", "other"]


# The frontend caps transcripts at 8,000 chars; these limits leave headroom
# while keeping oversized payloads from reaching the LLM providers.
class ScoreReportRequest(BaseModel):
    userText: str = Field(default="", max_length=20_000)
    transcriptSummary: str = Field(default="", max_length=20_000)
    jobDescription: str = Field(default="", max_length=20_000)
    agentType: str = Field(default="", max_length=50)


class ReportFeedback(BaseModel):
    clarityScore: int
    confidenceRating: int
    topImprovements: list[str]
    sentiment: ReportSentiment
    sentimentSummary: str


class ClassifyJobRequest(BaseModel):
    jobDescription: str = Field(max_length=20_000)


class ClassifyJobResponse(BaseModel):
    agentType: AgentType
    reasoning: str
