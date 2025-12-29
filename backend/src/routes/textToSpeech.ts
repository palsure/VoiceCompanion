import express from 'express'
import { elevenLabsService } from '../services/elevenLabsService.js'

const router = express.Router()

/**
 * Generate speech from text using ElevenLabs
 * POST /api/text-to-speech/generate
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

