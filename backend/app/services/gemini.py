import os
from typing import Any

import httpx


GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def _gemini_config() -> tuple[str, str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY.")

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
    return api_key, model


async def generate_gemini_text(payload: dict[str, Any]) -> str:
    api_key, model = _gemini_config()
    url = f"{GEMINI_API_BASE}/{model}:generateContent"

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(url, params={"key": api_key}, json=payload)

    if response.status_code >= 400:
        raise RuntimeError(
            f"Gemini request failed ({response.status_code}): {response.text}"
        )

    data = response.json()
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text")
    )
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("Gemini returned an empty response.")

    return text.strip()
