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
import FeatureInfoIcon from '../components/FeatureInfoIcon'

type LearningScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Learning'>

interface Props {
  navigation: LearningScreenNavigationProp
}

const LearningModeScreen = ({ navigation }: Props) => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>📚 Language Learning</Text>
          <FeatureInfoIcon
            title="Language Learning"
            description="Practice languages with scenarios and intelligent feedback."
            howItWorks={[
              'Pick a scenario (travel, restaurant, shopping, etc.)',
              'Have a guided voice conversation',
              'Get feedback on grammar, vocabulary, and pronunciation',
              'ElevenLabs provides natural voice examples and guidance',
            ]}
            features={[
              'Scenario-based practice',
              'Feedback panel',
              'Progress tracking',
              'ElevenLabs voice guidance',
            ]}
          />
        </View>
        <Text style={styles.subtitle}>Practice languages with intelligent feedback and personalized scenarios</Text>
      </View>

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
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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

