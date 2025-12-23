import { useState } from 'react'
import './AccessibilityControls.css'

const AccessibilityControls = () => {
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')

  const toggleHighContrast = () => {
    setHighContrast(!highContrast)
    document.documentElement.classList.toggle('high-contrast', !highContrast)
  }

  const changeFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size)
    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/g, '')
    document.documentElement.classList.add(`font-size-${size}`)
  }

  return (
    <div className="accessibility-controls" role="toolbar" aria-label="Accessibility controls">
      <button
        className="accessibility-button"
        onClick={toggleHighContrast}
        aria-pressed={highContrast}
        aria-label="Toggle high contrast mode"
      >
        {highContrast ? '🔆' : '🌓'} High Contrast
      </button>
      
      <div className="font-size-controls">
        <span className="font-size-label">Font Size:</span>
        <button
          className={`font-size-button ${fontSize === 'normal' ? 'active' : ''}`}
          onClick={() => changeFontSize('normal')}
          aria-label="Normal font size"
        >
          A
        </button>
        <button
          className={`font-size-button ${fontSize === 'large' ? 'active' : ''}`}
          onClick={() => changeFontSize('large')}
          aria-label="Large font size"
        >
          A
        </button>
        <button
          className={`font-size-button ${fontSize === 'xlarge' ? 'active' : ''}`}
          onClick={() => changeFontSize('xlarge')}
          aria-label="Extra large font size"
        >
          A
        </button>
      </div>
    </div>
  )
}

export default AccessibilityControls

