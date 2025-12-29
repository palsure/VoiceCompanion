import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ConversationRequest {
  message: string
  imageData?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ConversationResponse {
  response: string
  audioUrl?: string
}

export interface VisionAnalysis {
  text?: string
  objects?: Array<{ name: string; confidence: number }>
  description: string
}

export const conversationApi = {
  sendMessage: async (request: ConversationRequest): Promise<ConversationResponse> => {
    const response = await api.post<ConversationResponse>('/conversation', request)
    return response.data
  },
}

export const visionApi = {
  analyzeImage: async (imageData: string): Promise<VisionAnalysis> => {
    const response = await api.post<VisionAnalysis>('/vision/analyze', { imageData })
    return response.data
  },
  
  extractText: async (imageData: string): Promise<{ text: string }> => {
    const response = await api.post<{ text: string }>('/vision/text', { imageData })
    return response.data
  },
}

export default api

