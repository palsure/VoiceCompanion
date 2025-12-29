import express from 'express'
import { geminiService } from '../services/geminiService.js'
import { imagenService } from '../services/imagenService.js'
import axios from 'axios'

const router = express.Router()

/**
 * Generate image from text/voice description using Hugging Face Stable Diffusion
 * POST /api/image-generation/generate
 */
async function generateImageWithHuggingFace(prompt: string, style?: string): Promise<string | null> {
  try {
    // Try multiple Hugging Face models in order of preference
    const models = [
      'runwayml/stable-diffusion-v1-5',
      'stabilityai/stable-diffusion-2-1',
      'CompVis/stable-diffusion-v1-4',
    ]
    
    // Enhance prompt with style
    let enhancedPrompt = prompt
    if (style) {
      const styleModifiers: { [key: string]: string } = {
        realistic: 'photorealistic, high quality, detailed, 4k',
        artistic: 'artistic style, creative, expressive, painting',
        cartoon: 'cartoon style, animated, colorful, illustration',
        abstract: 'abstract art, modern, creative, contemporary',
        photographic: 'professional photography, sharp focus, high resolution, DSLR',
      }
      enhancedPrompt = `${prompt}, ${styleModifiers[style] || styleModifiers.realistic}`
    }

    // Try each model until one works
    for (const modelId of models) {
      try {
        const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`
        console.log(`Trying Hugging Face model: ${modelId}`)
        
        const response = await axios.post(
          apiUrl,
          {
            inputs: enhancedPrompt,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
            timeout: 90000, // 90 seconds timeout for image generation
          }
        )

        if (response.data && response.data.length > 0) {
          // Convert to base64
          const base64Image = Buffer.from(response.data).toString('base64')
          console.log(`Successfully generated image using ${modelId}`)
          return `data:image/png;base64,${base64Image}`
        }
      } catch (modelError: any) {
        console.log(`Model ${modelId} failed:`, modelError.response?.status || modelError.message)
        // If it's a 503 (model loading), wait a bit and try next model
        if (modelError.response?.status === 503) {
          console.log(`Model ${modelId} is loading, trying next model...`)
          continue
        }
        // For other errors, try next model
        continue
      }
    }
    
    return null
  } catch (error: any) {
    console.error('Hugging Face API error:', error.message)
    return null
  }
}

/**
 * Generate image using alternative free API (Pixabay placeholder or similar)
 */
async function generateImageFallback(prompt: string): Promise<string | null> {
  // No fallback - return null to indicate failure
  // We don't want random images that don't match the prompt
  console.log('No fallback image generation - returning null')
  return null
}

router.post('/generate', async (req, res) => {
  try {
    const { prompt, style, size } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Enhance the prompt using Gemini (with fallback to original if it fails)
    let enhancedPrompt = prompt
    try {
      enhancedPrompt = await geminiService.enhanceImagePrompt(prompt, style)
    } catch (error) {
      console.log('Gemini enhancement failed, using original prompt:', error)
      // Enhance manually with style modifiers
      if (style) {
        const styleModifiers: { [key: string]: string } = {
          realistic: 'photorealistic, high quality, detailed, 4k',
          artistic: 'artistic style, creative, expressive, painting',
          cartoon: 'cartoon style, animated, colorful, illustration',
          abstract: 'abstract art, modern, creative, contemporary',
          photographic: 'professional photography, sharp focus, high resolution, DSLR',
        }
        enhancedPrompt = `${prompt}, ${styleModifiers[style] || styleModifiers.realistic}`
      }
    }

    // Try to generate image using Google Imagen (Vertex AI)
    let imageData: string | null = null
    
    try {
      imageData = await imagenService.generateImage(enhancedPrompt, style)
      console.log('Successfully generated image with Google Imagen')
    } catch (imagenError: any) {
      console.log('Google Imagen failed, trying Hugging Face:', imagenError.message)
      
      // Fallback to Hugging Face API
      imageData = await generateImageWithHuggingFace(enhancedPrompt, style)
      
      // If Hugging Face also fails, return error (no random images)
      if (!imageData) {
        console.log('Hugging Face API unavailable, no fallback image')
        
        // Provide helpful error message based on the error
        let errorMessage = 'Image generation failed.'
        if (imagenError.message.includes('Billing') || imagenError.message.includes('billing')) {
          errorMessage = imagenError.message
        } else if (imagenError.message.includes('not enabled')) {
          errorMessage = 'Vertex AI API is not enabled. Please enable it using: gcloud services enable aiplatform.googleapis.com'
        } else if (imagenError.message.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please run: gcloud auth application-default login'
        } else {
          errorMessage = imagenError.message || 'Image generation service unavailable.'
        }
        
        // Provide appropriate suggestion based on error type
        let suggestion = 'Please check your Google Cloud configuration.'
        if (errorMessage.includes('Billing') || errorMessage.includes('billing')) {
          suggestion = 'Enable billing for your project: https://console.cloud.google.com/billing/enable?project=hackathon-482302'
        } else if (errorMessage.includes('not enabled')) {
          suggestion = 'Enable the Vertex AI API: gcloud services enable aiplatform.googleapis.com --project=hackathon-482302'
        } else if (errorMessage.includes('Authentication')) {
          suggestion = 'Run: gcloud auth application-default login'
        }
        
        return res.status(500).json({ 
          error: errorMessage,
          details: imagenError.message,
          suggestion: suggestion
        })
      }
    }

    if (imageData) {
      // Ensure we return the image in a format the mobile app can use
      const response: any = {
        prompt: enhancedPrompt,
        originalPrompt: prompt,
        style: style || 'realistic',
        size: size || '1024x1024',
      }
      
      // Set image field - prioritize the format that works best
      if (imageData.startsWith('data:')) {
        // Base64 image
        response.image = imageData
        response.imageData = imageData.split(',')[1]
      } else if (imageData.startsWith('http')) {
        // URL image - set both image and imageUrl for compatibility
        response.image = imageData
        response.imageUrl = imageData
      } else {
        // Fallback - just set image
        response.image = imageData
      }
      
      console.log('Returning image response:', { 
        hasImage: !!response.image, 
        hasImageUrl: !!response.imageUrl,
        imageType: imageData.startsWith('data:') ? 'base64' : imageData.startsWith('http') ? 'url' : 'other'
      })
      
      res.json(response)
    } else {
      // If all image generation fails, return enhanced prompt
      res.json({
        prompt: enhancedPrompt,
        originalPrompt: prompt,
        style: style || 'realistic',
        size: size || '1024x1024',
        message: 'Image generation service temporarily unavailable. Enhanced prompt provided.',
        // Note: In production, integrate with DALL-E, Midjourney, or other image generation APIs
      })
    }
  } catch (error: any) {
    console.error('Image generation error:', error)
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message,
    })
  }
})

export default router

