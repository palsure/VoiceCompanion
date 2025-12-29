import { Router, Request, Response } from 'express'
import { geminiService } from '../services/geminiService.js'
import { elevenLabsService } from '../services/elevenLabsService.js'
import { feedbackService } from '../services/feedbackService.js'
import { progressService } from '../services/progressService.js'
import { personalizationService } from '../services/personalizationService.js'

const router = Router()

interface ConversationRequest {
  message: string
  scenario?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  audioData?: string
  userId?: string
  mode?: 'accessibility' | 'learning'
  imageData?: string
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, scenario, conversationHistory, audioData, userId = 'default', mode = 'learning', imageData }: ConversationRequest = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    let responseText: string

    if (mode === 'accessibility' && imageData) {
      // Use multimodal response for accessibility mode with images
      responseText = await geminiService.generateResponseWithImage(
        message,
        imageData,
        conversationHistory
      )
    } else if (mode === 'learning') {
      // Get adaptive difficulty based on user progress
      const difficulty = personalizationService.getAdaptiveDifficulty(userId)
      // Generate response using Gemini with personalization
      responseText = await geminiService.generateResponse(
        message,
        conversationHistory,
        scenario,
        difficulty
      )
    } else {
      // Default accessibility mode without image
      responseText = await geminiService.generateResponse(
        message,
        conversationHistory
      )
    }

    // Analyze user's message for feedback
    const languageAnalysis = await feedbackService.analyzeFeedback(message, 'en', audioData)
    const feedback = feedbackService.formatFeedback(languageAnalysis)

    // Generate speech using ElevenLabs
    let audioBuffer: Buffer | null = null
    try {
      audioBuffer = await elevenLabsService.textToSpeech(responseText)
    } catch (error) {
      console.error('Failed to generate speech:', error)
      // Continue without audio
    }

    // Record conversation for progress tracking
    progressService.recordConversation(userId, scenario, 0, {
      grammar: { score: languageAnalysis.grammar?.score },
      vocabulary: { score: 85 }, // Default score
      pronunciation: { score: languageAnalysis.pronunciation?.score },
    })

    // Convert audio to base64 for frontend
    const audioBase64 = audioBuffer ? audioBuffer.toString('base64') : undefined

    res.json({
      response: responseText,
      feedback,
      audioUrl: audioBase64
        ? `data:audio/mpeg;base64,${audioBase64}`
        : undefined,
    })
  } catch (error: any) {
    console.error('Conversation error:', error)
    res.status(500).json({ error: error.message || 'Failed to process conversation' })
  }
})

export default router

