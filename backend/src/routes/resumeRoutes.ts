import { Router } from 'express'
import { parseResume, type ParseResumeInput } from '../services/resumeService.js'

export const resumeRouter = Router()

resumeRouter.post('/parse', async (req, res) => {
  try {
    const result = await parseResume(req.body as ParseResumeInput)
    res.json(result)
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Could not parse resume.',
    })
  }
})
