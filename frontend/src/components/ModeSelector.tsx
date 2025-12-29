import './ModeSelector.css'

interface ModeSelectorProps {
  mode: 'accessibility' | 'learning' | 'voice-to-art'
  onModeChange: (mode: 'accessibility' | 'learning' | 'voice-to-art') => void
}

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="mode-selector-tabs">
      <div className="tabs-container">
        <button
          className={`tab-button ${mode === 'accessibility' ? 'active' : ''}`}
          onClick={() => onModeChange('accessibility')}
          aria-pressed={mode === 'accessibility'}
        >
          <span className="tab-icon">👁️</span>
          <span className="tab-label">Accessibility</span>
        </button>
        <button
          className={`tab-button ${mode === 'learning' ? 'active' : ''}`}
          onClick={() => onModeChange('learning')}
          aria-pressed={mode === 'learning'}
        >
          <span className="tab-icon">📚</span>
          <span className="tab-label">Language Learning</span>
        </button>
        <button
          className={`tab-button ${mode === 'voice-to-art' ? 'active' : ''}`}
          onClick={() => onModeChange('voice-to-art')}
          aria-pressed={mode === 'voice-to-art'}
        >
          <span className="tab-icon">🎨</span>
          <span className="tab-label">Voice to Art</span>
        </button>
      </div>
    </div>
  )
}

export default ModeSelector

