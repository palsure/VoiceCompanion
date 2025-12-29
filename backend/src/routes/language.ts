import { Router, Request, Response } from 'express'
import { geminiService } from '../services/geminiService.js'
import { feedbackService } from '../services/feedbackService.js'

const router = Router()

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage = 'en' } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const analysis = await geminiService.analyzeLanguage(text, targetLanguage)
    const formatted = feedbackService.formatFeedback(analysis)

    res.json(formatted)
  } catch (error: any) {
    console.error('Language analysis error:', error)
    res.status(500).json({ error: error.message || 'Failed to analyze language' })
  }
})

router.post('/cultural', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage = 'en' } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const culturalContext = await geminiService.provideCulturalContext(text, targetLanguage)

    res.json({ context: culturalContext })
  } catch (error: any) {
    console.error('Cultural context error:', error)
    res.status(500).json({ error: error.message || 'Failed to provide cultural context' })
  }
})

export default router

