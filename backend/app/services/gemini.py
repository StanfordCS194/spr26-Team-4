import os
import google.generativeai as genai

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def _gemini_config() -> tuple[str, str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")
    return api_key, model


async def generate_gemini_text(prompt: str) -> str:
    api_key, model_name = _gemini_config()
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(prompt)
    text = response.text
    if not text or not text.strip():
        raise RuntimeError("Gemini returned an empty response.")
    return text.strip()
