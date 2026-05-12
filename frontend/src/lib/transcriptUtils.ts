type OpenAiFmt = { role?: string; content?: string | null }

export function summarizeFromConversation(messages: OpenAiFmt[]): string {
  const lines = messages
    .filter((m) => m.content && String(m.content).trim())
    .map((m) => `${(m.role || 'unknown').toUpperCase()}: ${String(m.content).trim()}`)
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
