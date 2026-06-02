/* App.tsx

Main entry point for the application.
Responsible for loading all app states and UI:
    onboarding, setup, in-call, report, saved sessions, KPIs
*/


import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { History, Moon, Sun } from 'lucide-react'
import { useVapiInterview } from './hooks/useVapiInterview'
import type { InterviewCharacter } from './lib/buildSystemPrompt'
import { parseResumeFile } from './lib/parseResumeFile'
import {
  deleteSession as deleteSessionLocal,
  loadKpiMetrics,
  loadSessions,
  updateSessionFeedbackUsefulnessLocal,
  updateSessionFeedbackUsefulnessRemote,
  type InterviewKpiMetrics,
  type InterviewSessionRecord,
} from './lib/sessionPersistence'
import { classifyJobDescription, type ClassifyJobResult } from './lib/classifyJob'
import { loadOnboardingResult, type OnboardingResult } from './lib/onboarding'
import { GLASS_CARD_CLASS, PAGE_CLASS, SHELL_CLASS } from './lib/interviewUi'
import { InCallView } from './views/InCallView'
import { OnboardingView } from './views/OnboardingView'
import { PastSessionDetailView } from './views/PastSessionDetailView'
import { PastSessionsView, type SortBy } from './views/PastSessionsView'
import { ReportView } from './views/ReportView'
import { SetupView } from './views/SetupView'

// Dashboard navigation states
// These screens are not part of the live Vapi lifecycle, so they are modeled
// separately from `phase`
type AppView = 'main' | 'past-sessions' | 'past-detail'
type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'interview_app_theme_v1'

function loadTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  // Keep theme parsing defensive so malformed localStorage values cannot break rendering.
  return saved === 'light' || saved === 'dark' ? saved : 'dark'
}

