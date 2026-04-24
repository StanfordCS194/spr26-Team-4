# InterviewApp (prototype)

Single-page **Interview Prep** practice app: pick interviewer persona (Marissa / Paul), upload resume text (PDF or `.txt`), run a voice session via **Vapi**, then see a short post-call report. Sessions are saved to **localStorage**; **Supabase** is optional.

## Run it locally (right now)

1. **Open a terminal** in this folder (`interview-app`).

2. **Install dependencies** (once):

   ```bash
   npm install
   ```

3. **Configure environment variables**  
   Copy the example env file and add your Vapi public key:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   - **`VITE_VAPI_PUBLIC_KEY`** — from the [Vapi dashboard](https://dashboard.vapi.ai/) (API keys → public key used for web clients).

   Optional, for remote session logging:

   - **`VITE_SUPABASE_URL`**
   - **`VITE_SUPABASE_ANON_KEY`**  
   If you use Supabase, create an `interview_sessions` table as described in `src/lib/sessionPersistence.ts`.

4. **Start the dev server**:

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

React (Vite), Tailwind CSS, Lucide icons, `@vapi-ai/web`, optional `@supabase/supabase-js`, `pdfjs-dist` for PDF text extraction.

## Frontend vs backend-flow boundaries

- **Frontend/UI**: [`src/App.tsx`](src/App.tsx), [`src/components/VoiceOrb.tsx`](src/components/VoiceOrb.tsx), and [`src/index.css`](src/index.css) handle rendering, visual states, and user interaction affordances.
- **Backend-flow modules**: [`src/lib/parseResumeFile.ts`](src/lib/parseResumeFile.ts), [`src/lib/reportScoring.ts`](src/lib/reportScoring.ts), and [`src/lib/sessionPersistence.ts`](src/lib/sessionPersistence.ts) handle parsing, scoring, and persistence logic.
- **Orchestration**: [`src/hooks/useVapiInterview.ts`](src/hooks/useVapiInterview.ts) coordinates call lifecycle/events and exposes UI-safe state for App.
