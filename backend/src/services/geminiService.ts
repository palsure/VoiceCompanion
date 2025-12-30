import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config.js'

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  constructor() {
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey)
      // Use gemini-2.5-flash - the latest available model with vision support
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      console.log('✅ Gemini service initialized with gemini-2.5-flash')
    }
  }

  async generateResponse(
    message: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
    scenario?: string,
    difficulty?: { complexity?: string; vocabularyLevel?: string; grammarFocus?: string[] }
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY in environment variables.')
    }

    try {
      let prompt = `You are VoiceBuddy, an AI language learning companion. You help users learn languages through natural conversation.

Your role:
- Engage in natural, friendly conversation in the target language
- Provide gentle corrections when users make mistakes
- Explain grammar, vocabulary, and cultural context
- Encourage and motivate learners
- Adapt your language level to the user's proficiency

${scenario ? `Current scenario: ${scenario}. Role-play this scenario naturally.` : ''}

${difficulty ? `
Adaptation settings:
- Complexity: ${difficulty.complexity}
- Vocabulary level: ${difficulty.vocabularyLevel}
- Focus areas: ${difficulty.grammarFocus?.join(', ')}
Adjust your responses accordingly.
` : ''}

Be conversational, warm, and supportive. When users make mistakes, gently correct them and explain why.

User message: ${message}`

      if (conversationHistory && conversationHistory.length > 0) {
        const historyContext = conversationHistory
          .slice(-6) // Last 6 messages for context
          .map(msg => `${msg.role === 'user' ? 'User' : 'VoiceBuddy'}: ${msg.content}`)
          .join('\n')
        prompt = `Previous conversation:\n${historyContext}\n\n${prompt}`
      }

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error: any) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to generate response: ${error.message}`)
    }
  }

  async analyzeLanguage(
    text: string,
    targetLanguage: string = 'en'
  ): Promise<{
    grammar: any
    vocabulary: any
    pronunciation: any
    cultural: any
  }> {
    if (!this.model) {
      throw new Error('Gemini API not configured')
    }

    const prompt = `Analyze this text in ${targetLanguage} for language learning feedback:

Text: "${text}"

Provide a detailed analysis in JSON format with:
1. Grammar: List any errors with corrections and explanations
2. Vocabulary: Suggest more natural word choices if applicable
3. Pronunciation: Provide pronunciation feedback (score 0-100 and tips)
4. Cultural: Explain any cultural context, idioms, or formality levels

Format as JSON with this structure:
{
  "grammar": {
    "errors": [{"incorrect": "...", "correct": "...", "explanation": "..."}],
    "score": 0-100
  },
  "vocabulary": {
    "suggestions": ["..."],
    "level": "beginner|intermediate|advanced"
  },
  "pronunciation": {
    "score": 0-100,
    "feedback": "..."
  },
  "cultural": {
    "context": "...",
    "idioms": [{"used": "...", "native": "...", "explanation": "..."}]
  }
}`

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = result.response.text()
      
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback: return structured response
      return {
        grammar: { errors: [], score: 85 },
        vocabulary: { suggestions: [], level: 'intermediate' },
        pronunciation: { score: 80, feedback: 'Good pronunciation overall' },
        cultural: { context: responseText },
      }
    } catch (error: any) {
      console.error('Gemini language analysis error:', error)
      throw new Error(`Failed to analyze language: ${error.message}`)
    }
  }

  async provideCulturalContext(
    text: string,
    targetLanguage: string
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not configured')
    }

    const prompt = `Explain the cultural context, idioms, and nuances in this ${targetLanguage} text:

"${text}"

Provide:
- Cultural context and meaning
- Any idioms or expressions used
- Formality level and appropriateness
- Regional variations if applicable`

    try {
      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error: any) {
      console.error('Gemini cultural context error:', error)
      throw new Error(`Failed to provide cultural context: ${error.message}`)
    }
  }

  async describeScene(imageData: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not configured')
    }

    const prompt = `Tell a vivid story about this image in approximately 100 words.

Describe:
- The scene with specific, unique details
- Depth (foreground to background)
- Colors, lighting, and mood
- What makes this image special

Write as flowing narrative prose, not a list. Be specific about what you see. Around 100 words.`

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

  async generateResponseWithImage(
    message: string,
    imageData: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not configured')
    }

    let prompt = message

    if (conversationHistory && conversationHistory.length > 0) {
      const historyContext = conversationHistory
        .slice(-6)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')
      prompt = `Previous conversation:\n${historyContext}\n\n${prompt}`
    }

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
      console.error('Gemini multimodal error:', error)
      throw new Error(`Failed to generate response: ${error.message}`)
    }
  }

  async enhanceImagePrompt(prompt: string, style?: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not configured')
    }

    const stylePrompt = style 
      ? `Style: ${style}. Create a detailed, vivid description suitable for image generation.`
      : 'Create a detailed, vivid description suitable for image generation with realistic details.'

    const enhancedPrompt = `Transform this user request into a detailed image generation prompt:

User request: "${prompt}"

${stylePrompt}

Provide a detailed, vivid description that includes:
- Visual details (colors, lighting, composition)
- Style and mood
- Specific elements and their arrangement
- Any artistic or technical specifications

Return only the enhanced prompt, no additional explanation.`

    try {
      const result = await this.model.generateContent(enhancedPrompt)
      return result.response.text().trim()
    } catch (error: any) {
      console.error('Gemini prompt enhancement error:', error)
      // Fallback to original prompt
      return prompt
    }
  }

  async generateRealTimeGuidance(
    imageData: string,
    previousContext?: string
  ): Promise<{
    description: string
    hazards: string[]
    navigation: string
    objects: string[]
  }> {
    if (!this.model) {
      throw new Error('Gemini API not configured')
    }

    const prompt = `You are a real-time navigation assistant for visually impaired users. Analyze this camera frame and provide:

1. A concise scene description (2-3 sentences)
2. Any immediate hazards or obstacles (stairs, doors, obstacles)
3. Navigation guidance (directions, distances, safe paths)
4. Notable objects or landmarks

${previousContext ? `Previous context: ${previousContext}\n` : ''}

Be specific, concise, and safety-focused. Format your response as JSON:
{
  "description": "...",
  "hazards": ["...", "..."],
  "navigation": "...",
  "objects": ["...", "..."]
}`

    try {
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: 'image/jpeg',
        },
      }

      const result = await this.model.generateContent([prompt, imagePart])
      const responseText = result.response.text()
      
      // Try to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // Fallback structured response
      return {
        description: responseText,
        hazards: [],
        navigation: 'Continue forward with caution',
        objects: [],
      }
    } catch (error: any) {
      console.error('Gemini real-time guidance error:', error)
      throw new Error(`Failed to generate guidance: ${error.message}`)
    }
  }
}

export const geminiService = new GeminiService()
export default geminiService

