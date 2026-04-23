import type { PluginOption } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function readJsonBody<T>(req: NodeJS.ReadableStream): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += String(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw) as T)
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function geminiScoringProxy(): PluginOption {
  return {
    name: 'gemini-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini-score', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const apiKey = process.env.GEMINI_API_KEY?.trim()
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY on server' }))
          return
        }

        try {
          const body = await readJsonBody<{ prompt?: string }>(req)
          if (!body.prompt || typeof body.prompt !== 'string') {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing prompt' }))
            return
          }

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: body.prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: 'application/json',
                },
              }),
            },
          )

          const payload = await response.text()
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(payload)
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Failed to call Gemini scoring API' }))
        }
      })

      server.middlewares.use('/api/gemini-resume', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const apiKey = process.env.GEMINI_API_KEY?.trim()
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY on server' }))
          return
        }

        try {
          const body = await readJsonBody<{ pdfBase64?: string }>(req)
          if (!body.pdfBase64 || typeof body.pdfBase64 !== 'string') {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing pdfBase64' }))
            return
          }

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
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
                          data: body.pdfBase64,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0,
                },
              }),
            },
          )

          if (!response.ok) {
            const errorPayload = await response.text()
            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Gemini resume parsing request failed',
                details: errorPayload,
              }),
            )
            return
          }

          const payload = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
          }
          const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
          if (typeof text !== 'string' || !text.trim()) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Gemini returned empty resume text' }))
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ text: text.trim() }))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Failed to parse resume with Gemini' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiScoringProxy()],
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
})
