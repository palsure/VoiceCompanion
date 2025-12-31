import { createApiClient, createApiServices } from './sharedApi'

// Create API client using shared module
// Vite proxy handles '/api' -> backend
const api = createApiClient({
  baseURL: '/api',
  timeout: 35000,
})

// Export API services from shared module
export const {
  conversationApi,
  feedbackApi,
  progressApi,
  imageGenerationApi,
  speechToTextApi,
  visionApi,
  guidanceApi,
  shoppingApi,
  textToSpeechApi,
  musicApi,
  galleryApi,
} = createApiServices(api)

// Re-export types from shared module
export type {
  ConversationRequest,
  ConversationResponse,
} from './sharedTypes'

export default api

