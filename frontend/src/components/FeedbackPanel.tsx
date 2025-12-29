import './FeedbackPanel.css'

interface FeedbackPanelProps {
  feedback: any
}

const FeedbackPanel = ({ feedback }: FeedbackPanelProps) => {
  if (!feedback) {
    return (
      <div className="feedback-panel">
        <h2>💬 Feedback</h2>
        <p className="feedback-placeholder">Start a conversation to receive real-time feedback!</p>
      </div>
    )
  }

  return (
    <div className="feedback-panel">
      <h2>💬 Feedback</h2>
      
      {feedback.grammar && (
        <div className="feedback-section">
          <h3>📝 Grammar</h3>
          <div className="feedback-item">
            {feedback.grammar.corrections?.map((correction: any, idx: number) => (
              <div key={idx} className="correction">
                <span className="incorrect">{correction.incorrect}</span>
                <span className="arrow">→</span>
                <span className="correct">{correction.correct}</span>
                {correction.explanation && (
                  <p className="explanation">{correction.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.vocabulary && feedback.vocabulary.suggestions && feedback.vocabulary.suggestions.length > 0 && (
        <div className="feedback-section">
          <h3>📚 Vocabulary</h3>
          <ul className="suggestions-list">
            {feedback.vocabulary.suggestions.map((suggestion: string, idx: number) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.pronunciation && (
        <div className="feedback-section">
          <h3>🎯 Pronunciation</h3>
          <div className="pronunciation-score">
            Score: {feedback.pronunciation.score}/100
          </div>
          {feedback.pronunciation.feedback && (
            <p>{feedback.pronunciation.feedback}</p>
          )}
        </div>
      )}

      {feedback.cultural && (
        <div className="feedback-section">
          <h3>🌍 Cultural Context</h3>
          <p>{feedback.cultural}</p>
        </div>
      )}
    </div>
  )
}

export default FeedbackPanel

