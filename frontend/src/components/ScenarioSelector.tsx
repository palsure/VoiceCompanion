import './ScenarioSelector.css'

interface ScenarioSelectorProps {
  selectedScenario: string | null
  onSelectScenario: (scenario: string | null) => void
}

const scenarios = [
  { id: 'restaurant', name: 'Restaurant Ordering', icon: '🍽️' },
  { id: 'travel', name: 'Travel & Directions', icon: '✈️' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'job-interview', name: 'Job Interview', icon: '💼' },
  { id: 'casual', name: 'Casual Conversation', icon: '💬' },
  { id: 'business', name: 'Business Meeting', icon: '📊' },
]

const ScenarioSelector = ({ selectedScenario, onSelectScenario }: ScenarioSelectorProps) => {
  return (
    <div className="scenario-selector">
      <h2>📚 Choose a Scenario</h2>
      <div className="scenarios-grid">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={`scenario-card ${selectedScenario === scenario.id ? 'selected' : ''}`}
            onClick={() => onSelectScenario(
              selectedScenario === scenario.id ? null : scenario.id
            )}
          >
            <span className="scenario-icon">{scenario.icon}</span>
            <span className="scenario-name">{scenario.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ScenarioSelector

