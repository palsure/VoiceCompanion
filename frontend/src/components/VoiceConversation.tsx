import { useState, useEffect, useRef } from 'react'
import { conversationApi, feedbackApi } from '../services/api'
import './VoiceConversation.css'

interface VoiceConversationProps {
  scenario: string | null
  onFeedback: (feedback: any) => void
  mode?: 'accessibility' | 'learning'
  capturedImage?: string | null
  targetLanguage?: string
  difficulty?: string
}

const VoiceConversation = ({ 
  scenario, 
  onFeedback, 
  mode = 'learning', 
  capturedImage,
  targetLanguage = 'spanish',
  difficulty = 'beginner'
}: VoiceConversationProps) => {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [conversationMessages, setConversationMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      
      // Set language based on target
      const langCodes: { [key: string]: string } = {
        spanish: 'es-ES',
        french: 'fr-FR',
        german: 'de-DE',
        italian: 'it-IT',
        portuguese: 'pt-BR',
        japanese: 'ja-JP',
        korean: 'ko-KR',
        mandarin: 'zh-CN',
        arabic: 'ar-SA',
        hindi: 'hi-IN',
      }
      recognitionRef.current.lang = langCodes[targetLanguage] || 'en-US'

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setIsListening(false)
        handleSendMessage(transcript)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [targetLanguage])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    // Add user message
    const userMessage = { role: 'user' as const, content: message }
    setConversationMessages(prev => [...prev, userMessage])
    setTextInput('')
    setIsLoading(true)

    try {
      // Send to backend
      const response = await conversationApi.sendMessage({
        message,
        scenario: scenario || undefined,
        mode,
        imageData: capturedImage || undefined,
      })

      // Add assistant response
      if (response.response) {
        setConversationMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.response 
        }])

        // Try to speak the response (may fail if quota exceeded)
        try {
          await speakText(response.response)
        } catch (e) {
          console.warn('Text-to-speech failed:', e)
        }
      }

      // Get feedback for the user's message
      try {
        const feedbackResult = await feedbackApi.analyze(message)
        if (feedbackResult) {
          onFeedback(feedbackResult)
        }
      } catch (e) {
        console.warn('Feedback analysis failed:', e)
      }

    } catch (error) {
      console.error('Error processing conversation:', error)
      setConversationMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble processing that. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        setIsSpeaking(true)
        
        // Set language for speech synthesis
        const langCodes: { [key: string]: string } = {
          spanish: 'es-ES',
          french: 'fr-FR',
          german: 'de-DE',
          italian: 'it-IT',
          portuguese: 'pt-BR',
          japanese: 'ja-JP',
          korean: 'ko-KR',
          mandarin: 'zh-CN',
          arabic: 'ar-SA',
          hindi: 'hi-IN',
        }
        utterance.lang = langCodes[targetLanguage] || 'en-US'
        
        utterance.onend = () => {
          setIsSpeaking(false)
          resolve()
        }
        utterance.onerror = () => {
          setIsSpeaking(false)
          resolve()
        }
        window.speechSynthesis.speak(utterance)
      } else {
        resolve()
      }
    })
  }

  const handleStartConversation = () => {
    if (!scenario) {
      alert('Please select a scenario first!')
      return
    }
    setIsActive(true)
    setConversationMessages([])
    
    // Add welcome message
    const welcomeMessages: { [key: string]: string } = {
      restaurant: "¡Hola! Welcome to the restaurant. I'll be your waiter today. What would you like to order?",
      travel: "Hello! I see you're looking for directions. Where would you like to go?",
      shopping: "Welcome to our store! Are you looking for something specific today?",
      'job-interview': "Good morning! Thank you for coming in today. Please, tell me about yourself.",
      casual: "Hey! How's it going? I haven't seen you in a while!",
      business: "Good afternoon. Thank you for joining this meeting. Shall we begin?",
      medical: "Hello, I'm Dr. Smith. What brings you in today?",
      housing: "Hi there! I'm the property manager. You're interested in the apartment?",
      dating: "Hey! Nice to meet you. So, what do you like to do for fun?",
      emergency: "911, what's your emergency?",
    }
    
    const welcome = welcomeMessages[scenario] || "Hello! Let's practice together. What would you like to talk about?"
    setConversationMessages([{ role: 'assistant', content: welcome }])
    speakText(welcome)
  }

  const handleStopConversation = () => {
    setIsActive(false)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(textInput)
    }
  }

  if (!isActive) {
    return (
      <div className="voice-conversation inactive">
        <div className="start-section">
          <div className="start-icon">🎯</div>
          <h3>Ready to Practice?</h3>
          {scenario ? (
            <>
              <p>You've selected: <strong>{scenario.replace('-', ' ')}</strong></p>
              <button className="start-button" onClick={handleStartConversation}>
                ▶ Start Conversation
              </button>
            </>
          ) : (
            <p className="hint">👆 Select a scenario above to begin practicing</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="voice-conversation active">
      <div className="conversation-header">
        <div className="header-info">
          <span className="scenario-badge">📚 {scenario?.replace('-', ' ')}</span>
          <span className="lang-badge">{targetLanguage}</span>
        </div>
        <button className="stop-button" onClick={handleStopConversation}>
          ✕ End
        </button>
      </div>

      <div className="conversation-status">
        {isListening && <span className="status-badge listening">🎤 Listening...</span>}
        {isSpeaking && <span className="status-badge speaking">🔊 Speaking...</span>}
        {isLoading && <span className="status-badge loading">💭 Thinking...</span>}
      </div>

      <div className="messages-container">
        {conversationMessages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <span className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </span>
            <div className="message-bubble">
              <span className="message-role">{msg.role === 'user' ? 'You' : 'VoiceBuddy'}</span>
              <p className="message-content">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <span className="message-avatar">🤖</span>
            <div className="message-bubble typing">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        <button 
          className={`voice-input-btn ${isListening ? 'listening' : ''}`}
          onClick={handleVoiceInput}
          disabled={isLoading || isSpeaking}
          title="Click to speak"
        >
          🎤
        </button>
        <input
          type="text"
          className="text-input"
          placeholder={`Type in ${targetLanguage}...`}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button 
          className="send-btn"
          onClick={() => handleSendMessage(textInput)}
          disabled={!textInput.trim() || isLoading}
        >
          ➤
        </button>
      </div>

      <p className="input-hint">
        💡 Speak in {targetLanguage} or type your message. You'll receive feedback on grammar, vocabulary, and more!
      </p>
    </div>
  )
}

export default VoiceConversation

// Web Speech API typings are provided globally via `src/types/speech-recognition.d.ts`
