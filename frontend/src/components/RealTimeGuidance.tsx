import { useState, useEffect, useRef } from 'react'
import { guidanceApi, textToSpeechApi } from '../services/api'
import CameraCapture from './CameraCapture'
import './RealTimeGuidance.css'

// Sample navigation scenario frames (base64 encoded placeholder images)
// In a real implementation, these would be actual sample images
const SAMPLE_FRAMES = [
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U3RhcnRpbmcgcGF0aDogQ2xlYXIgY29ycmlkb3IgaGVhZCBvZiB5b3U8L3RleHQ+PC9zdmc+',
    description: 'Starting path: Clear corridor ahead of you'
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QXBwcm9hY2hpbmcgYSBkb29yIG9uIHlvdXIgcmlnaHQ8L3RleHQ+PC9zdmc+',
    description: 'Approaching a door on your right'
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmY0NDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+V0FSTklORzogU3RhaXJzIGFoZWFkIGluIDUgc3RlcHM8L3RleHQ+PC9zdmc+',
    description: 'WARNING: Stairs ahead in 5 steps'
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2xlYXIgcGF0aCBhZnRlciBzdGFpcnM6IENvbnRpbnVlIGZvcndhcmQ8L3RleHQ+PC9zdmc+',
    description: 'Clear path after stairs: Continue forward'
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RGVzdGluYXRpb24gcmVhY2hlZDogRXhpdCBkb29yIG9uIHlvdXIgbGVmdDwvL3RleHQ+PC9zdmc+',
    description: 'Destination reached: Exit door on your left'
  }
]

