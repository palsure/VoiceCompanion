import { SpeechClient } from '@google-cloud/speech'
import { config } from '../config.js'

class SpeechToTextService {
  private client: SpeechClient | null = null

  constructor() {
    try {
      const clientConfig: any = {}
      
      if (config.googleCloudProjectId) {
        clientConfig.projectId = config.googleCloudProjectId
      }
      
      if (config.googleApplicationCredentials) {
        clientConfig.keyFilename = config.googleApplicationCredentials
      }
      
      this.client = new SpeechClient(clientConfig)
      console.log('Google Cloud Speech-to-Text client initialized')
    } catch (error) {
      console.warn('Speech-to-Text client initialization failed:', error)
      console.warn('Speech-to-Text features will be limited.')
      this.client = null
    }
  }

  /**
   * Transcribe audio from base64 encoded audio data
   */
  async transcribeAudio(audioData: string, languageCode: string = 'en-US'): Promise<string> {
    if (!this.client) {
      throw new Error('Speech-to-Text client not initialized. Please configure Google Cloud credentials.')
    }

    try {
      // Remove data URI prefix if present
      let audioContent = audioData
      let mimeType = 'audio/wav'
      
      if (audioContent.includes(',')) {
        const parts = audioContent.split(',')
        audioContent = parts[1]
        
        // Extract MIME type from data URI
        const mimeMatch = parts[0].match(/data:([^;]+)/)
        if (mimeMatch) {
          mimeType = mimeMatch[1]
        }
      }

      const audioBytes = Buffer.from(audioContent, 'base64')

      // Determine encoding based on MIME type
      // For Expo Audio, it typically records as M4A (AAC) or WAV
      let encoding: 'LINEAR16' | 'MP3' | 'WEBM_OPUS' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'SPEEX_WITH_HEADER_BYTE' | 'ENCODING_UNSPECIFIED' = 'ENCODING_UNSPECIFIED'
      let sampleRateHertz = 44100

      if (mimeType.includes('wav') || mimeType.includes('wave')) {
        encoding = 'LINEAR16'
        sampleRateHertz = 44100
      } else if (mimeType.includes('m4a') || mimeType.includes('mp4') || mimeType.includes('aac')) {
        // M4A/AAC - use encoding unspecified, Google will auto-detect
        encoding = 'ENCODING_UNSPECIFIED'
        sampleRateHertz = 44100
      } else if (mimeType.includes('mp3')) {
        encoding = 'MP3'
        sampleRateHertz = 44100
      } else {
        // Default: let Google auto-detect
        encoding = 'ENCODING_UNSPECIFIED'
        sampleRateHertz = 44100
      }

      const request: any = {
        audio: {
          content: audioBytes,
        },
        config: {
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
          model: 'latest_long',
        },
      }

      // Only set encoding if not unspecified
      if (encoding !== 'ENCODING_UNSPECIFIED') {
        request.config.encoding = encoding
        request.config.sampleRateHertz = sampleRateHertz
      }

      const [response] = await this.client.recognize(request)
      
      if (!response.results || response.results.length === 0) {
        throw new Error('No transcription results returned. Please check audio format and try again.')
      }

      // Get the first alternative from the first result
      const transcription = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim()

      if (!transcription) {
        throw new Error('Empty transcription result. Please try speaking more clearly.')
      }

      return transcription
    } catch (error: any) {
      console.error('Speech-to-Text error:', error)
      throw new Error(`Failed to transcribe audio: ${error.message}`)
    }
  }

  /**
   * Transcribe audio with streaming support (for real-time transcription)
   */
  async transcribeStreaming(audioChunk: Buffer, languageCode: string = 'en-US'): Promise<string> {
    if (!this.client) {
      throw new Error('Speech-to-Text client not initialized')
    }

    // For now, we'll use the standard recognize method
    // For true streaming, you would use streamingRecognize
    const audioData = `data:audio/wav;base64,${audioChunk.toString('base64')}`
    return this.transcribeAudio(audioData, languageCode)
  }
}

export const speechToTextService = new SpeechToTextService()
export default speechToTextService

