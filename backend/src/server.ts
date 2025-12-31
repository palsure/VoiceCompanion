console.log('Starting VoiceCompanion backend server...')
console.log('Node version:', process.version)
console.log('NODE_ENV:', process.env.NODE_ENV || 'development')
console.log('PORT:', process.env.PORT || '5000 (default)')

import express from 'express'
import cors from 'cors'
import { config } from './config.js'

console.log('Loading routes...')

import conversationRoutes from './routes/conversation.js'
import feedbackRoutes from './routes/feedback.js'
import progressRoutes from './routes/progress.js'
import languageRoutes from './routes/language.js'
import personalizationRoutes from './routes/personalization.js'
import visionRoutes from './routes/vision.js'
import dailyLivingRoutes from './routes/dailyLiving.js'
import imageGenerationRoutes from './routes/imageGeneration.js'
import guidanceRoutes from './routes/guidance.js'
import speechToTextRoutes from './routes/speechToText.js'
import textToSpeechRoutes from './routes/textToSpeech.js'
import galleryRoutes from './routes/gallery.js'
import musicRoutes from './routes/music.js'
import { errorHandler } from './middleware/errorHandler.js'

console.log('Routes loaded, initializing Express app...')

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Increase timeout for long-running requests (like image generation)
app.use((req, res, next) => {
  req.setTimeout(150000) // 150 seconds
  res.setTimeout(150000) // 150 seconds
  next()
})

app.use('/api/conversation', conversationRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/language', languageRoutes)
app.use('/api/personalization', personalizationRoutes)
app.use('/api/vision', visionRoutes)
app.use('/api/daily-living', dailyLivingRoutes)
app.use('/api/image-generation', imageGenerationRoutes)
app.use('/api/guidance', guidanceRoutes)
app.use('/api/speech-to-text', speechToTextRoutes)
app.use('/api/text-to-speech', textToSpeechRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/music', musicRoutes)

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'voicecompanion-backend' })
})

// Setup Swagger documentation
import { setupSwagger } from './config/swagger.js'
setupSwagger(app).catch((err) => {
  console.warn('Swagger setup failed (non-fatal):', err)
})

app.use(errorHandler)

console.log('Express app configured, starting server...')

const port =
  typeof config.port === 'string' ? Number.parseInt(config.port, 10) : config.port

const serverPort = Number.isFinite(port) ? port : 5000

console.log(`Attempting to listen on port ${serverPort}...`)

// Start server with error handling
try {
  const server = app.listen(serverPort, '0.0.0.0', () => {
    console.log(`✅ VoiceCompanion backend server running on port ${serverPort}`)
    console.log(`✅ Health check available at http://0.0.0.0:${serverPort}/health`)
    console.log(`✅ Server is ready to accept connections`)
  })
  
  server.on('error', (error: any) => {
    console.error('❌ Server error:', error)
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${serverPort} is already in use`)
    }
    process.exit(1)
  })
} catch (error) {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  // Don't exit - allow server to continue running
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
  // Don't exit - allow server to continue running
})

