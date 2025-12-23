import './ConversationView.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationViewProps {
  messages: Message[]
}

const ConversationView = ({ messages }: ConversationViewProps) => {
  return (
    <div className="conversation-view" role="log" aria-live="polite" aria-atomic="false">
      {messages.length === 0 ? (
        <div className="empty-state">
          <h2>Welcome to EchoSight</h2>
          <p>Start a conversation by clicking the microphone button or enabling voice commands.</p>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">👁️</span>
              <span>Describe what you see</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📄</span>
              <span>Read documents and text</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛒</span>
              <span>Get shopping assistance</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🗓️</span>
              <span>Manage your schedule</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}`}
              role={message.role === 'user' ? 'log' : 'status'}
            >
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-text">{message.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ConversationView

