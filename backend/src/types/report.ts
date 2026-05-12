export type ReportSentiment = 'positive' | 'neutral' | 'negative'

export type ReportFeedback = {
  clarityScore: number
  confidenceRating: number
  topImprovements: string[]
  sentiment: ReportSentiment
}
