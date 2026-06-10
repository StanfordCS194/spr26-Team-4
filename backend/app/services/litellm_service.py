import os
from typing import Any

from litellm import acompletion

DEFAULT_LITELLM_MODEL = "openai/gpt-4o-mini"


def _resolve_litellm_api_key() -> str:
    # Prefer explicit LiteLLM key, then common provider key names.
    candidate_keys = (
        "LITELLM_API_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GROQ_API_KEY",
        "MISTRAL_API_KEY",
        "COHERE_API_KEY",
    )
    for env_name in candidate_keys:
        value = os.getenv(env_name, "").strip()
        if value:
            return value
    return ""


def litellm_is_configured() -> bool:
    return bool(_resolve_litellm_api_key())


async def generate_litellm_text(prompt: str, *, temperature: float = 0.2) -> str:
    model = os.getenv("LITELLM_MODEL", DEFAULT_LITELLM_MODEL).strip()
    api_key = _resolve_litellm_api_key()
    if not api_key:
        raise RuntimeError("No API key found for LiteLLM provider.")

    response: Any = await acompletion(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        temperature=temperature,
    )

    choices = getattr(response, "choices", None)
    if not choices:
        raise RuntimeError("LiteLLM returned no choices.")

    message = getattr(choices[0], "message", None)
    content = getattr(message, "content", None)
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("LiteLLM returned an empty response.")
    return content.strip()
