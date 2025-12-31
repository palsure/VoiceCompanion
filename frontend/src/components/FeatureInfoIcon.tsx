import { useState } from 'react'
import './FeatureInfoIcon.css'

interface FeatureInfoIconProps {
  title: string
  description: string
  howItWorks: string[]
  features?: string[]
}

const FeatureInfoIcon = ({ title, description, howItWorks, features }: FeatureInfoIconProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="feature-info-icon"
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={`Learn more about ${title}`}
      >
        ℹ️
      </button>

      {isOpen && (
        <div
          className="feature-info-overlay"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => setIsOpen(false)}
        >
          <div className="feature-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feature-info-header">
              <h2>{title}</h2>
              <button
                className="feature-info-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="feature-info-content">
              <p className="feature-info-description">{description}</p>
              
              <div className="feature-info-section">
                <h3>How It Works:</h3>
                <ol className="feature-info-steps">
                  {howItWorks.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              {features && features.length > 0 && (
                <div className="feature-info-section">
                  <h3>Features:</h3>
                  <ul className="feature-info-list">
                    {features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FeatureInfoIcon

