import express from 'express'
import { geminiService } from '../services/geminiService.js'

const router = express.Router()

/**
 * Real-time guidance for visually impaired users based on camera stream
 * POST /api/guidance/realtime
 */
router.post('/realtime', async (req, res) => {
  try {
    const { imageData, previousContext } = req.body

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const guidance = await geminiService.generateRealTimeGuidance(imageData, previousContext)

    res.json(guidance)
  } catch (error: any) {
    console.error('Real-time guidance error:', error)
    res.status(500).json({
      error: 'Failed to generate guidance',
      message: error.message,
    })
  }
})

export default router