const RealTimeGuidance = () => {
  const [cameraActive, setCameraActive] = useState(false)
  const [simulationActive, setSimulationActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [guidance, setGuidance] = useState<{
    description: string
    hazards?: string[]
    navigation?: string
    objects?: string[]
  } | null>(null)
  const [previousContext, setPreviousContext] = useState<string>('')
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const simulationRef = useRef<NodeJS.Timeout | null>(null)
  const simulationLoopRef = useRef<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (cameraActive && capturedImage && !simulationActive) {
      // Start continuous guidance updates every 3 seconds
      intervalRef.current = setInterval(() => {
        captureAndAnalyze()
      }, 3000)
      
      // Initial capture
      setTimeout(() => captureAndAnalyze(), 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [cameraActive, capturedImage, simulationActive])

  // Simulation mode: cycle through sample frames
  useEffect(() => {
    if (simulationActive) {
      setCurrentFrameIndex(0)
      setPreviousContext('')
      setIsSimulationRunning(true)
      simulationLoopRef.current = true
      
      // Start simulation cycle
      const runSimulation = async () => {
        while (simulationLoopRef.current && simulationActive) {
          for (let i = 0; i < SAMPLE_FRAMES.length; i++) {
            if (!simulationLoopRef.current || !simulationActive) break
            
            setCurrentFrameIndex(i)
            const frame = SAMPLE_FRAMES[i]
            setCapturedImage(frame.image)
            
            // Analyze frame and generate guidance
            await analyzeSimulationFrame(frame.image, i)
            
            // Wait before next frame (4 seconds per frame)
            for (let wait = 0; wait < 40 && simulationLoopRef.current; wait++) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          }
          
          // Small pause before looping
          if (simulationLoopRef.current && simulationActive) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      runSimulation()
    } else {
      // Stop simulation
      simulationLoopRef.current = false
      setIsSimulationRunning(false)
      setCurrentFrameIndex(0)
      
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }

    return () => {
      simulationLoopRef.current = false
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [simulationActive])

  const handleImageCapture = (imageData: string | null) => {
    setCapturedImage(imageData)
    if (imageData && cameraActive) {
      captureAndAnalyze()
    }
  }

  const captureAndAnalyze = async () => {
    if (loading || !capturedImage) return

    try {
      setLoading(true)
      const result = await guidanceApi.realtime(capturedImage, previousContext)
      
      setGuidance(result)
      if (result.description) {
        setPreviousContext(result.description)
      }
      
      // Generate and play voice guidance
      await playVoiceGuidance(result)
    } catch (error: any) {
      console.error('Guidance error:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeSimulationFrame = async (imageData: string, frameIndex: number) => {
    try {
      setLoading(true)
      const result = await guidanceApi.realtime(imageData, previousContext)
      
      setGuidance(result)
      if (result.description) {
        setPreviousContext(result.description)
      }
      
      // Generate and play voice guidance
      await playVoiceGuidance(result)
    } catch (error: any) {
      console.error('Simulation guidance error:', error)
      // Fallback to sample description
      const sampleFrame = SAMPLE_FRAMES[frameIndex]
      const fallbackGuidance = {
        description: sampleFrame.description,
        hazards: frameIndex === 2 ? ['Stairs ahead'] : [],
        navigation: frameIndex === 2 ? 'Stop and proceed with caution. Stairs detected ahead.' : 'Continue forward safely.',
        objects: []
      }
      setGuidance(fallbackGuidance)
      await playVoiceGuidance(fallbackGuidance)
    } finally {
      setLoading(false)
    }
  }

  const playVoiceGuidance = async (guidanceData: {
    description: string
    hazards?: string[]
    navigation?: string
    objects?: string[]
  }) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Build navigation message
      let message = guidanceData.description || ''
      
      if (guidanceData.navigation) {
        message += ' ' + guidanceData.navigation
      }
      
      if (guidanceData.hazards && guidanceData.hazards.length > 0) {
        message = 'WARNING: ' + guidanceData.hazards.join('. ') + '. ' + message
      }

      // Generate speech
      const audioBlob = await textToSpeechApi.generate(message)
      const audioUrl = URL.createObjectURL(audioBlob)

      // Play audio
      const audio = new Audio(audioUrl)
      audio.volume = 1.0
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }

      await audio.play()
    } catch (error: any) {
      console.error('Voice guidance error:', error)
      // Continue without voice if TTS fails
    }
  }

  const handleStartSimulation = () => {
    setSimulationActive(true)
    setCameraActive(false)
    setCapturedImage(null)
    setGuidance(null)
    setPreviousContext('')
  }

  const handleStopSimulation = () => {
    // Stop simulation loop
    simulationLoopRef.current = false
    setSimulationActive(false)
    setIsSimulationRunning(false)
    setCurrentFrameIndex(0)
    setGuidance(null)
    setPreviousContext('')
    
    // Stop any playing audio immediately
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
  }

  return (
    <div className="real-time-guidance">
      <div className="section-header">
        <h2>🧭 Real-Time Guidance</h2>
        <p>Continuous voice guidance for safe navigation</p>
      </div>

      <div className="guidance-controls">
        <button
          className={`simulation-button ${simulationActive ? 'active' : ''}`}
          onClick={simulationActive ? handleStopSimulation : handleStartSimulation}
        >
          {simulationActive ? '⏹ Stop Simulation' : '🎬 Start Simulation'}
        </button>
      </div>

      <CameraCapture
        active={cameraActive && !simulationActive}
        onToggle={(active) => {
          if (active) {
            setSimulationActive(false)
          }
          setCameraActive(active)
        }}
        onImageCapture={handleImageCapture}
      />

      {simulationActive && (
        <div className="simulation-preview">
          <div className="simulation-frame">
            <div className="video-container">
              <img 
                src={SAMPLE_FRAMES[currentFrameIndex]?.image || SAMPLE_FRAMES[0].image} 
                alt={`Simulation frame ${currentFrameIndex + 1}`}
                className="simulation-image"
              />
              <div className="simulation-overlay">
                <span className="simulation-label">🎬 Simulation Mode</span>
                <span className="simulation-frame-count">Frame {currentFrameIndex + 1} of {SAMPLE_FRAMES.length}</span>
              </div>
            </div>
          </div>
          
          {guidance && (
            <div className="simulation-voice-description">
              <div className="voice-description-header">
                <span className="voice-icon">🔊</span>
                <h3>Voice Description</h3>
              </div>
              <div className="voice-description-content">
                <p className="description-text">{guidance.description}</p>
                {guidance.navigation && (
                  <p className="navigation-text">🧭 {guidance.navigation}</p>
                )}
                {guidance.hazards && guidance.hazards.length > 0 && (
                  <div className="hazards-text">
                    <strong>⚠️ Hazards:</strong>
                    <ul>
                      {guidance.hazards.map((hazard, idx) => (
                        <li key={idx}>{hazard}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {(cameraActive || simulationActive) && (
        <div className="guidance-status">
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Analyzing scene...</p>
            </div>
          ) : guidance ? (
            <div className="guidance-content">
              <div className="guidance-section">
                <h3>Scene Description</h3>
                <p className="guidance-text">{guidance.description}</p>
              </div>

              {guidance.hazards && guidance.hazards.length > 0 && (
                <div className="guidance-section hazards">
                  <h3>⚠️ Hazards</h3>
                  <ul>
                    {guidance.hazards.map((hazard, idx) => (
                      <li key={idx}>{hazard}</li>
                    ))}
                  </ul>
                </div>
              )}

              {guidance.navigation && (
                <div className="guidance-section navigation">
                  <h3>🧭 Navigation</h3>
                  <p className="guidance-text">{guidance.navigation}</p>
                </div>
              )}

              {guidance.objects && guidance.objects.length > 0 && (
                <div className="guidance-section objects">
                  <h3>Objects Detected</h3>
                  <div className="objects-list">
                    {guidance.objects.map((obj, idx) => (
                      <span key={idx} className="object-tag">{obj}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="instruction-box">
              <p>Camera is active. Guidance will appear here as the scene is analyzed...</p>
            </div>
          )}
        </div>
      )}

      {!cameraActive && !simulationActive && (
        <div className="instruction-box">
          <p>💡 Enable the camera or start simulation to begin receiving real-time guidance for safe navigation.</p>
        </div>
      )}
    </div>
  )
}

export default RealTimeGuidance

