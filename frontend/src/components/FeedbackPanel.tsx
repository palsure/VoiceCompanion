import { useState } from 'react'
import './FeedbackPanel.css'

interface FeedbackPanelProps {
  feedback: any
  targetLanguage?: string
}

const FeedbackPanel = ({ feedback, targetLanguage = 'spanish' }: FeedbackPanelProps) => {
  const [activeTab, setActiveTab] = useState<'grammar' | 'vocabulary' | 'pronunciation' | 'cultural'>('grammar')
  const [showExamples, setShowExamples] = useState<{ [key: string]: boolean }>({})

  if (!feedback) {
    return (
      <div className="feedback-panel empty">
        <div className="feedback-header">
          <h2>💬 Real-Time Feedback</h2>
        </div>
        <div className="feedback-placeholder">
          <div className="placeholder-icon">🎯</div>
          <h3>Start practicing to receive feedback!</h3>
          <p>As you speak, you'll receive instant analysis on:</p>
          <ul className="feedback-preview">
            <li><span className="preview-icon">📝</span> Grammar corrections with explanations</li>
            <li><span className="preview-icon">📚</span> Vocabulary suggestions & alternatives</li>
            <li><span className="preview-icon">🎤</span> Pronunciation tips & scores</li>
            <li><span className="preview-icon">🌍</span> Cultural context & idioms</li>
          </ul>
        </div>
      </div>
    )
  }

  const toggleExample = (key: string) => {
    setShowExamples(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getOverallScore = () => {
    const scores = [
      feedback.grammar?.score || 0,
      feedback.vocabulary?.score || 0,
      feedback.pronunciation?.score || 0,
    ].filter(s => s > 0)
    
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const overallScore = getOverallScore()

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <h2>💬 Real-Time Feedback</h2>
        {overallScore > 0 && (
          <div className="overall-score" style={{ borderColor: getScoreColor(overallScore) }}>
            <span className="score-value" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}
            </span>
            <span className="score-label">Overall</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="feedback-tabs">
        <button 
          className={`tab-btn ${activeTab === 'grammar' ? 'active' : ''}`}
          onClick={() => setActiveTab('grammar')}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-label">Grammar</span>
          {feedback.grammar?.score && (
            <span className="tab-score" style={{ background: getScoreColor(feedback.grammar.score) }}>
              {feedback.grammar.score}
            </span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          <span className="tab-icon">📚</span>
          <span className="tab-label">Vocabulary</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pronunciation' ? 'active' : ''}`}
          onClick={() => setActiveTab('pronunciation')}
        >
          <span className="tab-icon">🎤</span>
          <span className="tab-label">Pronunciation</span>
          {feedback.pronunciation?.score && (
            <span className="tab-score" style={{ background: getScoreColor(feedback.pronunciation.score) }}>
              {feedback.pronunciation.score}
            </span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cultural' ? 'active' : ''}`}
          onClick={() => setActiveTab('cultural')}
        >
          <span className="tab-icon">🌍</span>
          <span className="tab-label">Cultural</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="feedback-content">
        {/* Grammar Tab */}
        {activeTab === 'grammar' && feedback.grammar && (
          <div className="feedback-section grammar-section">
            {feedback.grammar.corrections?.length > 0 ? (
              <>
                <div className="section-header">
                  <h3>Grammar Corrections</h3>
                  <span className="corrections-count">
                    {feedback.grammar.corrections.length} issue{feedback.grammar.corrections.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                
                {feedback.grammar.corrections.map((correction: any, idx: number) => (
                  <div key={idx} className="correction-card">
                    <div className="correction-main">
                      <div className="incorrect-text">
                        <span className="label">❌ You said:</span>
                        <span className="text">{correction.incorrect}</span>
                      </div>
                      <div className="correction-arrow">→</div>
                      <div className="correct-text">
                        <span className="label">✅ Correct:</span>
                        <span className="text">{correction.correct}</span>
                      </div>
                    </div>
                    
                    {correction.explanation && (
                      <div className="correction-explanation">
                        <span className="explanation-icon">💡</span>
                        <p>{correction.explanation}</p>
                      </div>
                    )}

                    <button 
                      className="show-examples-btn"
                      onClick={() => toggleExample(`grammar-${idx}`)}
                    >
                      {showExamples[`grammar-${idx}`] ? '▼ Hide Examples' : '▶ Show More Examples'}
                    </button>

                    {showExamples[`grammar-${idx}`] && (
                      <div className="examples-section">
                        <p className="examples-title">More examples of this pattern:</p>
                        <ul className="examples-list">
                          <li>Example sentence 1 with correct usage</li>
                          <li>Example sentence 2 with correct usage</li>
                          <li>Example sentence 3 with correct usage</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="perfect-feedback">
                <span className="perfect-icon">🎉</span>
                <h3>Perfect Grammar!</h3>
                <p>No grammatical errors detected. Great job!</p>
              </div>
            )}
          </div>
        )}

        {/* Vocabulary Tab */}
        {activeTab === 'vocabulary' && feedback.vocabulary && (
          <div className="feedback-section vocabulary-section">
            <div className="vocab-level">
              <span className="level-label">Your vocabulary level:</span>
              <span className={`level-badge ${feedback.vocabulary.level}`}>
                {feedback.vocabulary.level?.toUpperCase() || 'INTERMEDIATE'}
              </span>
            </div>

            {feedback.vocabulary.suggestions?.length > 0 ? (
              <>
                <h3>💡 Vocabulary Suggestions</h3>
                <p className="suggestions-intro">Consider using these alternative words/phrases:</p>
                
                <div className="suggestions-grid">
                  {feedback.vocabulary.suggestions.map((suggestion: string, idx: number) => (
                    <div key={idx} className="suggestion-card">
                      <span className="suggestion-text">{suggestion}</span>
                      <button className="add-to-vocab-btn" title="Add to vocabulary list">
                        ➕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="vocab-tips">
                <h3>📖 Vocabulary Tips</h3>
                <ul>
                  <li>Try using more descriptive adjectives</li>
                  <li>Practice synonyms for common words</li>
                  <li>Learn idiomatic expressions</li>
                </ul>
              </div>
            )}

            <div className="vocab-challenge">
              <h4>🎯 Today's Challenge</h4>
              <p>Try to use at least 3 new words in your next conversation!</p>
            </div>
          </div>
        )}

        {/* Pronunciation Tab */}
        {activeTab === 'pronunciation' && feedback.pronunciation && (
          <div className="feedback-section pronunciation-section">
            <div className="pronunciation-score-display">
              <div 
                className="score-circle"
                style={{ 
                  background: `conic-gradient(${getScoreColor(feedback.pronunciation.score || 0)} ${(feedback.pronunciation.score || 0) * 3.6}deg, rgba(255,255,255,0.1) 0deg)` 
                }}
              >
                <div className="score-inner">
                  <span className="score-number">{feedback.pronunciation.score || 0}</span>
                  <span className="score-max">/100</span>
                </div>
              </div>
              <div className="score-description">
                <h3>Pronunciation Score</h3>
                <p>{feedback.pronunciation.feedback || 'Keep practicing for better pronunciation!'}</p>
              </div>
            </div>

            <div className="pronunciation-tips">
              <h4>🎯 Focus Areas</h4>
              <div className="tips-grid">
                <div className="tip-card">
                  <span className="tip-icon">👄</span>
                  <span className="tip-title">Mouth Position</span>
                  <p>Pay attention to how you shape your mouth</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">👂</span>
                  <span className="tip-title">Listen & Repeat</span>
                  <p>Mimic native speaker recordings</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">🎵</span>
                  <span className="tip-title">Intonation</span>
                  <p>Match the rhythm and melody of speech</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">⏱️</span>
                  <span className="tip-title">Speed</span>
                  <p>Start slow, then gradually speed up</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cultural Tab */}
        {activeTab === 'cultural' && (
          <div className="feedback-section cultural-section">
            {feedback.cultural ? (
              <>
                <div className="cultural-insight">
                  <span className="insight-icon">🌍</span>
                  <div className="insight-content">
                    <h3>Cultural Context</h3>
                    <p>{feedback.cultural}</p>
                  </div>
                </div>

                <div className="cultural-tips">
                  <h4>🎭 Did You Know?</h4>
                  <div className="cultural-cards">
                    <div className="cultural-card formality">
                      <span className="card-icon">👔</span>
                      <h5>Formality Levels</h5>
                      <p>This language has distinct formal and informal registers</p>
                    </div>
                    <div className="cultural-card gestures">
                      <span className="card-icon">👋</span>
                      <h5>Common Gestures</h5>
                      <p>Body language varies significantly across cultures</p>
                    </div>
                    <div className="cultural-card idioms">
                      <span className="card-icon">💬</span>
                      <h5>Popular Idioms</h5>
                      <p>Learn expressions that native speakers use daily</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="cultural-empty">
                <span className="empty-icon">🌏</span>
                <h3>Cultural Insights</h3>
                <p>Continue practicing to unlock cultural context and tips!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackPanel
