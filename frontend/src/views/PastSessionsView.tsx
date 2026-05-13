// Past sessions view: lists saved reports with sorting and quick actions.

import type { ReactNode } from 'react'
import { ChevronDown, ChevronLeft, Download, Trash2 } from 'lucide-react'
import type { InterviewKpiMetrics, InterviewSessionRecord } from '../lib/sessionPersistence'
import {
  CHARACTER_LABELS,
  downloadSessionFile,
  formatDate,
  PAGE_CLASS,
  SECONDARY_BUTTON_CLASS,
  SHELL_CLASS,
} from '../lib/interviewUi'

export type SortBy = 'date' | 'clarity' | 'confidence'

type PastSessionsViewProps = {
  sessions: InterviewSessionRecord[]
  kpiMetrics: InterviewKpiMetrics
  sortBy: SortBy
  onSortChange: (sortBy: SortBy) => void
  onBack: () => void
  headerAction?: ReactNode
  onSelectSession: (session: InterviewSessionRecord) => void
  onDeleteSession: (id: string) => void
}

export function PastSessionsView({
  sessions,
  kpiMetrics,
  sortBy,
  onSortChange,
  onBack,
  headerAction,
  onSelectSession,
  onDeleteSession,
}: PastSessionsViewProps) {
  const averageDuration =
    kpiMetrics.averageDurationSeconds == null
      ? '-'
      : `${Math.round(kpiMetrics.averageDurationSeconds)}s`
  const completionRate =
    kpiMetrics.completionRate == null ? '-' : `${Math.round(kpiMetrics.completionRate * 100)}%`
  const feedbackUsefulness =
    kpiMetrics.averageFeedbackUsefulnessRating == null
      ? 'No ratings yet'
      : `${kpiMetrics.averageFeedbackUsefulnessRating.toFixed(1)}/10`

  return (
    <div className={PAGE_CLASS}>
      <div className={SHELL_CLASS}>
        <div className="mb-8 flex items-center gap-4">
          <button type="button" onClick={onBack} className={SECONDARY_BUTTON_CLASS}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <h1 className="text-xl font-semibold text-white">Previous Sessions</h1>
          {headerAction && <div className="ml-auto">{headerAction}</div>}
        </div>

        {sessions.length === 0 ? (
          <p className="text-center text-slate-400">No sessions recorded yet.</p>
        ) : (
          <>
            {/* KPI tracking: high-yield prototype metrics from local completed sessions and attempts. */}
            <section className="mb-6 rounded-3xl border border-white/15 bg-white/[0.05] p-5 shadow-xl shadow-black/25 backdrop-blur">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Stats
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Avg interview duration
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">{averageDuration}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Across {kpiMetrics.completedSessions} completed sessions
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Completion rate
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">{completionRate}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {kpiMetrics.completedAttempts}/{kpiMetrics.startedAttempts} attempts completed
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Feedback usefulness
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">{feedbackUsefulness}</p>
                </div>
              </div>
            </section>

            <div className="mb-5 flex items-center gap-3">
              <label htmlFor="sort-select" className="whitespace-nowrap text-xs text-slate-400">
                Sort by
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortBy)}
                  className="appearance-none rounded-xl border border-white/15 bg-white/10 py-2 pl-4 pr-9 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                >
                  <option value="date">Date (newest first)</option>
                  <option value="clarity">Clarity (highest first)</option>
                  <option value="confidence">Confidence (highest first)</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 backdrop-blur transition hover:border-violet-400/40"
                >
                  <button
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className="w-full rounded-t-2xl px-5 pb-3 pt-4 text-left"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">
                        {CHARACTER_LABELS[session.character] ?? session.character}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(session.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                      <span>
                        Duration:{' '}
                        <span className="text-slate-300">{session.durationSeconds}s</span>
                      </span>
                      <span>
                        Clarity:{' '}
                        <span className="text-violet-300">{session.clarityScore}/10</span>
                      </span>
                      <span>
                        Confidence:{' '}
                        <span className="text-indigo-300">{session.confidenceRating}/10</span>
                      </span>
                      <span className="capitalize">
                        Sentiment: <span className="text-slate-300">{session.sentiment}</span>
                      </span>
                      {typeof session.feedbackUsefulnessRating === 'number' && (
                        <span>
                          Feedback usefulness:{' '}
                          <span className="text-sky-300">
                            {session.feedbackUsefulnessRating}/10
                          </span>
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 border-t border-white/5 px-5 py-2.5">
                    <button
                      type="button"
                      onClick={() => downloadSessionFile(session)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/30"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/25"
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
