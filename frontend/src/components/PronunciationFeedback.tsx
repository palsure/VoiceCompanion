import './PronunciationFeedback.css'

interface PronunciationFeedbackProps {
  feedback: {
    score: number
    feedback: string
    phonemes?: any[]
  } | null
}

const PronunciationFeedback = ({ feedback }: PronunciationFeedbackProps) => {
  if (!feedback) return null

  return (
    <div className="pronunciation-feedback">
      <h3>🎯 Pronunciation Analysis</h3>
      <div className="pronunciation-score">
        <div className="score-circle">
          <span>{feedback.score}</span>
        </div>
        <p className="score-label">Pronunciation Score</p>
      </div>
      {feedback.feedback && (
        <div className="pronunciation-text">
          <p>{feedback.feedback}</p>
        </div>
      )}
    </div>
  )
}

export default PronunciationFeedback

