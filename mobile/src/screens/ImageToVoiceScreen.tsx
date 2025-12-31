import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { visionApi } from '../services/api'
import { Audio } from 'expo-av'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { useAccessibleScreen, useAccessibleButton } from '../hooks/useAccessibleButton'
import FeatureInfoIcon from '../components/FeatureInfoIcon'

type ImageToVoiceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ImageToVoice'>

interface Props {
  navigation: ImageToVoiceScreenNavigationProp
}

const ImageToVoiceScreen = ({ navigation }: Props) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const { speak } = useAccessibility()

  // Announce screen when accessibility is enabled
  useAccessibleScreen(
    'Image to Voice',
    'Take a photo or load an image from your gallery to get a detailed voice description.'
  )

  useEffect(() => {
    // Request media library permissions on mount
    requestMediaLibraryPermissions()
    
    return () => {
      // Cleanup sound on unmount
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [])

  useEffect(() => {
    // Auto-generate description and voice when image is selected
    if (selectedImage) {
      handleAutoGenerate()
    }
  }, [selectedImage])

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library.'
      )
    }
  }

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera.'
        )
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        const base64Data = result.assets[0].base64
        if (base64Data) {
          const imageData = `data:image/jpeg;base64,${base64Data}`
          setSelectedImage(imageData)
          setDescription(null)
        } else {
          Alert.alert('Error', 'Failed to capture image data')
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        const base64Data = result.assets[0].base64
        if (base64Data) {
          const imageData = `data:image/jpeg;base64,${base64Data}`
          setSelectedImage(imageData)
          setDescription(null)
        } else {
          Alert.alert('Error', 'Failed to load image data')
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to pick image from gallery')
    }
  }


  const handleAutoGenerate = async () => {
    if (!selectedImage) return

    setLoading(true)
    setDescription(null)
    speak('Analyzing image and generating description...', { delay: 300 })

    try {
      // Generate description
      const result = await visionApi.describe(selectedImage)
      const desc = result.description || 'Unable to describe this image.'
      setDescription(desc)
      
      // Announce description when accessibility is enabled
      speak(`Description generated: ${desc}`, { delay: 500 })
      
      // Generate and play voice using ElevenLabs
      await handleGenerateVoice(desc)
    } catch (error: any) {
      console.error('Image description error:', error)
      speak('Failed to describe image. ' + (error.message || 'Please try again.'), { delay: 300 })
      Alert.alert('Error', error.message || 'Failed to describe image')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateVoice = async (text?: string) => {
    const textToSpeak = text || description
    if (!textToSpeak) return

    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.unloadAsync()
        setSound(null)
      }

      // Call backend to generate audio using ElevenLabs
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
        (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')
      
      const response = await fetch(`${API_BASE_URL}/api/text-to-speech/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSpeak }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.message || 'Failed to generate speech')
      }

      // Check if response is actually audio (not JSON error)
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('audio')) {
        const errorData = await response.json().catch(() => ({ error: 'Invalid response format' }))
        throw new Error(errorData.error || errorData.message || 'Invalid response from server')
      }

      // Convert response to base64
      const arrayBuffer = await response.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      // Save to temporary file
      const fileUri = FileSystem.documentDirectory + `speech_${Date.now()}.mp3`
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      })
      
      // Create and play sound with increased volume
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { 
          shouldPlay: true,
          volume: 1.0, // Maximum volume (0.0 to 1.0)
          isMuted: false,
        }
      )
      
      setSound(newSound)
      setIsPlaying(true)

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false)
            // Clean up file after playback
            FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {})
          }
        }
      })
    } catch (error: any) {
      console.error('Voice generation error:', error)
      // Use the actual error message from the backend
      const errorMessage = error.message || 'Failed to generate voice. Please try again.'
      
      Alert.alert('Voice Generation Error', errorMessage)
    }
  }

  const handleStopVoice = async () => {
    if (sound) {
      await sound.stopAsync()
      setIsPlaying(false)
    }
  }

  const handleClearImage = () => {
    setSelectedImage(null)
    setDescription(null)
    if (sound) {
      sound.unloadAsync()
      setSound(null)
    }
    setIsPlaying(false)
    speak('Image cleared')
  }

  const takePhotoButtonProps = useAccessibleButton({
    label: 'Take Photo',
    description: 'Capture a new photo using your camera',
    onPress: handleTakePhoto,
  })

  const loadGalleryButtonProps = useAccessibleButton({
    label: 'Load from Gallery',
    description: 'Select an image from your photo gallery',
    onPress: handlePickFromGallery,
  })

  const clearImageButtonProps = useAccessibleButton({
    label: 'Clear Image',
    description: 'Remove the current image',
    onPress: handleClearImage,
  })

  const playAgainButtonProps = useAccessibleButton({
    label: 'Play Again',
    description: 'Replay the voice description',
    onPress: () => description && handleGenerateVoice(description),
  })

  const stopButtonProps = useAccessibleButton({
    label: 'Stop',
    description: 'Stop the current voice playback',
    onPress: handleStopVoice,
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>📸 Image to Voice</Text>
          <FeatureInfoIcon
            title="Image to Voice"
            description="Turn an image into a detailed description that is read aloud."
            howItWorks={[
              'Take a photo or pick one from your gallery',
              'AI analyzes the image and generates a narrative description',
              'ElevenLabs text-to-speech converts it into natural voice audio',
              'Listen to the voice or read the text',
            ]}
            features={[
              'ElevenLabs-powered narration',
              'Camera + gallery input',
              'Automatic voice playback',
            ]}
          />
        </View>
        <Text style={styles.subtitleCard}>
          Capture or upload an image to get a detailed voice description
        </Text>
      </View>
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.cameraButton}
          {...takePhotoButtonProps}
        >
          <Text style={styles.buttonText}>📷 Take Photo</Text>
        </TouchableOpacity>
        <View style={{ width: 12 }} />
        <TouchableOpacity
          style={styles.galleryButton}
          {...loadGalleryButtonProps}
        >
          <Text style={styles.buttonText}>🖼️ Load from Gallery</Text>
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <View style={styles.imageSection}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.clearButton}
            {...clearImageButtonProps}
          >
            <Text style={styles.clearButtonText}>Clear Image</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Generating description and voice...</Text>
        </View>
      )}

      {description && (
        <View style={styles.resultSection}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Description:</Text>
            <View style={styles.speechControls}>
              {isPlaying ? (
                <TouchableOpacity
                  style={styles.stopButton}
                  {...stopButtonProps}
                >
                  <Text style={styles.stopButtonText}>⏹ Stop</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  {...playAgainButtonProps}
                  style={styles.speakButton}
                  onPress={() => handleGenerateVoice()}
                >
                  <Text style={styles.speakButtonText}>🔊 Play Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 This feature helps visually impaired users understand images through detailed voice descriptions.
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
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subtitleCard: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonSection: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  cameraButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  galleryButton: {
    flex: 1,
    backgroundColor: '#764ba2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'contain',
    backgroundColor: '#e0e0e0',
  },
  clearButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingSection: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  speechControls: {
    flexDirection: 'row',
  },
  speakButton: {
    backgroundColor: '#764ba2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  speakButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stopButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  descriptionBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  descriptionText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
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

export default ImageToVoiceScreen
