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

@pytest.mark.asyncio
async def test_filler_words_are_counted():
    payload = TranscriptAnalysisRequest(
        transcript=(
            "Um, I basically worked on the project and, like, "
            "I kind of helped the team organize the dashboard."
        )
    )

    result = await analyze_transcript(payload)

    assert result.metrics.fillerWordCount > 0
    assert len(result.metrics.fillerWordsDetected) > 0


@pytest.mark.asyncio
async def test_specificity_score_rewards_numbers_and_impact():
    payload = TranscriptAnalysisRequest(
        transcript=(
            "During my internship, I built a dashboard improvement for 40 users. "
            "Because the old workflow was slow, I implemented filters and reduced "
            "search time by 30 percent."
        )
    )

    result = await analyze_transcript(payload)

    assert result.specificityScore >= 5


@pytest.mark.asyncio
async def test_clarity_score_exists_for_short_transcript():
    payload = TranscriptAnalysisRequest(
        transcript="I helped my team build a dashboard."
    )

    result = await analyze_transcript(payload)

    assert 1 <= result.clarityScore <= 10


@pytest.mark.asyncio
async def test_response_includes_strengths_and_improvements():
    payload = TranscriptAnalysisRequest(
        transcript=(
            "I worked on a team project. "
            "I helped with the implementation and learned from the process."
        )
    )

    result = await analyze_transcript(payload)

    assert len(result.strengths) > 0
    assert len(result.improvementAreas) > 0


@pytest.mark.asyncio
async def test_estimated_speaking_time_is_calculated():
    payload = TranscriptAnalysisRequest(
        transcript=(
            "During my internship I built a tool for my team. "
            "The tool helped organize information and made the workflow easier."
        )
    )

    result = await analyze_transcript(payload)

    assert result.metrics.estimatedSpeakingSeconds > 0