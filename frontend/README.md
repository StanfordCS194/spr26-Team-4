# StarReady Frontend

React/Vite frontend for the behavioral interview prep app. It renders the UI, owns browser-only Vapi call state, and calls the backend for resume parsing and report scoring.

## Run it locally (right now)

1. **Start the backend first** from `../backend`:

   ```bash
   cd ../backend
   python3.12 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ollama pull llama3.2:3b
   python -m uvicorn app.main:app --reload --port 3001
   ```

2. **Open another terminal** in this folder (`frontend`).

3. **Install dependencies** (once):

   ```bash
   npm install
   ```

4. **Configure environment variables**  
   Copy the example env file and add your Vapi public key:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   - **`VITE_VAPI_PUBLIC_KEY`** — from the [Vapi dashboard](https://dashboard.vapi.ai/) (API keys → public key used for web clients).
   - **`VITE_API_BASE_URL`** — optional production backend URL. Local dev uses Vite proxy to `http://localhost:3001`.

   Optional, for remote session logging:

   - **`VITE_SUPABASE_URL`**
   - **`VITE_SUPABASE_ANON_KEY`**  
   If you use Supabase, create an `interview_sessions` table as described in `src/lib/sessionPersistence.ts`.

5. **Start the dev server**:

   ```bash
   npm run dev
   ```

5. **Open the app** in your browser at the URL Vite prints (usually `http://localhost:5173`). Allow **microphone** access when the browser asks so the call can run.

You can click **Start practice** without a resume (the assistant will note missing resume text). Uploading a resume injects that text into the system prompt.

### Other commands

| Command        | Purpose              |
| -------------- | -------------------- |
| `npm run dev`  | Hot-reload dev server |
| `npm run build` | Production build    |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint               |

## Stack (short)

React (Vite), Tailwind CSS, Lucide icons, `@vapi-ai/web`, optional `@supabase/supabase-js`.

## Frontend vs backend-flow boundaries

- **Frontend/UI**: [`src/App.tsx`](src/App.tsx), [`src/components/VoiceOrb.tsx`](src/components/VoiceOrb.tsx), and [`src/index.css`](src/index.css) handle rendering, visual states, and user interaction affordances.
- **Backend API clients**: [`src/lib/parseResumeFile.ts`](src/lib/parseResumeFile.ts) and [`src/lib/reportScoring.ts`](src/lib/reportScoring.ts) call backend endpoints for parsing/scoring.
- **Orchestration**: [`src/hooks/useVapiInterview.ts`](src/hooks/useVapiInterview.ts) coordinates call lifecycle/events and exposes UI-safe state for App.