export default function App() {
  // Onboarding (set initial interviewer)
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme())
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(() =>
    loadOnboardingResult(),
  )
  const [character, setCharacter] = useState<InterviewCharacter>(
    () => onboardingResult?.assignedCharacter ?? 'tech',
  )

  // Cross-view setup state
  const [resumeText, setResumeText] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [classifying, setClassifying] = useState(false)
  const [recommendedAgent, setRecommendedAgent] = useState<ClassifyJobResult | null>(null)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cross-view history state
  // Keep one centralized copy to avoid stale view-local state
  const [appView, setAppView] = useState<AppView>('main')
  const [selectedSession, setSelectedSession] = useState<InterviewSessionRecord | null>(null)
  const [savedSessions, setSavedSessions] = useState<InterviewSessionRecord[]>(() => loadSessions())
  const [kpiMetrics, setKpiMetrics] = useState<InterviewKpiMetrics>(() => loadKpiMetrics())
  const [sortBy, setSortBy] = useState<SortBy>('date')

  // Live interview
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

  useEffect(() => {
    // Theme classes live on <html> so shared CSS can style every view consistently.
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (phase !== 'setup') return

    // When a report flow returns to setup, reload persisted data so the history/KPI
    // dashboard reflects the just-finished session
    const refreshId = window.setTimeout(() => {
      setSavedSessions(loadSessions())
      setKpiMetrics(loadKpiMetrics())
    }, 0)

    return () => window.clearTimeout(refreshId)
  }, [phase])

  const refreshSessions = useCallback(() => {
    setSavedSessions(loadSessions())
    setKpiMetrics(loadKpiMetrics())
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
    // Copy before sorting to avoid mutating React state arrays in place.
    const copy = [...savedSessions]

    if (sortBy === 'clarity') return copy.sort((a, b) => b.clarityScore - a.clarityScore)
    if (sortBy === 'confidence') return copy.sort((a, b) => b.confidenceRating - a.confidenceRating)

    return copy
  }, [savedSessions, sortBy])

  const onPickFile = useCallback(async (file: File | null) => {
    if (!file) return

    setParseError(null)
    setParsing(true)
    setResumeFileName(file.name)

    try {
      // parseResumeFile abstracts PDF/text extraction so SetupView stays presentation-only
      const text = await parseResumeFile(file)
      setResumeText(text)

      if (!text.trim()) {
        setParseError('No text could be read from that file. Try another file.')
      }
    } catch (e) {
      setResumeText('')
      setParseError(e instanceof Error ? e.message : 'Could not read that file.')
    } finally {
      setParsing(false)
    }
  }, [])

  // Environment gating lets the UI render in development even before Vapi is configured.
  const vapiConfigured = Boolean(import.meta.env.VITE_VAPI_PUBLIC_KEY)
  const callError = error && error !== parseError ? error : null

  const beginPractice = useCallback(() => {
    void startCall(character, resumeText, jobDescriptionText)
  }, [character, resumeText, jobDescriptionText, startCall])

  // POSTs the current job description to the backend classify endpoint and updates the selected character
  const handleRecommendInterviewer = useCallback(() => {
    if (!jobDescriptionText.trim()) return

    setClassifying(true)
    void classifyJobDescription(jobDescriptionText)
      .then((data) => {
        setRecommendedAgent(data)
        setCharacter(data.agentType)
      })
      .catch((e) => {
        setParseError(e instanceof Error ? e.message : 'Could not classify job description.')
      })
      .finally(() => setClassifying(false))
  }, [jobDescriptionText])

  const handleFeedbackUsefulnessRating = useCallback(
    (sessionId: string, rating: number) => {
      // Update locally first so the dashboard reflects the rating even when Supabase is absent
      updateSessionFeedbackUsefulnessLocal(sessionId, rating)
      void updateSessionFeedbackUsefulnessRemote(sessionId, rating)

      refreshSessions()
    },
    [refreshSessions],
  )

  const handleOnboardingComplete = useCallback((result: OnboardingResult) => {
    setOnboardingResult(result)
    setCharacter(result.assignedCharacter)
  }, [])

  const themeToggle = (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      className="app-secondary-button group inline-flex w-11 items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-out hover:w-36 hover:bg-white/20 focus-visible:w-36 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 shrink-0" aria-hidden />
          <span className="max-w-0 whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:max-w-24 group-hover:opacity-100 group-focus-visible:max-w-24 group-focus-visible:opacity-100">
            Light mode
          </span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="max-w-0 whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:max-w-24 group-hover:opacity-100 group-focus-visible:max-w-24 group-focus-visible:opacity-100">
            Dark mode
          </span>
        </>
      )}
    </button>
  )

  // Render onboarding for first-time users
  if (!onboardingResult) {
    return <OnboardingView onComplete={handleOnboardingComplete} />
  }

  // Render history list and details before interview starts
  if (appView === 'past-sessions') {
    return (
      <PastSessionsView
        sessions={sortedSessions}
        kpiMetrics={kpiMetrics}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onBack={() => setAppView('main')}
        headerAction={themeToggle}
        onSelectSession={(session) => {
          setSelectedSession(session)
          setAppView('past-detail')
        }}
        onDeleteSession={handleDelete}
      />
    )
  }

  if (appView === 'past-detail' && selectedSession) {
    return (
      <PastSessionDetailView
        session={selectedSession}
        onBack={() => setAppView('past-sessions')}
        headerAction={themeToggle}
        onDeleteSession={handleDelete}
        onDeleted={() => {
          setSelectedSession(null)
          setAppView('past-sessions')
        }}
      />
    )
  }

  // Render interview lifecycle and voice agent last.
  return (
    <div className={PAGE_CLASS}>
      <div className={SHELL_CLASS}>
        <div className="mb-6 flex justify-end">{themeToggle}</div>

        <header className="mb-10 text-center sm:mb-12">
          <div className="flex items-center justify-center gap-3">
            <img
              src="/StarReady_Logo_transparent.svg"
              alt=""
              className="app-logo h-12 w-12 shrink-0 sm:h-14 sm:w-14"
            />
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              StarReady
            </h1>
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
            Practice with a voice interviewer in a focused dashboard: choose a persona, upload your
            resume, and run a three-question STAR session with instant micro-feedback.
          </p>
        </header>

        {parseError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-amber-500/35 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
          >
            Resume parsing issue: {parseError}
          </div>
        )}

        {callError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-rose-500/35 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
          >
            Call issue: {callError}
          </div>
        )}

        {!vapiConfigured && phase === 'setup' && (
          <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            Add{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-200">
              VITE_VAPI_PUBLIC_KEY
            </code>{' '}
            to <code className="rounded bg-black/30 px-1.5 py-0.5">frontend/.env</code> to
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
                // Refresh just before opening history in case a session was saved moments ago.
                refreshSessions()
                setAppView('past-sessions')
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20"
            >
              <History className="h-4 w-4" aria-hidden />
              Review Previous Sessions
            </button>
          </div>
        )}

        {phase !== 'report' && (
          <SetupView
            character={character}
            phase={phase}
            parsing={parsing}
            resumeFileName={resumeFileName}
            resumeText={resumeText}
            jobDescriptionText={jobDescriptionText}
            fileInputRef={fileInputRef}
            classifying={classifying}
            recommendedAgent={recommendedAgent}
            onCharacterChange={setCharacter}
            onJobDescriptionChange={setJobDescriptionText}
            onRecommendInterviewer={handleRecommendInterviewer}
            onPickFile={(file) => void onPickFile(file)}
          />
        )}

        {(phase === 'setup' || phase === 'connecting') && (
          <div className={`${GLASS_CARD_CLASS} mb-8 flex flex-col items-center gap-4 text-center`}>
            <button
              type="button"
              disabled={!vapiConfigured || parsing || phase === 'connecting'}
              onClick={beginPractice}
              className="w-full max-w-lg rounded-2xl bg-sky-500 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-sky-900/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === 'connecting' ? 'Connecting…' : 'Start practice'}
            </button>

            {phase === 'connecting' && connectingStage && (
              <p className="rounded-md border border-sky-300/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-100">
                {connectingStage}
              </p>
            )}

            <p className="max-w-2xl text-xs text-slate-400">
              Grant microphone access when the browser prompts. Transcripts and scores are saved locally.
            </p>
          </div>
        )}

        {phase === 'in-call' && (
          <InCallView
            muted={muted}
            aiSpeaking={aiSpeaking}
            volume={volume}
            onToggleMute={toggleMute}
            onEndCall={endCall}
          />
        )}

        {phase === 'report' && report && (
          <ReportView
            report={report}
            onFeedbackUsefulnessRating={handleFeedbackUsefulnessRating}
            onResetToSetup={resetToSetup}
          />
        )}
      </div>
    </div>
  )
}