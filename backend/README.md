# StarReady Backend

FastAPI backend for backend-flow work that should not run in the browser.

## Responsibilities

- `POST /api/resume/parse` parses uploaded resume content and returns extracted text.
- `POST /api/report/score` scores the completed interview transcript.
- Report scoring tries LiteLLM first, then falls back to Gemini, then local Ollama.
- PDF resume parsing is local and works best with text-based PDFs, not scanned images.

## Run Locally

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 3001
```

For local fallback scoring, install Ollama and pull the default model:

```bash
ollama pull llama3.2:3b
```

Copy `backend/.env.example` to `backend/.env` and set at least one LLM provider:

- **LiteLLM (default):** `LITELLM_MODEL` + `OPENAI_API_KEY` (or another provider key matching the model)
- **Gemini fallback:** `GEMINI_API_KEY`
- **Ollama fallback:** run `ollama pull llama3.2:3b` locally

## Scripts

| Command | Purpose |
| --- | --- |
| `python -m uvicorn app.main:app --reload --port 3001` | Start backend in watch mode |
| `python -m pytest` | Run the backend test suite (`tests/`) |
| `python -m compileall app` | Syntax-check backend modules |

FastAPI docs are available at `http://localhost:3001/docs` while the backend is running.
