// Shared report UI: renders score, sentiment, improvements, and transcript details.

type ReportSummaryData = {
  durationSeconds: number
  transcriptSummary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  clarityScore: number
  confidenceRating: number
  topImprovements: string[]
  feedbackUsefulnessRating?: number
}

type ReportSummaryProps = {
  report: ReportSummaryData
}

// Returns Tailwind bg + border classes for a 0-10 score.
// Low (<=4): rose tint, mid (5-6): amber tint, high (>=7): emerald tint.
function scoreCardClass(score: number): string {
  if (score >= 7) return 'border-emerald-500/25 bg-emerald-500/10'
  if (score >= 5) return 'border-amber-400/25 bg-amber-400/10'
  return 'border-rose-500/25 bg-rose-500/10'
}

function scoreValueClass(score: number): string {
  if (score >= 7) return 'text-emerald-300'
  if (score >= 5) return 'text-amber-300'
  return 'text-rose-300'
}

function sentimentCardClass(sentiment: ReportSummaryData['sentiment']): string {
  if (sentiment === 'positive') return 'border-emerald-500/25 bg-emerald-500/10'
  if (sentiment === 'negative') return 'border-rose-500/25 bg-rose-500/10'
  return 'border-white/10 bg-black/20'
}

function sentimentValueClass(sentiment: ReportSummaryData['sentiment']): string {
  if (sentiment === 'positive') return 'text-emerald-300'
  if (sentiment === 'negative') return 'text-rose-300'
  return 'text-slate-300'
}

function ScoreCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: number
}) {
  const colorClasses = tone == null ? 'border-white/10 bg-black/20' : scoreCardClass(tone)
  const valueClasses = tone == null ? 'text-white' : scoreValueClass(tone)

  return (
    <div className={`rounded-xl border p-4 text-center ${colorClasses}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClasses}`}>{value}</p>
    </div>
  )
}

export function ReportSummary({ report }: ReportSummaryProps) {
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Duration" value={`${report.durationSeconds}s`} />
        <ScoreCard
          label="Clarity score"
          value={`${report.clarityScore}/10`}
          tone={report.clarityScore}
        />
        <ScoreCard
          label="Confidence"
          value={`${report.confidenceRating}/10`}
          tone={report.confidenceRating}
        />
      </div>

      <div className={`mb-6 rounded-xl border p-4 ${sentimentCardClass(report.sentiment)}`}>
        <p className="text-xs uppercase tracking-wide text-slate-500">Sentiment</p>
        <p className={`mt-1 font-medium capitalize ${sentimentValueClass(report.sentiment)}`}>
          {report.sentiment}
        </p>
      </div>

      {typeof report.feedbackUsefulnessRating === 'number' && (
        <div className="mb-6 rounded-xl border border-sky-400/25 bg-sky-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Feedback usefulness rating
          </p>
          <p className="mt-1 font-medium text-sky-200">{report.feedbackUsefulnessRating}/10</p>
        </div>
      )}

      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
          Top 3 improved points
        </p>
        <ul className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-300">
          {report.topImprovements.map((improvement, index) => (
            <li key={index} className="text-pretty">
              {improvement}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
          Transcript summary
        </p>
        <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words text-left text-xs leading-relaxed text-slate-400">
          {report.transcriptSummary || '-'}
        </pre>
      </div>
    </>
  )
}
