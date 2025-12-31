import { useState, useRef, useEffect } from 'react'
import { imageGenerationApi, speechToTextApi, galleryApi } from '../services/api'
import PaletteIcon from './PaletteIcon'
import FeatureInfoIcon from './FeatureInfoIcon'
import './VoiceToArt.css'

interface SavedArt {
  id: string
  image: string
  prompt: string
  style: string
  createdAt: number
}

function artSyncKey(a: Pick<SavedArt, 'image' | 'prompt' | 'style'>) {
  // Good-enough dedupe across clients without hashing libs.
  return `${a.style}::${a.prompt}::${a.image.slice(0, 120)}`
}

const VoiceToArt = () => {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string>('')
  const [currentStyle, setCurrentStyle] = useState<string>('realistic')
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedArts, setSavedArts] = useState<SavedArt[]>([])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [artToDelete, setArtToDelete] = useState<SavedArt | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const audioChunksRef = useRef<Blob[]>([])
  const isInitialMountRef = useRef(true)

  // Load saved arts (prefer backend for cross-platform sync; localStorage as fallback)
  useEffect(() => {
    const loadGallery = async () => {
      try {
        // Read localStorage first (we may need it to backfill backend for cross-platform sync)
        let localArts: SavedArt[] = []
        try {
          const saved = localStorage.getItem('voiceCompanion_savedArts')
          if (saved) {
            const parsed = JSON.parse(saved)
            localArts = Array.isArray(parsed) ? parsed : []
          }
        } catch (e) {
          console.warn('Failed to load gallery from localStorage:', e)
        }

        // Try backend API (shared across web + mobile)
        try {
          const apiResponse = await galleryApi.list()
          const apiArts: SavedArt[] = Array.isArray(apiResponse?.arts) ? apiResponse.arts : []

          // Merge API + local (so UI shows everything immediately)
          const seen = new Set<string>()
          const merged: SavedArt[] = []
          for (const a of [...apiArts, ...localArts]) {
            if (!a?.image || !a?.prompt) continue
            const k = artSyncKey(a)
            if (seen.has(k)) continue
            seen.add(k)
            merged.push(a)
          }
          if (merged.length > 0) setSavedArts(merged)

          // If backend is missing items, backfill from localStorage so mobile can see them.
          // Cap sync to avoid huge uploads.
          const apiKeys = new Set(apiArts.map((a) => artSyncKey(a)))
          const missing = localArts.filter((a) => a?.image && a?.prompt && !apiKeys.has(artSyncKey(a))).slice(0, 25)
          if (missing.length > 0) {
            console.log(`Syncing ${missing.length} local gallery items to backend...`)
            for (const a of missing) {
              try {
                await galleryApi.save(a.image, a.prompt, a.style || 'realistic')
              } catch (syncErr) {
                console.warn('Gallery sync failed for one item:', syncErr)
              }
            }
            // Refresh from backend after sync
            try {
              const refreshed = await galleryApi.list()
              if (Array.isArray(refreshed?.arts)) {
                setSavedArts(refreshed.arts)
              }
            } catch {}
          }
          return
        } catch (apiError) {
          console.warn('API load failed:', apiError)
        }

        // Fallback to localStorage (legacy)
        if (localArts.length > 0) {
          setSavedArts(localArts)
          return
        }
        
        // If both are empty, set empty array
        console.log('No saved arts found in localStorage or API')
        setSavedArts([])
      } catch (err) {
        console.error('Failed to load saved arts:', err)
        setSavedArts([])
      }
    }

    loadGallery()
  }, [])

  // Save arts to localStorage whenever savedArts changes
  useEffect(() => {
    // Skip on initial mount (when savedArts is loaded from localStorage)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }
    
    try {
      if (savedArts.length === 0) {
        // Remove the key if gallery is empty
        localStorage.removeItem('voiceCompanion_savedArts')
        console.log('Removed gallery from localStorage (empty)')
        return
      }
      
      const jsonString = JSON.stringify(savedArts)
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024)
      console.log('Saving to localStorage:', savedArts.length, 'items, size:', sizeInMB.toFixed(2), 'MB')
      
      localStorage.setItem('voiceCompanion_savedArts', jsonString)
      console.log('Successfully saved to localStorage')
      
      // Clear any previous storage errors on successful save
      if (error && error.includes('Gallery storage')) {
        setError(null)
      }
    } catch (err: any) {
      console.error('Failed to save arts to localStorage in useEffect:', err)
      // Only handle quota errors - other errors are likely from handleSaveToGallery
      if (err instanceof DOMException && (err.code === 22 || err.name === 'QuotaExceededError')) {
        console.warn('localStorage quota exceeded in useEffect, removing oldest items')
        const sorted = [...savedArts].sort((a, b) => b.createdAt - a.createdAt)
        const reduced = sorted.slice(0, 10) // Keep only newest 10
        try {
          localStorage.setItem('voiceCompanion_savedArts', JSON.stringify(reduced))
          setSavedArts(reduced)
          // Only show error if we actually had to reduce items
          if (reduced.length < savedArts.length) {
            setError('Gallery storage limit reached. Only the 10 most recent items are kept.')
            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000)
          }
        } catch (e) {
          console.error('Failed to reduce saved arts in useEffect:', e)
          // Don't show error here - let handleSaveToGallery handle it
        }
      } else {
        // Log but don't show error - handleSaveToGallery will handle it
        console.warn('Non-quota localStorage error in useEffect:', err)
      }
    }
  }, [savedArts])

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
    }
  }, [mediaRecorder])

  const startRecording = async () => {
    try {
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser')
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })

      // Determine the best MIME type for the browser
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      }

      // Create MediaRecorder with the best supported format
      const options: MediaRecorderOptions = { mimeType }
      const recorder = new MediaRecorder(stream, options)
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error)
        setError('Recording error occurred. Please try again.')
        setIsRecording(false)
      }

      recorder.onstop = async () => {
        try {
          // Use the MIME type from the recorder
          const finalMimeType = recorder.mimeType || mimeType
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType })
          
          if (audioBlob.size === 0) {
            setError('No audio recorded. Please try again.')
            setLoading(false)
            return
          }

          await processAudioRecording(audioBlob)
        } catch (err: any) {
          console.error('Error processing recording:', err)
          setError('Failed to process recording. Please try again.')
          setLoading(false)
        } finally {
          stream.getTracks().forEach(track => track.stop())
        }
      }

      // Start recording with timeslice to ensure data is available
      recorder.start(1000) // Collect data every second
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

  const processAudioRecording = async (audioBlob: Blob) => {
    setLoading(true)
    setError(null)
    
    try {
      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data recorded')
      }

      // Convert audio blob to base64
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        try {
          const result = reader.result as string
          if (!result) {
            throw new Error('Failed to read audio data')
          }

          // Extract base64 data (remove data URL prefix)
          const base64Audio = result.includes(',') ? result.split(',')[1] : result
          
          if (!base64Audio) {
            throw new Error('Invalid audio data format')
          }

          console.log('Sending audio for transcription, size:', audioBlob.size, 'bytes')
          
          // Transcribe audio to text with English as default language
          const response = await speechToTextApi.transcribe(base64Audio, 'en-US')
          
          // Handle different response formats from backend
          // Backend returns: { transcription: string, languageCode: string, model: string }
          // But type expects: { text: string, language?: string }
          let transcribedText = ''
          
          if (typeof response === 'string') {
            transcribedText = response
          } else if (response?.transcription) {
            // Backend format: { transcription: string }
            transcribedText = typeof response.transcription === 'string' 
              ? response.transcription 
              : String(response.transcription)
          } else if (response?.text) {
            // Expected format: { text: string }
            transcribedText = response.text
          } else if (response?.data) {
            // Nested format
            if (response.data.transcription) {
              transcribedText = String(response.data.transcription)
            } else if (response.data.text) {
              transcribedText = String(response.data.text)
            }
          }
          
          if (transcribedText && transcribedText.trim()) {
            setPrompt(transcribedText.trim())
            console.log('Transcription successful:', transcribedText.trim())
          } else {
            console.error('Unexpected transcription response format:', response)
            setError('No transcription received. Please try speaking more clearly or type your description.')
          }
        } catch (err: any) {
          console.error('Speech-to-text error:', err)
          let errorMessage = 'Failed to transcribe audio.'
          
          if (err.response?.data?.error) {
            errorMessage = err.response.data.error
          } else if (err.message) {
            errorMessage = err.message
          }
          
          setError(`${errorMessage} Please try typing your description.`)
        } finally {
          setLoading(false)
        }
      }
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        setError('Failed to process audio recording. Please try again.')
        setLoading(false)
      }
      
      reader.readAsDataURL(audioBlob)
    } catch (err: any) {
      console.error('Error processing audio:', err)
      setError(err.message || 'Failed to process audio recording.')
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your art.')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedImage(null)

    try {
      const result = await imageGenerationApi.generate(prompt, style)
      
      let imageUrl = null
      if (result.image) {
        imageUrl = result.image
      } else if (result.imageUrl) {
        imageUrl = result.imageUrl
      } else if (result.imageData) {
        imageUrl = `data:image/png;base64,${result.imageData}`
      } else {
        setError(result.message || 'Image generation service is temporarily unavailable.')
        return
      }
      
      setGeneratedImage(imageUrl)
      setCurrentPrompt(prompt)
      setCurrentStyle(style)
    } catch (err: any) {
      console.error('Image generation error:', err)
      
      let errorMessage = 'Failed to generate image'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
        if (err.response.data.details) {
          errorMessage += `\n\n${err.response.data.details}`
        }
        if (err.response.data.suggestion) {
          errorMessage += `\n\n${err.response.data.suggestion}`
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `voice-to-art-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper function to compress image if needed
  const compressImage = (imageData: string, maxSizeKB: number = 500): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions to reduce size
        const maxDimension = 1024
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // Try different quality levels to get under maxSizeKB
          let quality = 0.9
          let compressed = canvas.toDataURL('image/jpeg', quality)
          
          // If still too large, reduce quality further
          while (compressed.length > maxSizeKB * 1024 && quality > 0.3) {
            quality -= 0.1
            compressed = canvas.toDataURL('image/jpeg', quality)
          }
          
          resolve(compressed)
        } else {
          resolve(imageData) // Fallback to original
        }
      }
      img.onerror = () => resolve(imageData) // Fallback to original
      img.src = imageData
    })
  }

  const handleSaveToGallery = async () => {
    if (!generatedImage || !currentPrompt) {
      console.warn('Cannot save: missing image or prompt', { generatedImage: !!generatedImage, currentPrompt: !!currentPrompt })
      return
    }

    setSaving(true)
    // Clear any previous errors before attempting to save
    setError(null)
    try {
      // Compress image to reduce storage size (max 500KB per image)
      const compressedImage = await compressImage(generatedImage, 500)
      const imageSizeKB = compressedImage.length / 1024
      console.log('Image size after compression:', imageSizeKB.toFixed(2), 'KB')

      const newArt: SavedArt = {
        id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        image: compressedImage,
        prompt: currentPrompt,
        style: currentStyle,
        createdAt: Date.now(),
      }

      console.log('Saving art to gallery:', {
        id: newArt.id,
        prompt: newArt.prompt,
        style: newArt.style,
        imageSize: imageSizeKB.toFixed(2) + ' KB',
      })

      // Try to save to backend API (optional - falls back to localStorage)
      try {
        await galleryApi.save(compressedImage, currentPrompt, currentStyle)
        console.log('Art saved to backend API')
      } catch (apiError) {
        console.warn('Backend API save failed, using localStorage:', apiError)
        // Continue with localStorage save
      }

      // Update state first (this will trigger useEffect to save)
      const updatedArts = [newArt, ...savedArts]
      
      // Also save directly to localStorage immediately to ensure persistence
      try {
        const jsonString = JSON.stringify(updatedArts)
        const totalSizeMB = new Blob([jsonString]).size / (1024 * 1024)
        
        console.log('Attempting to save to localStorage:', updatedArts.length, 'items, total size:', totalSizeMB.toFixed(2), 'MB')
        
        // Check if we're approaching the limit (most browsers have ~5-10MB limit)
        let artsToSave = updatedArts
        if (totalSizeMB > 4) {
          console.warn('Approaching localStorage limit, removing oldest items')
          // Keep only newest 15 items to stay under limit
          const sorted = [...updatedArts].sort((a, b) => b.createdAt - a.createdAt)
          artsToSave = sorted.slice(0, 15)
          setSuccessMessage('Art saved! (Oldest items removed to free space)')
        } else {
          setSuccessMessage('Art saved to gallery successfully!')
        }
        
        // Save to localStorage
        localStorage.setItem('voiceCompanion_savedArts', JSON.stringify(artsToSave))
        
        // Update state with the saved arts (may be reduced if over limit)
        setSavedArts(artsToSave)
        
        // Verify the save worked
        const verify = localStorage.getItem('voiceCompanion_savedArts')
        if (verify) {
          const verified = JSON.parse(verify)
          console.log('Verified save: localStorage contains', verified.length, 'items')
        } else {
          console.error('Save verification failed: localStorage is empty after save')
        }
        
        console.log('Successfully saved to localStorage')
      } catch (storageError: any) {
        console.error('localStorage save error:', storageError)
        
        // Only show error for actual quota issues
        if (storageError instanceof DOMException && (storageError.code === 22 || storageError.name === 'QuotaExceededError')) {
          // Try to reduce items and save again
          try {
            const sorted = [...savedArts].sort((a, b) => b.createdAt - a.createdAt)
            const reduced = sorted.slice(0, 10) // Keep only newest 10
            const withNew = [newArt, ...reduced]
            localStorage.setItem('voiceCompanion_savedArts', JSON.stringify(withNew))
            setSavedArts(withNew)
            setSuccessMessage('Art saved! (Some older items were removed to free space)')
            
            // Verify
            const verifyAfterReduction = localStorage.getItem('voiceCompanion_savedArts')
            if (verifyAfterReduction) {
              console.log('Verified save after reduction: localStorage contains', JSON.parse(verifyAfterReduction).length, 'items')
            }
          } catch (e) {
            console.error('Failed to save even after reducing:', e)
            setError('Gallery storage is full. Please delete some items manually and try again.')
            setTimeout(() => setError(null), 5000)
            setSaving(false)
            return
          }
        } else {
          // For other errors, still try to update state
          console.warn('Non-quota localStorage error:', storageError)
          setSavedArts(updatedArts)
          setSuccessMessage('Art saved to gallery!')
          // Log warning but don't show error to user for non-quota issues
        }
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err: any) {
      console.error('Failed to save art:', err)
      setError('Failed to save art to gallery. Please try again.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (art: SavedArt, e: React.MouseEvent) => {
    e.stopPropagation()
    setArtToDelete(art)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!artToDelete) return

    try {
      // Try to delete from backend API
      try {
        await galleryApi.delete(artToDelete.id)
        console.log('Art deleted from backend API')
      } catch (apiError) {
        console.warn('Backend API delete failed, using localStorage:', apiError)
        // Continue with localStorage delete
      }

      // Update state (this will trigger useEffect to save to localStorage)
      const updatedArts = savedArts.filter(art => art.id !== artToDelete.id)
      setSavedArts(updatedArts)

      // Also directly save to localStorage to ensure persistence
      try {
        if (updatedArts.length === 0) {
          // Remove the key if gallery is empty
          localStorage.removeItem('voiceCompanion_savedArts')
        } else {
          localStorage.setItem('voiceCompanion_savedArts', JSON.stringify(updatedArts))
        }
        console.log('Deleted art and saved to localStorage:', updatedArts.length, 'items remaining')
      } catch (err) {
        console.error('Failed to save to localStorage after delete:', err)
      }

      setSuccessMessage('Art deleted from gallery successfully!')
      setShowDeleteModal(false)
      setArtToDelete(null)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err: any) {
      console.error('Failed to delete art:', err)
      setError('Failed to delete art. Please try again.')
      setShowDeleteModal(false)
      setArtToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setArtToDelete(null)
  }

  const handleLoadArt = (art: SavedArt) => {
    setGeneratedImage(art.image)
    setCurrentPrompt(art.prompt)
    setCurrentStyle(art.style)
    setPrompt(art.prompt)
    setStyle(art.style)
  }

  const handleClearText = () => {
    setPrompt('')
    setError(null)
  }

  const styles = ['realistic', 'artistic', 'cartoon', 'abstract', 'photographic']

  return (
    <div className="voice-to-art">
      <div className="voice-to-art-header">
        <div className="header-content">
          <PaletteIcon size={64} className="animated" />
          <div className="header-text">
            <div className="header-title-row">
              <h1 className="header-title">Voice to Art</h1>
              <FeatureInfoIcon
                title="Voice to Art"
                description="Transform your voice descriptions into stunning AI-generated artwork. Simply describe what you want to see, and our AI will create beautiful images for you."
                howItWorks={[
                  'Speak your description or type it in the text box',
                  'Voice input uses speech recognition to convert your words to text',
                  'Choose an art style (realistic, artistic, cartoon, abstract, or photographic)',
                  'Click "Create Art" to generate your image using Google Imagen AI',
                  'View your generated artwork and save it to your gallery',
                  'Access your saved art anytime from the "My Gallery" tab'
                ]}
                features={[
                  'Voice input support for hands-free creation',
                  'Multiple art styles to choose from',
                  'AI-powered image generation using Google Imagen',
                  'ElevenLabs integration for natural voice interactions',
                  'Personal gallery to save and manage your art',
                  'Download and share your creations',
                  'Accessible voice mode for all users'
                ]}
              />
            </div>
            <p className="header-subtitle">Describe what you want to see, and we'll create it</p>
          </div>
        </div>
      </div>
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Art
        </button>
        <button
          className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          My Gallery ({savedArts.length})
        </button>
      </div>

      {activeTab === 'create' && (
        <>
          <div className="input-section">
        <div className="input-header">
          <label className="label">Describe your art:</label>
          <div className="input-actions">
            <button
              className={`voice-button ${isRecording ? 'active' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              {isRecording ? '⏹ Stop Recording' : '🎤 Voice Input'}
            </button>
            {prompt && (
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
          placeholder="e.g., A serene sunset over mountains with purple and orange skies"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-text">Recording... Speak your description</span>
          </div>
        )}
      </div>

      <div className="style-section">
        <label className="label">Style:</label>
        <div className="style-buttons">
          {styles.map((s) => (
            <button
              key={s}
              className={`style-button ${style === s ? 'active' : ''}`}
              onClick={() => setStyle(s)}
              disabled={loading}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button
        className={`generate-button ${loading ? 'disabled' : ''}`}
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
      >
        {loading ? (
          <span className="loading-spinner">⏳ Generating...</span>
        ) : (
          '✨ Create Art'
        )}
      </button>

      {error && (
        <div className="error-message" role="alert">
          {error.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="alert">
          {successMessage}
        </div>
      )}

      {generatedImage && (
        <div className="image-section">
          <div className="image-header">
            <h3 className="result-title">
              Created Art: {currentPrompt && (
                <span className="art-prompt">{currentPrompt}</span>
              )} {currentStyle && (
                <span className="art-style">({currentStyle})</span>
              )}
            </h3>
            <div className="image-actions">
              <button 
                className="save-button" 
                onClick={handleSaveToGallery}
                disabled={saving || !currentPrompt}
                title="Save to gallery"
              >
                {saving ? '💾 Saving...' : '💾 Save to Gallery'}
              </button>
              <button className="download-button" onClick={handleDownload} title="Download image">
                ⬇️ Download
              </button>
            </div>
          </div>
          <img
            src={generatedImage}
            alt="Generated art"
            className="generated-image"
            onError={(e) => {
              console.error('Image load error:', e)
              setError('Failed to load generated image. Please try again.')
            }}
          />
        </div>
      )}

      <div className="info-box">
        <p className="info-text">
          💡 Tip: Be descriptive! Include details about colors, mood, composition, and style for best results.
        </p>
      </div>
        </>
      )}

      {activeTab === 'gallery' && (
        <div className="gallery-section">
          {savedArts.length > 0 ? (
            <>
              <h3 className="gallery-title">My Gallery ({savedArts.length})</h3>
              <div className="gallery-grid">
                {savedArts.map((art) => {
                  if (!art || !art.image) {
                    console.warn('Invalid art item:', art)
                    return null
                  }
                  return (
                    <div key={art.id} className="gallery-item">
                      <img
                        src={art.image}
                        alt={art.prompt || 'Saved art'}
                        className="gallery-image"
                        onClick={() => {
                          handleLoadArt(art)
                          setActiveTab('create')
                        }}
                        onError={(e) => {
                          console.error('Failed to load gallery image:', art.id, e)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div className="gallery-item-info">
                        <p className="gallery-prompt" title={art.prompt || ''}>
                          {art.prompt && art.prompt.length > 50 ? `${art.prompt.substring(0, 50)}...` : (art.prompt || 'Untitled')}
                        </p>
                        <p className="gallery-meta">
                          {art.style || 'unknown'} • {art.createdAt ? new Date(art.createdAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                      <button
                        className="gallery-delete-button"
                        onClick={(e) => handleDeleteClick(art, e)}
                        title="Delete from gallery"
                      >
                        🗑️
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="empty-gallery">
              <p className="empty-gallery-text">No saved art yet.</p>
              <p className="empty-gallery-hint">Create some art and save it to your gallery!</p>
              <button
                className="create-art-button"
                onClick={() => setActiveTab('create')}
              >
                Create Art
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && artToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Art?</h3>
            <p className="modal-message">
              Are you sure you want to delete this art? This action cannot be undone.
            </p>
            {artToDelete.prompt && (
              <p className="modal-prompt">
                "{artToDelete.prompt.length > 60 ? `${artToDelete.prompt.substring(0, 60)}...` : artToDelete.prompt}"
              </p>
            )}
            <div className="modal-actions">
              <button
                className="modal-button modal-button-cancel"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="modal-button modal-button-delete"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceToArt

