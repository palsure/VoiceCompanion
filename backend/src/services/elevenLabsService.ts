import axios from 'axios'
import { config } from '../config.js'

class ElevenLabsService {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  constructor() {
    this.apiKey = config.elevenLabsApiKey || ''
  }

  async textToSpeech(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
        }
      )

      return Buffer.from(response.data)
    } catch (error: any) {
      console.error('ElevenLabs TTS error:', error)
      throw new Error(`Failed to generate speech: ${error.message}`)
    }
  }

  async getVoices(): Promise<any[]> {
    if (!this.apiKey) {
      return []
    }

    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      })
      return response.data.voices || []
    } catch (error: any) {
      console.error('ElevenLabs voices error:', error)
      return []
    }
  }
}

export const elevenLabsService = new ElevenLabsService()
export default elevenLabsService

