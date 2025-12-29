/**
 * Shared TypeScript types and interfaces for VoiceCompanion
 */

export interface ConversationRequest {
  message: string
  scenario?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  audioData?: string
  mode?: 'accessibility' | 'learning'
  imageData?: string
}

export interface ConversationResponse {
  response: string
  feedback?: any
  audioUrl?: string
}

export interface ImageGenerationRequest {
  prompt: string
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'photographic'
  size?: string
}

export interface ImageGenerationResponse {
  image?: string
  imageUrl?: string
  imageData?: string
  prompt?: string
  originalPrompt?: string
  style?: string
  size?: string
  message?: string
  error?: string
  details?: string
  suggestion?: string
}

export interface SpeechToTextRequest {
  audioData: string
  languageCode?: string
}

export interface SpeechToTextResponse {
  text: string
  language?: string
}

export interface VisionAnalysisRequest {
  imageData: string
}

export interface VisionAnalysisResponse {
  description: string
  objects?: string[]
  text?: string
  labels?: string[]
}

export interface ProgressData {
  totalSessions: number
  totalTime: number
  averageScore: number
  skillLevel: string
  scores: {
    pronunciation: number
    grammar: number
    vocabulary: number
    fluency: number
  }
  recommendations?: string[]
}

