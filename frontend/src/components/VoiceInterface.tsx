import { useVoiceConversation } from '../hooks/useVoiceConversation'
import './VoiceInterface.css'

interface VoiceInterfaceProps {
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  currentImage: string | null
}

const VoiceInterface = ({ isListening, isSpeaking, isProcessing, currentImage }: VoiceInterfaceProps) => {
  const {
    startListening,
    stopListening,
  } = useVoiceConversation()

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="voice-interface">
      <div className="voice-status">
        {isProcessing && <span className="status-indicator processing">Processing...</span>}
        {isSpeaking && <span className="status-indicator speaking">Speaking...</span>}
        {isListening && <span className="status-indicator listening">Listening...</span>}
        {currentImage && <span className="status-indicator image-ready">📷 Image Ready</span>}
      </div>

      <button
        className={`voice-button ${isListening ? 'active' : ''}`}
        onClick={handleToggleListening}
        disabled={isProcessing || isSpeaking}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        <span className="voice-icon">
          {isListening ? '🛑' : '🎤'}
        </span>
        <span className="voice-text">
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </span>
      </button>

      <p className="voice-hint">
        {isListening 
          ? 'Speak now...' 
          : 'Click the button to start a conversation'}
      </p>
    </div>
  )
}

export default VoiceInterface

