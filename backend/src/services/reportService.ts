import { generateGeminiText } from './gemini.js'
import type { ReportFeedback, ReportSentiment } from '../types/report.js'

type GeminiFeedback = {
  clarityScore?: unknown
  confidenceRating?: unknown
  sentiment?: unknown
  topImprovements?: unknown
}

function clampScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(1, Math.min(10, Math.round(value)))
}

function normalizeSentiment(value: unknown): ReportSentiment | null {
  if (value === 'positive' || value === 'neutral' || value === 'negative') return value
  return null
}

function parseGeminiJson(text: string): GeminiFeedback | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed) as GeminiFeedback
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (!fenced) return null
    try {
      return JSON.parse(fenced[1]) as GeminiFeedback
    } catch {
      return null
    }
  }
}

function normalizeImprovements(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const cleaned = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
  if (cleaned.length < 3) return null
  return cleaned.slice(0, 3)
}

export async function scoreInterviewFeedback(
  userText: string,
  transcriptSummary: string,
): Promise<ReportFeedback> {
  const prompt = `You are scoring a candidate's behavioral interview transcript.
Return JSON only with this schema:
{
  "clarityScore": number (1-10),
  "confidenceRating": number (1-10),
  "sentiment": "positive" | "neutral" | "negative",
  "topImprovements": [string, string, string]
}

Scoring guidance:
- Clarity: structure, directness, completeness, concision.
- Confidence: ownership language, certainty, assertiveness without arrogance.
- Sentiment: overall tone of candidate responses.
- Improvements: actionable, specific, and tailored to this transcript.

Candidate transcript:
${transcriptSummary || userText || '(empty transcript)'}`;

  const text = await generateGeminiText({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })

  const parsed = parseGeminiJson(text)
  if (!parsed) {
    throw new Error('Gemini returned invalid scoring JSON.')
  }

  const clarityScore = clampScore(parsed.clarityScore)
  const confidenceRating = clampScore(parsed.confidenceRating)
  const sentiment = normalizeSentiment(parsed.sentiment)
  const topImprovements = normalizeImprovements(parsed.topImprovements)

  if (
    clarityScore == null ||
    confidenceRating == null ||
    sentiment == null ||
    topImprovements == null
  ) {
    throw new Error('Gemini scoring response is missing required fields.')
  }

  return {
    clarityScore,
    confidenceRating,
    sentiment,
    topImprovements,
  }
}
