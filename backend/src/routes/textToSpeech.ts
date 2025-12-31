import express from 'express'
import { elevenLabsService } from '../services/elevenLabsService.js'

const router = express.Router()

/**
 * @swagger
 * /api/text-to-speech/generate:
 *   post:
 *     summary: Generate speech from text using ElevenLabs
 *     tags: [Text-to-Speech]
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
 *                 description: Text to convert to speech
 *                 example: "Hello, this is a test of text to speech."
 *               voiceId:
 *                 type: string
 *                 description: ElevenLabs voice ID (optional)
 *     responses:
 *       200:
 *         description: Audio generated successfully
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/generate', async (req, res) => {
  try {
    const { text, voiceId } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' })
    }

    // Generate speech using ElevenLabs
    const audioBuffer = await elevenLabsService.textToSpeech(text, voiceId)

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audioBuffer.length.toString())
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"')
    
    // Send audio buffer
    res.send(audioBuffer)
  } catch (error: any) {
    console.error('Text-to-Speech generation error:', error)
    
    // Provide more specific error messages
    let statusCode = 500
    let errorMessage = 'Failed to generate speech'
    
    if (error.message.includes('API key') || error.message.includes('invalid') || error.message.includes('expired')) {
      statusCode = 503
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        errorMessage = 'ElevenLabs API key is invalid or expired. Please verify your API key in the .env file is correct and active.'
      } else {
        errorMessage = 'Text-to-speech service is not configured. Please set ELEVENLABS_API_KEY in the backend environment.'
      }
    } else if (error.message.includes('rate limit')) {
      statusCode = 429
      errorMessage = 'Rate limit exceeded. Please try again later.'
    } else {
      errorMessage = error.message || 'Failed to generate speech'
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message,
    })
  }
})

export default router

