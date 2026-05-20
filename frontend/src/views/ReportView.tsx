// Report view: displays the just-completed interview report and reset action.

import { useState } from 'react'
import type { PostInterviewReport } from '../hooks/useVapiInterview'
import { ReportSummary } from '../components/ReportSummary'
import { GLASS_CARD_CLASS } from '../lib/interviewUi'

type ReportViewProps = {
  report: PostInterviewReport
  onFeedbackUsefulnessRating: (sessionId: string, rating: number) => void
  onResetToSetup: () => void
}

export function ReportView({
  report,
  onFeedbackUsefulnessRating,
  onResetToSetup,
}: ReportViewProps) {
  const [showRating, setShowRating] = useState(false)
  const [submittedRating, setSubmittedRating] = useState<number | null>(null)

  const submitRating = (rating: number) => {
    // Optimistically lock in the submitted rating before delegating persistence to App.
    setSubmittedRating(rating)
    onFeedbackUsefulnessRating(report.sessionId, rating)
  }

  return (
    <section className={GLASS_CARD_CLASS}>
      <h2 className="mb-6 text-center text-xl font-semibold text-white">
        Post-interview report
      </h2>

      <ReportSummary report={report} />

      {/* KPI tracking: optional feedback usefulness rating */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
        <p className="text-sm font-medium text-white">Was this feedback useful?</p>
        <p className="mt-1 text-xs text-slate-400">
          Optional: rate it only if you want to help us improve the prototype.
        </p>

        {submittedRating == null && !showRating && (
          <button
            type="button"
            onClick={() => setShowRating(true)}
            className="mt-4 rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/25"
          >
            Rate feedback usefulness
          </button>
        )}

        {submittedRating == null && showRating && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => submitRating(rating)}
                className="h-9 w-9 rounded-lg border border-white/15 bg-white/10 text-sm font-medium text-white transition hover:border-sky-300/60 hover:bg-sky-500/20"
                aria-label={`Rate feedback usefulness ${rating} out of 10`}
              >
                {rating}
              </button>
            ))}
          </div>
        )}

        {submittedRating != null && (
          <p className="mt-4 text-sm text-emerald-300">
            Thanks. Saved usefulness rating: {submittedRating}/10.
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onResetToSetup}
          className="rounded-xl border border-white/15 bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/15"
        >
          Back to dashboard
        </button>
      </div>
    </section>
  )
}