import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config.js'

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  constructor() {
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey)
      // Use gemini-1.5-pro for multimodal, fallback to gemini-pro for text-only
      try {
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
      } catch {
        // Fallback to gemini-pro if 1.5-pro is not available
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
      }
    }
  }

  async generateResponse(
    message: string,
    imageData?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY in environment variables.')
    }

    try {
      // Build conversation context
      let prompt = `You are a helpful, friendly, and empathetic voice assistant designed to help people with visual impairments. 
You provide clear, descriptive, and natural responses. Be conversational and warm, as if speaking to a friend.

Context: You are helping the user navigate daily life through voice interaction. You can:
- Describe visual scenes and objects (when an image is provided)
- Read and explain text from images, documents, labels, and signs
- Help with shopping: describe products, read labels, compare items, check prices
- Assist with navigation: describe locations, provide directions, identify landmarks
- Manage daily tasks: scheduling, reminders, to-do lists
- Read documents: letters, bills, recipes, instructions
- Provide companionship and assistance with daily activities

Be proactive and helpful. If the user asks about something visual and you have an image, describe it in detail. 
If they ask to read something, extract and read all text clearly.
For shopping, be specific about product details, prices, and comparisons.
For navigation, provide clear, step-by-step directions.

User message: ${message}`

      if (conversationHistory && conversationHistory.length > 0) {
        const historyContext = conversationHistory
          .slice(-5) // Last 5 messages for context
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n')
        prompt = `Previous conversation:\n${historyContext}\n\n${prompt}`
      }

      if (imageData) {
        // For multimodal requests with images
        const imagePart = {
          inlineData: {
            data: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
            mimeType: 'image/jpeg',
          },
        }

        const result = await this.model.generateContent([prompt, imagePart])
        return result.response.text()
      } else {
        // Text-only request
        const result = await this.model.generateContent(prompt)
        return result.response.text()
      }
    } catch (error: any) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to generate response: ${error.message}`)
    }
  }

  async describeScene(imageData: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not configured')
    }

    const prompt = `Describe this image in detail, focusing on:
- What objects and people are visible
- The layout and spatial arrangement
- Colors, textures, and visual details
- Any text that appears
- The overall scene context

Be descriptive and helpful for someone who cannot see the image.`

    try {
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: 'image/jpeg',
        },
      }

      const result = await this.model.generateContent([prompt, imagePart])
      return result.response.text()
    } catch (error: any) {
      console.error('Gemini scene description error:', error)
      throw new Error(`Failed to describe scene: ${error.message}`)
    }
  }
}

export const geminiService = new GeminiService()
export default geminiService

