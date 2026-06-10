import pytest

from app.models.transcript import TranscriptAnalysisRequest
from app.services.transcript_service import analyze_transcript


@pytest.mark.asyncio
async def test_analyze_transcript_returns_metrics():
    payload = TranscriptAnalysisRequest(
        transcript=(
            "During my internship, I was responsible for improving a dashboard. "
            "I implemented a new filter system because users were struggling to find data. "
            "As a result, the team reduced search time by 30 percent."
        ),
        targetRole="Software Engineer",
    )

    result = await analyze_transcript(payload)

    assert result.metrics.wordCount > 0
    assert result.metrics.sentenceCount > 0
    assert result.specificityScore >= 1
    assert result.clarityScore >= 1
    assert len(result.starSignals) == 4


@pytest.mark.asyncio
async def test_analyze_transcript_rejects_empty_transcript():
    payload = TranscriptAnalysisRequest(transcript="")

    with pytest.raises(ValueError):
        await analyze_transcript(payload)


@pytest.mark.asyncio
async def test_star_detection_finds_action_and_result():
    payload = TranscriptAnalysisRequest(
        transcript=(
            "I built a tool for my team. "
            "The result was that we improved our process and reduced manual work."
        )
    )

    result = await analyze_transcript(payload)
    detected = {signal.category for signal in result.starSignals if signal.detected}

    assert "action" in detected
    assert "result" in detected