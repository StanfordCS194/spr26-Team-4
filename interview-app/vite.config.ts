import type { PluginOption } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function geminiScoringProxy(): PluginOption {
  return {
    name: 'gemini-scoring-proxy',
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

        let raw = ''
        req.on('data', (chunk) => {
          raw += String(chunk)
        })

        req.on('end', async () => {
          try {
            const body = JSON.parse(raw) as { prompt?: string }
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
