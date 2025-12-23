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

    // Use Vision API for structured analysis
    const analysis = await visionService.analyzeImage(imageData)

    // Use Gemini for natural language description
    let description = analysis.description
    try {
      const geminiDescription = await geminiService.describeScene(imageData)
      description = geminiDescription
    } catch (geminiError) {
      console.warn('Gemini description failed, using Vision API result:', geminiError)
      // Fall back to Vision API description
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

