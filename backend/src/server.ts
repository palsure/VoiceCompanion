import express from 'express'
import cors from 'cors'
import { config } from './config.js'
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'voicecompanion-backend' })
})

app.use(errorHandler)

app.listen(config.port, '0.0.0.0', () => {
  console.log(`VoiceCompanion backend server running on port ${config.port}`)
})

