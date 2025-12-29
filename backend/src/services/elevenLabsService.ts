import axios from 'axios'
import FormData from 'form-data'
import { config } from '../config.js'

class ElevenLabsService {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  constructor() {
    this.apiKey = config.elevenLabsApiKey || ''
    // Log API key status (without exposing the full key)
    if (this.apiKey) {
      console.log('ElevenLabs API key loaded:', this.apiKey.substring(0, 10) + '...')
    } else {
      console.warn('ElevenLabs API key not found in configuration')
      console.log('Available env vars:', {
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? 'SET' : 'NOT SET',
        fromConfig: config.elevenLabsApiKey ? 'SET' : 'NOT SET'
      })
    }
  }

  async textToSpeech(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
    // Re-check API key from config in case it wasn't loaded during construction
    if (!this.apiKey) {
      this.apiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY || ''
    }
    
    if (!this.apiKey) {
      console.error('ElevenLabs API key check failed:', {
        fromInstance: !!this.apiKey,
        fromConfig: !!config.elevenLabsApiKey,
        fromEnv: !!process.env.ELEVENLABS_API_KEY
      })
      throw new Error('ElevenLabs API key not configured')
    }

    console.log('Using ElevenLabs API key:', this.apiKey.substring(0, 15) + '...' + ' (length: ' + this.apiKey.length + ')')

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          // Removed model_id as eleven_monolingual_v1 is deprecated on free tier
          // Using default model which is available on all tiers
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
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.detail?.message || error.response.data?.message || error.message
        
        if (status === 401) {
          console.error('ElevenLabs 401 Unauthorized - API key may be invalid or expired')
          console.error('API key being used:', this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'NOT SET')
          throw new Error('ElevenLabs API key is invalid or expired. Please verify your API key in the .env file is correct and active.')
        } else if (status === 429) {
          throw new Error('ElevenLabs API rate limit exceeded. Please try again later.')
        } else {
          throw new Error(`Failed to generate speech: ${message || `HTTP ${status}`}`)
        }
      }
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

  async generateMusic(
    prompt: string,
    options: {
      musicLengthMs?: number
      modelId?: string
      forceInstrumental?: boolean
      respectSectionsDurations?: boolean
      storeForInpainting?: boolean
      signWithC2pa?: boolean
    } = {}
  ): Promise<Buffer> {
    // Re-check API key from config
    if (!this.apiKey) {
      this.apiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY || ''
    }
    
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in your .env file.')
    }

