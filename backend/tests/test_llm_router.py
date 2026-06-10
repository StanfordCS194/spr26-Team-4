import pytest

import app.services.llm_router as llm_router


def _ok(name):
    async def provider(prompt: str, **kwargs) -> str:
        return f"{name} response"

    return provider


def _fail(name):
    async def provider(prompt: str, **kwargs) -> str:
        raise RuntimeError(f"{name} is down")

    return provider


class TestGenerateTextWithFallback:
    async def test_uses_litellm_when_configured(self, monkeypatch):
        monkeypatch.setattr(llm_router, "litellm_is_configured", lambda: True)
        monkeypatch.setattr(llm_router, "generate_litellm_text", _ok("litellm"))
        monkeypatch.setattr(llm_router, "generate_gemini_text", _fail("gemini"))
        monkeypatch.setattr(llm_router, "generate_ollama_text", _fail("ollama"))

        assert await llm_router.generate_text_with_fallback("hi") == "litellm response"

    async def test_skips_litellm_without_key_and_uses_gemini(self, monkeypatch):
        monkeypatch.setattr(llm_router, "litellm_is_configured", lambda: False)
        monkeypatch.setattr(llm_router, "generate_litellm_text", _fail("litellm"))
        monkeypatch.setattr(llm_router, "generate_gemini_text", _ok("gemini"))
        monkeypatch.setattr(llm_router, "generate_ollama_text", _fail("ollama"))

        assert await llm_router.generate_text_with_fallback("hi") == "gemini response"

    async def test_falls_back_from_litellm_failure_to_gemini(self, monkeypatch):
        monkeypatch.setattr(llm_router, "litellm_is_configured", lambda: True)
        monkeypatch.setattr(llm_router, "generate_litellm_text", _fail("litellm"))
        monkeypatch.setattr(llm_router, "generate_gemini_text", _ok("gemini"))
        monkeypatch.setattr(llm_router, "generate_ollama_text", _fail("ollama"))

        assert await llm_router.generate_text_with_fallback("hi") == "gemini response"

    async def test_falls_back_to_ollama_last(self, monkeypatch):
        monkeypatch.setattr(llm_router, "litellm_is_configured", lambda: True)
        monkeypatch.setattr(llm_router, "generate_litellm_text", _fail("litellm"))
        monkeypatch.setattr(llm_router, "generate_gemini_text", _fail("gemini"))
        monkeypatch.setattr(llm_router, "generate_ollama_text", _ok("ollama"))

        assert await llm_router.generate_text_with_fallback("hi") == "ollama response"

    async def test_all_providers_failing_raises_combined_error(self, monkeypatch):
        monkeypatch.setattr(llm_router, "litellm_is_configured", lambda: False)
        monkeypatch.setattr(llm_router, "generate_litellm_text", _fail("litellm"))
        monkeypatch.setattr(llm_router, "generate_gemini_text", _fail("gemini"))
        monkeypatch.setattr(llm_router, "generate_ollama_text", _fail("ollama"))

        with pytest.raises(RuntimeError) as excinfo:
            await llm_router.generate_text_with_fallback("hi")

        message = str(excinfo.value)
        assert "All LLM providers failed" in message
        assert "LiteLLM skipped: no API key configured." in message
        assert "Gemini failed: gemini is down" in message
        assert "Ollama failed: ollama is down" in message


class TestLitellmIsConfigured:
    CANDIDATE_KEYS = (
        "LITELLM_API_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GROQ_API_KEY",
        "MISTRAL_API_KEY",
        "COHERE_API_KEY",
    )

    def _clear_keys(self, monkeypatch):
        for key in self.CANDIDATE_KEYS:
            monkeypatch.delenv(key, raising=False)

    def test_false_when_no_keys_set(self, monkeypatch):
        from app.services.litellm_service import litellm_is_configured

        self._clear_keys(monkeypatch)
        assert litellm_is_configured() is False

    def test_blank_key_does_not_count(self, monkeypatch):
        from app.services.litellm_service import litellm_is_configured

        self._clear_keys(monkeypatch)
        monkeypatch.setenv("OPENAI_API_KEY", "   ")
        assert litellm_is_configured() is False

    @pytest.mark.parametrize("env_name", CANDIDATE_KEYS)
    def test_true_when_any_key_set(self, monkeypatch, env_name):
        from app.services.litellm_service import litellm_is_configured

        self._clear_keys(monkeypatch)
        monkeypatch.setenv(env_name, "sk-test")
        assert litellm_is_configured() is True
