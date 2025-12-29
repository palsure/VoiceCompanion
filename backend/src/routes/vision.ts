import express from 'express'
import { visionService } from '../services/visionService.js'
import { geminiService } from '../services/geminiService.js'

const router = express.Router()

router.post('/analyze', async (req, res) => {
  try {
    const { imageData } = req.body

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }

    // Use Google Vision API for comprehensive image analysis
    const analysis = await visionService.analyzeImage(imageData)
    
    // Generate a natural, descriptive scene description using Gemini
    let description: string
    try {
      // Use Gemini to generate a natural scene description from the image
      description = await geminiService.describeScene(imageData)
    } catch (geminiError: any) {
      console.warn('Gemini scene description failed, falling back to Vision API description:', geminiError.message)
      // Fallback to Vision API description if Gemini fails
      description = visionService.generateDescription(analysis)
    }

    res.json({
      ...analysis,
      description,
    })
  } catch (error: any) {
    console.error('Vision analysis error:', error)
    res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message,
    })
  }
})

router.post('/text', async (req, res) => {
  try {
    const { imageData } = req.body

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const text = await visionService.extractText(imageData)

    res.json({ text })
  } catch (error: any) {
    console.error('Text extraction error:', error)
    res.status(500).json({
      error: 'Failed to extract text',
      message: error.message,
    })
  }
})

export default router

