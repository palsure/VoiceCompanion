import dotenv from 'dotenv'

// Load .env file if it exists (for local development)
// In Docker, environment variables are provided via docker-compose env_file
dotenv.config()

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // ElevenLabs
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  
  // Google Cloud
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  vertexAiLocation: process.env.VERTEX_AI_LOCATION || 'us-central1',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
}

