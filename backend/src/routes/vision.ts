import express from 'express'
import { visionService } from '../services/visionService.js'
import { geminiService } from '../services/geminiService.js'

const router = express.Router()

/**
 * @swagger
 * /api/vision/analyze:
 *   post:
 *     summary: Analyze an image and provide description
 *     tags: [Vision]
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
 *                 description: Base64 encoded image data
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *     responses:
 *       200:
 *         description: Image analysis successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 description:
 *                   type: string
 *                   description: AI-generated description of the image
 *                 labels:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/analyze', async (req, res) => {
  try {
    const { imageData } = req.body

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }

    // Try Gemini FIRST for image description (works without Vision API)
    let description: string
    let analysis: any = {}

    try {
      console.log('Using Gemini to describe image...')
      description = await geminiService.describeScene(imageData)
      console.log('Gemini description successful')
    } catch (geminiError: any) {
      console.error('Gemini scene description failed:', geminiError.message)
      description = 'Failed to describe image. Please check your Gemini API key configuration.'
    }

    // Optionally try Vision API for additional analysis (may fail if not enabled)
    try {
      analysis = await visionService.analyzeImage(imageData)
    } catch (visionError: any) {
      console.warn('Vision API not available:', visionError.message)
      // Continue without Vision API data - Gemini description is the priority
    }

    res.json({
      ...analysis,
      description,
    })
  } catch (error: any) {
    console.error('Vision analysis error:', error)
    res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message,
    })
  }
})

/**
 * @swagger
 * /api/vision/text:
 *   post:
 *     summary: Extract text from an image (OCR)
 *     tags: [Vision]
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
 *                 description: Base64 encoded image data
 *     responses:
 *       200:
 *         description: Text extraction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: Extracted text from the image
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/text', async (req, res) => {
  try {
    const { imageData } = req.body

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const text = await visionService.extractText(imageData)

    res.json({ text })
  } catch (error: any) {
    console.error('Text extraction error:', error)
    res.status(500).json({
      error: 'Failed to extract text',
      message: error.message,
    })
  }
})

export default router

