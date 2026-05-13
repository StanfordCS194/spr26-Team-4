// Past session detail view: renders one saved report with download/delete actions.

import type { ReactNode } from 'react'
import { ChevronLeft, Download, Trash2 } from 'lucide-react'
import { ReportSummary } from '../components/ReportSummary'
import type { InterviewSessionRecord } from '../lib/sessionPersistence'
import {
  CHARACTER_LABELS,
  downloadSessionFile,
  formatDate,
  GLASS_CARD_CLASS,
  PAGE_CLASS,
  SECONDARY_BUTTON_CLASS,
  SHELL_CLASS,
} from '../lib/interviewUi'

type PastSessionDetailViewProps = {
  session: InterviewSessionRecord
  onBack: () => void
  headerAction?: ReactNode
  onDeleteSession: (id: string, afterDelete?: () => void) => void
  onDeleted: () => void
}

export function PastSessionDetailView({
  session,
  onBack,
  headerAction,
  onDeleteSession,
  onDeleted,
}: PastSessionDetailViewProps) {
  return (
    <div className={PAGE_CLASS}>
      <div className={SHELL_CLASS}>
        <div className="mb-8 flex items-center gap-4">
          <button type="button" onClick={onBack} className={SECONDARY_BUTTON_CLASS}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {CHARACTER_LABELS[session.character] ?? session.character}
            </h1>
            <p className="text-xs text-slate-500">{formatDate(session.createdAt)}</p>
          </div>
          {headerAction && <div className="ml-auto">{headerAction}</div>}
        </div>

        <section className={GLASS_CARD_CLASS}>
          <h2 className="mb-6 text-center text-xl font-semibold text-white">
            Post-interview report
          </h2>
          <ReportSummary report={session} />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => downloadSessionFile(session)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download report
            </button>
            <button
              type="button"
              onClick={() => onDeleteSession(session.id, onDeleted)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 px-5 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/30"
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
