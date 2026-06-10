import base64

import pytest

from app.models.resume import ParseResumeRequest
from app.services.resume_service import _infer_mime_type, parse_resume


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


class TestInferMimeType:
    def test_explicit_mime_type_wins(self):
        assert _infer_mime_type("resume.pdf", "text/plain") == "text/plain"

    def test_pdf_extension(self):
        assert _infer_mime_type("Resume.PDF", None) == "application/pdf"

    def test_txt_extension(self):
        assert _infer_mime_type("notes.txt", "") == "text/plain"

    def test_unknown_extension(self):
        assert _infer_mime_type("resume.docx", None) == "application/octet-stream"

    def test_no_filename_or_mime(self):
        assert _infer_mime_type(None, None) == "application/octet-stream"


class TestParseResume:
    async def test_parses_plain_text_resume(self):
        payload = ParseResumeRequest(
            fileName="resume.txt",
            dataBase64=_b64("  Jane Doe\nSoftware Engineer  ".encode()),
        )
        result = await parse_resume(payload)
        assert result.text == "Jane Doe\nSoftware Engineer"

    async def test_missing_data_raises(self):
        with pytest.raises(ValueError, match="Missing resume file data"):
            await parse_resume(ParseResumeRequest(fileName="resume.txt"))

    async def test_invalid_base64_raises(self):
        payload = ParseResumeRequest(fileName="resume.txt", dataBase64="!!! not base64 !!!")
        with pytest.raises(ValueError, match="not valid base64"):
            await parse_resume(payload)

    async def test_empty_text_resume_raises(self):
        payload = ParseResumeRequest(fileName="resume.txt", dataBase64=_b64(b"   \n  "))
        with pytest.raises(ValueError, match="empty"):
            await parse_resume(payload)

    async def test_non_utf8_text_raises(self):
        payload = ParseResumeRequest(fileName="resume.txt", dataBase64=_b64(b"\xff\xfe\xfa"))
        with pytest.raises(ValueError, match="not valid UTF-8"):
            await parse_resume(payload)

    async def test_unsupported_mime_type_raises(self):
        payload = ParseResumeRequest(fileName="resume.docx", dataBase64=_b64(b"PK\x03\x04"))
        with pytest.raises(ValueError, match="Only PDF and text resumes"):
            await parse_resume(payload)

    async def test_corrupt_pdf_raises(self):
        payload = ParseResumeRequest(fileName="resume.pdf", dataBase64=_b64(b"definitely not a pdf"))
        with pytest.raises(ValueError, match="Could not read that PDF|No text could be extracted"):
            await parse_resume(payload)
