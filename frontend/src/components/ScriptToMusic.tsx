import { useState, useRef, useEffect } from 'react'
import { musicApi, speechToTextApi } from '../services/api'
import FeatureInfoIcon from './FeatureInfoIcon'
import './ScriptToMusic.css'

interface SavedMusic {
  id: string
  script: string
  style: string
  length: number
  audioUrl: string
  createdAt: number
}

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
Of love, hope, and glory

Verse 2:
Through the ups and downs we go
Music helps our spirits grow
In harmony we find our way
To face another day

Chorus:
Music fills the air
With melodies so fair
Every note tells a story
Of love, hope, and glory

Bridge:
When words are not enough
Music speaks from the heart
It connects us all together
A universal art

Chorus:
Music fills the air
With melodies so fair
Every note tells a story
Of love, hope, and glory`

const ScriptToMusic = () => {
  const [script, setScript] = useState(DEFAULT_LYRICS)
  const [loading, setLoading] = useState(false)
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null)
  const [generatedMusicBlob, setGeneratedMusicBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [musicLength, setMusicLength] = useState(30) // 30 seconds default
  const [musicStyle, setMusicStyle] = useState('acoustic')
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'music'>('create')
  const [savedMusic, setSavedMusic] = useState<SavedMusic[]>([])
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isInitialMountRef = useRef(true)

  // Load saved music from localStorage on mount
  useEffect(() => {
    const loadMusic = async () => {
      try {
        const saved = localStorage.getItem('voiceCompanion_savedMusic')
        if (saved) {
          const parsed = JSON.parse(saved)
          const musicArray = Array.isArray(parsed) ? parsed : []
          
          // Data URLs are already stored correctly, no conversion needed
          setSavedMusic(musicArray)
        }
      } catch (err) {
        console.error('Failed to load saved music:', err)
      }
    }
    
    loadMusic()
    isInitialMountRef.current = false
  }, [])

  // Save music to localStorage whenever savedMusic changes
  useEffect(() => {
    if (isInitialMountRef.current) {
      return
    }
    
    const saveMusic = async () => {
      try {
        if (savedMusic.length === 0) {
          localStorage.removeItem('voiceCompanion_savedMusic')
          return
        }
        
        // Music is already stored as data URLs, so we can save directly
        localStorage.setItem('voiceCompanion_savedMusic', JSON.stringify(savedMusic))
      } catch (err: any) {
        console.error('Failed to save music to localStorage:', err)
      }
    }
    
    saveMusic()
  }, [savedMusic])

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
    const styleInfo = MUSIC_STYLES.find(s => s.id === musicStyle)
    const enhancedPrompt = `${script.trim()}\n\nStyle: ${styleDescription}${styleInfo ? ` (${styleInfo.description})` : ''}`

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
      setGeneratedMusicBlob(musicBlob)
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

        audio.onpause = () => {
          setIsPlaying(false)
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

  const handleSaveMusic = async () => {
    if (!generatedMusicUrl || !generatedMusicBlob) {
      setError('No music to save')
      return
    }

    try {
      // Convert blob to data URL for storage
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(generatedMusicBlob)
      })

      const musicId = `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newMusic: SavedMusic = {
        id: musicId,
        script: script.trim(),
        style: musicStyle,
        length: musicLength,
        audioUrl: dataUrl,
        createdAt: Date.now(),
      }

      setSavedMusic((prev) => [newMusic, ...prev])
      setError(null)
      
      // Show success message (you could add a toast notification here)
      alert('Music saved successfully!')
    } catch (err: any) {
      console.error('Failed to save music:', err)
      setError('Failed to save music: ' + (err.message || 'Unknown error'))
    }
  }

  const handlePlaySavedMusic = (music: SavedMusic) => {
    if (playingMusicId === music.id && audioRef.current && !audioRef.current.paused) {
      // Pause if playing
      audioRef.current.pause()
      setPlayingMusicId(null)
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Play new music
      const audio = new Audio(music.audioUrl)
      audio.volume = 1.0
      audioRef.current = audio

      audio.onended = () => {
        setPlayingMusicId(null)
        audioRef.current = null
      }

      audio.onerror = () => {
        setPlayingMusicId(null)
        setError('Failed to play music')
        audioRef.current = null
      }

      audio.play()
      setPlayingMusicId(music.id)
    }
  }

  const handleDeleteMusic = (musicId: string) => {
    if (window.confirm('Are you sure you want to delete this music?')) {
      setSavedMusic((prev) => prev.filter((m) => m.id !== musicId))
      
      // Stop playing if this music was playing
      if (playingMusicId === musicId && audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
        setPlayingMusicId(null)
      }
    }
  }

  const handleDownloadSavedMusic = (music: SavedMusic) => {
    const link = document.createElement('a')
    link.href = music.audioUrl
    link.download = `music-${music.id}.mp3`
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
            <div className="header-title-row">
              <h1 className="header-title">Script to Music</h1>
              <FeatureInfoIcon
                title="Script to Music"
                description="Transform your lyrics, scripts, or voice recordings into beautiful music compositions. Choose from various music styles and let AI create the perfect soundtrack."
                howItWorks={[
                  'Enter your lyrics or script in the text box, or use voice recording',
                  'Select your preferred music style (Acoustic, Electronic, Classical, Jazz, Rock, or Ambient)',
                  'Choose the music length (15-60 seconds)',
                  'Click "Generate Music" - powered by ElevenLabs Music Generation API',
                  'ElevenLabs creates high-quality instrumental music from your text',
                  'Listen to your generated music and save it to your collection',
                  'Access your saved music anytime from the "My Music" tab'
                ]}
                features={[
                  'ElevenLabs Music Generation API for professional-quality compositions',
                  'Text-to-music conversion using advanced AI models',
                  'Voice input support for hands-free creation',
                  'Multiple music styles to choose from',
                  'Adjustable music length',
                  'Open-source fallback when premium services are unavailable',
                  'Save and manage your music library',
                  'Download your compositions'
                ]}
              />
            </div>
            <p className="header-subtitle">Convert your lyrics or voice into beautiful music</p>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Music
        </button>
        <button
          className={`tab-button ${activeTab === 'music' ? 'active' : ''}`}
          onClick={() => setActiveTab('music')}
        >
          My Music ({savedMusic.length})
        </button>
      </div>

      {activeTab === 'create' && (
        <>

      <div className="input-section">
        <div className="input-header-row">
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
            onChange={(e) => setMusicLength(parseInt(e.target.value) || 30)}
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
              {isPlaying && audioRef.current && !audioRef.current.paused ? '⏸ Pause' : '▶ Play Music'}
            </button>
            <button
              className="save-button"
              onClick={handleSaveMusic}
            >
              💾 Save Music
            </button>
            <button
              className="download-button"
              onClick={handleDownloadMusic}
            >
              ⬇ Download
            </button>
          </div>
          <audio ref={audioRef} src={generatedMusicUrl} />
        </div>
      )}
        </>
      )}

      {activeTab === 'music' && (
        <div className="music-gallery">
          {savedMusic.length === 0 ? (
            <div className="empty-gallery">
              <p>No saved music yet.</p>
              <p>Create some music and save it to your collection!</p>
            </div>
          ) : (
            <div className="music-list">
              {savedMusic.map((music) => (
                <div key={music.id} className="music-item">
                  <div className="music-item-header">
                    <h4 className="music-item-title">
                      {music.script.substring(0, 50)}
                      {music.script.length > 50 ? '...' : ''}
                    </h4>
                    <div className="music-item-meta">
                      <span className="music-style-badge">{MUSIC_STYLES.find(s => s.id === music.style)?.label || music.style}</span>
                      <span className="music-length-badge">{Math.floor(music.length / 60)}:{String(music.length % 60).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="music-item-controls">
                    <button
                      className="play-button-small"
                      onClick={() => handlePlaySavedMusic(music)}
                    >
                      {playingMusicId === music.id ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <button
                      className="download-button-small"
                      onClick={() => handleDownloadSavedMusic(music)}
                    >
                      ⬇ Download
                    </button>
                    <button
                      className="delete-button-small"
                      onClick={() => handleDeleteMusic(music.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="music-item-date">
                    {new Date(music.createdAt).toLocaleDateString()} {new Date(music.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ScriptToMusic

