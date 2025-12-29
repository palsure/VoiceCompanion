import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // ElevenLabs
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  
  // Google Cloud
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  vertexAiLocation: process.env.VERTEX_AI_LOCATION || 'us-central1',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
}

// Validate required configuration
if (!config.elevenLabsApiKey && config.nodeEnv === 'production') {
  console.warn('Warning: ELEVENLABS_API_KEY not set')
}

if (!config.geminiApiKey && config.nodeEnv === 'production') {
  console.warn('Warning: GEMINI_API_KEY not set')
}

export default config

