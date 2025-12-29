import express from 'express'
import { geminiService } from '../services/geminiService.js'
import { visionService } from '../services/visionService.js'

const router = express.Router()

router.post('/read-document', async (req, res) => {
  try {
    const { imageData } = req.body

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const text = await visionService.extractText(imageData)

    const explanation = await geminiService.generateResponse(
      `Please read and explain this document clearly. Format it in a way that's easy to understand when read aloud:\n\n${text}`
    )

    res.json({
      text,
      explanation,
    })
  } catch (error: any) {
    console.error('Document reading error:', error)
    res.status(500).json({
      error: 'Failed to read document',
      message: error.message,
    })
  }
})

router.post('/shopping-assist', async (req, res) => {
  try {
    const { imageData, question } = req.body

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const analysis = await visionService.analyzeImage(imageData)
    
    const prompt = question 
      ? `The user is asking about a product: "${question}". Based on the image analysis, provide helpful shopping assistance.`
      : 'Describe this product in detail, including what it is, any visible text (brand, price, description), and helpful shopping information.'

    const assistance = await geminiService.generateResponse(prompt)

    res.json({
      productInfo: analysis,
      assistance,
    })
  } catch (error: any) {
    console.error('Shopping assistance error:', error)
    res.status(500).json({
      error: 'Failed to provide shopping assistance',
      message: error.message,
    })
  }
})

router.post('/navigation', async (req, res) => {
  try {
    const { query, location } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' })
    }

    const prompt = `The user needs navigation help: "${query}". ${location ? `Their current location context: ${location}` : ''}
Provide clear, step-by-step directions that are easy to follow when spoken aloud. Be specific about landmarks, turns, and distances.`

    const directions = await geminiService.generateResponse(prompt)

    res.json({
      directions,
    })
  } catch (error: any) {
    console.error('Navigation error:', error)
    res.status(500).json({
      error: 'Failed to provide navigation assistance',
      message: error.message,
    })
  }
})

router.post('/tasks', async (req, res) => {
  try {
    const { action, task, tasks } = req.body

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ error: 'Action is required' })
    }

    let prompt = ''
    switch (action) {
      case 'add':
        prompt = `The user wants to add a task: "${task}". Confirm the task and provide a helpful response.`
        break
      case 'list':
        prompt = `The user wants to see their tasks. Here are their current tasks: ${JSON.stringify(tasks || [])}. List them in a clear, organized way.`
        break
      case 'complete':
        prompt = `The user completed a task: "${task}". Acknowledge this and provide encouragement.`
        break
      default:
        prompt = `The user is managing tasks. Action: ${action}. ${task ? `Task: ${task}` : ''}`
    }

    const response = await geminiService.generateResponse(prompt)

    res.json({
      response,
    })
  } catch (error: any) {
    console.error('Task management error:', error)
    res.status(500).json({
      error: 'Failed to manage tasks',
      message: error.message,
    })
  }
})

export default router

