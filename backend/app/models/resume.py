from pydantic import BaseModel


class ParseResumeRequest(BaseModel):
    fileName: str | None = None
    mimeType: str | None = None
    dataBase64: str | None = None


class ParseResumeResponse(BaseModel):
    text: str
