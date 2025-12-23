import express from 'express'
import { geminiService } from '../services/geminiService.js'
import { elevenLabsService } from '../services/elevenLabsService.js'

const router = express.Router()

interface ConversationRequest {
  message: string
  imageData?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

router.post('/', async (req, res) => {
  try {
    const { message, imageData, conversationHistory }: ConversationRequest = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Generate response using Gemini
    const response = await geminiService.generateResponse(
      message,
      imageData,
      conversationHistory
    )

    // Optionally generate audio using ElevenLabs
    let audioUrl: string | undefined
    try {
      const audioBuffer = await elevenLabsService.textToSpeech(response)
      // In a real implementation, you'd save this to storage and return a URL
      // For now, we'll return base64 encoded audio
      audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`
    } catch (audioError) {
      console.warn('Audio generation failed, continuing without audio:', audioError)
      // Continue without audio - graceful degradation
    }

    res.json({
      response,
      audioUrl,
    })
  } catch (error: any) {
    console.error('Conversation error:', error)
    res.status(500).json({
      error: 'Failed to process conversation',
      message: error.message,
    })
  }
})

export default router

