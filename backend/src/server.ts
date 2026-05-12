import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { reportRouter } from './routes/reportRoutes.js'
import { resumeRouter } from './routes/resumeRoutes.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: frontendOrigin,
  }),
)
app.use(express.json({ limit: '15mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/resume', resumeRouter)
app.use('/api/report', reportRouter)

app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`)
})
