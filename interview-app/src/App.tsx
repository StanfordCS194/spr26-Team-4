import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Briefcase,
  ChevronLeft,
  ChevronDown,
  Download,
  History,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { VoiceOrb } from './components/VoiceOrb'
import { useVapiInterview } from './hooks/useVapiInterview'
import type { InterviewCharacter } from './lib/buildSystemPrompt'
import { parseResumeFile } from './lib/parseResumeFile'
import {
  loadSessions,
  deleteSession as deleteSessionLocal,
  type InterviewSessionRecord,
} from './lib/sessionPersistence'

const CHARACTERS: {
  id: InterviewCharacter
  label: string
  persona: string
  blurb: string
}[] = [
  {
    id: 'tech-lead',
    label: 'Tech Lead',
    persona: 'Marissa',
    blurb: 'Depth on architecture, tradeoffs, and collaboration.',
  },
  {
    id: 'hiring-manager',
    label: 'Hiring Manager',
    persona: 'Paul',
    blurb: 'Scope, outcomes, and how you work with stakeholders.',
  },
]

const CHARACTER_LABELS: Record<string, string> = {
  'tech-lead': 'Tech Lead',
  'hiring-manager': 'Hiring Manager',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function downloadSessionFile(s: InterviewSessionRecord) {
  const lines = [
    'Interview Session Report',
    '========================',
    `Date:       ${formatDate(s.createdAt)}`,
    `Character:  ${CHARACTER_LABELS[s.character] ?? s.character}`,
    `Duration:   ${s.durationSeconds}s`,
    '',
    'Scores',
    '------',
    `Clarity:    ${s.clarityScore}/10`,
    `Confidence: ${s.confidenceRating}/10`,
    `Sentiment:  ${s.sentiment}`,
    '',
    'Top 3 Improvements',
    '------------------',
    ...s.topImprovements.map((t, i) => `${i + 1}. ${t}`),
    '',
    'Transcript Summary',
    '------------------',
    s.transcriptSummary || '—',
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `interview-${new Date(s.createdAt).toISOString().slice(0, 10)}-${s.id.slice(0, 6)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

type SortBy = 'date' | 'clarity' | 'confidence'
type AppView = 'main' | 'past-sessions' | 'past-detail'

export default function App() {
  const [character, setCharacter] = useState<InterviewCharacter>('tech-lead')
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [appView, setAppView] = useState<AppView>('main')
  const [selectedSession, setSelectedSession] = useState<InterviewSessionRecord | null>(null)
  const [savedSessions, setSavedSessions] = useState<InterviewSessionRecord[]>(() => loadSessions())
  const [sortBy, setSortBy] = useState<SortBy>('date')

  const {
    phase,
    muted,
    aiSpeaking,
    volume,
    error,
    report,
    connectingStage,
    startCall,
    endCall,
    toggleMute,
    resetToSetup,
  } = useVapiInterview()

  // Refresh saved sessions whenever returning to setup phase
  useEffect(() => {
    if (phase === 'setup') {
      setSavedSessions(loadSessions())
    }
  }, [phase])

  const refreshSessions = useCallback(() => {
    setSavedSessions(loadSessions())
  }, [])

  const handleDelete = useCallback(
    (id: string, afterDelete?: () => void) => {
      if (!window.confirm('Are you sure you want to delete this session? This cannot be undone.')) return
      deleteSessionLocal(id)
      refreshSessions()
      afterDelete?.()
    },
    [refreshSessions],
  )

  const sortedSessions = useMemo(() => {
    const copy = [...savedSessions]
    if (sortBy === 'clarity') return copy.sort((a, b) => b.clarityScore - a.clarityScore)
    if (sortBy === 'confidence') return copy.sort((a, b) => b.confidenceRating - a.confidenceRating)
    return copy // already stored newest-first
  }, [savedSessions, sortBy])

  const onPickFile = useCallback(async (file: File | null) => {
    if (!file) return
    setParseError(null)
    setParsing(true)
    setResumeFileName(file.name)
    try {
      const text = await parseResumeFile(file)
      setResumeText(text)
      if (!text.trim()) {
        setParseError('No text could be read from that file. Try a text resume or another PDF.')
      }
    } catch (e) {
      setResumeText('')
      setParseError(e instanceof Error ? e.message : 'Could not read that file.')
    } finally {
      setParsing(false)
    }
  }, [])

  const vapiConfigured = Boolean(import.meta.env.VITE_VAPI_PUBLIC_KEY)

  // ── Past sessions list ────────────────────────────────────────────────────
  if (appView === 'past-sessions') {
    return (
      <div className="min-h-svh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-16">
          <div className="mb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAppView('main')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
            <h1 className="text-xl font-semibold text-white">Previous Sessions</h1>
          </div>

          {savedSessions.length === 0 ? (
            <p className="text-center text-slate-400">No sessions recorded yet.</p>
          ) : (
            <>
              {/* Sort control */}
              <div className="mb-5 flex items-center gap-3">
                <label htmlFor="sort-select" className="text-xs text-slate-400 whitespace-nowrap">
                  Sort by
                </label>
                <div className="relative">
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="appearance-none rounded-xl border border-white/15 bg-white/10 py-2 pl-4 pr-9 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-400/60"
                  >
                    <option value="date">Date (newest first)</option>
                    <option value="clarity">Clarity (highest first)</option>
                    <option value="confidence">Confidence (highest first)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {sortedSessions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/20 backdrop-blur transition hover:border-violet-400/30"
                  >
                    {/* Clickable summary area */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSession(s)
                        setAppView('past-detail')
                      }}
                      className="w-full rounded-t-2xl px-5 pt-4 pb-3 text-left"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">
                          {CHARACTER_LABELS[s.character] ?? s.character}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(s.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                        <span>Duration: <span className="text-slate-300">{s.durationSeconds}s</span></span>
                        <span>Clarity: <span className="text-violet-300">{s.clarityScore}/10</span></span>
                        <span>Confidence: <span className="text-indigo-300">{s.confidenceRating}/10</span></span>
                        <span className="capitalize">Sentiment: <span className="text-slate-300">{s.sentiment}</span></span>
                      </div>
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 border-t border-white/5 px-5 py-2.5">
                      <button
                        type="button"
                        onClick={() => downloadSessionFile(s)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/30"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/25"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Past session detail ───────────────────────────────────────────────────
  if (appView === 'past-detail' && selectedSession) {
    const s = selectedSession
    return (
      <div className="min-h-svh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-16">
          <div className="mb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAppView('past-sessions')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {CHARACTER_LABELS[s.character] ?? s.character}
              </h1>
              <p className="text-xs text-slate-500">{formatDate(s.createdAt)}</p>
            </div>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl shadow-black/30 backdrop-blur">
            <h2 className="mb-6 text-center text-xl font-semibold text-white">
              Post-interview report
            </h2>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
                <p className="mt-1 text-2xl font-semibold text-white">{s.durationSeconds}s</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Clarity score</p>
                <p className="mt-1 text-2xl font-semibold text-violet-300">{s.clarityScore}/10</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-300">{s.confidenceRating}/10</p>
              </div>
            </div>
            <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Sentiment (heuristic)</p>
              <p className="mt-1 capitalize text-slate-200">{s.sentiment}</p>
            </div>
            <div className="mb-6">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Top 3 improved points
              </p>
              <ul className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-300">
                {s.topImprovements.map((t, i) => (
                  <li key={i} className="text-pretty">{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Transcript summary
              </p>
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words text-left text-xs leading-relaxed text-slate-400">
                {s.transcriptSummary || '—'}
              </pre>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => downloadSessionFile(s)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
              >
                <Download className="h-4 w-4" aria-hidden />
                Download report
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDelete(s.id, () => {
                    setSelectedSession(null)
                    setAppView('past-sessions')
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 px-5 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/30"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete session
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <header className="mb-10 text-center">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-violet-200/90">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            InterviewApp
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Interview Prep
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
            Voice practice with Vapi: pick an interviewer, upload your resume text, then run a
            three-question behavioral session with STAR and micro-feedback.
          </p>
        </header>

        {(error || parseError) && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
          >
            {error || parseError}
          </div>
        )}

        {!vapiConfigured && phase === 'setup' && (
          <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            Add{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-200">
              VITE_VAPI_PUBLIC_KEY
            </code>{' '}
            to <code className="rounded bg-black/30 px-1.5 py-0.5">interview-app/.env</code> to
            start calls. Optional:{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code> to
            log sessions remotely.
          </p>
        )}

        {phase === 'setup' && savedSessions.length > 0 && (
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                refreshSessions()
                setAppView('past-sessions')
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
            >
              <History className="h-4 w-4" aria-hidden />
              Review Previous Sessions
            </button>
          </div>
        )}

        {phase !== 'report' && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/20 backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <User className="h-4 w-4" aria-hidden />
              Character
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {CHARACTERS.map((c) => {
                const selected = character === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={phase === 'in-call' || phase === 'connecting'}
                    onClick={() => setCharacter(c.id)}
                    className={`rounded-xl border px-4 py-4 text-left transition ${
                      selected
                        ? 'border-violet-400/70 bg-violet-500/15 ring-1 ring-violet-400/40'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{c.label}</span>
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-violet-200">
                        {c.persona}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-snug text-slate-400">{c.blurb}</p>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {phase !== 'report' && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/20 backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <Briefcase className="h-4 w-4" aria-hidden />
              Resume
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,text/plain,application/pdf"
              className="hidden"
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={phase === 'in-call' || phase === 'connecting' || parsing}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" aria-hidden />
                {parsing ? 'Reading…' : 'Upload PDF or text'}
              </button>
              {resumeFileName && (
                <span className="text-sm text-slate-400">
                  {resumeFileName}
                  {resumeText.trim() ? (
                    <span className="ml-2 text-emerald-400/90">
                      ({resumeText.length.toLocaleString()} chars)
                    </span>
                  ) : null}
                </span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Text is injected into the assistant system prompt. For PDFs we extract embedded text
              only (scanned pages may be empty).
            </p>
          </section>
        )}

        {(phase === 'setup' || phase === 'connecting') && (
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              disabled={!vapiConfigured || parsing || phase === 'connecting'}
              onClick={() => void startCall(character, resumeText)}
              className="w-full max-w-md rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === 'connecting' ? 'Connecting…' : 'Start practice'}
            </button>
            {phase === 'connecting' && connectingStage && (
              <p className="text-xs text-slate-500">{connectingStage}</p>
            )}
            <p className="max-w-md text-center text-xs text-slate-500">
              Grant microphone access when the browser prompts. Session duration, transcript summary,
              and simple scores are saved locally; Supabase is used only if configured.
            </p>
          </div>
        )}

        {phase === 'in-call' && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-xl shadow-black/30 backdrop-blur">
            <p className="mb-6 text-sm text-slate-400">Session in progress</p>
            <div className="mb-8 flex justify-center">
              <VoiceOrb active={aiSpeaking} volume={volume} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
              >
                {muted ? (
                  <>
                    <MicOff className="h-4 w-4" aria-hidden />
                    Unmute mic
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" aria-hidden />
                    Mute mic
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={endCall}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 px-5 py-2.5 text-sm font-medium text-rose-100 hover:bg-rose-500/30"
              >
                <PhoneOff className="h-4 w-4" aria-hidden />
                End call
              </button>
            </div>
          </section>
        )}

        {phase === 'report' && report && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl shadow-black/30 backdrop-blur">
            <h2 className="mb-6 text-center text-xl font-semibold text-white">
              Post-interview report
            </h2>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {report.durationSeconds}s
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Clarity score</p>
                <p className="mt-1 text-2xl font-semibold text-violet-300">
                  {report.clarityScore}/10
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-300">
                  {report.confidenceRating}/10
                </p>
              </div>
            </div>
            <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Sentiment (heuristic)</p>
              <p className="mt-1 capitalize text-slate-200">{report.sentiment}</p>
            </div>
            <div className="mb-6">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Top 3 improved points
              </p>
              <ul className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-300">
                {report.topImprovements.map((t, i) => (
                  <li key={i} className="text-pretty">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Transcript summary
              </p>
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words text-left text-xs leading-relaxed text-slate-400">
                {report.transcriptSummary || '—'}
              </pre>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={resetToSetup}
                className="rounded-xl border border-white/15 bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/15"
              >
                Back to dashboard
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
