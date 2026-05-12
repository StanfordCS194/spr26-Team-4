# InterviewApp Backend

Express/TypeScript backend for backend-flow work that should not run in the browser.

## Responsibilities

- `POST /api/resume/parse` parses uploaded resume content and returns extracted text.
- `POST /api/report/score` scores the completed interview transcript.
- Gemini API access uses server-side `GEMINI_API_KEY`.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
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
| `npm run dev` | Start backend in watch mode |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled server |
| `npm run typecheck` | Type-check without emitting |
