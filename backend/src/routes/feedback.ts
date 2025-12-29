import { Router, Request, Response } from 'express'
import { feedbackService } from '../services/feedbackService.js'

const router = Router()

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { text, audioData, targetLanguage = 'en' } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const analysis = await feedbackService.analyzeFeedback(text, targetLanguage, audioData)
    const formattedFeedback = feedbackService.formatFeedback(analysis)

    res.json(formattedFeedback)
  } catch (error: any) {
    console.error('Feedback analysis error:', error)
    res.status(500).json({ error: error.message || 'Failed to analyze feedback' })
  }
})

export default router

