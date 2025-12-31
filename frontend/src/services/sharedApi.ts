/**
 * Vendored copy of `shared/src/api.ts`
 * Kept in frontend so Docker/Cloud Build doesn't need monorepo path mapping.
 */

import axios, { AxiosInstance } from 'axios'
import type {
  ConversationRequest,
  ConversationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  SpeechToTextResponse,
  VisionAnalysisResponse,
  ProgressData,
} from './sharedTypes'

export interface ApiConfig {
  baseURL: string
  timeout?: number
}

export function createApiClient(config: ApiConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: config.timeout || 35000,
  })
}

export class VoiceCompanionApi {
  private api: AxiosInstance

  constructor(apiClient: AxiosInstance) {
    this.api = apiClient
  }

  async sendConversation(data: ConversationRequest): Promise<ConversationResponse> {
    const response = await this.api.post('/conversation', data)
    return response.data
  }

  async analyzeFeedback(text: string, audioData?: string): Promise<any> {
    const response = await this.api.post('/feedback/analyze', { text, audioData })
    return response.data
  }

  async getProgress(): Promise<ProgressData> {
    const response = await this.api.get('/progress')
    return response.data
  }

  async updateProgress(data: Partial<ProgressData>): Promise<ProgressData> {
    const response = await this.api.post('/progress', data)
    return response.data
  }

  async generateImage(
    prompt: string,
    style?: ImageGenerationRequest['style'],
    size?: string
  ): Promise<ImageGenerationResponse> {
    const response = await this.api.post(
      '/image-generation/generate',
      { prompt, style, size },
      { timeout: 120000 }
    )
    return response.data
  }

  async transcribeSpeech(audioData: string, languageCode?: string): Promise<SpeechToTextResponse> {
    const response = await this.api.post('/speech-to-text/transcribe', {
      audioData,
      languageCode,
    })
    return response.data
  }

  async analyzeImage(imageData: string): Promise<VisionAnalysisResponse> {
    const response = await this.api.post('/vision/analyze', { imageData })
    return response.data
  }

  async describeImage(imageData: string): Promise<VisionAnalysisResponse> {
    return this.analyzeImage(imageData)
  }

  async getRealtimeGuidance(imageData: string, previousContext?: string): Promise<any> {
    const response = await this.api.post('/guidance/realtime', { imageData, previousContext })
    return response.data
  }

  async getShoppingAssistance(imageData: string, question?: string): Promise<any> {
    const response = await this.api.post('/daily-living/shopping-assist', { imageData, question })
    return response.data
  }

  async textToSpeech(text: string, voiceId?: string): Promise<Blob> {
    const response = await this.api.post(
      '/text-to-speech/generate',
      { text, voiceId },
      { responseType: 'blob' }
    )
    return response.data
  }

  async generateMusic(
    prompt: string,
    options?: {
      musicLengthMs?: number
      modelId?: string
      forceInstrumental?: boolean
      respectSectionsDurations?: boolean
      storeForInpainting?: boolean
      signWithC2pa?: boolean
    }
  ): Promise<Blob> {
    const response = await this.api.post(
      '/music/generate',
      { prompt, ...options },
      { responseType: 'blob', timeout: 300000 }
    )
    return response.data
  }

  async saveToGallery(image: string, prompt: string, style: string, userId?: string): Promise<any> {
    const response = await this.api.post('/gallery/save', { image, prompt, style, userId })
    return response.data
  }

  async getGallery(userId?: string): Promise<any> {
    const response = await this.api.get('/gallery/list', { params: { userId } })
    return response.data
  }

  async getArtById(id: string, userId?: string): Promise<any> {
    const response = await this.api.get(`/gallery/${id}`, { params: { userId } })
    return response.data
  }

  async deleteArt(id: string, userId?: string): Promise<any> {
    const response = await this.api.delete(`/gallery/${id}`, { params: { userId } })
    return response.data
  }
}

export function createApiServices(apiClient: AxiosInstance) {
  const api = new VoiceCompanionApi(apiClient)

  return {
    conversationApi: {
      sendMessage: (data: ConversationRequest) => api.sendConversation(data),
    },
    feedbackApi: {
      analyze: (text: string, audioData?: string) => api.analyzeFeedback(text, audioData),
    },
    progressApi: {
      get: () => api.getProgress(),
      update: (data: Partial<ProgressData>) => api.updateProgress(data),
    },
    imageGenerationApi: {
      generate: (prompt: string, style?: string, size?: string) =>
        api.generateImage(prompt, style as any, size),
    },
    speechToTextApi: {
      transcribe: (audioData: string, languageCode?: string) =>
        api.transcribeSpeech(audioData, languageCode),
    },
    visionApi: {
      analyze: (imageData: string) => api.analyzeImage(imageData),
      describe: (imageData: string) => api.describeImage(imageData),
    },
    guidanceApi: {
      realtime: (imageData: string, previousContext?: string) =>
        api.getRealtimeGuidance(imageData, previousContext),
    },
    shoppingApi: {
      assist: (imageData: string, question?: string) => api.getShoppingAssistance(imageData, question),
    },
    textToSpeechApi: {
      generate: (text: string, voiceId?: string) => api.textToSpeech(text, voiceId),
    },
    musicApi: {
      generate: (
        prompt: string,
        options?: {
          musicLengthMs?: number
          modelId?: string
          forceInstrumental?: boolean
          respectSectionsDurations?: boolean
          storeForInpainting?: boolean
          signWithC2pa?: boolean
        }
      ) => api.generateMusic(prompt, options),
    },
    galleryApi: {
      save: (image: string, prompt: string, style: string, userId?: string) =>
        api.saveToGallery(image, prompt, style, userId),
      list: (userId?: string) => api.getGallery(userId),
      get: (id: string, userId?: string) => api.getArtById(id, userId),
      delete: (id: string, userId?: string) => api.deleteArt(id, userId),
    },
  }
}


