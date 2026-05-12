import { apiUrl, getApiError } from './apiClient'

export type ReportSentiment = 'positive' | 'neutral' | 'negative'

export type ReportFeedback = {
  clarityScore: number
  confidenceRating: number
  topImprovements: string[]
  sentiment: ReportSentiment
}

function isReportFeedback(value: unknown): value is ReportFeedback {
  if (!value || typeof value !== 'object') return false
  const data = value as ReportFeedback
  return (
    typeof data.clarityScore === 'number' &&
    typeof data.confidenceRating === 'number' &&
    (data.sentiment === 'positive' ||
      data.sentiment === 'neutral' ||
      data.sentiment === 'negative') &&
    Array.isArray(data.topImprovements) &&
    data.topImprovements.every((item) => typeof item === 'string')
  )
}

export async function scoreInterviewFeedback(
  userText: string,
  transcriptSummary: string,
): Promise<ReportFeedback> {
  const response = await fetch(apiUrl('/api/report/score'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userText, transcriptSummary }),
  })

  if (!response.ok) {
    throw new Error(await getApiError(response, 'Could not score interview report.'))
  }

  const payload = (await response.json()) as unknown
  if (!isReportFeedback(payload)) {
    throw new Error('Backend returned an invalid report score response.')
  }

  return payload
}
