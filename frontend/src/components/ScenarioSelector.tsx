import { useState } from 'react'
import './ScenarioSelector.css'

interface ScenarioSelectorProps {
  selectedScenario: string | null
  onSelectScenario: (scenario: string | null) => void
  selectedLanguage?: string
  onSelectLanguage?: (language: string) => void
  selectedDifficulty?: string
  onSelectDifficulty?: (difficulty: string) => void
}

const languages = [
  { id: 'spanish', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { id: 'french', name: 'French', flag: '🇫🇷', native: 'Français' },
  { id: 'german', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
  { id: 'italian', name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
  { id: 'portuguese', name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
  { id: 'japanese', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
  { id: 'korean', name: 'Korean', flag: '🇰🇷', native: '한국어' },
  { id: 'mandarin', name: 'Mandarin', flag: '🇨🇳', native: '中文' },
  { id: 'arabic', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
  { id: 'hindi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
]

const difficulties = [
  { id: 'beginner', name: 'Beginner', icon: '🌱', description: 'Basic phrases, present tense, simple vocabulary' },
  { id: 'intermediate', name: 'Intermediate', icon: '🌿', description: 'Complex sentences, past/future tense, idioms' },
  { id: 'advanced', name: 'Advanced', icon: '🌳', description: 'Native-like fluency, nuances, cultural depth' },
]

const scenarios = [
  { 
    id: 'restaurant', 
    name: 'Restaurant Ordering', 
    icon: '🍽️',
    description: 'Order food, ask about menu items, handle allergies',
    objectives: ['Menu vocabulary', 'Polite requests', 'Dietary terms']
  },
  { 
    id: 'travel', 
    name: 'Travel & Directions', 
    icon: '✈️',
    description: 'Ask for directions, book transportation, navigate airports',
    objectives: ['Direction words', 'Time expressions', 'Transportation vocab']
  },
  { 
    id: 'shopping', 
    name: 'Shopping', 
    icon: '🛍️',
    description: 'Bargain, ask about sizes, make returns',
    objectives: ['Numbers & prices', 'Colors & sizes', 'Comparison words']
  },
  { 
    id: 'job-interview', 
    name: 'Job Interview', 
    icon: '💼',
    description: 'Discuss experience, answer common questions, negotiate',
    objectives: ['Professional vocabulary', 'Past achievements', 'Formal register']
  },
  { 
    id: 'casual', 
    name: 'Casual Conversation', 
    icon: '💬',
    description: 'Small talk, hobbies, opinions, making friends',
    objectives: ['Informal speech', 'Slang & expressions', 'Cultural topics']
  },
  { 
    id: 'business', 
    name: 'Business Meeting', 
    icon: '📊',
    description: 'Present ideas, negotiate deals, email etiquette',
    objectives: ['Business jargon', 'Persuasion', 'Formal writing']
  },
  { 
    id: 'medical', 
    name: 'Medical Visit', 
    icon: '🏥',
    description: 'Describe symptoms, understand prescriptions, emergencies',
    objectives: ['Body parts', 'Symptoms', 'Medical instructions']
  },
  { 
    id: 'housing', 
    name: 'Housing & Rentals', 
    icon: '🏠',
    description: 'Find apartments, discuss terms, report issues',
    objectives: ['Housing vocabulary', 'Contract terms', 'Problem reporting']
  },
  { 
    id: 'dating', 
    name: 'Social & Dating', 
    icon: '💕',
    description: 'Compliments, making plans, expressing feelings',
    objectives: ['Emotional vocabulary', 'Casual invitations', 'Cultural norms']
  },
  { 
    id: 'emergency', 
    name: 'Emergency Situations', 
    icon: '🚨',
    description: 'Call for help, describe situations, stay calm',
    objectives: ['Emergency phrases', 'Clear communication', 'Location description']
  },
]

const ScenarioSelector = ({ 
  selectedScenario, 
  onSelectScenario,
  selectedLanguage = 'spanish',
  onSelectLanguage,
  selectedDifficulty = 'beginner',
  onSelectDifficulty
}: ScenarioSelectorProps) => {
  const [showLanguages, setShowLanguages] = useState(false)
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)

  const currentLanguage = languages.find(l => l.id === selectedLanguage) || languages[0]
  const currentDifficulty = difficulties.find(d => d.id === selectedDifficulty) || difficulties[0]

  return (
    <div className="scenario-selector">
      {/* Language Selector */}
      <div className="language-section">
        <h3>🌍 Target Language</h3>
        <button 
          className="language-dropdown-trigger"
          onClick={() => setShowLanguages(!showLanguages)}
        >
          <span className="lang-flag">{currentLanguage.flag}</span>
          <span className="lang-name">{currentLanguage.name}</span>
          <span className="lang-native">({currentLanguage.native})</span>
          <span className="dropdown-arrow">{showLanguages ? '▲' : '▼'}</span>
        </button>
        
        {showLanguages && (
          <div className="language-dropdown">
            {languages.map((lang) => (
              <button
                key={lang.id}
                className={`language-option ${selectedLanguage === lang.id ? 'selected' : ''}`}
                onClick={() => {
                  onSelectLanguage?.(lang.id)
                  setShowLanguages(false)
                }}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-name">{lang.name}</span>
                <span className="lang-native">{lang.native}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty Selector */}
      <div className="difficulty-section">
        <h3>📈 Difficulty Level</h3>
        <div className="difficulty-buttons">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              className={`difficulty-btn ${selectedDifficulty === diff.id ? 'selected' : ''}`}
              onClick={() => onSelectDifficulty?.(diff.id)}
              title={diff.description}
            >
              <span className="diff-icon">{diff.icon}</span>
              <span className="diff-name">{diff.name}</span>
            </button>
          ))}
        </div>
        <p className="difficulty-description">{currentDifficulty.description}</p>
      </div>

      {/* Scenario Grid */}
      <div className="scenarios-section">
        <h3>📚 Choose a Scenario</h3>
        <div className="scenarios-grid">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`scenario-card ${selectedScenario === scenario.id ? 'selected' : ''} ${expandedScenario === scenario.id ? 'expanded' : ''}`}
              onClick={() => onSelectScenario(
                selectedScenario === scenario.id ? null : scenario.id
              )}
              onMouseEnter={() => setExpandedScenario(scenario.id)}
              onMouseLeave={() => setExpandedScenario(null)}
            >
              <span className="scenario-icon">{scenario.icon}</span>
              <span className="scenario-name">{scenario.name}</span>
              
              {expandedScenario === scenario.id && (
                <div className="scenario-details">
                  <p className="scenario-description">{scenario.description}</p>
                  <div className="scenario-objectives">
                    <strong>You'll learn:</strong>
                    <ul>
                      {scenario.objectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedScenario && (
        <div className="selection-summary">
          <span className="summary-icon">✅</span>
          <span>
            Learning <strong>{currentLanguage.name}</strong> at <strong>{currentDifficulty.name}</strong> level 
            with <strong>{scenarios.find(s => s.id === selectedScenario)?.name}</strong> scenario
          </span>
        </div>
      )}
    </div>
  )
}

export default ScenarioSelector

