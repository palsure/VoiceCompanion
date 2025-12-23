import { useState, useEffect } from 'react'
import VoiceInterface from './components/VoiceInterface'
import CameraCapture from './components/CameraCapture'
import ConversationView from './components/ConversationView'
import AccessibilityControls from './components/AccessibilityControls'
import { useVoiceConversation } from './hooks/useVoiceConversation'
import './App.css'

function App() {
  const {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    currentImage,
    setCurrentImage,
    speakResponse,
  } = useVoiceConversation()

  const [cameraActive, setCameraActive] = useState(false)

  // Automatically speak assistant responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant' && !isSpeaking) {
      speakResponse(lastMessage.content)
    }
  }, [messages, isSpeaking, speakResponse])

  return (
    <div className="app">
      <header className="app-header">
        <h1>VoiceLens</h1>
        <p className="subtitle">Your intelligent accessibility assistant</p>
      </header>
      
      <AccessibilityControls />
      
      <main className="app-main">
        <div className="main-content">
          <ConversationView messages={messages} />
          
          <div className="interaction-section">
            <CameraCapture 
              active={cameraActive}
              onToggle={(active) => setCameraActive(active)}
              onImageCapture={setCurrentImage}
            />
            
            <VoiceInterface
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              currentImage={currentImage}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

