type OpenAiContent = string | null | undefined | { type?: string; text?: string }[]
type OpenAiFmt = { role?: string; content?: OpenAiContent }

// Vapi's conversation-update messages include the system prompt (resume + job
// description) and tool calls; only real dialogue belongs in the transcript.
const DIALOGUE_ROLES = new Set(['user', 'assistant', 'bot'])

// Anthropic models can return content as an array of blocks instead of a string.
function contentToText(content: OpenAiContent): string {
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  return ''
}

export function summarizeFromConversation(messages: OpenAiFmt[]): string {
  const lines: string[] = []
  for (const m of messages) {
    const role = (m.role || '').toLowerCase()
    if (!DIALOGUE_ROLES.has(role)) continue
    const text = contentToText(m.content)
    if (!text) continue
    const label = role === 'bot' ? 'ASSISTANT' : role.toUpperCase()
    lines.push(`${label}: ${text}`)
  }
  return lines.join('\n').slice(0, 8000)
}

export function summarizeFromTranscriptChunks(
  chunks: { role: string; text: string }[],
): string {
  return chunks
    .map((c) => `${c.role.toUpperCase()}: ${c.text}`)
    .join('\n')
    .slice(0, 8000)
}

export function extractUserSpeech(transcriptChunks: { role: string; text: string }[]): string {
  return transcriptChunks
    .filter((c) => c.role === 'user')
    .map((c) => c.text)
    .join(' ')
}
