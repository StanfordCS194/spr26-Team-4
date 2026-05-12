import { apiUrl, getApiError } from './apiClient'

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export async function parseResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf')
  const isText = file.type.startsWith('text/') || name.endsWith('.txt')

  if (!isPdf && !isText) {
    throw new Error('Only PDF and text resumes are supported.')
  }

  const response = await fetch(apiUrl('/api/resume/parse'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
      dataBase64: arrayBufferToBase64(await file.arrayBuffer()),
    }),
  })

  if (!response.ok) {
    throw new Error(await getApiError(response, 'Could not parse that resume.'))
  }

  const payload = (await response.json()) as { text?: unknown }
  if (typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new Error('No resume text was extracted from that file.')
  }
  return payload.text.trim()
}
