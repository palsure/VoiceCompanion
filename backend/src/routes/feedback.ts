import { Router, Request, Response } from 'express'
import { feedbackService } from '../services/feedbackService.js'

const router = Router()

/**
 * @swagger
 * /api/feedback/analyze:
 *   post:
 *     summary: Analyze text for language learning feedback
 *     tags: [Language Learning]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to analyze
 *               targetLanguage:
 *                 type: string
 *                 default: en
 *               audioData:
 *                 type: string
 *                 description: Base64 audio for pronunciation analysis
 *     responses:
 *       200:
 *         description: Feedback analysis result
 *       400:
 *         description: Missing text
 *       500:
 *         description: Server error
 */
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

