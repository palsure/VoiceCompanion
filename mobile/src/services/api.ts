import { Platform } from 'react-native'
// Using relative path for now - can be switched to @voicecompanion/shared once package is installed
import { createApiClient, createApiServices } from '../../../shared/src/api'

// Use environment variable if provided; otherwise pick sane defaults per platform.
// - iOS simulator can reach your host machine via localhost
// - Android emulator must use 10.0.2.2 to reach the host machine
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')

// Helpful during debugging (visible in Metro logs / device logs)
console.log('[api] baseURL =', `${API_BASE_URL}/api`)

// Create API client using shared module
const api = createApiClient({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 35000, // 35 seconds timeout for mobile (slightly longer than backend)
})

// Export API services from shared module
export const {
  conversationApi,
  feedbackApi,
  progressApi,
  imageGenerationApi,
  guidanceApi,
  visionApi,
  shoppingApi,
  speechToTextApi,
} = createApiServices(api)

// Re-export types from shared module
export type {
  ConversationRequest,
  ConversationResponse,
} from '../../../shared/src/types'

export default api


