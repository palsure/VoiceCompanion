import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { useAccessibleScreen, useAccessibleButton } from '../hooks/useAccessibleButton'

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>

interface Props {
  navigation: HomeScreenNavigationProp
}

const HomeScreen = ({ navigation }: Props) => {
  console.log('HomeScreen rendering...')
  const { isEnabled, toggle } = useAccessibility()
  
  // Announce screen when accessibility is enabled
  useAccessibleScreen(
    'VoiceCompanion Home',
    'Your Intelligent Voice Assistant for Accessibility and Learning. Use the accessibility toggle at the top to enable voice descriptions.'
  )

  const learningButtonProps = useAccessibleButton({
    label: 'Language Learning',
    description: 'Practice languages with intelligent feedback',
    onPress: () => navigation.navigate('Learning'),
  })

  const voiceToImageButtonProps = useAccessibleButton({
    label: 'Voice to Art',
    description: 'Describe what you want to see, and we will create it',
    onPress: () => navigation.navigate('VoiceToImage'),
  })

  const imageToVoiceButtonProps = useAccessibleButton({
    label: 'Image to Voice',
    description: 'Get detailed voice descriptions of images',
    onPress: () => navigation.navigate('ImageToVoice'),
  })

  const guidanceButtonProps = useAccessibleButton({
    label: 'Real-Time Guidance',
    description: 'Continuous voice guidance for safe navigation',
    onPress: () => navigation.navigate('BlindGuidance'),
  })

  const shoppingButtonProps = useAccessibleButton({
    label: 'Voice Guided Shopping',
    description: 'Identify products, read labels, and get shopping assistance',
    onPress: () => navigation.navigate('VoiceGuidedShopping'),
  })


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Accessibility Toggle */}
      <View style={styles.accessibilityToggleContainer}>
        <Text style={styles.accessibilityLabel}>🔊 Voice Descriptions</Text>
        <Switch
          value={isEnabled}
          onValueChange={toggle}
          trackColor={{ false: '#767577', true: '#667eea' }}
          thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>✨ New Features</Text>
        <View style={styles.featuresGrid}>
          <TouchableOpacity
            style={[styles.featureCard, styles.voiceToImageCard]}
            {...voiceToImageButtonProps}
            activeOpacity={0.8}
          >
            <Text style={styles.featureIcon}>🎨</Text>
            <Text style={styles.featureTitle}>Voice to Art</Text>
            <Text style={styles.featureDescription}>
              Describe what you want to see, and we'll create it
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, styles.imageToVoiceCard]}
            {...imageToVoiceButtonProps}
            activeOpacity={0.8}
          >
            <Text style={styles.featureIcon}>📸</Text>
            <Text style={styles.featureTitle}>Image to Voice</Text>
            <Text style={styles.featureDescription}>
              Get detailed voice descriptions of images
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, styles.guidanceCard]}
            {...guidanceButtonProps}
            activeOpacity={0.8}
          >
            <Text style={styles.featureIcon}>🧭</Text>
            <Text style={styles.featureTitle}>Real-Time Guidance</Text>
            <Text style={styles.featureDescription}>
              Continuous voice guidance for safe navigation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, styles.shoppingCard]}
            {...shoppingButtonProps}
            activeOpacity={0.8}
          >
            <Text style={styles.featureIcon}>🛒</Text>
            <Text style={styles.featureTitle}>Voice Guided Shopping</Text>
            <Text style={styles.featureDescription}>
              Identify products, read labels, and get shopping assistance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, styles.learningCard]}
            {...learningButtonProps}
            activeOpacity={0.8}
          >
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={styles.featureTitle}>Language Learning</Text>
            <Text style={styles.featureDescription}>
              Practice languages with intelligent feedback
            </Text>
            <TouchableOpacity
              style={styles.progressButtonInline}
              onPress={() => navigation.navigate('Progress')}
              activeOpacity={0.8}
            >
              <Text style={styles.progressButtonTextInline}>📊 View Your Progress</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const screenWidth = Dimensions.get('window').width
const padding = 20
const gap = 12
const cardWidth = (screenWidth - (padding * 2) - gap) / 2 // 2 columns with padding and gap

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for scrolling
  },
  accessibilityToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accessibilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  learningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#764ba2',
  },
  progressButtonInline: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  progressButtonTextInline: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    width: cardWidth,
    marginBottom: gap,
  },
  voiceToImageCard: {
    borderLeftColor: '#9c27b0',
  },
  imageToVoiceCard: {
    borderLeftColor: '#00bcd4',
  },
  guidanceCard: {
    borderLeftColor: '#4caf50',
  },
  shoppingCard: {
    borderLeftColor: '#ff9800',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
})

export default HomeScreen

