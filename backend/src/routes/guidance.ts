import express from 'express'
import { geminiService } from '../services/geminiService.js'

const router = express.Router()

/**
 * @swagger
 * /api/guidance/realtime:
 *   post:
 *     summary: Get real-time navigation guidance from camera image
 *     tags: [Guidance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageData
 *             properties:
 *               imageData:
 *                 type: string
 *                 description: Base64 encoded image from camera
 *               previousContext:
 *                 type: string
 *                 description: Previous guidance context for continuity
 *     responses:
 *       200:
 *         description: Navigation guidance response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 guidance:
 *                   type: string
 *                 hazards:
 *                   type: array
 *                   items:
 *                     type: string
 *                 context:
 *                   type: string
 *       400:
 *         description: Missing image data
 *       500:
 *         description: Server error
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

