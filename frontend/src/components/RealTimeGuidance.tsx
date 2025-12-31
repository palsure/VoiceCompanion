import { useState, useEffect, useRef } from 'react'
import { guidanceApi, textToSpeechApi } from '../services/api'
import CameraCapture from './CameraCapture'
import FeatureInfoIcon from './FeatureInfoIcon'
import './RealTimeGuidance.css'

function animateStreetNavigation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  let frameId = 0
  let t = 0

  const draw = () => {
    t += 1
    ctx.clearRect(0, 0, width, height)

    // Background sky/ground
    ctx.fillStyle = '#0b1020'
    ctx.fillRect(0, 0, width, height)

    // Road
    const roadTop = height * 0.35
    ctx.fillStyle = '#141a2d'
    ctx.beginPath()
    ctx.moveTo(width * 0.35, roadTop)
    ctx.lineTo(width * 0.65, roadTop)
    ctx.lineTo(width * 0.92, height)
    ctx.lineTo(width * 0.08, height)
    ctx.closePath()
    ctx.fill()

    // Lane lines
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.lineWidth = Math.max(2, width * 0.003)
    ctx.setLineDash([10, 14])
    ctx.beginPath()
    ctx.moveTo(width * 0.5, roadTop)
    ctx.lineTo(width * 0.5, height)
    ctx.stroke()
    ctx.setLineDash([])

    // Moving "navigation marker"
    const markerY = height - ((t % 140) / 140) * (height - roadTop)
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(width * 0.5, markerY, Math.max(6, width * 0.012), 0, Math.PI * 2)
    ctx.fill()

    // Simple hazard pulse near top (to mimic step changes)
    const pulse = (Math.sin(t / 12) + 1) / 2
    ctx.fillStyle = `rgba(245, 158, 11, ${0.15 + pulse * 0.25})`
    ctx.fillRect(width * 0.12, roadTop - 26, width * 0.76, 10)

    frameId = window.requestAnimationFrame(draw)
  }

  frameId = window.requestAnimationFrame(draw)
  return () => window.cancelAnimationFrame(frameId)
}

