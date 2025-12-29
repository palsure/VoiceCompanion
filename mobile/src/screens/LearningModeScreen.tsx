import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import ScenarioSelector from '../components/ScenarioSelector'
import VoiceConversation from '../components/VoiceConversation'
import FeedbackPanel from '../components/FeedbackPanel'

type LearningScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Learning'>

interface Props {
  navigation: LearningScreenNavigationProp
}

const LearningModeScreen = ({ navigation }: Props) => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScenarioSelector
        selectedScenario={selectedScenario}
        onSelectScenario={setSelectedScenario}
      />
      
      <VoiceConversation
        scenario={selectedScenario}
        onFeedback={setCurrentFeedback}
        mode="learning"
      />

      <FeedbackPanel feedback={currentFeedback} />
      
      <TouchableOpacity
        style={styles.progressButton}
        onPress={() => navigation.navigate('Progress')}
        activeOpacity={0.8}
      >
        <Text style={styles.progressButtonText}>📊 View Your Progress</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  progressButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default LearningModeScreen

