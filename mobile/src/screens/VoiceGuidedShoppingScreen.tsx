import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import CameraCapture from '../components/CameraCapture'
import * as Speech from 'expo-speech'
import { shoppingApi } from '../services/api'
import FeatureInfoIcon from '../components/FeatureInfoIcon'

type VoiceGuidedShoppingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VoiceGuidedShopping'>

interface Props {
  navigation: VoiceGuidedShoppingScreenNavigationProp
}

const VoiceGuidedShoppingScreen = ({ navigation }: Props) => {
  const [cameraActive, setCameraActive] = useState(false)
  const [simulationActive, setSimulationActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [productInfo, setProductInfo] = useState<any>(null)
  const [assistance, setAssistance] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentSimulationProduct, setCurrentSimulationProduct] = useState(0)
  const [shoppingHistory, setShoppingHistory] = useState<Array<{
    product: string
    info: any
    assistance: string
  }>>([])

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const SIMULATION_PRODUCTS = [
    {
      name: 'Organic Coffee Beans',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600',
      productInfo: { description: 'Premium organic coffee beans', price: '$24.99', brand: 'Colombian Gold' },
      assistance:
        'This is a premium organic coffee product. The price is $24.99 for a 12oz bag. It contains 100% Arabica coffee beans and is organic certified.',
    },
    {
      name: 'Fresh Avocados',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600',
      productInfo: { description: 'Fresh Hass avocados', price: '$2.99 each', brand: 'Fresh Farm' },
      assistance:
        'These are fresh Hass avocados, priced at $2.99 each. They appear ripe and ready to eat. Perfect for toast or guacamole.',
    },
    {
      name: 'Organic Honey',
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600',
      productInfo: { description: 'Pure organic wildflower honey', price: '$12.99', brand: "Nature's Best" },
      assistance:
        "This is pure organic wildflower honey, priced at $12.99 for a 16oz jar. It's 100% pure with no additives. Great natural sweetener.",
    },
    {
      name: 'Whole Grain Bread',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
      productInfo: { description: 'Fresh baked whole grain bread', price: '$4.99', brand: 'Bakery Fresh' },
      assistance:
        "This is whole grain bread, priced at $4.99. It's a healthy option with fiber and nutrients—great for sandwiches and toast.",
    },
  ]

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current)
      Speech.stop()
    }
  }, [])

  const handleImageCapture = (imageData: string | null) => {
    setCapturedImage(imageData)
    if (imageData) {
      setProductInfo(null)
      setAssistance(null)
      setQuestion('')
    }
  }

  const handleAnalyzeProduct = async (customQuestion?: string) => {
    if (!capturedImage) {
      Alert.alert('Error', 'Please capture or select an image first')
      return
    }

    setLoading(true)
    setProductInfo(null)
    setAssistance(null)

    try {
      const query = customQuestion || question || undefined
      const result = await shoppingApi.assist(capturedImage, query)
      
      setProductInfo(result.productInfo)
      setAssistance(result.assistance)
      
      // Add to shopping history
      if (result.productInfo?.description || result.assistance) {
        setShoppingHistory(prev => [{
          product: result.productInfo?.description || 'Product',
          info: result.productInfo,
          assistance: result.assistance,
        }, ...prev.slice(0, 4)]) // Keep last 5 items
      }
      
      // Automatically speak the assistance
      if (result.assistance) {
        handleSpeakAssistance(result.assistance)
      }
    } catch (error: any) {
      console.error('Shopping assistance error:', error)
      Alert.alert('Error', error.message || 'Failed to analyze product')
    } finally {
      setLoading(false)
    }
  }

  const handleSpeakAssistance = (text?: string) => {
    const textToSpeak = text || assistance
    if (!textToSpeak) return

    setIsSpeaking(true)
    Speech.speak(textToSpeak, {
      language: 'en',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
  }

  const handleStopSpeaking = () => {
    Speech.stop()
    setIsSpeaking(false)
  }

  const loadSimulationProduct = (index: number) => {
    const item = SIMULATION_PRODUCTS[index]
    if (!item) return
    setCapturedImage(item.image)
    setProductInfo(item.productInfo)
    setAssistance(item.assistance)
    setQuestion('')
    setShoppingHistory((prev) => [
      { product: item.productInfo.description || 'Product', info: item.productInfo, assistance: item.assistance },
      ...prev.slice(0, 4),
    ])
    setTimeout(() => handleSpeakAssistance(item.assistance), 500)
  }

  const handleStartSimulation = () => {
    setSimulationActive(true)
    setCameraActive(false)
    setCurrentSimulationProduct(0)
    loadSimulationProduct(0)
    simulationIntervalRef.current = setInterval(() => {
      setCurrentSimulationProduct((prev) => {
        const next = (prev + 1) % SIMULATION_PRODUCTS.length
        loadSimulationProduct(next)
        return next
      })
    }, 8000)
  }

  const handleStopSimulation = () => {
    setSimulationActive(false)
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }
    setCapturedImage(null)
    setProductInfo(null)
    setAssistance(null)
    setQuestion('')
    Speech.stop()
    setIsSpeaking(false)
  }

  const quickQuestions = [
    'What is this product?',
    'What is the price?',
    'What are the ingredients?',
    'Is this on sale?',
    'Compare with similar products',
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>🛒 Voice Guided Shopping</Text>
          <FeatureInfoIcon
            title="Voice Guided Shopping"
            description="Capture products and get intelligent shopping assistance through voice."
            howItWorks={[
              'Use camera to capture a product (or start Simulation to demo)',
              'AI extracts product details and answers questions (price, ingredients, comparisons)',
              'ElevenLabs text-to-speech reads the assistance aloud',
              'Review recent items in Shopping History',
            ]}
            features={[
              'ElevenLabs-powered voice narration',
              'Quick question buttons',
              'Simulation mode for demos',
              'Shopping history',
            ]}
          />
        </View>
        <Text style={styles.subtitle}>
          Capture products and get detailed voice descriptions, prices, and shopping assistance
        </Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.simButton, simulationActive && styles.simButtonActive]}
          onPress={simulationActive ? handleStopSimulation : handleStartSimulation}
          activeOpacity={0.85}
        >
          <Text style={styles.simButtonText}>
            {simulationActive ? '⏹ Stop Simulation' : '🎬 Start Simulation'}
          </Text>
        </TouchableOpacity>
      </View>

      {!simulationActive && (
        <CameraCapture
          active={cameraActive}
          onToggle={setCameraActive}
          onImageCapture={handleImageCapture}
          showPickImageButton={false}
        />
      )}

      {simulationActive && (
        <View style={styles.simInfo}>
          <Text style={styles.simLabel}>🎬 Simulation Mode</Text>
          <Text style={styles.simName}>
            Product {currentSimulationProduct + 1} of {SIMULATION_PRODUCTS.length}:{' '}
            {SIMULATION_PRODUCTS[currentSimulationProduct]?.name}
          </Text>
        </View>
      )}

      {capturedImage && (
        <View style={styles.actionSection}>
          <Text style={styles.label}>Ask a question (optional):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., What is the price? What are the ingredients?"
            value={question}
            onChangeText={setQuestion}
            multiline
            numberOfLines={2}
          />
          
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsLabel}>Quick questions:</Text>
            <View style={styles.quickQuestions}>
              {quickQuestions.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickQuestionButton}
                  onPress={() => {
                    setQuestion(q)
                    handleAnalyzeProduct(q)
                  }}
                >
                  <Text style={styles.quickQuestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
            onPress={() => handleAnalyzeProduct()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeButtonText}>🔍 Analyze Product</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {assistance && (
        <View style={styles.resultSection}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Shopping Assistance:</Text>
            <View style={styles.speechControls}>
              {isSpeaking ? (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleStopSpeaking}
                >
                  <Text style={styles.stopButtonText}>⏹ Stop</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => handleSpeakAssistance()}
                >
                  <Text style={styles.speakButtonText}>🔊 Read Aloud</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.assistanceBox}>
            <Text style={styles.assistanceText}>{assistance}</Text>
          </View>
        </View>
      )}

      {productInfo && (
        <View style={styles.productInfoSection}>
          <Text style={styles.sectionTitle}>Product Details:</Text>
          
          {productInfo.text && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>📝 Text Found:</Text>
              <Text style={styles.infoText}>{productInfo.text}</Text>
            </View>
          )}

          {productInfo.objects && productInfo.objects.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>🏷️ Objects Detected:</Text>
              {productInfo.objects.map((obj: any, idx: number) => (
                <Text key={idx} style={styles.infoText}>
                  • {obj.name} ({Math.round(obj.confidence * 100)}% confidence)
                </Text>
              ))}
            </View>
          )}

          {productInfo.description && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>📄 Description:</Text>
              <Text style={styles.infoText}>{productInfo.description}</Text>
            </View>
          )}
        </View>
      )}

      {shoppingHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Products:</Text>
          {shoppingHistory.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.historyItem}
              onPress={() => {
                setProductInfo(item.info)
                setAssistance(item.assistance)
                handleSpeakAssistance(item.assistance)
              }}
            >
              <Text style={styles.historyItemText}>{item.product}</Text>
              <Text style={styles.historyItemSubtext}>Tap to review</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          💡 Use this feature to:
          {'\n'}• Identify products and read labels
          {'\n'}• Check prices and compare items
          {'\n'}• Read ingredients and nutritional info
          {'\n'}• Get shopping recommendations
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
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
  controlsRow: {
    marginBottom: 12,
  },
  simButton: {
    backgroundColor: '#764ba2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simButtonActive: {
    backgroundColor: '#f44336',
  },
  simButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  simInfo: {
    backgroundColor: '#fff9e6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ff9800',
    marginBottom: 16,
  },
  simLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ff9800',
    marginBottom: 6,
  },
  simName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  quickQuestionsContainer: {
    marginBottom: 16,
  },
  quickQuestionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickQuestionButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  quickQuestionText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500',
  },
  analyzeButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
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
  assistanceBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  assistanceText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  productInfoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  historySection: {
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  historyItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  historyItemSubtext: {
    fontSize: 12,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoBoxText: {
    color: '#1976d2',
    fontSize: 14,
    lineHeight: 20,
  },
})

export default VoiceGuidedShoppingScreen

