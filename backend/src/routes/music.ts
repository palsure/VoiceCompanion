import express from 'express'
import { elevenLabsService } from '../services/elevenLabsService.js'

const router = express.Router()

/**
 * Generate music from text/script using ElevenLabs
 * POST /api/music/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      prompt,
      musicLengthMs,
      modelId,
      forceInstrumental,
      respectSectionsDurations,
      storeForInpainting,
      signWithC2pa,
    } = req.body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required',
        message: 'Please provide a text prompt describing the music you want to generate',
      })
    }

    const musicBuffer = await elevenLabsService.generateMusic(prompt, {
      musicLengthMs,
      modelId,
      forceInstrumental,
      respectSectionsDurations,
      storeForInpainting,
      signWithC2pa,
    })

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', musicBuffer.length)
    res.setHeader('Content-Disposition', `attachment; filename="generated-music-${Date.now()}.mp3"`)

    // Send the audio buffer
    res.send(musicBuffer)
  } catch (error: any) {
    console.error('Music generation error:', error)
    
    // Handle specific error types
    let statusCode = 500
    let errorMessage = error.message || 'An error occurred while generating music'
    
    if (error.message?.includes('API key')) {
      statusCode = 401
      errorMessage = error.message
    } else if (error.message?.includes('Payment Required') || error.message?.includes('paid subscription') || error.message?.includes('upgrade your plan')) {
      statusCode = 402
      errorMessage = error.message
    } else if (error.message?.includes('rate limit')) {
      statusCode = 429
      errorMessage = error.message
    } else if (error.message?.includes('not available') || error.message?.includes('endpoint not found')) {
      statusCode = 404
      errorMessage = error.message
    }
    
    res.status(statusCode).json({
      error: 'Failed to generate music',
      message: errorMessage,
    })
  }
})

export default router

