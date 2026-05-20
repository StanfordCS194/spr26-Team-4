import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Backend-flow adapter: local/remote persistence for completed interview sessions.
export type InterviewSessionRecord = {
  id: string
  createdAt: string
  durationSeconds: number
  transcriptSummary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  character: string
  clarityScore: number
  confidenceRating: number
  topImprovements: string[]
  feedbackUsefulnessRating?: number
}

const LOCAL_KEY = 'interview_app_sessions_v1'
const ATTEMPTS_LOCAL_KEY = 'interview_app_attempts_v1'

function readLocal(): InterviewSessionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InterviewSessionRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadSessions(): InterviewSessionRecord[] {
  return readLocal()
}

export function deleteSession(id: string): void {
  const next = readLocal().filter((s) => s.id !== id)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
}

export function saveSessionLocal(record: InterviewSessionRecord) {
  // Keep recent history bounded so localStorage stays predictable for repeat testers.
  const next = [record, ...readLocal()].slice(0, 50)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
}

// KPI tracking: attempts let us measure starts vs completions without changing
// the core completed-session report shape.
export type InterviewAttemptStatus = 'started' | 'completed' | 'failed'

export type InterviewAttemptRecord = {
  id: string
  startedAt: string
  endedAt?: string
  status: InterviewAttemptStatus
  durationSeconds?: number
  failureReason?: string
}

export type InterviewKpiMetrics = {
  completedSessions: number
  startedAttempts: number
  completedAttempts: number
  averageDurationSeconds: number | null
  completionRate: number | null
  averageFeedbackUsefulnessRating: number | null
  feedbackUsefulnessRatingCount: number
}

function readAttemptsLocal(): InterviewAttemptRecord[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InterviewAttemptRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAttemptsLocal(records: InterviewAttemptRecord[]) {
  // Attempts are only used for aggregate KPIs, so older records can be safely trimmed.
  localStorage.setItem(ATTEMPTS_LOCAL_KEY, JSON.stringify(records.slice(0, 100)))
}

function updateAttemptLocal(
  id: string,
  update: Partial<Omit<InterviewAttemptRecord, 'id' | 'startedAt'>>,
) {
  const attempts = readAttemptsLocal()
  const next = attempts.map((attempt) =>
    attempt.id === id ? { ...attempt, ...update } : attempt,
  )
  saveAttemptsLocal(next)
}

export function loadAttempts(): InterviewAttemptRecord[] {
  return readAttemptsLocal()
}

export function startInterviewAttempt(): InterviewAttemptRecord {
  const attempt: InterviewAttemptRecord = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    status: 'started',
  }
  saveAttemptsLocal([attempt, ...readAttemptsLocal()])
  return attempt
}

export function completeInterviewAttempt(id: string, durationSeconds: number): void {
  updateAttemptLocal(id, {
    status: 'completed',
    endedAt: new Date().toISOString(),
    durationSeconds,
  })
}

export function failInterviewAttempt(id: string, failureReason: string): void {
  updateAttemptLocal(id, {
    status: 'failed',
    endedAt: new Date().toISOString(),
    failureReason,
  })
}

export function updateSessionFeedbackUsefulnessLocal(
  id: string,
  feedbackUsefulnessRating: number,
): InterviewSessionRecord | null {
  const sessions = readLocal()
  let updated: InterviewSessionRecord | null = null
  const next = sessions.map((session) => {
    if (session.id !== id) return session
    updated = { ...session, feedbackUsefulnessRating }
    return updated
  })
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
  return updated
}

export function loadKpiMetrics(): InterviewKpiMetrics {
  const sessions = readLocal()
  const attempts = readAttemptsLocal()
  const completedAttempts = attempts.filter((attempt) => attempt.status === 'completed').length
  // Feedback usefulness is optional, so averages are based only on submitted ratings.
  const feedbackRatings = sessions
    .map((session) => session.feedbackUsefulnessRating)
    .filter((rating): rating is number => typeof rating === 'number')

  return {
    completedSessions: sessions.length,
    startedAttempts: attempts.length,
    completedAttempts,
    averageDurationSeconds: sessions.length
      ? sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / sessions.length
      : null,
    completionRate: attempts.length ? completedAttempts / attempts.length : null,
    averageFeedbackUsefulnessRating: feedbackRatings.length
      ? feedbackRatings.reduce((sum, rating) => sum + rating, 0) / feedbackRatings.length
      : null,
    feedbackUsefulnessRatingCount: feedbackRatings.length,
  }
}

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!supabase) {
    supabase = createClient(url, key)
  }
  return supabase
}

/**
 * Optional Supabase persistence. Create a table similar to:
 *
 * create table if not exists public.interview_sessions (
 *   id text primary key,
 *   created_at timestamptz not null default now(),
 *   duration_seconds int not null,
 *   transcript_summary text not null,
 *   sentiment text not null,
 *   character text not null,
 *   clarity_score int not null,
 *   confidence_rating int not null,
 *   top_improvements text[] not null,
 *   feedback_usefulness_rating int
 * );
 */
export async function saveSessionRemote(record: InterviewSessionRecord) {
  const client = getSupabase()
  if (!client) return

  const row = {
    id: record.id,
    created_at: record.createdAt,
    duration_seconds: record.durationSeconds,
    transcript_summary: record.transcriptSummary,
    sentiment: record.sentiment,
    character: record.character,
    clarity_score: record.clarityScore,
    confidence_rating: record.confidenceRating,
    top_improvements: record.topImprovements,
    ...(typeof record.feedbackUsefulnessRating === 'number'
      ? { feedback_usefulness_rating: record.feedbackUsefulnessRating }
      : {}),
  }

  const { error } = await client.from('interview_sessions').insert(row)

  if (error) {
    console.warn('[InterviewApp] Supabase insert skipped:', error.message)
  }
}

export async function updateSessionFeedbackUsefulnessRemote(
  id: string,
  feedbackUsefulnessRating: number,
) {
  const client = getSupabase()
  if (!client) return

  const { error } = await client
    .from('interview_sessions')
    .update({ feedback_usefulness_rating: feedbackUsefulnessRating })
    .eq('id', id)

  if (error) {
    console.warn('[InterviewApp] Supabase feedback rating update skipped:', error.message)
  }
}
