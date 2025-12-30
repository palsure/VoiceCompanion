import { useState, useEffect } from 'react'
import './ProgressTracker.css'

interface Achievement {
  id: string
  name: string
  icon: string
  description: string
  unlocked: boolean
  progress: number
  target: number
}

const ProgressTracker = () => {
  const [progress, setProgress] = useState({
    totalConversations: 0,
    totalTime: 0,
    grammarScore: 0,
    vocabularyScore: 0,
    pronunciationScore: 0,
    streak: 0,
    wordsLearned: 0,
    scenariosCompleted: 0,
  })
  const [skillLevel, setSkillLevel] = useState<string>('beginner')
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview')
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first-chat', name: 'First Steps', icon: '🎯', description: 'Complete your first conversation', unlocked: false, progress: 0, target: 1 },
    { id: 'streak-3', name: 'On Fire', icon: '🔥', description: 'Maintain a 3-day streak', unlocked: false, progress: 0, target: 3 },
    { id: 'streak-7', name: 'Week Warrior', icon: '⚔️', description: 'Maintain a 7-day streak', unlocked: false, progress: 0, target: 7 },
    { id: 'streak-30', name: 'Monthly Master', icon: '👑', description: 'Maintain a 30-day streak', unlocked: false, progress: 0, target: 30 },
    { id: 'convos-10', name: 'Chatterbox', icon: '💬', description: 'Complete 10 conversations', unlocked: false, progress: 0, target: 10 },
    { id: 'convos-50', name: 'Conversationalist', icon: '🗣️', description: 'Complete 50 conversations', unlocked: false, progress: 0, target: 50 },
    { id: 'grammar-80', name: 'Grammar Guru', icon: '📝', description: 'Achieve 80% grammar score', unlocked: false, progress: 0, target: 80 },
    { id: 'vocab-80', name: 'Word Wizard', icon: '📚', description: 'Achieve 80% vocabulary score', unlocked: false, progress: 0, target: 80 },
    { id: 'pronunciation-80', name: 'Perfect Pitch', icon: '🎤', description: 'Achieve 80% pronunciation score', unlocked: false, progress: 0, target: 80 },
    { id: 'all-scenarios', name: 'Explorer', icon: '🗺️', description: 'Try all 10 scenarios', unlocked: false, progress: 0, target: 10 },
    { id: 'hour-practice', name: 'Dedicated', icon: '⏰', description: 'Practice for 1 hour total', unlocked: false, progress: 0, target: 60 },
    { id: 'perfect-session', name: 'Flawless', icon: '✨', description: 'Get 100% in any category', unlocked: false, progress: 0, target: 100 },
  ])

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const [progressRes, skillRes, recRes] = await Promise.all([
          fetch('/api/progress'),
          fetch('/api/personalization/skill-level'),
          fetch('/api/personalization/recommendations'),
        ])
        
        if (progressRes.ok) {
          const data = await progressRes.json()
          setProgress(prev => ({ ...prev, ...data }))
          updateAchievements(data)
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
    const interval = setInterval(loadProgress, 10000)
    return () => clearInterval(interval)
  }, [])

  const updateAchievements = (data: typeof progress) => {
    setAchievements(prev => prev.map(achievement => {
      let newProgress = achievement.progress
      let unlocked = achievement.unlocked

      switch (achievement.id) {
        case 'first-chat':
          newProgress = Math.min(data.totalConversations, 1)
          break
        case 'streak-3':
          newProgress = Math.min(data.streak, 3)
          break
        case 'streak-7':
          newProgress = Math.min(data.streak, 7)
          break
        case 'streak-30':
          newProgress = Math.min(data.streak, 30)
          break
        case 'convos-10':
          newProgress = Math.min(data.totalConversations, 10)
          break
        case 'convos-50':
          newProgress = Math.min(data.totalConversations, 50)
          break
        case 'grammar-80':
          newProgress = data.grammarScore
          break
        case 'vocab-80':
          newProgress = data.vocabularyScore
          break
        case 'pronunciation-80':
          newProgress = data.pronunciationScore
          break
        case 'hour-practice':
          newProgress = Math.min(Math.floor(data.totalTime / 60), 60)
          break
        case 'perfect-session':
          newProgress = Math.max(data.grammarScore, data.vocabularyScore, data.pronunciationScore)
          break
      }

      unlocked = newProgress >= achievement.target

      return { ...achievement, progress: newProgress, unlocked }
    }))
  }

  const getSkillLevelProgress = () => {
    const avg = (progress.grammarScore + progress.vocabularyScore + progress.pronunciationScore) / 3
    if (skillLevel === 'beginner') return { current: avg, nextLevel: 'Intermediate', needed: 40 }
    if (skillLevel === 'intermediate') return { current: avg, nextLevel: 'Advanced', needed: 70 }
    return { current: avg, nextLevel: 'Master', needed: 100 }
  }

  const levelProgress = getSkillLevelProgress()
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h2>📊 Your Progress</h2>
        <div className="skill-badge-container">
          <div className={`skill-badge ${skillLevel}`}>
            <span className="skill-icon">
              {skillLevel === 'beginner' ? '🌱' : skillLevel === 'intermediate' ? '🌿' : '🌳'}
            </span>
            <span className="skill-text">{skillLevel.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="level-progress">
        <div className="level-info">
          <span>Progress to {levelProgress.nextLevel}</span>
          <span>{Math.round(levelProgress.current)}%</span>
        </div>
        <div className="level-bar">
          <div 
            className="level-fill" 
            style={{ width: `${(levelProgress.current / levelProgress.needed) * 100}%` }}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="progress-tabs">
        <button 
          className={`progress-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`progress-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
          <span className="achievement-count">{unlockedCount}/{achievements.length}</span>
        </button>
        <button 
          className={`progress-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📅 History
        </button>
      </div>

      {/* Tab Content */}
      <div className="progress-content">
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">💬</span>
                <span className="stat-value">{progress.totalConversations}</span>
                <span className="stat-label">Conversations</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⏱️</span>
                <span className="stat-value">{Math.floor(progress.totalTime / 60)}m</span>
                <span className="stat-label">Practice Time</span>
              </div>
              <div className="stat-card streak">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{progress.streak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📖</span>
                <span className="stat-value">{progress.wordsLearned || 0}</span>
                <span className="stat-label">Words Learned</span>
              </div>
            </div>

            {/* Skills Chart */}
            <div className="skills-section">
              <h3>📊 Skill Breakdown</h3>
              <div className="skills-chart">
                <div className="skill-row">
                  <div className="skill-info">
                    <span className="skill-name">📝 Grammar</span>
                    <span className="skill-value">{progress.grammarScore}%</span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-fill grammar" 
                      style={{ width: `${progress.grammarScore}%` }}
                    />
                  </div>
                </div>
                <div className="skill-row">
                  <div className="skill-info">
                    <span className="skill-name">📚 Vocabulary</span>
                    <span className="skill-value">{progress.vocabularyScore}%</span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-fill vocabulary" 
                      style={{ width: `${progress.vocabularyScore}%` }}
                    />
                  </div>
                </div>
                <div className="skill-row">
                  <div className="skill-info">
                    <span className="skill-name">🎤 Pronunciation</span>
                    <span className="skill-value">{progress.pronunciationScore}%</span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-fill pronunciation" 
                      style={{ width: `${progress.pronunciationScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="recommendations-section">
                <h3>💡 Personalized Tips</h3>
                <div className="recommendations-list">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-card">
                      <span className="rec-icon">✨</span>
                      <span className="rec-text">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    {!achievement.unlocked && (
                      <div className="achievement-progress">
                        <div 
                          className="achievement-bar"
                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                        />
                        <span className="achievement-count">
                          {achievement.progress}/{achievement.target}
                        </span>
                      </div>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <span className="unlocked-badge">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="history-placeholder">
              <span className="history-icon">📅</span>
              <h3>Practice History</h3>
              <p>Your conversation history will appear here as you practice more!</p>
              <div className="history-preview">
                <div className="history-stat">
                  <span className="stat-label">This Week</span>
                  <span className="stat-value">{Math.min(progress.totalConversations, 7)} sessions</span>
                </div>
                <div className="history-stat">
                  <span className="stat-label">This Month</span>
                  <span className="stat-value">{progress.totalConversations} sessions</span>
                </div>
                <div className="history-stat">
                  <span className="stat-label">Best Streak</span>
                  <span className="stat-value">{progress.streak} days</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressTracker
