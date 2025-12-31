import { useEffect } from 'react'
import { useCamera } from '../hooks/useCamera'
import './CameraCapture.css'

interface CameraCaptureProps {
  active: boolean
  onToggle: (active: boolean) => void
  onImageCapture?: (imageData: string | null) => void
  onOpenGallery?: () => void
  showUploadButton?: boolean
  hideToggleButton?: boolean
}

const CameraCapture = ({ active, onToggle, onImageCapture, onOpenGallery, showUploadButton = true, hideToggleButton = false }: CameraCaptureProps) => {
  const { videoRef, isActive, error, startCamera, stopCamera, captureImage } = useCamera()

  useEffect(() => {
    if (active && !isActive) {
      startCamera()
    } else if (!active && isActive) {
      stopCamera()
    }
  }, [active, isActive, startCamera, stopCamera])

  useEffect(() => {
    onToggle(isActive)
  }, [isActive, onToggle])

  const handleCapture = () => {
    const imageData = captureImage()
    if (imageData && onImageCapture) {
      onImageCapture(imageData)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onImageCapture) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        onImageCapture(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="camera-capture">
      <div className="camera-controls">
        {onOpenGallery && (
          <button
            className="gallery-button"
            onClick={onOpenGallery}
            aria-label="Open from gallery"
          >
            🖼️ Open from Gallery
          </button>
        )}

        {showUploadButton && (
          <label className="upload-button">
            📁 Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        )}

        {!hideToggleButton && (
          <button
            className="camera-toggle"
            onClick={() => {
              if (isActive) {
                stopCamera()
              } else {
                startCamera()
              }
            }}
            aria-label={isActive ? 'Turn off camera' : 'Turn on camera'}
          >
            {isActive ? '📷 Stop Camera' : '📷 Start Camera'}
          </button>
        )}
      </div>
      
      {isActive && (
        <div className="capture-control">
          <button
            className="capture-button"
            onClick={handleCapture}
            aria-label="Capture image"
          >
            📸 Capture Image
          </button>
        </div>
      )}

      {error && (
        <div className="camera-error" role="alert">
          {error}
        </div>
      )}

      {isActive && (
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
            aria-label="Camera preview"
          />
        </div>
      )}
    </div>
  )
}

export default CameraCapture

