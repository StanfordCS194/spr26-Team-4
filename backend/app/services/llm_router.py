from app.services.gemini import generate_gemini_text
from app.services.litellm_service import generate_litellm_text, litellm_is_configured
from app.services.ollama import generate_ollama_text


async def generate_text_with_fallback(prompt: str) -> str:
    errors: list[str] = []

    if litellm_is_configured():
        try:
            return await generate_litellm_text(prompt)
        except Exception as error:
            errors.append(f"LiteLLM failed: {error}")
    else:
        errors.append("LiteLLM skipped: no API key configured.")

    try:
        return await generate_gemini_text(prompt)
    except Exception as error:
        errors.append(f"Gemini failed: {error}")

    try:
        return await generate_ollama_text(prompt)
    except Exception as error:
        errors.append(f"Ollama failed: {error}")

    raise RuntimeError("All LLM providers failed. " + " | ".join(errors))
