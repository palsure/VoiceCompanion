import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import * as Speech from 'expo-speech'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
// Import EncodingType if available for type safety
type FileSystemEncoding = 'utf8' | 'base64'
import { imageGenerationApi, speechToTextApi } from '../services/api'

type VoiceToImageScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VoiceToImage'>

interface Props {
  navigation: VoiceToImageScreenNavigationProp
}

const VoiceToImageScreen = ({ navigation }: Props) => {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync()
      }
    }
  }, [recording])

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone permission is required for voice input.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      // Use HIGH_QUALITY preset which records as M4A (AAC) format
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(newRecording)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    setIsRecording(false)
    setLoading(true)
    
    // Show loading message
    console.log('Processing audio recording...')
    
    try {
      // Stop recording with timeout
      await Promise.race([
        recording.stopAndUnloadAsync(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Recording stop timeout')), 5000)
        )
      ])
      const uri = recording.getURI()
      setRecording(null)

      if (uri) {
        try {
          // Read the audio file and convert to base64 using expo-file-system
          // Use string literal 'base64' - this is the correct way for expo-file-system
          const encoding: FileSystemEncoding = 'base64'
          const base64Audio = await FileSystem.readAsStringAsync(uri, {
            encoding,
          })
          
          // Determine MIME type based on file extension
          let mimeType = 'audio/m4a' // Default for Expo Audio
          if (uri.endsWith('.m4a') || uri.includes('.m4a')) {
            mimeType = 'audio/m4a'
          } else if (uri.endsWith('.wav') || uri.includes('.wav')) {
            mimeType = 'audio/wav'
          } else if (uri.endsWith('.mp3') || uri.includes('.mp3')) {
            mimeType = 'audio/mp3'
          }
          
          // Create data URI
          const audioDataUri = `data:${mimeType};base64,${base64Audio}`
          
          // Send to backend for transcription
          console.log('Sending audio for transcription, size:', base64Audio.length)
          console.log('Audio MIME type:', mimeType)
          
          // Add timeout wrapper
          const transcriptionPromise = speechToTextApi.transcribe(audioDataUri, 'en-US')
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transcription timeout after 35 seconds')), 35000)
          )
          
          const result = await Promise.race([transcriptionPromise, timeoutPromise]) as any
          
          console.log('Transcription result:', result)
          
          // Handle different response formats
          const transcription = result.transcription || result.text || result.transcript || ''
          
          if (transcription && transcription.trim().length > 0) {
            // Clean up the transcription (remove any unwanted characters)
            const cleanTranscription = transcription.trim()
            setPrompt(cleanTranscription)
            console.log('Transcription successful:', cleanTranscription)
            // Show success feedback
            Alert.alert('Success', 'Your voice has been transcribed!', [{ text: 'OK' }])
          } else {
            console.error('Empty or invalid transcription:', result)
            throw new Error('No transcription received or transcription is empty')
          }
        } catch (error: any) {
          console.error('Transcription error:', error)
          let errorMessage = 'Failed to transcribe audio'
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message
          } else if (error.message) {
            errorMessage = error.message
          }
          
          // Check if it's a credentials error
          if (errorMessage.includes('credentials') || errorMessage.includes('authentication') || errorMessage.includes('API key')) {
            errorMessage = 'ElevenLabs API key not configured. Please set up ELEVENLABS_API_KEY in the backend.'
          } else if (errorMessage.includes('Network Error') || error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to backend server. Please ensure the backend is running.'
          } else if (errorMessage.includes('Cannot read property') || errorMessage.includes('undefined')) {
            errorMessage = 'Audio file processing error. Please try recording again.'
          }
          
          Alert.alert(
            'Transcription Error',
            errorMessage + '\n\nYou can still type your description manually.',
            [{ text: 'OK' }]
          )
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
        Alert.alert('Error', 'No audio file found')
      }
    } catch (error: any) {
      setLoading(false)
      console.error('Recording stop error:', error)
      Alert.alert('Error', 'Failed to process recording: ' + error.message)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a description for the image')
      return
    }

    setLoading(true)
    setGeneratedImage(null)

    try {
      const result = await imageGenerationApi.generate(prompt, style, '1024x1024')
      
      // Check if we got an actual image
      if (result.image) {
        // Handle base64 image data
        setGeneratedImage(result.image)
      } else if (result.imageUrl) {
        // Handle image URL
        setGeneratedImage(result.imageUrl)
      } else if (result.imageData) {
        // Handle base64 image data (without data: prefix)
        setGeneratedImage(`data:image/png;base64,${result.imageData}`)
      } else {
        // No image generated - show message
        Alert.alert(
          'Image Generation',
          result.message || 'Image generation service is temporarily unavailable.',
          [{ text: 'OK' }]
        )
      }
    } catch (error: any) {
      console.error('Image generation error:', error)
      
      // Extract error message from backend response
      let errorMessage = 'Failed to generate image'
      let errorDetails = ''
      
      // Check if it's a safety filter error
      if (error.response?.data?.error?.includes('safety filters') || 
          error.response?.data?.error?.includes('blocked by safety')) {
        errorMessage = 'Image blocked by safety filters'
        errorDetails = 'Your prompt may contain content that violates safety policies. Try rephrasing (e.g., avoid words like "child" or other sensitive terms).'
      }
      let suggestion = ''
      
      if (error.response?.data) {
        // Backend returned structured error
        errorMessage = error.response.data.error || error.message || errorMessage
        errorDetails = error.response.data.details || ''
        suggestion = error.response.data.suggestion || ''
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Show user-friendly error message
      const fullMessage = suggestion 
        ? `${errorMessage}\n\n${suggestion}`
        : errorDetails
        ? `${errorMessage}\n\n${errorDetails}`
        : errorMessage
      
      Alert.alert('Image Generation Error', fullMessage, [{ text: 'OK' }])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToGallery = async () => {
    if (!generatedImage) {
      Alert.alert('Error', 'No image to save')
      return
    }

    try {
      setSaving(true)
      
      // Request media library permissions (only photos, not audio)
      // Check current permissions first
      const currentStatus = await MediaLibrary.getPermissionsAsync()
      let status = currentStatus.status
      
      // Only request if not already granted
      if (status !== 'granted') {
        const result = await MediaLibrary.requestPermissionsAsync()
        status = result.status
      }
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your gallery.')
        return
      }

      let imageUri = generatedImage
      
      // If it's a base64 image, save it to a file first
      if (generatedImage.startsWith('data:image')) {
        const base64Data = generatedImage.split(',')[1]
        const fileUri = FileSystem.documentDirectory + `art_${Date.now()}.png`
        
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: 'base64' as FileSystemEncoding,
        })
        
        imageUri = fileUri
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(imageUri)
      await MediaLibrary.createAlbumAsync('Voice to Art', asset, false)
      
      Alert.alert('Success', 'Image saved to gallery!')
    } catch (error: any) {
      console.error('Error saving image:', error)
      Alert.alert('Error', `Failed to save image: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inputSection}>
        <View style={styles.inputHeader}>
          <Text style={styles.label}>Describe your art:</Text>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.voiceButtonText}>
              {isRecording ? '⏹ Stop Recording' : '🎤 Voice Input'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., A serene sunset over mountains with purple and orange skies"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording... Speak your description</Text>
          </View>
        )}
      </View>

      <View style={styles.styleSection}>
        <Text style={styles.label}>Style:</Text>
        <View style={styles.styleButtons}>
          {['realistic', 'artistic', 'cartoon', 'abstract', 'photographic'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.styleButton, style === s && styles.styleButtonActive]}
              onPress={() => setStyle(s)}
            >
              <Text style={[styles.styleButtonText, style === s && styles.styleButtonTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.generateButton, (loading || !prompt.trim()) && styles.generateButtonDisabled]}
        onPress={handleGenerate}
        disabled={loading || !prompt.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>✨ Create Art</Text>
        )}
      </TouchableOpacity>

      {generatedImage && (
        <View style={styles.imageSection}>
          <View style={styles.imageHeader}>
            <Text style={styles.resultTitle}>Generated Image:</Text>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#667eea" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>💾 Save to Gallery</Text>
              )}
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: generatedImage }} 
            style={styles.generatedImage}
            resizeMode="contain"
            onError={(error) => {
              console.error('Image load error:', error.nativeEvent?.error || error)
              // Don't show alert for placeholder images - they're expected fallbacks
              if (!generatedImage.includes('placeholder') && !generatedImage.includes('data:image/svg')) {
                Alert.alert('Error', 'Failed to load image. Please try generating again.')
              }
            }}
          />
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Tip: Be descriptive! Include details about colors, mood, composition, and style for best results.
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceButton: {
    backgroundColor: '#764ba2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#f44336',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f44336',
    marginRight: 8,
  },
  recordingText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  styleSection: {
    marginBottom: 24,
  },
  styleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  styleButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  styleButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  styleButtonTextActive: {
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
    minWidth: 200,
    maxWidth: 400,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },
  generatedImage: {
    width: '100%',
    maxWidth: 600,
    height: 300,
    borderRadius: 8,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    color: '#1976d2',
    fontSize: 14,
    lineHeight: 20,
  },
})

export default VoiceToImageScreen

