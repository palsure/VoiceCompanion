import { useState, useRef, useEffect } from 'react'
import { visionApi, textToSpeechApi } from '../services/api'
import CameraCapture from './CameraCapture'
import './ImageToVoice.css'

interface SavedArt {
  id: string
  image: string
  prompt: string
  style: string
  createdAt: number
}

const ImageToVoice = () => {
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [savedArts, setSavedArts] = useState<SavedArt[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load saved arts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voiceCompanion_savedArts')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedArts(Array.isArray(parsed) ? parsed : [])
      }
    } catch (err) {
      console.error('Failed to load saved arts:', err)
    }
  }, [])

  const handleImageCapture = (imageData: string | null) => {
    setCapturedImage(imageData)
    setDescription(null)
    if (imageData) {
      handleAutoGenerate(imageData)
    }
  }

  const handleAutoGenerate = async (imageData: string) => {
    setLoading(true)
    try {
      // Get image description
      const result = await visionApi.describe(imageData)
      const imageDescription = result.description || 'Unable to describe image'
      setDescription(imageDescription)

      // Try to generate and play voice (but don't fail if quota exceeded)
      try {
        await handleGenerateVoice(imageDescription)
      } catch (voiceError: any) {
        console.warn('Voice generation failed (quota may be exceeded):', voiceError)
        // Don't show alert - just show the text description
      }
    } catch (error: any) {
      console.error('Image analysis error:', error)
      setDescription('Failed to analyze image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateVoice = async (text: string) => {
    try {
      // Use text-to-speech API from shared module
      const audioBlob = await textToSpeechApi.generate(text)
      const audioUrl = URL.createObjectURL(audioBlob)

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Create new audio element
      const audio = new Audio(audioUrl)
      audio.volume = 1.0
      audioRef.current = audio

      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error: any) {
      console.error('Voice generation error:', error)
      alert('Voice generation unavailable. Your ElevenLabs quota may be exceeded. The text description is shown above.')
    }
  }

  const handleStopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }
  }

  const handleClearImage = () => {
    setCapturedImage(null)
    setDescription(null)
    handleStopVoice()
  }

  const handleOpenGallery = () => {
    setShowGalleryModal(true)
  }

  const handleSelectFromGallery = (art: SavedArt) => {
    handleImageCapture(art.image)
    setShowGalleryModal(false)
  }

  return (
    <div className="image-to-voice">
      <div className="section-header">
        <h2>📸 Image to Voice</h2>
        <p>Capture or upload an image to get a detailed voice description</p>
      </div>

      <CameraCapture
        active={cameraActive}
        onToggle={setCameraActive}
        onImageCapture={handleImageCapture}
        onOpenGallery={handleOpenGallery}
      />

      {capturedImage && (
        <div className="image-preview-section">
          <div className="image-preview-header">
            <h3>Captured Image</h3>
            <button className="clear-button" onClick={handleClearImage}>
              ✕ Clear
            </button>
          </div>
          <img src={capturedImage} alt="Captured" className="preview-image" />
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Analyzing image and generating description...</p>
            </div>
          )}

          {description && (
            <div className="description-section">
              <h3>Image Description:</h3>
              <p className="description-text">{description}</p>
              <div className="voice-controls">
                {isPlaying ? (
                  <button className="stop-button" onClick={handleStopVoice}>
                    ⏹ Stop Voice
                  </button>
                ) : (
                  <button
                    className="play-button"
                    onClick={() => handleGenerateVoice(description)}
                  >
                    🔊 Play Description
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!capturedImage && (
        <div className="instruction-box">
          <p>💡 Click "Start Camera" to capture an image, "Open from Gallery" to select from your saved art, or "Upload Image" to choose a file.</p>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="gallery-modal-overlay" onClick={() => setShowGalleryModal(false)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-header">
              <h3>Select from Saved Art</h3>
              <button
                className="gallery-modal-close"
                onClick={() => setShowGalleryModal(false)}
              >
                ✕
              </button>
            </div>
            {savedArts.length > 0 ? (
              <div className="gallery-modal-grid">
                {savedArts.map((art) => (
                  <div
                    key={art.id}
                    className="gallery-modal-item"
                    onClick={() => handleSelectFromGallery(art)}
                  >
                    <img
                      src={art.image}
                      alt={art.prompt || 'Saved art'}
                      className="gallery-modal-image"
                    />
                    <div className="gallery-modal-info">
                      <p className="gallery-modal-prompt" title={art.prompt || ''}>
                        {art.prompt && art.prompt.length > 40
                          ? `${art.prompt.substring(0, 40)}...`
                          : art.prompt || 'Untitled'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gallery-modal-empty">
                <p>No saved art yet.</p>
                <p>Create some art in the "Voice to Art" feature and save it to your gallery.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageToVoice

