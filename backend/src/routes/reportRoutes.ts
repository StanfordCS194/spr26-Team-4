import { Router } from 'express'
import { scoreInterviewFeedback } from '../services/reportService.js'

type ScoreRequest = {
  userText?: unknown
  transcriptSummary?: unknown
}

export const reportRouter = Router()

reportRouter.post('/score', async (req, res) => {
  try {
    const body = req.body as ScoreRequest
    const userText = typeof body.userText === 'string' ? body.userText : ''
    const transcriptSummary =
      typeof body.transcriptSummary === 'string' ? body.transcriptSummary : ''

    const result = await scoreInterviewFeedback(userText, transcriptSummary)
    res.json(result)
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Could not score interview report.',
    })
  }
})
