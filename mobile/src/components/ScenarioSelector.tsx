import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'

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
    <View style={styles.container}>
      <Text style={styles.title}>📚 Choose a Scenario</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scenariosContainer}
      >
        {scenarios.map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            style={[
              styles.scenarioCard,
              selectedScenario === scenario.id && styles.scenarioCardSelected,
            ]}
            onPress={() => onSelectScenario(
              selectedScenario === scenario.id ? null : scenario.id
            )}
            activeOpacity={0.7}
          >
            <Text style={styles.scenarioIcon}>{scenario.icon}</Text>
            <Text style={styles.scenarioName}>{scenario.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scenariosContainer: {
    paddingRight: 12,
  },
  scenarioCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scenarioCardSelected: {
    backgroundColor: '#e8e3ff',
    borderColor: '#667eea',
  },
  scenarioIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  scenarioName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
})

export default ScenarioSelector

