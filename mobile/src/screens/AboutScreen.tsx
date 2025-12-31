import React from 'react'
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { useAccessibleScreen } from '../hooks/useAccessibleButton'
import FeatureInfoIcon from '../components/FeatureInfoIcon'

const AboutScreen = () => {
  useAccessibleScreen(
    'About VoiceCompanion',
    'Learn how VoiceCompanion works and what features are available.'
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>👁️ About VoiceCompanion</Text>
          <FeatureInfoIcon
            title="About VoiceCompanion"
            description="VoiceCompanion is a voice-driven assistant for accessibility, learning, and creative AI."
            howItWorks={[
              'Voice Mode enables hands-free navigation and commands',
              'ElevenLabs powers high-quality text-to-speech across the app',
              'ElevenLabs Music Generation powers Script to Music',
              'Google Gemini / Vision / Imagen power understanding and creation',
            ]}
            features={[
              'ElevenLabs TTS across features',
              'ElevenLabs Music Generation',
              'Voice-first accessibility',
            ]}
          />
        </View>
        <Text style={styles.subtitle}>
          An intelligent, voice-driven assistant for accessibility and creativity
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What it is</Text>
        <Text style={styles.paragraph}>
          VoiceCompanion helps users interact hands-free using voice, camera, and AI. It’s designed
          with accessibility-first principles for visually impaired users, while also offering
          creative tools like Voice to Art and Script to Music.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Powered by ElevenLabs</Text>
        <Text style={styles.paragraph}>
          VoiceCompanion uses ElevenLabs for natural, human-like voice output (text-to-speech) across
          the app, and ElevenLabs Music Generation for creating music from your lyrics or script.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core features</Text>
        <View style={styles.bullets}>
          <Text style={styles.bullet}>• 🎨 Voice to Art (Google Imagen)</Text>
          <Text style={styles.bullet}>• 📸 Image to Voice (Vision + ElevenLabs TTS)</Text>
          <Text style={styles.bullet}>• 🧭 Real-Time Guidance (Gemini + voice guidance)</Text>
          <Text style={styles.bullet}>• 🛒 Voice Guided Shopping (Vision + voice help)</Text>
          <Text style={styles.bullet}>• 🎵 Script to Music (ElevenLabs Music + fallback)</Text>
          <Text style={styles.bullet}>• 📚 Language Learning (practice + feedback)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <Text style={styles.paragraph}>
          If you’re using an Android emulator, the mobile app reaches your backend using
          {' '}<Text style={styles.code}>10.0.2.2</Text> (not localhost).
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
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
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e9e9e9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  bullets: {
    gap: 6,
  },
  bullet: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  code: {
    fontFamily: 'Menlo',
    color: '#1976d2',
    fontWeight: '700',
  },
})

export default AboutScreen


