import express from 'express'
import { elevenLabsService } from '../services/elevenLabsService.js'
import axios from 'axios'

const router = express.Router()

/**
 * Fallback music generation using simple audio synthesis
 * Creates a basic musical pattern based on the prompt and style
 */
async function generateMusicFallback(prompt: string, durationSeconds: number, style?: string): Promise<Buffer> {
  try {
    console.log('Using open source fallback music generation for prompt:', prompt.substring(0, 50), 'style:', style)
    
    // Try alternative Hugging Face models
    const models = [
      'facebook/musicgen-small',
      'facebook/musicgen-medium',
      'audiocraft/musicgen-small',
    ]
    
    for (const model of models) {
      try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            inputs: prompt,
            parameters: {
              duration: Math.min(durationSeconds, 30), // Max 30s for free tier
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}`,
              'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
            timeout: 120000,
          }
        )
        
        if (response.data && response.data.byteLength > 0) {
          console.log(`Successfully generated music using ${model}`)
          return Buffer.from(response.data)
        }
      } catch (modelError: any) {
        console.warn(`Model ${model} failed:`, modelError.message)
        continue
      }
    }
    
    // If all Hugging Face models fail, generate music based on prompt and style
    return generateMusicFromPrompt(prompt, durationSeconds, style)
  } catch (error: any) {
    console.error('All fallback methods failed, generating music from prompt:', error)
    // Last resort: generate music from prompt
    return generateMusicFromPrompt(prompt, durationSeconds, style)
  }
}

/**
 * Generate music from prompt and style using audio synthesis
 * Analyzes the prompt to determine tempo, mood, and scale
 */
function generateMusicFromPrompt(prompt: string, durationSeconds: number, style?: string): Buffer {
  const sampleRate = 44100
  const numSamples = sampleRate * durationSeconds
  const buffer = Buffer.allocUnsafe(numSamples * 2)
  
  // Analyze prompt to determine musical characteristics
  const lowerPrompt = prompt.toLowerCase()
  
  // Determine tempo based on keywords
  let notesPerSecond = 2 // Default: moderate tempo
  if (lowerPrompt.includes('fast') || lowerPrompt.includes('energetic') || lowerPrompt.includes('upbeat') || lowerPrompt.includes('rock')) {
    notesPerSecond = 4
  } else if (lowerPrompt.includes('slow') || lowerPrompt.includes('relaxing') || lowerPrompt.includes('calm') || lowerPrompt.includes('ambient')) {
    notesPerSecond = 1
  }
  
  // Determine scale based on mood
  let scale: number[]
  if (lowerPrompt.includes('minor') || lowerPrompt.includes('sad') || lowerPrompt.includes('melancholic') || lowerPrompt.includes('jazz')) {
    // A minor scale
    scale = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00] // A, B, C, D, E, F, G, A
  } else if (lowerPrompt.includes('classical') || lowerPrompt.includes('orchestral')) {
    // D major scale
    scale = [293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 554.37, 587.33] // D, E, F#, G, A, B, C#, D
  } else {
    // C major scale (default)
    scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25] // C, D, E, F, G, A, B, C
  }
  
  // Adjust based on style
  if (style) {
    const lowerStyle = style.toLowerCase()
    if (lowerStyle.includes('rock') || lowerStyle.includes('electronic')) {
      notesPerSecond = 4
    } else if (lowerStyle.includes('jazz')) {
      // Keep jazz tempo moderate
    } else if (lowerStyle.includes('ambient') || lowerStyle.includes('classical')) {
      notesPerSecond = 1
    }
  }
  
  // Generate melody pattern
  const samplesPerNote = Math.floor(sampleRate / notesPerSecond)
  const totalNotes = Math.ceil(durationSeconds * notesPerSecond)
  
  for (let i = 0; i < numSamples; i++) {
    const noteIndex = Math.floor(i / samplesPerNote) % totalNotes
    const scaleIndex = noteIndex % scale.length
    const baseFreq = scale[scaleIndex]
    
    // Create harmony based on style
    let sample = 0
    const t = i / sampleRate
    
    if (style && style.toLowerCase().includes('rock')) {
      // Power chord: root + fifth
      sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.7 + Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.3
    } else if (style && style.toLowerCase().includes('jazz')) {
      // Jazz chord: root + third + fifth + seventh
      sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.4 +
               Math.sin(2 * Math.PI * baseFreq * 1.25 * t) * 0.2 +
               Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.2 +
               Math.sin(2 * Math.PI * baseFreq * 1.75 * t) * 0.2
    } else if (style && (style.toLowerCase().includes('acoustic') || style.toLowerCase().includes('classical'))) {
      // Gentle harmony: root + octave
      sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.6 + Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.4
    } else {
      // Default: root + harmony
      const harmonyFreq = baseFreq * 0.5 // One octave lower
      sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.7 + Math.sin(2 * Math.PI * harmonyFreq * t) * 0.3
    }
    
    // Apply ADSR envelope for each note
    const notePosition = (i % samplesPerNote) / samplesPerNote
    let envelope = 1.0
    if (notePosition < 0.1) {
      // Attack
      envelope = notePosition / 0.1
    } else if (notePosition > 0.9) {
      // Release
      envelope = (1 - notePosition) / 0.1
    }
    
    // Apply overall fade in/out
    const globalEnvelope = Math.min(1, Math.min(i / (sampleRate * 0.1), (numSamples - i) / (sampleRate * 0.1)))
    
    // Add some variation for more musical interest
    const variation = Math.sin(2 * Math.PI * 0.5 * t) * 0.1 // Slow vibrato
    
    const amplitude = Math.floor((sample + variation) * envelope * globalEnvelope * 12000)
    
    // Write as 16-bit little-endian
    buffer.writeInt16LE(amplitude, i * 2)
  }
  
  return createWavFile(buffer, sampleRate)
}

/**
 * Generate a simple musical pattern as ultimate fallback
 * Creates a pleasant melody using basic synthesis
 */
function generateSimpleTone(durationSeconds: number): Buffer {
  const sampleRate = 44100
  const numSamples = sampleRate * durationSeconds
  const buffer = Buffer.allocUnsafe(numSamples * 2) // 16-bit audio, 2 bytes per sample
  
  // Create a pleasant melody pattern (C major scale)
  const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25] // C, D, E, F, G, A, B, C
  const notesPerSecond = 2 // Play 2 notes per second
  const samplesPerNote = Math.floor(sampleRate / notesPerSecond)
  const totalNotes = Math.ceil(durationSeconds * notesPerSecond)
  
  for (let i = 0; i < numSamples; i++) {
    const noteIndex = Math.floor(i / samplesPerNote) % totalNotes
    const scaleIndex = noteIndex % scale.length
    const frequency = scale[scaleIndex]
    
    // Add some harmony with a lower octave
    const baseFreq = frequency
    const harmonyFreq = frequency * 0.5 // One octave lower
    
    // Generate waveform with multiple harmonics for richer sound
    const t = i / sampleRate
    const sample1 = Math.sin(2 * Math.PI * baseFreq * t)
    const sample2 = Math.sin(2 * Math.PI * harmonyFreq * t) * 0.5
    const sample = (sample1 + sample2) / 1.5
    
    // Apply ADSR envelope for each note
    const notePosition = (i % samplesPerNote) / samplesPerNote
    let envelope = 1.0
    if (notePosition < 0.1) {
      // Attack
      envelope = notePosition / 0.1
    } else if (notePosition > 0.9) {
      // Release
      envelope = (1 - notePosition) / 0.1
    }
    
    // Apply overall fade in/out
    const globalEnvelope = Math.min(1, Math.min(i / (sampleRate * 0.1), (numSamples - i) / (sampleRate * 0.1)))
    
    const amplitude = Math.floor(sample * envelope * globalEnvelope * 12000) // 16-bit range, reduced for safety
    
    // Write as 16-bit little-endian
    buffer.writeInt16LE(amplitude, i * 2)
  }
  
  // Convert to WAV format
  return createWavFile(buffer, sampleRate)
}

/**
 * Create a WAV file from audio buffer
 */
function createWavFile(audioData: Buffer, sampleRate: number): Buffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8
  const dataSize = audioData.length
  const fileSize = 36 + dataSize
  
  const wavHeader = Buffer.alloc(44)
  
  // RIFF header
  wavHeader.write('RIFF', 0)
  wavHeader.writeUInt32LE(fileSize, 4)
  wavHeader.write('WAVE', 8)
  
  // fmt chunk
  wavHeader.write('fmt ', 12)
  wavHeader.writeUInt32LE(16, 16) // fmt chunk size
  wavHeader.writeUInt16LE(1, 20) // audio format (PCM)
  wavHeader.writeUInt16LE(numChannels, 22)
  wavHeader.writeUInt32LE(sampleRate, 24)
  wavHeader.writeUInt32LE(byteRate, 28)
  wavHeader.writeUInt16LE(blockAlign, 32)
  wavHeader.writeUInt16LE(bitsPerSample, 34)
  
  // data chunk
  wavHeader.write('data', 36)
  wavHeader.writeUInt32LE(dataSize, 40)
  
  return Buffer.concat([wavHeader, audioData])
}

/**
 * @swagger
 * /api/music/generate:
 *   post:
 *     summary: Generate music from text/script
 *     description: |
 *       Generates music from a text prompt using ElevenLabs API with fallback to open-source models.
 *       Supports various music styles and lengths.
 *     tags: [Music]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Text description of the music to generate (e.g., "Upbeat jazz with piano")
 *                 example: "Upbeat jazz with piano, Style: Acoustic"
 *               musicLengthMs:
 *                 type: number
 *                 description: Desired length in milliseconds
 *                 default: 30000
 *                 example: 30000
 *               modelId:
 *                 type: string
 *                 description: ElevenLabs model ID (optional)
 *               forceInstrumental:
 *                 type: boolean
 *                 description: Force instrumental music
 *               style:
 *                 type: string
 *                 description: Music style (e.g., "acoustic", "electronic", "rock")
 *     responses:
 *       200:
 *         description: Music generated successfully
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audio:
 *                   type: string
 *                   format: base64
 *                 usedFallback:
 *                   type: boolean
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      prompt,
      musicLengthMs,
      modelId,
      forceInstrumental,
      respectSectionsDurations,
      storeForInpainting,
      signWithC2pa,
    } = req.body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required',
        message: 'Please provide a text prompt describing the music you want to generate',
      })
    }

    let musicBuffer: Buffer
    let usedFallback = false

    try {
      // Try ElevenLabs first
      musicBuffer = await elevenLabsService.generateMusic(prompt, {
        musicLengthMs,
        modelId,
        forceInstrumental,
        respectSectionsDurations,
        storeForInpainting,
        signWithC2pa,
      })
      console.log('Music generated successfully using ElevenLabs')
    } catch (elevenLabsError: any) {
      console.warn('ElevenLabs music generation failed, trying fallback:', elevenLabsError.message)
      
      // Fallback to open source music generation
      try {
        const durationSeconds = Math.floor((musicLengthMs || 30000) / 1000)
        // Extract style from prompt if available (handle "Style: Acoustic" or "Style: Acoustic (Gentle, organic sounds)")
        const styleMatch = prompt.match(/Style:\s*([^\n(]+)/i)
        const style = styleMatch ? styleMatch[1].trim() : undefined
        musicBuffer = await generateMusicFallback(prompt, Math.min(durationSeconds, 30), style) // Max 30s for free tier
        usedFallback = true
        console.log('Music generated successfully using open source fallback with style:', style)
      } catch (fallbackError: any) {
        console.warn('Fallback music generation failed, using prompt-based generator:', fallbackError.message)
        // Ultimate fallback: generate music from prompt
        const durationSeconds = Math.floor((musicLengthMs || 30000) / 1000)
        const styleMatch = prompt.match(/Style:\s*([^\n(]+)/i)
        const style = styleMatch ? styleMatch[1].trim() : undefined
        musicBuffer = generateMusicFromPrompt(prompt, Math.min(durationSeconds, 30), style)
        usedFallback = true
        console.log('Music generated using prompt-based fallback with style:', style)
      }
    }

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', usedFallback ? 'audio/wav' : 'audio/mpeg')
    res.setHeader('Content-Length', musicBuffer.length)
    res.setHeader('Content-Disposition', `attachment; filename="generated-music-${Date.now()}.${usedFallback ? 'wav' : 'mp3'}"`)
    if (usedFallback) {
      res.setHeader('X-Music-Source', 'fallback')
    }

    // Send the audio buffer
    res.send(musicBuffer)
  } catch (error: any) {
    console.error('Music generation error:', error)
    
    // Handle specific error types
    let statusCode = 500
    let errorMessage = error.message || 'An error occurred while generating music'
    
    if (error.message?.includes('API key')) {
      statusCode = 401
      errorMessage = error.message
    } else if (error.message?.includes('Payment Required') || error.message?.includes('paid subscription') || error.message?.includes('upgrade your plan')) {
      statusCode = 402
      errorMessage = error.message
    } else if (error.message?.includes('rate limit')) {
      statusCode = 429
      errorMessage = error.message
    } else if (error.message?.includes('not available') || error.message?.includes('endpoint not found')) {
      statusCode = 404
      errorMessage = error.message
    }
    
    res.status(statusCode).json({
      error: 'Failed to generate music',
      message: errorMessage,
    })
  }
})

export default router

