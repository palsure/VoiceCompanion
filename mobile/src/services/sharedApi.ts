/**
 * Mobile-local copy of the shared API client/services.
 *
 * Why: Metro can be finicky with monorepos (imports outside project root).
 * To keep the Android app stable, mobile uses this local version instead of
 * importing from `../shared`.
 */

import axios, { type AxiosInstance } from 'axios'

export interface ApiConfig {
  baseURL: string
  timeout?: number
}

export function createApiClient(config: ApiConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: config.timeout || 35000,
  })
}

class VoiceCompanionApi {
  private api: AxiosInstance

  constructor(apiClient: AxiosInstance) {
    this.api = apiClient
  }

  // Conversation
  sendConversation(data: any) {
    return this.api.post('/conversation', data).then((r) => r.data)
  }

  // Feedback
  analyzeFeedback(text: string, audioData?: string) {
    return this.api.post('/feedback/analyze', { text, audioData }).then((r) => r.data)
  }

  // Progress
  getProgress() {
    return this.api.get('/progress').then((r) => r.data)
  }
  updateProgress(data: any) {
    return this.api.post('/progress', data).then((r) => r.data)
  }

  // Image generation
  generateImage(prompt: string, style?: string, size?: string) {
    return this.api
      .post(
        '/image-generation/generate',
        { prompt, style, size },
        { timeout: 120000 }
      )
      .then((r) => r.data)
  }

  // Speech-to-text
  transcribeSpeech(audioData: string, languageCode?: string) {
    return this.api.post('/speech-to-text/transcribe', { audioData, languageCode }).then((r) => r.data)
  }

  // Vision
  analyzeImage(imageData: string) {
    return this.api.post('/vision/analyze', { imageData }).then((r) => r.data)
  }
  describeImage(imageData: string) {
    return this.analyzeImage(imageData)
  }

  // Guidance
  getRealtimeGuidance(imageData: string, previousContext?: string) {
    return this.api.post('/guidance/realtime', { imageData, previousContext }).then((r) => r.data)
  }

  // Shopping
  getShoppingAssistance(imageData: string, question?: string) {
    return this.api.post('/daily-living/shopping-assist', { imageData, question }).then((r) => r.data)
  }

  // Text-to-speech (audio)
  textToSpeech(text: string, voiceId?: string) {
    return this.api
      .post('/text-to-speech/generate', { text, voiceId }, { responseType: 'blob' })
      .then((r) => r.data)
  }

  // Music generation (audio)
  generateMusic(
    prompt: string,
    options?: {
      musicLengthMs?: number
      modelId?: string
      forceInstrumental?: boolean
      respectSectionsDurations?: boolean
      storeForInpainting?: boolean
      signWithC2pa?: boolean
    }
  ) {
    return this.api
      .post(
        '/music/generate',
        { prompt, ...options },
        { responseType: 'blob', timeout: 300000 }
      )
      .then((r) => r.data)
  }

  // Gallery
  saveToGallery(image: string, prompt: string, style: string, userId?: string) {
    return this.api.post('/gallery/save', { image, prompt, style, userId }).then((r) => r.data)
  }
  getGallery(userId?: string) {
    return this.api.get('/gallery/list', { params: { userId } }).then((r) => r.data)
  }
  deleteArt(id: string, userId?: string) {
    return this.api.delete(`/gallery/${id}`, { params: { userId } }).then((r) => r.data)
  }
}

export function createApiServices(apiClient: AxiosInstance) {
  const api = new VoiceCompanionApi(apiClient)
  return {
    conversationApi: { sendMessage: (data: any) => api.sendConversation(data) },
    feedbackApi: { analyze: (text: string, audioData?: string) => api.analyzeFeedback(text, audioData) },
    progressApi: { get: () => api.getProgress(), update: (data: any) => api.updateProgress(data) },
    imageGenerationApi: { generate: (prompt: string, style?: string, size?: string) => api.generateImage(prompt, style, size) },
    speechToTextApi: { transcribe: (audioData: string, languageCode?: string) => api.transcribeSpeech(audioData, languageCode) },
    visionApi: { analyze: (imageData: string) => api.analyzeImage(imageData), describe: (imageData: string) => api.describeImage(imageData) },
    guidanceApi: { realtime: (imageData: string, previousContext?: string) => api.getRealtimeGuidance(imageData, previousContext) },
    shoppingApi: { assist: (imageData: string, question?: string) => api.getShoppingAssistance(imageData, question) },
    textToSpeechApi: { generate: (text: string, voiceId?: string) => api.textToSpeech(text, voiceId) },
    musicApi: { generate: (prompt: string, options?: any) => api.generateMusic(prompt, options) },
    galleryApi: {
      save: (image: string, prompt: string, style: string, userId?: string) => api.saveToGallery(image, prompt, style, userId),
      list: (userId?: string) => api.getGallery(userId),
      delete: (id: string, userId?: string) => api.deleteArt(id, userId),
    },
  }
}


