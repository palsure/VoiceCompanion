import express from 'express'
import { elevenLabsService } from '../services/elevenLabsService.js'

const router = express.Router()

router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' })
    }

    const audioBuffer = await elevenLabsService.textToSpeech(text, voiceId)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audioBuffer.length)
    res.send(audioBuffer)
  } catch (error: any) {
    console.error('TTS error:', error)
    res.status(500).json({
      error: 'Failed to generate speech',
      message: error.message,
    })
  }
})

router.get('/voices', async (req, res) => {
  try {
    const voices = await elevenLabsService.getVoices()
    res.json({ voices })
  } catch (error: any) {
    console.error('Voices error:', error)
    res.status(500).json({
      error: 'Failed to fetch voices',
      message: error.message,
    })
  }
})

export default router

