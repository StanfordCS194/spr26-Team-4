const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }

type GeminiPayload = {
  contents: Array<{
    role: 'user'
    parts: GeminiPart[]
  }>
  generationConfig?: {
    temperature?: number
    responseMimeType?: string
  }
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY.')
  }

  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash',
  }
}

export async function generateGeminiText(payload: GeminiPayload): Promise<string> {
  const { apiKey, model } = getGeminiConfig()
  const response = await fetch(
    `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Gemini request failed (${response.status}): ${details}`)
  }

  const data = (await response.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text?.trim()) {
    throw new Error('Gemini returned an empty response.')
  }

  return text.trim()
}
