import express from 'express'
import { elevenLabsService } from '../services/elevenLabsService.js'

const router = express.Router()

/**
 * Transcribe audio to text using ElevenLabs Speech-to-Text
 * POST /api/speech-to-text/transcribe
 */
router.post('/transcribe', async (req, res) => {
  try {
    const { audioData, languageCode, modelId, tagAudioEvents, diarize } = req.body

    if (!audioData || typeof audioData !== 'string') {
      return res.status(400).json({ error: 'Audio data is required (base64 encoded)' })
    }

    // Map language codes to ElevenLabs format
    // ElevenLabs uses 3-letter ISO codes (eng, spa, fra, etc.) or None for auto-detection
    const mapLanguageCode = (code: string | undefined): string | undefined => {
      // Default to English if no language code is provided
      if (!code) return 'eng' // Default to English instead of auto-detect
      
      // Convert common formats to ElevenLabs format
      const langMap: Record<string, string> = {
        'en': 'eng',
        'en-US': 'eng',
        'en-GB': 'eng',
        'es': 'spa',
        'es-ES': 'spa',
        'es-MX': 'spa',
        'fr': 'fra',
        'fr-FR': 'fra',
        'de': 'deu',
        'de-DE': 'deu',
        'it': 'ita',
        'it-IT': 'ita',
        'pt': 'por',
        'pt-BR': 'por',
        'ja': 'jpn',
        'ja-JP': 'jpn',
        'zh': 'zho',
        'zh-CN': 'zho',
        'ko': 'kor',
        'ko-KR': 'kor',
      }
      
      // Check if it's already in the correct format
      if (code.length === 3 && /^[a-z]{3}$/i.test(code)) {
        return code.toLowerCase()
      }
      
      // Try to map it
      const normalized = code.toLowerCase().replace('_', '-')
      return langMap[normalized] || langMap[code.split('-')[0]] || undefined
    }

    const transcription = await elevenLabsService.speechToText(audioData, {
      modelId: modelId || 'scribe_v1',
      tagAudioEvents: tagAudioEvents !== undefined ? tagAudioEvents : true,
      languageCode: mapLanguageCode(languageCode), // Map to ElevenLabs format or undefined for auto-detect
      diarize: diarize !== undefined ? diarize : true,
    })

    res.json({
      transcription,
      languageCode: languageCode || 'en-US',
      model: modelId || 'scribe_v1',
    })
  } catch (error: any) {
    console.error('Speech-to-Text transcription error:', error)
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error.message,
    })
  }
})

export default router

