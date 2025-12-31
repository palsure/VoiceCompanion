/**
 * Vendored copy of `shared/src/types.ts`
 * Kept in frontend so Docker/Cloud Build doesn't need monorepo path mapping.
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
  // Backend route returns `transcription`
  transcription?: string
  // Some older code paths used `text`
  text?: string
  // Metadata
  languageCode?: string
  model?: string
  // Some callers defensively handle nested response shapes
  data?: {
    transcription?: string
    text?: string
    [key: string]: any
  }
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


