import type { InterviewCharacter } from './buildSystemPrompt'
import type { InterviewSessionRecord } from './sessionPersistence'

export const CHARACTERS: {
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

export const CHARACTER_LABELS: Record<string, string> = {
  'tech-lead': 'Tech Lead',
  'hiring-manager': 'Hiring Manager',
}

export const PAGE_CLASS =
  'app-page min-h-svh bg-slate-950 bg-[radial-gradient(circle_at_15%_15%,_rgba(56,189,248,0.22),_transparent_35%),radial-gradient(circle_at_85%_10%,_rgba(167,139,250,0.22),_transparent_40%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-slate-100'

export const SHELL_CLASS = 'mx-auto max-w-6xl px-4 py-10 pb-16 sm:px-6'

export const GLASS_CARD_CLASS =
  'app-card rounded-3xl border border-white/15 bg-white/[0.05] p-6 shadow-2xl shadow-black/35 backdrop-blur-md'

export const SECONDARY_BUTTON_CLASS =
  'app-secondary-button inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50'

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function downloadSessionFile(s: InterviewSessionRecord) {
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
    `Interview tone: ${s.sentiment}`,
    ...(s.sentimentSummary ? [`Tone summary: ${s.sentimentSummary}`] : []),
    ...(typeof s.feedbackUsefulnessRating === 'number'
      ? [`Feedback usefulness: ${s.feedbackUsefulnessRating}/10`]
      : []),
    '',
    'Top 3 Improvements',
    '------------------',
    ...s.topImprovements.map((t, i) => `${i + 1}. ${t}`),
    '',
    'Transcript Summary',
    '------------------',
    s.transcriptSummary || '-',
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `interview-${new Date(s.createdAt).toISOString().slice(0, 10)}-${s.id.slice(0, 6)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
