from pydantic import BaseModel, Field


class ParseResumeRequest(BaseModel):
    fileName: str | None = Field(default=None, max_length=255)
    mimeType: str | None = Field(default=None, max_length=100)
    # ~7.5 MB decoded — generous for a resume, bounded for the server.
    dataBase64: str | None = Field(default=None, max_length=10_000_000)


class ParseResumeResponse(BaseModel):
    text: str
