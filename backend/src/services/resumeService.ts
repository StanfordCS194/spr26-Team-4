import { generateGeminiText } from './gemini.js'

export type ParseResumeInput = {
  fileName?: string
  mimeType?: string
  dataBase64?: string
}

export type ParseResumeResult = {
  text: string
}

function inferMimeType(fileName?: string, mimeType?: string): string {
  if (mimeType?.trim()) return mimeType
  const lower = fileName?.toLowerCase() ?? ''
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.txt')) return 'text/plain'
  return 'application/octet-stream'
}

export async function parseResume(input: ParseResumeInput): Promise<ParseResumeResult> {
  if (!input.dataBase64) {
    throw new Error('Missing resume file data.')
  }

  const mimeType = inferMimeType(input.fileName, input.mimeType)
  if (mimeType.startsWith('text/')) {
    const text = Buffer.from(input.dataBase64, 'base64').toString('utf8').trim()
    if (!text) throw new Error('Text resume was empty.')
    return { text }
  }

  if (mimeType !== 'application/pdf') {
    throw new Error('Only PDF and text resumes are supported.')
  }

  const text = await generateGeminiText({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Extract the complete resume text from this PDF. Return plain text only. Preserve section headers, bullet points, dates, company names, titles, and metrics. Do not summarize.',
          },
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: input.dataBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
    },
  })

  return { text }
}
