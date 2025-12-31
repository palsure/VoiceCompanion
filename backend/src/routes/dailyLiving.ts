import express from 'express'
import { geminiService } from '../services/geminiService.js'
import { visionService } from '../services/visionService.js'

const router = express.Router()

/**
 * @swagger
 * /api/daily-living/read-document:
 *   post:
 *     summary: Read and explain a document from image
 *     tags: [Daily Living]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageData
 *             properties:
 *               imageData:
 *                 type: string
 *                 description: Base64 encoded image of document
 *     responses:
 *       200:
 *         description: Document text and explanation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                 explanation:
 *                   type: string
 *       400:
 *         description: Missing image data
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/daily-living/shopping-assist:
 *   post:
 *     summary: Get shopping assistance for a product
 *     tags: [Daily Living]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageData
 *             properties:
 *               imageData:
 *                 type: string
 *                 description: Base64 encoded image of product
 *               question:
 *                 type: string
 *                 description: Specific question about the product
 *     responses:
 *       200:
 *         description: Product info and assistance
 *       400:
 *         description: Missing image data
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/daily-living/navigation:
 *   post:
 *     summary: Get navigation assistance
 *     tags: [Daily Living]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Navigation query
 *               location:
 *                 type: string
 *                 description: Current location context
 *     responses:
 *       200:
 *         description: Navigation directions
 *       400:
 *         description: Missing query
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/daily-living/tasks:
 *   post:
 *     summary: Manage daily tasks
 *     tags: [Daily Living]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [add, list, complete]
 *               task:
 *                 type: string
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task management response
 *       400:
 *         description: Missing action
 *       500:
 *         description: Server error
 */
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

