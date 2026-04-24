const FILLERS = /\b(um|uh|like|you know|sort of|kind of)\b/gi
const HEDGE =
  /\b(i think|maybe|probably|i guess|not sure|i'm not sure|i am not sure)\b/gi

// Backend-flow adapter: transcript scoring and heuristic feedback generation.
export function simpleSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase()
  const pos = (
    lower.match(
      /\b(achieved|success|great|excited|confident|led|improved|delivered|impact|growth)\b/g,
    ) || []
  ).length
  const neg = (
    lower.match(
      /\b(struggled|failed|difficult|unsure|weak|lack|problem|conflict|mistake)\b/g,
    ) || []
  ).length
  if (pos > neg + 1) return 'positive'
  if (neg > pos + 1) return 'negative'
  return 'neutral'
}

export function scoreFromUserTranscript(userText: string): {
  clarityScore: number
  confidenceRating: number
  topImprovements: string[]
} {
  const text = userText.trim()
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const words = text.split(/\s+/).filter(Boolean)
  const fillerMatches = text.match(FILLERS) || []
  const hedgeMatches = text.match(HEDGE) || []

  let clarity = 7
  if (words.length < 20) clarity -= 2
  if (fillerMatches.length > 5) clarity -= 2
  if (fillerMatches.length > 10) clarity -= 1
  clarity -= Math.min(2, Math.floor(hedgeMatches.length / 2))
  const avgLen = words.length / Math.max(1, sentences.length)
  if (avgLen > 40) clarity -= 1
  if (avgLen < 6 && sentences.length > 2) clarity -= 1
  clarity = Math.round(Math.max(1, Math.min(10, clarity)))

  let confidence = 8
  confidence -= Math.min(4, hedgeMatches.length)
  if (fillerMatches.length > 8) confidence -= 2
  else if (fillerMatches.length > 4) confidence -= 1
  confidence = Math.round(Math.max(1, Math.min(10, confidence)))

  const improvements: string[] = []
  if (fillerMatches.length >= 3) {
    improvements.push(
      'Cut filler words (for example “um” and “like”) so answers land with more authority.',
    )
  }
  if (hedgeMatches.length >= 2) {
    improvements.push(
      'Swap hedges (“I think”, “maybe”) for direct claims tied to outcomes you owned.',
    )
  }
  if (avgLen < 12 && words.length > 40) {
    improvements.push(
      'Lengthen STAR answers with one more concrete action and metric from your resume.',
    )
  }
  if (!/[0-9]/.test(text)) {
    improvements.push(
      'Add numbers (scope, time, percent) so impact is easier to remember.',
    )
  }
  if (improvements.length < 3) {
    improvements.push(
      'Lead each answer with the result, then back up with situation and actions.',
    )
  }
  if (improvements.length < 3) {
    improvements.push(
      'Name one resume bullet per answer so interviewers connect stories to your file.',
    )
  }
  if (improvements.length < 3) {
    improvements.push(
      'Pause one beat before speaking to choose your headline sentence first.',
    )
  }

  return {
    clarityScore: clarity,
    confidenceRating: confidence,
    topImprovements: improvements.slice(0, 3),
  }
}
