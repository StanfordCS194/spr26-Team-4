# StarReady Backend

FastAPI backend for backend-flow work that should not run in the browser.

## Responsibilities

- `POST /api/resume/parse` parses uploaded resume content and returns extracted text.
- `POST /api/report/score` scores the completed interview transcript.
- Report scoring uses a local Ollama model. No external AI API key is required.
- PDF resume parsing is local and works best with text-based PDFs, not scanned images.

## Run Locally

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 3001
```

Before scoring reports, install Ollama and pull the default model:

```bash
ollama pull llama3.2:3b
```

Optional `.env`:

```bash
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

## Scripts

| Command | Purpose |
| --- | --- |
| `python -m uvicorn app.main:app --reload --port 3001` | Start backend in watch mode |
| `python -m compileall app` | Syntax-check backend modules |

FastAPI docs are available at `http://localhost:3001/docs` while the backend is running.
