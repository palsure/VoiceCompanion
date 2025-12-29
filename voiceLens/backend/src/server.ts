import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import conversationRoutes from './routes/conversation.js'
import visionRoutes from './routes/vision.js'
import voiceRoutes from './routes/voice.js'
import dailyLivingRoutes from './routes/dailyLiving.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/conversation', conversationRoutes)
app.use('/api/vision', visionRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/daily-living', dailyLivingRoutes)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  const statusCode = (err as any).statusCode || 500
  res.status(statusCode).json({ 
    error: 'Internal server error', 
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app

