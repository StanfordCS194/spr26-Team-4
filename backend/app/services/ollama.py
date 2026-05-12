import os
from typing import Any

import httpx


DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_OLLAMA_MODEL = "llama3.2:3b"


def _ollama_config() -> tuple[str, str]:
    base_url = os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL).strip()
    model = os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL).strip()
    return base_url.rstrip("/"), model


async def generate_ollama_text(
    prompt: str,
    *,
    response_format: str | None = None,
    temperature: float = 0.2,
) -> str:
    base_url, model = _ollama_config()
    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature},
    }
    if response_format:
        payload["format"] = response_format

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(f"{base_url}/api/generate", json=payload)
    except httpx.ConnectError as error:
        raise RuntimeError(f"Ollama is not running at {base_url}.") from error
    except httpx.TimeoutException as error:
        raise RuntimeError("Ollama took too long to generate a response.") from error

    if response.status_code >= 400:
        details = response.text
        try:
            error_payload = response.json()
            if isinstance(error_payload.get("error"), str):
                details = error_payload["error"]
        except ValueError:
            pass

        if "not found" in details.lower():
            raise RuntimeError(
                f"Ollama model '{model}' is not installed. Run: ollama pull {model}"
            )
        raise RuntimeError(f"Ollama request failed ({response.status_code}): {details}")

    data = response.json()
    text = data.get("response")
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("Ollama returned an empty response.")

    return text.strip()
