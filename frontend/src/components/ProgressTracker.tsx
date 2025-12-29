import { useState, useEffect } from 'react'
import './ProgressTracker.css'

const ProgressTracker = () => {
  const [progress, setProgress] = useState({
    totalConversations: 0,
    totalTime: 0,
    grammarScore: 0,
    vocabularyScore: 0,
    pronunciationScore: 0,
    streak: 0,
  })
  const [skillLevel, setSkillLevel] = useState<string>('beginner')
  const [recommendations, setRecommendations] = useState<string[]>([])

  useEffect(() => {
    // Load progress from API
    const loadProgress = async () => {
      try {
        const [progressRes, skillRes, recRes] = await Promise.all([
          fetch('/api/progress'),
          fetch('/api/personalization/skill-level'),
          fetch('/api/personalization/recommendations'),
        ])
        
        if (progressRes.ok) {
          const data = await progressRes.json()
          setProgress(data)
        }
        
        if (skillRes.ok) {
          const skill = await skillRes.json()
          setSkillLevel(skill.level)
        }
        
        if (recRes.ok) {
          const rec = await recRes.json()
          setRecommendations(rec.recommendations || [])
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
      }
    }
    loadProgress()
    
    // Refresh every 5 seconds to update progress
    const interval = setInterval(loadProgress, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
      <div className="progress-tracker">
      <h2>📊 Your Progress</h2>
      
      <div className="skill-level-badge">
        <span className="skill-label">Skill Level:</span>
        <span className={`skill-value ${skillLevel}`}>{skillLevel.toUpperCase()}</span>
      </div>
      
      <div className="progress-stats">
        <div className="stat-item">
          <div className="stat-value">{progress.totalConversations}</div>
          <div className="stat-label">Conversations</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{Math.floor(progress.totalTime / 60)}m</div>
          <div className="stat-label">Practice Time</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{progress.streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>

      <div className="progress-scores">
        <div className="score-item">
          <div className="score-label">Grammar</div>
          <div className="score-bar">
            <div 
              className="score-fill" 
              style={{ width: `${progress.grammarScore}%` }}
            ></div>
          </div>
          <div className="score-value">{progress.grammarScore}%</div>
        </div>
        <div className="score-item">
          <div className="score-label">Vocabulary</div>
          <div className="score-bar">
            <div 
              className="score-fill" 
              style={{ width: `${progress.vocabularyScore}%` }}
            ></div>
          </div>
          <div className="score-value">{progress.vocabularyScore}%</div>
        </div>
        <div className="score-item">
          <div className="score-label">Pronunciation</div>
          <div className="score-bar">
            <div 
              className="score-fill" 
              style={{ width: `${progress.pronunciationScore}%` }}
            ></div>
          </div>
          <div className="score-value">{progress.pronunciationScore}%</div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>💡 Recommendations</h3>
          <ul className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker

