import { useState, useRef } from 'react'
import { musicApi, speechToTextApi } from '../services/api'
import './ScriptToMusic.css'

const MUSIC_STYLES = [
  { id: 'acoustic', label: 'Acoustic', description: 'Gentle, organic sounds' },
  { id: 'electronic', label: 'Electronic', description: 'Modern synth and beats' },
  { id: 'classical', label: 'Classical', description: 'Orchestral and traditional' },
  { id: 'jazz', label: 'Jazz', description: 'Smooth and sophisticated' },
  { id: 'rock', label: 'Rock', description: 'Energetic and powerful' },
  { id: 'ambient', label: 'Ambient', description: 'Atmospheric and relaxing' },
]

const DEFAULT_LYRICS = `Verse 1:
Walking through the morning light
Everything feels so bright
New day brings new hope
Learning how to cope

Chorus:
Music fills the air
With melodies so fair
Every note tells a story
Of love, hope, and glory`

const ScriptToMusic = () => {
  const [script, setScript] = useState(DEFAULT_LYRICS)
  const [loading, setLoading] = useState(false)
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [musicLength, setMusicLength] = useState(180) // 3 minutes in seconds
  const [musicStyle, setMusicStyle] = useState('acoustic')
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handleClearText = () => {
    setScript('')
    setError(null)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Find supported MIME type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']
      let selectedMimeType = ''
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported audio format found')
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      })

      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType })
          
          if (audioBlob.size === 0) {
            throw new Error('No audio data recorded')
          }

          // Convert to base64
          const reader = new FileReader()
          reader.onloadend = async () => {
            try {
              const result = reader.result as string
              const base64Audio = result.includes(',') ? result.split(',')[1] : result
              
              // Transcribe audio
              const response = await speechToTextApi.transcribe(base64Audio, 'en-US')
              
              let transcribedText = ''
              if (typeof response === 'string') {
                transcribedText = response
              } else if (response?.transcription) {
                transcribedText = String(response.transcription)
              } else if (response?.text) {
                transcribedText = response.text
              }
              
              if (transcribedText && transcribedText.trim()) {
                setScript(transcribedText.trim())
              } else {
                setError('No text transcribed from audio')
              }
            } catch (err: any) {
              console.error('Transcription error:', err)
              setError('Failed to transcribe audio: ' + (err.message || 'Unknown error'))
            } finally {
              stream.getTracks().forEach(track => track.stop())
            }
          }
          
          reader.readAsDataURL(audioBlob)
        } catch (err: any) {
          console.error('Error processing recording:', err)
          setError('Failed to process recording: ' + (err.message || 'Unknown error'))
          stream.getTracks().forEach(track => track.stop())
        }
      }

      recorder.start(1000)
      setMediaRecorder(recorder)
      setIsRecording(true)
      setError(null)
    } catch (err: any) {
      console.error('Failed to start recording', err)
      let errorMessage = 'Failed to start recording.'
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Recording not supported in this browser. Please use a modern browser.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const handleGenerateMusic = async () => {
    if (!script.trim()) {
      setError('Please enter lyrics or a description for the music')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedMusicUrl(null)

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }

    // Enhance prompt with style information
    const styleDescription = MUSIC_STYLES.find(s => s.id === musicStyle)?.label || musicStyle
    const enhancedPrompt = `${script.trim()}\n\nStyle: ${styleDescription}`

    try {
      const musicBlob = await musicApi.generate(enhancedPrompt, {
        musicLengthMs: musicLength * 1000, // Convert seconds to milliseconds
        modelId: 'music_v1',
        forceInstrumental: true,
        respectSectionsDurations: true,
        storeForInpainting: false,
        signWithC2pa: false,
      })

      // Create object URL for audio playback
      const musicUrl = URL.createObjectURL(musicBlob)
      setGeneratedMusicUrl(musicUrl)
    } catch (err: any) {
      console.error('Music generation error:', err)
      setError(err.message || 'Failed to generate music. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayMusic = () => {
    if (!generatedMusicUrl) return

    if (audioRef.current && !audioRef.current.paused) {
      // Pause if playing
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Play or resume
      if (!audioRef.current) {
        const audio = new Audio(generatedMusicUrl)
        audio.volume = 1.0
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
          audioRef.current = null
        }

        audio.onerror = () => {
          setIsPlaying(false)
          setError('Failed to play music')
          audioRef.current = null
        }
      }

      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleDownloadMusic = () => {
    if (!generatedMusicUrl) return

    const link = document.createElement('a')
    link.href = generatedMusicUrl
    link.download = `generated-music-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="script-to-music">
      <div className="section-header">
        <div className="header-content">
          <div className="header-icon">🎵</div>
          <div className="header-text">
            <h1 className="header-title">Script to Music</h1>
            <p className="header-subtitle">Convert your lyrics or voice into beautiful music</p>
          </div>
        </div>
      </div>

      <div className="input-section">
        <div className="input-header">
          <label className="label">Describe the music you want:</label>
          <div className="input-actions">
            <button
              className={`voice-button ${isRecording ? 'active' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              {isRecording ? '⏹ Stop Recording' : '🎤 Voice Input'}
            </button>
            {script && (
              <button
                className="clear-button"
                onClick={handleClearText}
                disabled={loading || isRecording}
                title="Clear text"
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </div>
        <textarea
          className="text-input"
          placeholder="e.g., A relaxing acoustic guitar melody with soft piano and gentle percussion, evoking a peaceful sunset on the beach."
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={4}
          disabled={loading || isRecording}
        />
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            Recording... Speak your music description
          </div>
        )}
      </div>

      <div className="options-section">
        <div className="option-group">
          <label className="label">Music Length (seconds):</label>
          <input
            type="number"
            className="length-input"
            min="30"
            max="600"
            step="30"
            value={musicLength}
            onChange={(e) => setMusicLength(parseInt(e.target.value) || 180)}
            disabled={loading}
          />
          <span className="length-hint">({Math.floor(musicLength / 60)} min {musicLength % 60} sec)</span>
        </div>
        
        <div className="option-group">
          <label className="label">Music Style:</label>
          <select
            className="style-select"
            value={musicStyle}
            onChange={(e) => setMusicStyle(e.target.value)}
            disabled={loading}
          >
            {MUSIC_STYLES.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label} - {style.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        className="generate-button"
        onClick={handleGenerateMusic}
        disabled={loading || !script.trim() || isRecording}
      >
        {loading ? '🎵 Generating Music...' : '🎵 Generate Music'}
      </button>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Creating your music... This may take a few minutes.</p>
        </div>
      )}

      {generatedMusicUrl && !loading && (
        <div className="music-result">
          <h3>Generated Music</h3>
          <div className="music-controls">
            <button
              className="play-button"
              onClick={handlePlayMusic}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play Music'}
            </button>
            <button
              className="download-button"
              onClick={handleDownloadMusic}
            >
              💾 Download
            </button>
          </div>
          <audio ref={audioRef} src={generatedMusicUrl} />
        </div>
      )}
    </div>
  )
}

export default ScriptToMusic

