import { Platform } from 'react-native'
// Use mobile-local API client (avoids Metro monorepo import issues).
import { createApiClient, createApiServices } from './sharedApi'

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
  textToSpeechApi,
  musicApi,
  galleryApi,
} = createApiServices(api)

export default api


