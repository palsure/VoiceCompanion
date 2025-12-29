import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import CameraCapture from '../components/CameraCapture'
import VoiceConversation from '../components/VoiceConversation'
import FeedbackPanel from '../components/FeedbackPanel'

type AccessibilityScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Accessibility'>

interface Props {
  navigation: AccessibilityScreenNavigationProp
}

const AccessibilityModeScreen = ({ navigation }: Props) => {
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CameraCapture
        active={cameraActive}
        onToggle={setCameraActive}
        onImageCapture={setCapturedImage}
      />

      <VoiceConversation
        scenario={null}
        onFeedback={setCurrentFeedback}
        mode="accessibility"
        capturedImage={capturedImage}
      />

      <FeedbackPanel feedback={currentFeedback} />
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
  },
})

export default AccessibilityModeScreen

