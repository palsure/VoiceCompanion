import { ImageAnnotatorClient } from '@google-cloud/vision'
import { config } from '../config.js'

export class VisionService {
  private client: ImageAnnotatorClient | null = null

  constructor() {
    // Try to initialize Vision API client
    // Will use Application Default Credentials if keyFilename is not provided
    try {
      const clientConfig: any = {}
      
      if (config.googleCloudProjectId) {
        clientConfig.projectId = config.googleCloudProjectId
      }
      
      // Only use keyFilename if explicitly provided (bypasses org policy)
      if (config.googleApplicationCredentials) {
        clientConfig.keyFilename = config.googleApplicationCredentials
      }
      // Otherwise, will use Application Default Credentials (ADC)
      // Set up with: gcloud auth application-default login
      
      this.client = new ImageAnnotatorClient(clientConfig)
    } catch (error) {
      console.warn('Vision API client initialization failed:', error)
      console.warn('Vision features will be limited.')
      console.warn('Options:')
      console.warn('1. Set GOOGLE_APPLICATION_CREDENTIALS to key file path')
      console.warn('2. Use Application Default Credentials: gcloud auth application-default login')
      this.client = null
    }
  }

  private base64ToBuffer(base64String: string): Buffer {
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
      const objectLocalizationFn = (this.client as any)?.objectLocalization
      if (typeof objectLocalizationFn !== 'function') {
        // Some @google-cloud/vision typings / versions don't expose this method cleanly.
        // Fail soft: object detection is optional in our composite description.
        return []
      }

      const [result] = await objectLocalizationFn.call(this.client, {
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
      return []
    }
  }

  async analyzeImage(imageData: string): Promise<{
    text?: string
    objects?: Array<{ name: string; confidence: number }>
    labels?: Array<{ name: string; score: number }>
    description: string
  }> {
    try {
      const [text, objects, labels] = await Promise.all([
        this.extractText(imageData).catch(() => undefined),
        this.detectObjects(imageData).catch(() => []),
        this.detectLabels(imageData).catch(() => [])
      ])

      // Generate comprehensive description from all Vision API results
      const description = this.generateDescription({ text, objects, labels })

      return {
        text,
        objects,
        labels,
        description,
      }
    } catch (error: any) {
      console.error('Image analysis error:', error)
      throw error
    }
  }

  async detectLabels(imageData: string): Promise<Array<{ name: string; score: number }>> {
    if (!this.client) {
      throw new Error('Vision API not configured. Please set up Google Cloud credentials.')
    }

    try {
      const imageBuffer = this.base64ToBuffer(imageData)
      const [result] = await this.client.labelDetection({
        image: { content: imageBuffer },
      })

      const labels = result.labelAnnotations
      if (labels && labels.length > 0) {
        return labels
          .filter((label: any) => label.score && label.score > 0.5)
          .map((label: any) => ({
            name: label.description || '',
            score: label.score || 0,
          }))
          .slice(0, 10) // Limit to top 10 labels
      }
      return []
    } catch (error: any) {
      console.error('Vision API label detection error:', error)
      return []
    }
  }

  generateDescription(analysis: {
    text?: string
    objects?: Array<{ name: string; confidence: number }>
    labels?: Array<{ name: string; score: number }>
  }): string {
    const parts: string[] = []

    // Add text if found
    if (analysis.text && analysis.text.trim() && analysis.text !== 'No text found in image') {
      parts.push(`Text found in the image: ${analysis.text}`)
    }

    // Add objects if detected
    if (analysis.objects && analysis.objects.length > 0) {
      const objectNames = analysis.objects.map(o => o.name).join(', ')
      parts.push(`Objects detected: ${objectNames}`)
    }

    // Add labels for scene context
    if (analysis.labels && analysis.labels.length > 0) {
      const topLabels = analysis.labels
        .slice(0, 5)
        .map(l => l.name)
        .join(', ')
      parts.push(`Scene contains: ${topLabels}`)
    }

    // Create a natural language description
    if (parts.length > 0) {
      return parts.join('. ') + '.'
    }

    return 'Image analyzed using Google Vision API. The image appears to be a photograph or image, but specific details could not be clearly identified.'
  }
}

export const visionService = new VisionService()
export default visionService

