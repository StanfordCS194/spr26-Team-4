import base64
from io import BytesIO

from pypdf import PdfReader

from app.models.resume import ParseResumeRequest, ParseResumeResponse


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

    try:
        file_bytes = base64.b64decode(payload.dataBase64, validate=True)
    except Exception as error:
        raise ValueError("Resume file data was not valid base64.") from error

    mime_type = _infer_mime_type(payload.fileName, payload.mimeType)
    if mime_type.startswith("text/"):
        try:
            text = file_bytes.decode("utf-8").strip()
        except UnicodeDecodeError as error:
            raise ValueError("Text resume was not valid UTF-8.") from error
        if not text:
            raise ValueError("Text resume was empty.")
        return ParseResumeResponse(text=text)

    if mime_type != "application/pdf":
        raise ValueError("Only PDF and text resumes are supported.")

    try:
        reader = PdfReader(BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception as error:
        raise ValueError("Could not read that PDF resume.") from error

    text = "\n\n".join(page.strip() for page in pages if page.strip()).strip()
    if not text:
        raise ValueError(
            "No text could be extracted from that PDF. Try a text-based PDF instead of a scanned image."
        )

    return ParseResumeResponse(text=text)