    // Verify API key by checking if it works for other endpoints first
    try {
      const voicesResponse = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
        timeout: 5000,
      })
      console.log('API key verified - can access Voices API')
    } catch (verifyError: any) {
      if (verifyError.response?.status === 401 || verifyError.response?.status === 403) {
        throw new Error('ElevenLabs API key is invalid or expired. Please check your API key in the .env file and ensure it is correct and active.')
      }
      // If verification fails for other reasons, continue anyway (might be network issue)
      console.warn('Could not verify API key, but continuing with music generation:', verifyError.message)
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required for music generation')
    }

    try {
      const requestBody = {
        prompt: prompt.trim(),
        music_length_ms: options.musicLengthMs || 180000, // 3 minutes default
        model_id: options.modelId || 'music_v1',
        force_instrumental: options.forceInstrumental !== undefined ? options.forceInstrumental : true,
        respect_sections_durations: options.respectSectionsDurations !== undefined ? options.respectSectionsDurations : true,
        store_for_inpainting: options.storeForInpainting !== undefined ? options.storeForInpainting : false,
        sign_with_c2pa: options.signWithC2pa !== undefined ? options.signWithC2pa : false,
      }

      console.log('Generating music with ElevenLabs:', {
        prompt: prompt.substring(0, 50) + '...',
        musicLengthMs: requestBody.music_length_ms,
        modelId: requestBody.model_id,
      })

      console.log('Calling ElevenLabs Music API:', {
        endpoint: `${this.baseUrl}/music`,
        apiKeyPresent: !!this.apiKey,
        apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 15) + '...' : 'NOT SET',
        requestBody: {
          ...requestBody,
          prompt: requestBody.prompt.substring(0, 50) + '...',
        },
      })

      const response = await axios.post(
        `${this.baseUrl}/music`,
        requestBody,
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
          timeout: 300000, // 5 minutes timeout for music generation
        }
      )

      console.log('Music generated successfully, size:', response.data.byteLength, 'bytes')
      return Buffer.from(response.data)
    } catch (error: any) {
      console.error('ElevenLabs music generation error:', error)
      if (error.response) {
        const status = error.response.status
        let responseData = error.response.data
        
        // Try to parse response data if it's a buffer
        if (Buffer.isBuffer(responseData)) {
          try {
            responseData = JSON.parse(responseData.toString())
          } catch (e) {
            // If parsing fails, use the buffer as-is
            responseData = { message: responseData.toString() }
          }
        }
        
        console.error('Response status:', status)
        console.error('Response data:', responseData)
        
        if (status === 401 || status === 403) {
          console.error('ElevenLabs 401/403 - API key authentication failed for Music API')
          console.error('API key being used:', this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'NOT SET')
          console.error('Response data:', responseData)
          
          // Check if it's a subscription/access issue
          const errorDetail = responseData?.detail?.message || responseData?.message || responseData?.error || ''
          if (errorDetail.toLowerCase().includes('subscription') || errorDetail.toLowerCase().includes('plan') || errorDetail.toLowerCase().includes('access')) {
            throw new Error('Your ElevenLabs subscription plan does not include Music Generation access. Please upgrade your plan or contact ElevenLabs support to enable Music API access.')
          }
          
          throw new Error('ElevenLabs API key is invalid, expired, or does not have access to the Music API. Please verify your API key in the .env file and ensure your ElevenLabs plan includes Music Generation access. Note: Music Generation may require a paid subscription tier.')
        } else if (status === 402) {
          // 402 Payment Required - subscription/credits issue
          console.error('ElevenLabs 402 - Payment Required for Music API')
          console.error('Response data:', responseData)
          const errorDetail = responseData?.detail?.message || responseData?.message || responseData?.error || ''
          throw new Error('Music Generation requires a paid ElevenLabs subscription plan with Music API access. Your current plan does not include this feature. Please upgrade your ElevenLabs plan to access Music Generation, or contact ElevenLabs support for assistance.')
        } else if (status === 404) {
          throw new Error('ElevenLabs Music API endpoint not found. The Music API may not be available in your plan or the endpoint has changed.')
        } else if (status === 429) {
          throw new Error('ElevenLabs API rate limit exceeded. Please try again later.')
        } else {
          const errorMessage = responseData?.detail?.message || responseData?.message || responseData?.error || error.message
          throw new Error(`Failed to generate music: ${errorMessage || `HTTP ${status}`}`)
        }
      }
      
      // Handle network/timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Music generation request timed out. The generation may take longer than expected. Please try again or use a shorter music length.')
      }
      
      throw new Error(`Failed to generate music: ${error.message}`)
    }
  }

  /**
   * Convert speech to text using ElevenLabs Speech-to-Text API
   */
  async speechToText(
    audioData: string,
    options: {
      modelId?: string
      tagAudioEvents?: boolean
      languageCode?: string
      diarize?: boolean
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY environment variable.')
    }

    try {
      // Remove data URI prefix if present
      let audioContent = audioData
      if (audioContent.includes(',')) {
        audioContent = audioContent.split(',')[1]
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioContent, 'base64')

      // Create form data for multipart/form-data request
      // Format: curl -X POST https://api.elevenlabs.io/v1/speech-to-text \
      //         -H "xi-api-key: <key>" \
      //         -H "Content-Type: multipart/form-data" \
      //         -F model_id="string" \
      //         -F file=@<file>
      const formData = new FormData()
      
      // Add audio file (required)
      formData.append('file', audioBuffer, {
        filename: 'audio.m4a',
        contentType: 'audio/m4a',
      })

      // Add model_id (required) - use scribe_v1 as default
      const modelId = options.modelId || 'scribe_v1'
      formData.append('model_id', modelId)

      // Add optional parameters if provided
      if (options.tagAudioEvents !== undefined) {
        formData.append('tag_audio_events', options.tagAudioEvents.toString())
      }
      if (options.languageCode) {
        formData.append('language_code', options.languageCode)
      }
      if (options.diarize !== undefined) {
        formData.append('diarize', options.diarize.toString())
      }

      // ElevenLabs Speech-to-Text API endpoint
      // POST https://api.elevenlabs.io/v1/speech-to-text
      const endpoint = `${this.baseUrl}/speech-to-text`
      
      console.log(`Calling ElevenLabs Speech-to-Text API: ${endpoint}`)
      console.log(`API Key present: ${!!this.apiKey}`)
      console.log(`Model ID: ${modelId}`)
      console.log(`Audio buffer size: ${audioBuffer.length} bytes`)
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds
      
      let response
      try {
        response = await axios.post(
          endpoint,
          formData,
          {
            headers: {
              'xi-api-key': this.apiKey,
              ...formData.getHeaders(),
            },
            timeout: 30000, // 30 seconds timeout - reduce for faster failure detection
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            signal: controller.signal,
          }
        )
        
        clearTimeout(timeoutId)
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new Error('Request timeout: ElevenLabs API took too long to respond (30s). Please try a shorter recording.')
        }
        throw error
      }
      
      console.log(`ElevenLabs API response status: ${response.status}`)
      console.log('ElevenLabs response data type:', typeof response.data)
      console.log('ElevenLabs response data keys:', response.data ? Object.keys(response.data) : 'null')

      // ElevenLabs returns transcription in the response
      // Handle different possible response formats
      const data = response.data
      
      // Log full response for debugging (first 500 chars)
      const responseStr = JSON.stringify(data).substring(0, 500)
      console.log('ElevenLabs response preview:', responseStr)
      
      // Check for text field (most common)
      if (data?.text) {
        const text = typeof data.text === 'string' ? data.text : JSON.stringify(data.text)
        console.log('Found transcription in data.text:', text.substring(0, 100))
        return text.trim()
      }
      
      // Check for transcription field
      if (data?.transcription) {
        const transcription = typeof data.transcription === 'string' ? data.transcription : JSON.stringify(data.transcription)
        console.log('Found transcription in data.transcription:', transcription.substring(0, 100))
        return transcription.trim()
      }
      
      // Check if response is a string directly
      if (typeof data === 'string') {
        console.log('Response is string directly:', data.substring(0, 100))
        return data.trim()
      }
      
      // Check for segments array (with diarization)
      if (data?.segments && Array.isArray(data.segments)) {
        const segmentsText = data.segments
          .map((seg: any) => {
            // Handle segment objects with text or transcription
            if (typeof seg === 'string') return seg
            return seg.text || seg.transcription || seg.word || seg.content || ''
          })
          .filter((text: string) => text.trim().length > 0)
          .join(' ')
          .trim()
        console.log('Found transcription in segments:', segmentsText.substring(0, 100))
        return segmentsText
      }
      
      // Check for words array
      if (data?.words && Array.isArray(data.words)) {
        const wordsText = data.words
          .map((word: any) => typeof word === 'string' ? word : word.word || word.text || word.content || '')
          .filter((w: string) => w.trim().length > 0)
          .join(' ')
          .trim()
        console.log('Found transcription in words:', wordsText.substring(0, 100))
        return wordsText
      }
      
      // Check for nested structure (e.g., data.result.text)
      if (data?.result) {
        if (data.result.text) return data.result.text.trim()
        if (data.result.transcription) return data.result.transcription.trim()
      }
      
      // Log the full response for debugging
      console.log('ElevenLabs full response structure:', JSON.stringify(data, null, 2))
      throw new Error('Unexpected response format from ElevenLabs. Check logs for response structure.')
    } catch (error: any) {
      console.error('ElevenLabs Speech-to-Text error:', error)
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('ElevenLabs API request timed out. The endpoint may be incorrect or the service may be unavailable.')
      }
      
      // Handle network errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Cannot connect to ElevenLabs API. Please check your internet connection and API endpoint.')
      }
      
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        
        if (error.response.status === 404) {
          throw new Error('ElevenLabs Speech-to-Text endpoint not found. The API endpoint may have changed or Speech-to-Text may not be available in your plan.')
        }
        
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('ElevenLabs API authentication failed. Please check your API key.')
        }
        
        throw new Error(`ElevenLabs API error: ${error.response.data?.message || error.response.statusText || error.response.status}`)
      }
      
      throw new Error(`Failed to transcribe audio: ${error.message}`)
    }
  }

  // ElevenLabs Agents API methods
  async createAgentConversation(config: {
    agentId?: string
    language?: string
    scenario?: string
  }): Promise<string> {
    // Note: This is a placeholder for the actual ElevenLabs Agents API
    // The actual implementation will depend on the specific Agents API endpoints
    // For now, we'll use a mock conversation ID
    // In production, this would call: POST /v1/agents/{agent_id}/conversations
    
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Mock implementation - replace with actual API call
    return `conv_${Date.now()}`
  }

  async sendAgentMessage(
    conversationId: string,
    message: string,
    audioData?: Buffer
  ): Promise<{ response: string; audio?: Buffer }> {
    // Note: This is a placeholder for the actual ElevenLabs Agents API
    // The actual implementation would:
    // 1. Send message/audio to the agent
    // 2. Get response text and audio
    // 3. Return both
    
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Mock implementation - in production, this would call the Agents API
    // For now, we'll return a placeholder response
    // The actual flow would be handled by Gemini + TTS in the conversation route
    throw new Error('Agent message sending not yet fully implemented - use conversation endpoint')
  }
}

export const elevenLabsService = new ElevenLabsService()
export default elevenLabsService

