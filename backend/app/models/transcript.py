from pydantic import BaseModel, Field


class TranscriptAnalysisRequest(BaseModel):
    transcript: str = Field(default="", max_length=20_000)
    targetRole: str = Field(default="", max_length=200)


class StarSignal(BaseModel):
    category: str
    detected: bool
    evidence: list[str]


class TranscriptMetrics(BaseModel):
    wordCount: int
    sentenceCount: int
    estimatedSpeakingSeconds: int
    fillerWordCount: int
    fillerWordsDetected: list[str]
    averageSentenceLength: float


class TranscriptAnalysisResponse(BaseModel):
    metrics: TranscriptMetrics
    starSignals: list[StarSignal]
    strengths: list[str]
    improvementAreas: list[str]
    specificityScore: int
    clarityScore: int