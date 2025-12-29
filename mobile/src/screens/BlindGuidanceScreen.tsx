import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as Speech from 'expo-speech'
import { guidanceApi } from '../services/api'

type BlindGuidanceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BlindGuidance'>

interface Props {
  navigation: BlindGuidanceScreenNavigationProp
}

const BlindGuidanceScreen = ({ navigation }: Props) => {
  const [permission, requestPermission] = useCameraPermissions()
  const [isActive, setIsActive] = useState(false)
  const [facing, setFacing] = useState<CameraType>('back')
  const [loading, setLoading] = useState(false)
  const [guidance, setGuidance] = useState<{
    description: string
    hazards: string[]
    navigation: string
    objects: string[]
  } | null>(null)
  const [previousContext, setPreviousContext] = useState<string>('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cameraRef = useRef<any>(null)

  useEffect(() => {
    if (isActive && permission?.granted) {
      // Start continuous guidance updates every 3 seconds
      intervalRef.current = setInterval(() => {
        captureAndAnalyze()
      }, 3000)
      
      // Initial capture
      setTimeout(() => captureAndAnalyze(), 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, permission?.granted])

  const handleRequestPermission = async () => {
    const result = await requestPermission()
    if (!result.granted) {
      Alert.alert(
        'Camera Permission Required',
        'VoiceCompanion needs camera access to provide real-time guidance.'
      )
    }
  }

  const captureAndAnalyze = async () => {
    if (loading) return

    try {
      setLoading(true)
      
      // Capture frame from camera using ImagePicker
      const photo = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
        base64: true,
        exif: false,
      })

      if (!photo.canceled && photo.assets[0]?.base64) {
        const imageData = `data:image/jpeg;base64,${photo.assets[0].base64}`
        
        const result = await guidanceApi.realtime(imageData, previousContext)
        setGuidance(result)
        
        // Update context for next frame
        setPreviousContext(result.description)
        
        // Speak critical information
        if (result.hazards && result.hazards.length > 0) {
          Speech.speak(`Warning: ${result.hazards.join('. ')}`, {
            language: 'en',
            pitch: 1.2,
            rate: 0.9,
          })
        } else if (result.navigation) {
          // Speak navigation guidance
          Speech.speak(result.navigation, {
            language: 'en',
            pitch: 1.0,
            rate: 0.85,
          })
        }
      }
    } catch (error: any) {
      console.error('Guidance capture error:', error)
      // Don't show alert for every frame error to avoid spam
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!permission?.granted) {
      handleRequestPermission()
      return
    }
    setIsActive(!isActive)
    if (!isActive) {
      setGuidance(null)
      setPreviousContext('')
    }
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🧭 Real-Time Guidance</Text>
          <Text style={styles.subtitle}>
            Get voice-guided navigation and obstacle detection
          </Text>
        </View>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required for real-time guidance
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🧭 Real-Time Guidance</Text>
        <Text style={styles.subtitle}>
          Continuous voice guidance for safe navigation
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
        onPress={handleToggle}
      >
        <Text style={styles.toggleButtonText}>
          {isActive ? '⏹ Stop Guidance' : '▶ Start Guidance'}
        </Text>
      </TouchableOpacity>

      {isActive && (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          )}
          <View style={styles.captureHint}>
            <Text style={styles.captureHintText}>
              📸 Auto-capturing every 3 seconds...
            </Text>
          </View>
        </View>
      )}

      {guidance && (
        <View style={styles.guidanceSection}>
          <Text style={styles.sectionTitle}>Current Guidance:</Text>
          
          <View style={styles.guidanceCard}>
            <Text style={styles.guidanceLabel}>Scene:</Text>
            <Text style={styles.guidanceText}>{guidance.description}</Text>
          </View>

          {guidance.hazards && guidance.hazards.length > 0 && (
            <View style={[styles.guidanceCard, styles.hazardCard]}>
              <Text style={[styles.guidanceLabel, styles.hazardLabel]}>⚠️ Hazards:</Text>
              {guidance.hazards.map((hazard, idx) => (
                <Text key={idx} style={styles.hazardText}>• {hazard}</Text>
              ))}
            </View>
          )}

          {guidance.navigation && (
            <View style={[styles.guidanceCard, styles.navigationCard]}>
              <Text style={styles.guidanceLabel}>🧭 Navigation:</Text>
              <Text style={styles.guidanceText}>{guidance.navigation}</Text>
            </View>
          )}

          {guidance.objects && guidance.objects.length > 0 && (
            <View style={styles.guidanceCard}>
              <Text style={styles.guidanceLabel}>Objects:</Text>
              <Text style={styles.guidanceText}>
                {guidance.objects.join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 This feature provides continuous voice guidance, alerting you to obstacles and providing navigation assistance in real-time.
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  toggleButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#f5576c',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 20,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  captureHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    alignItems: 'center',
  },
  captureHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  guidanceSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  guidanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  hazardCard: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  navigationCard: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  guidanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  hazardLabel: {
    color: '#f44336',
  },
  guidanceText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  hazardText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 4,
    lineHeight: 20,
  },
  placeholder: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontSize: 16,
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

export default BlindGuidanceScreen

