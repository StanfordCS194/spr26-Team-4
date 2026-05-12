# InterviewApp Backend

FastAPI backend for backend-flow work that should not run in the browser.

## Responsibilities

- `POST /api/resume/parse` parses uploaded resume content and returns extracted text.
- `POST /api/report/score` scores the completed interview transcript.
- Gemini API access uses server-side `GEMINI_API_KEY`.

## Run Locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 -m uvicorn app.main:app --reload --port 3001
```

Required `.env`:

```bash
GEMINI_API_KEY=
```

Optional `.env`:

```bash
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_MODEL=gemini-2.0-flash
```

## Scripts

| Command | Purpose |
| --- | --- |
| `python3 -m uvicorn app.main:app --reload --port 3001` | Start backend in watch mode |
| `python3 -m compileall app` | Syntax-check backend modules |

FastAPI docs are available at `http://localhost:3001/docs` while the backend is running.
