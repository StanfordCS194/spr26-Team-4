import json

import pytest

import app.services.report_service as report_service
from app.models.report import ScoreReportRequest
from app.services.report_service import (
    _IMPROVEMENT_PLACEHOLDER,
    _clamp_score,
    _normalize_improvements,
    _normalize_sentiment,
    _normalize_sentiment_summary,
    _parse_model_json,
    classify_job_description,
    score_interview_feedback,
)


class TestClampScore:
    def test_in_range_values_round(self):
        assert _clamp_score(7) == 7
        assert _clamp_score(6.4) == 6
        assert _clamp_score(6.6) == 7

    def test_clamps_to_bounds(self):
        assert _clamp_score(0) == 1
        assert _clamp_score(-5) == 1
        assert _clamp_score(11) == 10
        assert _clamp_score(100.0) == 10

    def test_rejects_non_numbers(self):
        assert _clamp_score("8") is None
        assert _clamp_score(None) is None
        assert _clamp_score([8]) is None

    def test_rejects_bool(self):
        assert _clamp_score(True) is None
        assert _clamp_score(False) is None

    def test_rejects_non_finite(self):
        assert _clamp_score(float("inf")) is None
        assert _clamp_score(float("nan")) is None


class TestNormalizeSentiment:
    @pytest.mark.parametrize("value", ["positive", "neutral", "negative"])
    def test_accepts_valid_sentiments(self, value):
        assert _normalize_sentiment(value) == value

    @pytest.mark.parametrize("value", ["POSITIVE", "happy", "", None, 1])
    def test_rejects_invalid_sentiments(self, value):
        assert _normalize_sentiment(value) is None


class TestParseModelJson:
    def test_plain_json(self):
        assert _parse_model_json('{"a": 1}') == {"a": 1}

    def test_json_with_surrounding_whitespace(self):
        assert _parse_model_json('  \n {"a": 1} \n ') == {"a": 1}

    def test_fenced_json_block(self):
        text = 'Here you go:\n```json\n{"a": 1}\n```\nThanks!'
        assert _parse_model_json(text) == {"a": 1}

    def test_fenced_block_without_language_tag(self):
        text = '```\n{"a": 1}\n```'
        assert _parse_model_json(text) == {"a": 1}

    def test_empty_string(self):
        assert _parse_model_json("") is None
        assert _parse_model_json("   ") is None

    def test_invalid_json(self):
        assert _parse_model_json("not json at all") is None

    def test_fenced_block_with_invalid_json(self):
        assert _parse_model_json("```json\nnot json\n```") is None


class TestNormalizeSentimentSummary:
    def test_valid_string(self):
        assert _normalize_sentiment_summary(" You sounded confident. ") == "You sounded confident."

    def test_empty_or_non_string(self):
        assert _normalize_sentiment_summary("") is None
        assert _normalize_sentiment_summary("   ") is None
        assert _normalize_sentiment_summary(None) is None
        assert _normalize_sentiment_summary(123) is None


class TestNormalizeImprovements:
    def test_exactly_three(self):
        items = ["Be concise", "Use STAR", "Quantify impact"]
        assert _normalize_improvements(items) == items

    def test_pads_to_three(self):
        result = _normalize_improvements(["Only one"])
        assert result == ["Only one", _IMPROVEMENT_PLACEHOLDER, _IMPROVEMENT_PLACEHOLDER]

    def test_truncates_to_three(self):
        result = _normalize_improvements(["a", "b", "c", "d", "e"])
        assert result == ["a", "b", "c"]

    def test_strips_and_drops_empty_entries(self):
        result = _normalize_improvements([" a ", "", "  ", "b"])
        assert result == ["a", "b", _IMPROVEMENT_PLACEHOLDER]

    def test_drops_non_string_entries(self):
        result = _normalize_improvements([1, "a", None])
        assert result == ["a", _IMPROVEMENT_PLACEHOLDER, _IMPROVEMENT_PLACEHOLDER]

    def test_rejects_non_list_or_all_empty(self):
        assert _normalize_improvements("not a list") is None
        assert _normalize_improvements(None) is None
        assert _normalize_improvements([]) is None
        assert _normalize_improvements(["", "  "]) is None


VALID_SCORE_RESPONSE = {
    "clarityScore": 8,
    "confidenceRating": 6,
    "sentiment": "positive",
    "sentimentSummary": "You came across as engaged and specific.",
    "topImprovements": ["Tighten openings", "Quantify results", "Slow down"],
}


def _fake_llm(response_text):
    async def fake(prompt: str) -> str:
        fake.prompts.append(prompt)
        return response_text

    fake.prompts = []
    return fake


class TestScoreInterviewFeedback:
    async def test_happy_path(self, monkeypatch):
        fake = _fake_llm(json.dumps(VALID_SCORE_RESPONSE))
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        payload = ScoreReportRequest(transcriptSummary="I led a project...")
        result = await score_interview_feedback(payload)

        assert result.clarityScore == 8
        assert result.confidenceRating == 6
        assert result.sentiment == "positive"
        assert result.topImprovements == VALID_SCORE_RESPONSE["topImprovements"]

    async def test_includes_job_and_agent_context_in_prompt(self, monkeypatch):
        fake = _fake_llm(json.dumps(VALID_SCORE_RESPONSE))
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        payload = ScoreReportRequest(
            transcriptSummary="Transcript here",
            jobDescription="Senior SWE at Acme",
            agentType="tech",
        )
        await score_interview_feedback(payload)

        prompt = fake.prompts[0]
        assert "Senior SWE at Acme" in prompt
        assert "Interview type: tech domain." in prompt
        assert "Transcript here" in prompt

    async def test_invalid_json_raises(self, monkeypatch):
        fake = _fake_llm("sorry, I can't do that")
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        with pytest.raises(ValueError, match="invalid scoring JSON"):
            await score_interview_feedback(ScoreReportRequest(userText="hi"))

    async def test_missing_fields_raise(self, monkeypatch):
        incomplete = {"clarityScore": 8, "confidenceRating": 6}
        fake = _fake_llm(json.dumps(incomplete))
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        with pytest.raises(ValueError, match="missing required fields"):
            await score_interview_feedback(ScoreReportRequest(userText="hi"))

    async def test_out_of_range_scores_are_clamped(self, monkeypatch):
        response = dict(VALID_SCORE_RESPONSE, clarityScore=15, confidenceRating=-2)
        fake = _fake_llm(json.dumps(response))
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        result = await score_interview_feedback(ScoreReportRequest(userText="hi"))
        assert result.clarityScore == 10
        assert result.confidenceRating == 1


class TestClassifyJobDescription:
    async def test_valid_classification(self, monkeypatch):
        fake = _fake_llm(json.dumps({"agentType": "finance", "reasoning": "It is banking."}))
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        result = await classify_job_description("Analyst role at an investment bank")
        assert result.agentType == "finance"
        assert result.reasoning == "It is banking."

    async def test_unparseable_response_defaults_to_other(self, monkeypatch):
        fake = _fake_llm("no json here")
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        result = await classify_job_description("Some job")
        assert result.agentType == "other"
        assert "Could not classify" in result.reasoning

    async def test_invalid_agent_type_defaults_to_other(self, monkeypatch):
        fake = _fake_llm(json.dumps({"agentType": "marketing", "reasoning": "x"}))
        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake)

        result = await classify_job_description("Some job")
        assert result.agentType == "other"
