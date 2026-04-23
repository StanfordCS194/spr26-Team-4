function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

export async function parseResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf')
  if (!isPdf) {
    throw new Error('Only PDF resumes are supported.')
  }

  const pdfBase64 = arrayBufferToBase64(await file.arrayBuffer())
  const response = await fetch('/api/gemini-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64 }),
  })

  if (!response.ok) {
    throw new Error(
      `Resume parsing failed (${response.status}). Check GEMINI_API_KEY and try another PDF.`,
    )
  }

  const payload = (await response.json()) as { text?: unknown }
  if (typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new Error('No resume text was extracted from this PDF.')
  }
  return payload.text.trim()
}
