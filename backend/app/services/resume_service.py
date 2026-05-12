import base64

from app.models.resume import ParseResumeRequest, ParseResumeResponse
from app.services.gemini import generate_gemini_text


def _infer_mime_type(file_name: str | None, mime_type: str | None) -> str:
    if mime_type and mime_type.strip():
        return mime_type

    lower_name = (file_name or "").lower()
    if lower_name.endswith(".pdf"):
        return "application/pdf"
    if lower_name.endswith(".txt"):
        return "text/plain"
    return "application/octet-stream"


async def parse_resume(payload: ParseResumeRequest) -> ParseResumeResponse:
    if not payload.dataBase64:
        raise ValueError("Missing resume file data.")

    mime_type = _infer_mime_type(payload.fileName, payload.mimeType)
    if mime_type.startswith("text/"):
        text = base64.b64decode(payload.dataBase64).decode("utf-8").strip()
        if not text:
            raise ValueError("Text resume was empty.")
        return ParseResumeResponse(text=text)

    if mime_type != "application/pdf":
        raise ValueError("Only PDF and text resumes are supported.")

    text = await generate_gemini_text(
        {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                "Extract the complete resume text from this PDF. "
                                "Return plain text only. Preserve section headers, "
                                "bullet points, dates, company names, titles, and "
                                "metrics. Do not summarize."
                            )
                        },
                        {
                            "inline_data": {
                                "mime_type": "application/pdf",
                                "data": payload.dataBase64,
                            }
                        },
                    ],
                }
            ],
            "generationConfig": {"temperature": 0},
        }
    )
    return ParseResumeResponse(text=text)
