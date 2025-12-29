import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native'
import { useVoiceConversation } from '../hooks/useVoiceConversation'

interface VoiceConversationProps {
  scenario: string | null
  onFeedback: (feedback: any) => void
  mode?: 'accessibility' | 'learning'
  capturedImage?: string | null
}

const VoiceConversation = ({ 
  scenario, 
  onFeedback, 
  mode = 'learning',
  capturedImage 
}: VoiceConversationProps) => {
  const [isActive, setIsActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])

  const {
    startConversation,
    stopConversation,
    isListening,
    isSpeaking,
    sendMessage,
  } = useVoiceConversation({
    scenario,
    onFeedback,
    mode,
    capturedImage,
    onMessage: (message) => {
      setConversationHistory(prev => [...prev, message])
    },
  })

  const handleToggle = () => {
    if (isActive) {
      stopConversation()
      setIsActive(false)
    } else {
      if (mode === 'learning' && !scenario) {
        Alert.alert('Select Scenario', 'Please select a scenario first!')
        return
      }
      startConversation()
      setIsActive(true)
    }
  }

  const handleSendText = async () => {
    if (!textInput.trim()) {
      return
    }

    const message = textInput.trim()
    setTextInput('')
    
    try {
      await sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        {isListening && (
          <View style={[styles.statusBadge, styles.listeningBadge]}>
            <Text style={styles.statusText}>🎤 Listening</Text>
          </View>
        )}
        {isSpeaking && (
          <View style={[styles.statusBadge, styles.speakingBadge]}>
            <Text style={styles.statusText}>🔊 Speaking</Text>
          </View>
        )}
        {scenario && (
          <View style={[styles.statusBadge, styles.scenarioBadge]}>
            <Text style={styles.statusText}>📚 {scenario}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonActive]}
        onPress={handleToggle}
        disabled={isListening || isSpeaking}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isActive ? '⏹ Stop Conversation' : '▶ Start Conversation'}
        </Text>
      </TouchableOpacity>

      {/* Text Input as alternative to voice */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message here..."
          value={textInput}
          onChangeText={setTextInput}
          multiline
          editable={!isSpeaking}
        />
        <View style={{ width: 8 }} />
        <TouchableOpacity
          style={[styles.sendButton, !textInput.trim() && styles.sendButtonDisabled]}
          onPress={handleSendText}
          disabled={!textInput.trim() || isSpeaking}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Conversation</Text>
          <ScrollView style={styles.historyScroll}>
            {conversationHistory.map((msg, idx) => (
              <View key={idx}>
                <View
                  style={[
                    styles.message,
                    msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  <Text style={styles.messageRole}>
                    {msg.role === 'user' ? 'You' : 'VoiceCompanion'}
                  </Text>
                  <Text style={styles.messageContent}>{msg.content}</Text>
                </View>
                {idx < conversationHistory.length - 1 && <View style={{ height: 8 }} />}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.hint}>
        {isActive
          ? mode === 'learning'
            ? 'Speak naturally in your target language. VoiceCompanion will respond and provide feedback.'
            : 'Ask questions about what you see, or request help with daily tasks.'
          : mode === 'learning'
          ? 'Select a scenario and tap to start practicing your language skills!'
          : 'Enable camera and start conversation to get visual assistance!'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  listeningBadge: {
    backgroundColor: '#e3f2fd',
  },
  speakingBadge: {
    backgroundColor: '#f3e5f5',
  },
  scenarioBadge: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonActive: {
    backgroundColor: '#f5576c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  historyContainer: {
    marginTop: 12,
    marginBottom: 12,
    maxHeight: 200,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  historyScroll: {
    flex: 1,
  },
  message: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  assistantMessage: {
    backgroundColor: '#f3e5f5',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageRole: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  messageContent: {
    color: '#333',
    lineHeight: 20,
  },
  hint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
})

export default VoiceConversation
