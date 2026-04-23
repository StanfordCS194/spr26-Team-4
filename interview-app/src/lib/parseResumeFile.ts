import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

let workerConfigured = false

function ensurePdfWorker() {
  if (!workerConfigured) {
    GlobalWorkerOptions.workerSrc = workerUrl
    workerConfigured = true
  }
}

async function extractPdfText(file: File): Promise<string> {
  ensurePdfWorker()
  const data = await file.arrayBuffer()
  const pdf = await getDocument({ data }).promise
  const parts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const strings = (content.items as { str?: string }[])
      .map((item) => (typeof item.str === 'string' ? item.str : ''))
      .filter(Boolean)
    parts.push(strings.join(' '))
  }
  return parts.join('\n').replace(/\s+/g, ' ').trim()
}

export async function parseResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const isPdf =
    file.type === 'application/pdf' || name.endsWith('.pdf')

  if (isPdf) {
    return extractPdfText(file)
  }

  return (await file.text()).trim()
}
