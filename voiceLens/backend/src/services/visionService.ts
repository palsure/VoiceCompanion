import { ImageAnnotatorClient } from '@google-cloud/vision'
import { config } from '../config.js'

class VisionService {
  private client: ImageAnnotatorClient | null = null

  constructor() {
    if (config.googleApplicationCredentials || config.googleCloudProjectId) {
      try {
        this.client = new ImageAnnotatorClient({
          projectId: config.googleCloudProjectId,
          keyFilename: config.googleApplicationCredentials,
        })
      } catch (error) {
        console.warn('Vision API client initialization failed:', error)
        console.warn('Vision features will be limited. Make sure GOOGLE_APPLICATION_CREDENTIALS is set.')
      }
    }
  }

  private base64ToBuffer(base64String: string): Buffer {
    // Remove data URL prefix if present
    const base64Data = base64String.includes(',') 
      ? base64String.split(',')[1] 
      : base64String
    return Buffer.from(base64Data, 'base64')
  }

  async extractText(imageData: string): Promise<string> {
    if (!this.client) {
      throw new Error('Vision API not configured. Please set up Google Cloud credentials.')
    }

    try {
      const imageBuffer = this.base64ToBuffer(imageData)
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer },
      })

      const detections = result.textAnnotations
      if (detections && detections.length > 0) {
        // First annotation contains all text
        return detections[0].description || ''
      }
      return 'No text found in image'
    } catch (error: any) {
      console.error('Vision API text extraction error:', error)
      throw new Error(`Failed to extract text: ${error.message}`)
    }
  }

  async detectObjects(imageData: string): Promise<Array<{ name: string; confidence: number }>> {
    if (!this.client) {
      throw new Error('Vision API not configured')
    }

    try {
      const imageBuffer = this.base64ToBuffer(imageData)
      const [result] = await this.client.objectLocalization({
        image: { content: imageBuffer },
      })

      const objects: Array<{ name: string; confidence: number }> = []
      
      if (result.localizedObjectAnnotations) {
        for (const annotation of result.localizedObjectAnnotations) {
          if (annotation.name && annotation.score) {
            objects.push({
              name: annotation.name,
              confidence: annotation.score,
            })
          }
        }
      }

      return objects
    } catch (error: any) {
      console.error('Vision API object detection error:', error)
      // Return empty array instead of throwing for graceful degradation
      return []
    }
  }

  async analyzeImage(imageData: string): Promise<{
    text?: string
    objects?: Array<{ name: string; confidence: number }>
    description: string
  }> {
    try {
      const [text, objects] = await Promise.all([
        this.extractText(imageData).catch(() => undefined),
        this.detectObjects(imageData).catch(() => []),
      ])

      // Build description from extracted data
      let description = ''
      if (text && text.trim()) {
        description += `Text found: ${text}\n`
      }
      if (objects.length > 0) {
        description += `Objects detected: ${objects.map(o => o.name).join(', ')}`
      }
      if (!description) {
        description = 'Image analyzed, but no specific text or objects were clearly identified.'
      }

      return {
        text,
        objects,
        description,
      }
    } catch (error: any) {
      console.error('Image analysis error:', error)
      throw error
    }
  }
}

export const visionService = new VisionService()
export default visionService

