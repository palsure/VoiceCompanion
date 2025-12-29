import { useState, useEffect } from 'react'
import { useElevenLabsAgent } from '../hooks/useElevenLabsAgent'
import './VoiceConversation.css'

interface VoiceConversationProps {
  scenario: string | null
  onFeedback: (feedback: any) => void
  mode?: 'accessibility' | 'learning'
  capturedImage?: string | null
}

const VoiceConversation = ({ scenario, onFeedback, mode = 'learning', capturedImage }: VoiceConversationProps) => {
  const [isActive, setIsActive] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  
  const { startConversation, stopConversation, isListening, isSpeaking } = useElevenLabsAgent({
    scenario,
    onFeedback,
    mode,
    capturedImage,
    onMessage: (message: { role: 'user' | 'assistant'; content: string }) => {
      setConversationMessages(prev => [...prev, message])
    },
  })

  const handleToggle = () => {
    if (isActive) {
      stopConversation()
      setIsActive(false)
    } else {
      if (!scenario) {
        alert('Please select a scenario first!')
        return
      }
      startConversation()
      setIsActive(true)
      setConversationMessages([])
    }
  }

  useEffect(() => {
    if (!isActive) {
      setConversationMessages([])
    }
  }, [isActive])

  return (
    <div className="voice-conversation">
      <div className="conversation-status">
        {isListening && <span className="status-badge listening">🎤 Listening</span>}
        {isSpeaking && <span className="status-badge speaking">🔊 Speaking</span>}
        {scenario && <span className="status-badge scenario">📚 {scenario}</span>}
      </div>

      <button
        className={`conversation-button ${isActive ? 'active' : ''}`}
        onClick={handleToggle}
        disabled={isListening || isSpeaking}
      >
        {isActive ? '⏹ Stop Conversation' : '▶ Start Conversation'}
      </button>

      <div className="conversation-hint">
        {mode === 'learning' ? (
          isActive
            ? 'Speak naturally in your target language. VoiceCompanion will respond and provide feedback.'
            : 'Select a scenario and click to start practicing your language skills!'
        ) : (
          isActive
            ? 'Ask questions about what you see, or request help with daily tasks.'
            : 'Enable camera and start conversation to get visual assistance!'
        )}
      </div>

      {conversationMessages.length > 0 && (
        <div className="conversation-history">
          <h3>Conversation</h3>
          <div className="messages-list">
            {conversationMessages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <span className="message-role">{msg.role === 'user' ? 'You' : 'VoiceBuddy'}</span>
                <span className="message-content">{msg.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceConversation

