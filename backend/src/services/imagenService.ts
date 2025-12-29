import { PredictionServiceClient } from '@google-cloud/aiplatform'
import { GoogleAuth } from 'google-auth-library'
import axios from 'axios'
import { config } from '../config.js'

class ImagenService {
  private client: PredictionServiceClient | null = null
  private auth: GoogleAuth | null = null
  private projectId: string
  private location: string

  constructor() {
    this.projectId = config.googleCloudProjectId || ''
    this.location = config.vertexAiLocation || 'us-central1'

    // Try to initialize with Application Default Credentials (ADC)
    // This works without a key file if running on GCP or with gcloud auth
    if (this.projectId) {
      try {
        // Initialize Google Auth for REST API calls
        this.auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        })
        
        // Also initialize client for potential future use
        this.client = new PredictionServiceClient({
          apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
          projectId: this.projectId,
        })
        console.log('Imagen service initialized with Application Default Credentials')
        console.log(`Project ID: ${this.projectId}, Location: ${this.location}`)
      } catch (error) {
        console.error('Failed to initialize Imagen service:', error)
        console.log('Note: If organization policy blocks key creation, use: gcloud auth application-default login')
      }
    }
  }

  /**
   * Generate image from text prompt using Google Imagen via REST API
   */
  async generateImage(prompt: string, style?: string): Promise<string | null> {
    if (!this.auth || !this.projectId) {
      throw new Error('Google Cloud credentials not configured for Imagen')
    }

    try {
      // Enhance prompt with style
      let enhancedPrompt = prompt
      if (style) {
        const styleModifiers: { [key: string]: string } = {
          realistic: 'photorealistic, high quality, detailed, 4k, professional',
          artistic: 'artistic style, creative, expressive, painting, masterpiece',
          cartoon: 'cartoon style, animated, colorful, illustration, vibrant',
          abstract: 'abstract art, modern, creative, contemporary, unique',
          photographic: 'professional photography, sharp focus, high resolution, DSLR, studio quality',
        }
        enhancedPrompt = `${prompt}, ${styleModifiers[style] || styleModifiers.realistic}`
      }

      // Imagen API endpoint - using imagegeneration model via REST API
      // Try different model versions if one doesn't work
      let modelName = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/imagegeneration@006`
      let apiUrl = `https://${this.location}-aiplatform.googleapis.com/v1/${modelName}:predict`
      
      // Alternative: Try imagen-3.0-generate-001 if imagegeneration@006 doesn't work
      // const modelName = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-001`
      
      // Get access token with proper project ID
      const client = await this.auth.getClient()
      if (this.projectId) {
        client.projectId = this.projectId
      }
      const accessTokenResponse = await client.getAccessToken()
      const accessToken = accessTokenResponse?.token
      
      if (!accessToken) {
        throw new Error('Failed to get access token. Make sure you have run: gcloud auth application-default login')
      }

      // Create the request body for Vertex AI Imagen
      // Ensure prompt is properly parameterized in the request
      const requestBody = {
        instances: [
          {
            prompt: String(enhancedPrompt || prompt).trim(), // Ensure prompt is a string and trimmed
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          safetyFilterLevel: 'block_some',
          personGeneration: 'allow_adult', // Allow adult person generation (more widely available than 'allow_all')
        },
      }
      
      // Validate prompt is not empty
      if (!requestBody.instances[0].prompt || requestBody.instances[0].prompt.length === 0) {
        throw new Error('Prompt cannot be empty')
      }

      console.log(`Generating image with Imagen for prompt: ${requestBody.instances[0].prompt}`)
      console.log(`Using model: ${modelName}`)
      console.log(`Prompt length: ${requestBody.instances[0].prompt.length} characters`)
      
      // Make REST API call
      console.log('Making Imagen API request to:', apiUrl)
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      console.log('Prompt parameter:', JSON.stringify(requestBody.instances[0].prompt))
      
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 120 seconds timeout for image generation
      }).catch((error) => {
        // Log detailed error information for debugging
        if (error.response) {
          console.error('Imagen API error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
          })
          // Log the full error data
          if (error.response.data) {
            console.error('Full error data:', JSON.stringify(error.response.data, null, 2))
          }
        } else {
          console.error('Imagen API error (no response):', error.message)
        }
        throw error
      })
      
      // Handle response from REST API
      console.log('Imagen API response status:', response.status)
      console.log('Imagen API response headers:', JSON.stringify(response.headers, null, 2))
      console.log('Imagen API response structure:', {
        hasData: !!response.data,
        hasPredictions: !!(response.data?.predictions),
        predictionsLength: response.data?.predictions?.length || 0,
        responseKeys: response.data ? Object.keys(response.data) : [],
        responseDataType: typeof response.data,
        responseDataIsArray: Array.isArray(response.data),
      })
      
      // Check if response is empty (might be filtered by safety settings)
      if (response.data && Object.keys(response.data).length === 0) {
        console.warn('Imagen returned empty response - likely filtered by safety settings')
        throw new Error('Image generation was blocked by safety filters. The prompt may contain content that violates safety policies. Try rephrasing the prompt (e.g., avoid words like "child" or other sensitive terms).')
      }
      
      // Check if predictions array is empty
      if (response.data && response.data.predictions && response.data.predictions.length === 0) {
        console.warn('Imagen returned empty predictions array - likely filtered by safety settings')
        throw new Error('Image generation was blocked by safety filters. The prompt may contain content that violates safety policies. Try rephrasing the prompt (e.g., avoid words like "child" or other sensitive terms).')
      }
      
      if (response.data) {
        // Log the full response structure for debugging
        if (response.data.predictions) {
          console.log('Predictions structure:', JSON.stringify(response.data.predictions[0], null, 2).substring(0, 500))
        } else {
          console.log('Response data keys:', Object.keys(response.data))
          console.log('Full response data:', JSON.stringify(response.data, null, 2))
        }
      } else {
        console.warn('Response has no data property')
        console.log('Response object keys:', Object.keys(response))
        console.log('Response status:', response.status, response.statusText)
      }
      
      if (response.data && response.data.predictions && response.data.predictions.length > 0) {
        const prediction = response.data.predictions[0] as any
        
        // Handle different response formats
        if (prediction.bytesBase64Encoded) {
          const imageData = `data:image/png;base64,${prediction.bytesBase64Encoded}`
          console.log('Successfully generated image with Imagen (bytesBase64Encoded)')
          return imageData
        } else if (prediction.generatedImages && Array.isArray(prediction.generatedImages) && prediction.generatedImages.length > 0) {
          const firstImage = prediction.generatedImages[0]
          if (firstImage.bytesBase64Encoded) {
            const imageData = `data:image/png;base64,${firstImage.bytesBase64Encoded}`
            console.log('Successfully generated image with Imagen (generatedImages)')
            return imageData
          }
        } else if (prediction.mimeType && prediction.bytesBase64Encoded) {
          const imageData = `data:${prediction.mimeType};base64,${prediction.bytesBase64Encoded}`
          console.log('Successfully generated image with Imagen (mimeType)')
          return imageData
        } else if (prediction.bytesBase64Encoded === '' || prediction.bytesBase64Encoded === null) {
          // Empty response - might be a safety filter or content policy issue
          console.warn('Imagen returned empty image data - might be filtered by safety settings')
          throw new Error('Image generation was blocked by safety filters. Try a different prompt.')
        }
        
        // Log what we actually received
        console.error('Unexpected prediction structure:', {
          keys: Object.keys(prediction),
          hasBytesBase64: 'bytesBase64Encoded' in prediction,
          hasGeneratedImages: 'generatedImages' in prediction,
          predictionType: typeof prediction,
        })
      } else if (response.data && !response.data.predictions) {
        // Response has data but no predictions array
        console.error('Response has data but no predictions:', Object.keys(response.data))
      }

      throw new Error('No image data in Imagen response')
    } catch (error: any) {
      console.error('Imagen image generation error:', error)
      
      // Provide more helpful error messages
      const errorData = error.response?.data?.error || error.response?.data
      const errorMessage = errorData?.message || error.message
      const errorReason = errorData?.details?.[0]?.reason || errorData?.details?.[0]?.errorInfo?.reason
      
      if (error.response?.status === 403) {
        if (errorReason === 'BILLING_DISABLED' || errorMessage?.includes('billing')) {
          throw new Error(`Billing is not enabled for this project. Vertex AI requires billing to be enabled. Please enable billing at: https://console.cloud.google.com/billing/enable?project=${this.projectId}`)
        } else {
          throw new Error(`Vertex AI API permission denied. ${errorMessage || 'Please check your IAM roles and ensure the API is enabled.'}`)
        }
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please run: gcloud auth application-default login')
      } else if (error.response?.status === 404) {
        throw new Error('Imagen model not found. Please check your project ID and location.')
      }
      
      throw new Error(`Failed to generate image with Imagen: ${errorMessage || 'Unknown error'}`)
    }
  }
}

export const imagenService = new ImagenService()
export default imagenService

