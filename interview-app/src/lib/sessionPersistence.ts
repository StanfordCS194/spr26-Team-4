import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
}

const LOCAL_KEY = 'interview_app_sessions_v1'

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
  const next = [record, ...readLocal()].slice(0, 50)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
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
 *   top_improvements text[] not null
 * );
 */
export async function saveSessionRemote(record: InterviewSessionRecord) {
  const client = getSupabase()
  if (!client) return

  const { error } = await client.from('interview_sessions').insert({
    id: record.id,
    created_at: record.createdAt,
    duration_seconds: record.durationSeconds,
    transcript_summary: record.transcriptSummary,
    sentiment: record.sentiment,
    character: record.character,
    clarity_score: record.clarityScore,
    confidence_rating: record.confidenceRating,
    top_improvements: record.topImprovements,
  })

  if (error) {
    console.warn('[InterviewApp] Supabase insert skipped:', error.message)
  }
}