// Navigation steps with video simulation
const NAVIGATION_STEPS = [
  {
    step: 1,
    title: 'Starting Path',
    description: 'Clear corridor ahead of you. Begin walking forward.',
    navigation: 'Continue straight ahead. The path is clear.',
    hazards: [],
    duration: 3000, // 3 seconds
  },
  {
    step: 2,
    title: 'Approaching Door',
    description: 'A door is approaching on your right side.',
    navigation: 'Continue forward. Door on your right - no action needed.',
    hazards: [],
    duration: 4000, // 4 seconds
  },
  {
    step: 3,
    title: 'Warning: Stairs Ahead',
    description: 'WARNING: Stairs detected ahead in 5 steps.',
    navigation: 'Stop and proceed with caution. Stairs ahead in 5 steps.',
    hazards: ['Stairs ahead in 5 steps'],
    duration: 5000, // 5 seconds
  },
  {
    step: 4,
    title: 'After Stairs',
    description: 'Clear path after stairs. Continue forward safely.',
    navigation: 'Clear path ahead. Continue forward.',
    hazards: [],
    duration: 4000, // 4 seconds
  },
  {
    step: 5,
    title: 'Destination Reached',
    description: 'Destination reached. Exit door on your left.',
    navigation: 'You have reached your destination. Exit door is on your left.',
    hazards: [],
    duration: 3000, // 3 seconds
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const simulationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const simulationLoopRef = useRef<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

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

  // Initialize canvas animation as primary (since video URLs may not work)
  useEffect(() => {
    if (simulationActive) {
      const canvas = document.getElementById('navigation-canvas') as HTMLCanvasElement
      const video = videoRef.current
      
      if (canvas && video) {
        // Set canvas size
        const container = video.parentElement
        if (container) {
          const rect = container.getBoundingClientRect()
          canvas.width = rect.width || 800
          canvas.height = rect.height || 450
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Show canvas, hide video
            canvas.style.display = 'block'
            video.style.display = 'none'
            animateStreetNavigation(ctx, canvas.width, canvas.height)
          }
        }
      }
      
      return () => {
        if (canvas) {
          canvas.style.display = 'none'
        }
        if (video) {
          video.style.display = 'block'
        }
      }
    }
  }, [simulationActive])

  // Simulation mode: cycle through navigation steps with video
  useEffect(() => {
    if (simulationActive) {
      setCurrentStepIndex(0)
      setPreviousContext('')
      setIsSimulationRunning(true)
      simulationLoopRef.current = true
      setSimulationProgress(0)
      
      // Start simulation cycle
      const runSimulation = async () => {
        while (simulationLoopRef.current && simulationActive) {
          for (let i = 0; i < NAVIGATION_STEPS.length; i++) {
            if (!simulationLoopRef.current || !simulationActive) break
            
            setCurrentStepIndex(i)
            const step = NAVIGATION_STEPS[i]
            
            // Update guidance with step information
            const stepGuidance = {
              description: step.description,
              navigation: step.navigation,
              hazards: step.hazards,
              objects: []
            }
            setGuidance(stepGuidance)
            setPreviousContext(step.description)
            
            // Generate and play voice guidance
            await playVoiceGuidance(stepGuidance)
            
            // Animate progress bar
            const stepDuration = step.duration
            const progressInterval = 50
            const progressSteps = stepDuration / progressInterval
            
            for (let p = 0; p <= progressSteps && simulationLoopRef.current; p++) {
              setSimulationProgress((i * 100 + (p / progressSteps) * (100 / NAVIGATION_STEPS.length)))
              await new Promise(resolve => setTimeout(resolve, progressInterval))
            }
          }
          
          // Small pause before looping
          if (simulationLoopRef.current && simulationActive) {
            setSimulationProgress(0)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      runSimulation()
    } else {
      // Stop simulation
      simulationLoopRef.current = false
      setIsSimulationRunning(false)
      setCurrentStepIndex(0)
      setSimulationProgress(0)
      
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
      
      // Stop video if playing
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }

    return () => {
      simulationLoopRef.current = false
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current = null
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
    setCurrentStepIndex(0)
    setSimulationProgress(0)
    setGuidance(null)
    setPreviousContext('')
    
    // Stop any playing audio immediately
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    
    // Stop video
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div className="real-time-guidance">
      <div className="section-header">
        <div className="header-content">
          <div className="header-icon">🧭</div>
          <div className="header-text">
            <div className="header-title-row">
              <h1 className="header-title">Real-Time Guidance</h1>
              <FeatureInfoIcon
                title="Real-Time Guidance"
                description="Get continuous voice guidance for safe navigation using your camera. Perfect for visually impaired users navigating unfamiliar environments."
                howItWorks={[
                  'Enable your camera or start a simulation to begin',
                  'The camera continuously captures and analyzes the scene',
                  'AI identifies obstacles, hazards, and navigation cues using Google Cloud Gemini',
                  'Navigation instructions are converted to speech using ElevenLabs text-to-speech',
                  'Hear natural, human-like descriptions of the scene, navigation directions, and hazard warnings',
                  'Simulation mode demonstrates the feature with sample scenarios'
                ]}
                features={[
                  'Real-time camera stream analysis',
                  'ElevenLabs-powered voice guidance with natural speech synthesis',
                  'Continuous voice narration of surroundings',
                  'Hazard detection and warnings',
                  'Navigation instructions',
                  'Simulation mode for demonstration',
                  'Accessible for visually impaired users'
                ]}
              />
            </div>
            <p className="header-subtitle">Continuous voice guidance for safe navigation based on camera stream</p>
          </div>
        </div>
      </div>

      <div className="guidance-controls">
        <button
          className={`simulation-button ${simulationActive ? 'active' : ''}`}
          onClick={simulationActive ? handleStopSimulation : handleStartSimulation}
        >
          {simulationActive ? '⏹ Stop Simulation' : '🎬 Start Simulation'}
        </button>
        {!simulationActive && (
          <button
            className="camera-toggle"
            onClick={() => {
              setCameraActive(!cameraActive)
            }}
            aria-label={cameraActive ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraActive ? '📷 Stop Camera' : '📷 Start Camera'}
          </button>
        )}
      </div>

      {!simulationActive && (
        <CameraCapture
          active={cameraActive && !simulationActive}
          onToggle={(active) => {
            if (active) {
              setSimulationActive(false)
            }
            setCameraActive(active)
          }}
          onImageCapture={handleImageCapture}
          showUploadButton={false}
          hideToggleButton={true}
        />
      )}

      {simulationActive && (
        <div className="simulation-preview">
          <div className="simulation-frame">
            <div className="video-container">
              <div className="video-wrapper">
                <video
                  ref={videoRef}
                  className="simulation-video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                >
                  <source src="https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4" type="video/mp4" />
                  <source src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <canvas id="navigation-canvas" className="navigation-canvas" style={{ display: 'none' }}></canvas>
                <div className="simulation-overlay">
                  <span className="simulation-label">🎬 Simulation Mode</span>
                  <span className="simulation-step-count">Step {currentStepIndex + 1} of {NAVIGATION_STEPS.length}</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {guidance && (
            <div className="simulation-voice-description">
              <div className="voice-description-header">
                <span className="voice-icon">🔊</span>
                <h3>Navigation Guidance</h3>
                {NAVIGATION_STEPS[currentStepIndex] && (
                  <span className="step-title">{NAVIGATION_STEPS[currentStepIndex].title}</span>
                )}
              </div>
              <div className="voice-description-content">
                <div className="step-indicator">
                  <span className="step-number">Step {currentStepIndex + 1}</span>
                  <span className="step-total">of {NAVIGATION_STEPS.length}</span>
                </div>
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

