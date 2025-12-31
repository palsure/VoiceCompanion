import swaggerJsdoc from 'swagger-jsdoc'
import { Express } from 'express'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VoiceCompanion API',
      version: '1.0.0',
      description: 'API documentation for VoiceCompanion backend service',
      contact: {
        name: 'VoiceCompanion Support',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Vision', description: 'Image analysis and vision services' },
      { name: 'Image Generation', description: 'Text-to-image generation' },
      { name: 'Text-to-Speech', description: 'TTS using ElevenLabs' },
      { name: 'Speech-to-Text', description: 'STT using ElevenLabs' },
      { name: 'Music', description: 'Music generation from scripts' },
      { name: 'Gallery', description: 'Art gallery management' },
      { name: 'Guidance', description: 'Real-time navigation guidance' },
      { name: 'Conversation', description: 'AI conversation endpoints' },
      { name: 'Daily Living', description: 'Accessibility and daily living assistance' },
      { name: 'Language Learning', description: 'Language learning features' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            service: {
              type: 'string',
              example: 'voicecompanion-backend',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/server.ts'], // Paths to files containing OpenAPI definitions
}

export const swaggerSpec = swaggerJsdoc(options)

export async function setupSwagger(app: Express) {
  // Dynamic import for ESM compatibility
  const swaggerUi = await import('swagger-ui-express')
  const swaggerUiExpress = swaggerUi.default
  
  app.use('/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'VoiceCompanion API Documentation',
  }))
  
  // Also serve JSON spec
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
}

