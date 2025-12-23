import { useEffect } from 'react'
import { useCamera } from '../hooks/useCamera'
import './CameraCapture.css'

interface CameraCaptureProps {
  active: boolean
  onToggle: (active: boolean) => void
  onImageCapture?: (imageData: string | null) => void
}

const CameraCapture = ({ active, onToggle, onImageCapture }: CameraCaptureProps) => {
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

  return (
    <div className="camera-capture">
      <div className="camera-controls">
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
        
        {isActive && (
          <button
            className="capture-button"
            onClick={handleCapture}
            aria-label="Capture image"
          >
            📸 Capture
          </button>
        )}
      </div>

      {error && (
        <div className="camera-error" role="alert">
          {error}
        </div>
      )}

      <div className="camera-preview">
        {isActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
            aria-label="Camera preview"
          />
        ) : (
          <div className="camera-placeholder">
            <p>Camera is off</p>
            <p className="placeholder-hint">Enable camera to capture images for visual assistance</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CameraCapture

