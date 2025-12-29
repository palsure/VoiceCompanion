import { conversationApi, ConversationRequest } from './api'

export interface VoiceService {
  sendMessage: (message: string, imageData?: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<string>
}

class VoiceServiceImpl implements VoiceService {
  async sendMessage(
    message: string,
    imageData?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const request: ConversationRequest = {
      message,
      imageData,
      conversationHistory: history,
    }
    
    const response = await conversationApi.sendMessage(request)
    return response.response
  }
}

export const voiceService = new VoiceServiceImpl()

