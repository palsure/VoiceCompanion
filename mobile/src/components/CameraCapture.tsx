import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native'
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'

interface CameraCaptureProps {
  active: boolean
  onToggle: (active: boolean) => void
  onImageCapture?: (imageData: string | null) => void
  showPickImageButton?: boolean
}

const CameraCapture = ({ active, onToggle, onImageCapture, showPickImageButton = true }: CameraCaptureProps) => {
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>('back')
  const [imageUri, setImageUri] = useState<string | null>(null)

  useEffect(() => {
    onToggle(active && permission?.granted === true)
  }, [active, permission?.granted])

  const handleRequestPermission = async () => {
    const result = await requestPermission()
    if (!result.granted) {
      Alert.alert(
        'Camera Permission Required',
        'VoiceCompanion needs camera access to help you see and read documents.'
      )
    }
  }

  const handleCapture = async () => {
    if (!permission?.granted) {
      await handleRequestPermission()
      return
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`
        setImageUri(base64Image)
        if (onImageCapture) {
          onImageCapture(base64Image)
        }
      }
    } catch (error) {
      console.error('Camera capture error:', error)
      Alert.alert('Error', 'Failed to capture image')
    }
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`
      setImageUri(base64Image)
      if (onImageCapture) {
        onImageCapture(base64Image)
      }
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
        <Text style={styles.placeholder}>
          Camera permission is required for visual assistance
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={handleRequestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => onToggle(!active)}
        >
          <Text style={styles.buttonText}>
            {active ? '📷 Stop Camera' : '📷 Start Camera'}
          </Text>
        </TouchableOpacity>

        {active && (
          <>
            <View style={{ width: 8 }} />
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
            >
              <Text style={styles.buttonText}>📸 Capture</Text>
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            {showPickImageButton && (
              <TouchableOpacity
                style={styles.pickButton}
                onPress={handlePickImage}
              >
                <Text style={styles.buttonText}>🖼️ Pick</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {active && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
          />
        </View>
      )}

      {imageUri && (
        <View style={styles.imageReady}>
          <Text style={styles.imageReadyText}>✅ Image captured and ready</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setImageUri(null)
              if (onImageCapture) {
                onImageCapture(null)
              }
            }}
          >
            <Text style={styles.clearButtonText}>Clear Image</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  toggleButton: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  captureButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  pickButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#ff9800',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cameraContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
  },
  camera: {
    flex: 1,
  },
  placeholder: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  permissionButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  imageReady: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  imageReadyText: {
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  clearButton: {
    backgroundColor: '#f44336',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
})

export default CameraCapture
