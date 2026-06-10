import base64
import json

import pytest
from fastapi.testclient import TestClient

import app.services.report_service as report_service
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthRoute:
    def test_health(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"ok": True}


class TestResumeParseRoute:
    def test_parses_text_resume(self, client):
        data = base64.b64encode(b"Jane Doe, Engineer").decode("ascii")
        response = client.post(
            "/api/resume/parse",
            json={"fileName": "resume.txt", "dataBase64": data},
        )
        assert response.status_code == 200
        assert response.json() == {"text": "Jane Doe, Engineer"}

    def test_missing_data_returns_400(self, client):
        response = client.post("/api/resume/parse", json={"fileName": "resume.txt"})
        assert response.status_code == 400
        assert "Missing resume file data" in response.json()["detail"]


class TestReportScoreRoute:
    def test_score_happy_path(self, client, monkeypatch):
        llm_response = json.dumps(
            {
                "clarityScore": 7,
                "confidenceRating": 9,
                "sentiment": "neutral",
                "sentimentSummary": "You were calm and steady.",
                "topImprovements": ["a", "b", "c"],
            }
        )

        async def fake_llm(prompt: str) -> str:
            return llm_response

        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake_llm)

        response = client.post(
            "/api/report/score",
            json={"transcriptSummary": "I built a thing and shipped it."},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["clarityScore"] == 7
        assert body["confidenceRating"] == 9
        assert body["sentiment"] == "neutral"
        assert body["topImprovements"] == ["a", "b", "c"]

    def test_llm_failure_returns_502_without_leaking_details(self, client, monkeypatch):
        async def failing_llm(prompt: str) -> str:
            raise RuntimeError("Ollama is not running at http://localhost:11434.")

        monkeypatch.setattr(report_service, "generate_text_with_fallback", failing_llm)

        response = client.post("/api/report/score", json={"userText": "hello"})
        assert response.status_code == 502
        detail = response.json()["detail"]
        assert "temporarily unavailable" in detail
        assert "localhost" not in detail

    def test_invalid_llm_json_returns_502(self, client, monkeypatch):
        async def garbage_llm(prompt: str) -> str:
            return "not json"

        monkeypatch.setattr(report_service, "generate_text_with_fallback", garbage_llm)

        response = client.post("/api/report/score", json={"userText": "hello"})
        assert response.status_code == 502


class TestReportClassifyRoute:
    def test_classify_happy_path(self, client, monkeypatch):
        async def fake_llm(prompt: str) -> str:
            return json.dumps({"agentType": "consulting", "reasoning": "Strategy role."})

        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake_llm)

        response = client.post(
            "/api/report/classify",
            json={"jobDescription": "Strategy consultant at a Big 3 firm"},
        )
        assert response.status_code == 200
        assert response.json() == {"agentType": "consulting", "reasoning": "Strategy role."}

    def test_classify_defaults_to_other_on_garbage(self, client, monkeypatch):
        async def fake_llm(prompt: str) -> str:
            return "I have no idea"

        monkeypatch.setattr(report_service, "generate_text_with_fallback", fake_llm)

        response = client.post("/api/report/classify", json={"jobDescription": "???"})
        assert response.status_code == 200
        assert response.json()["agentType"] == "other"

    def test_classify_degrades_gracefully_when_llm_unreachable(self, client, monkeypatch):
        async def failing_llm(prompt: str) -> str:
            raise RuntimeError("All LLM providers failed.")

        monkeypatch.setattr(report_service, "generate_text_with_fallback", failing_llm)

        response = client.post("/api/report/classify", json={"jobDescription": "SWE role"})
        assert response.status_code == 200
        body = response.json()
        assert body["agentType"] == "other"
        assert "unavailable" in body["reasoning"]
