import { useState, useRef, useCallback } from 'react'
import * as Speech from 'expo-speech'
import { Audio } from 'expo-av'
import { conversationApi } from '../services/api'
import { Alert } from 'react-native'

interface UseVoiceConversationOptions {
  scenario?: string | null
  onFeedback?: (feedback: any) => void
  mode?: 'accessibility' | 'learning'
  capturedImage?: string | null
  onMessage?: (message: { role: 'user' | 'assistant'; content: string }) => void
}

export const useVoiceConversation = (options: UseVoiceConversationOptions = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const soundRef = useRef<Audio.Sound | null>(null)

  const startConversation = useCallback(async () => {
    // For React Native, voice input would need @react-native-voice/voice
    // For now, we'll use a text input approach or implement voice recognition
    setIsListening(true)
    
    // TODO: Implement voice recognition
    // This is a placeholder - you'll need to install and configure:
    // npm install @react-native-voice/voice
    Alert.alert(
      'Voice Input',
      'Voice recognition will be available soon. For now, you can use text input.',
      [{ text: 'OK' }]
    )
  }, [])

  const stopConversation = useCallback(() => {
    setIsListening(false)
    if (soundRef.current) {
      soundRef.current.stopAsync()
      soundRef.current.unloadAsync()
      soundRef.current = null
    }
  }, [])

  const sendMessage = useCallback(async (message: string) => {
    try {
      // Notify about user message
      if (options.onMessage) {
        options.onMessage({ role: 'user', content: message })
      }

      const response = await conversationApi.sendMessage({
        message,
        scenario: options.scenario || undefined,
        mode: options.mode || 'learning',
        imageData: options.capturedImage || undefined,
      })

      // Notify about assistant response
      if (options.onMessage && response.response) {
        options.onMessage({ role: 'assistant', content: response.response })
      }

      // Play audio response if available
      if (response.audioUrl) {
        await playAudio(response.audioUrl)
      } else if (response.response) {
        // Use text-to-speech as fallback
        await speakText(response.response)
      }

      // Trigger feedback callback
      if (options.onFeedback && response.feedback) {
        options.onFeedback(response.feedback)
      }

      return response
    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message. Please try again.')
      throw error
    }
  }, [options])

  const playAudio = async (audioUrl: string): Promise<void> => {
    try {
      // Stop any currently playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      )
      soundRef.current = sound
      setIsSpeaking(true)

      await sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsSpeaking(false)
            sound.unloadAsync()
            soundRef.current = null
          }
        }
      })
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsSpeaking(false)
      // Fallback to text-to-speech
      if (options.onMessage) {
        const lastMessage = conversationMessages[conversationMessages.length - 1]
        if (lastMessage?.role === 'assistant') {
          await speakText(lastMessage.content)
        }
      }
    }
  }

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true)
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false)
          resolve()
        },
        onStopped: () => {
          setIsSpeaking(false)
          resolve()
        },
        onError: () => {
          setIsSpeaking(false)
          resolve()
        },
      })
    })
  }

  return {
    isListening,
    isSpeaking,
    conversationMessages,
    startConversation,
    stopConversation,
    sendMessage,
  }
}
