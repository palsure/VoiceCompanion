import { useState, useEffect, useRef } from 'react'
import { shoppingApi } from '../services/api'
import CameraCapture from './CameraCapture'
import FeatureInfoIcon from './FeatureInfoIcon'
import './VoiceGuidedShopping.css'

// Simulation products for demo
const SIMULATION_PRODUCTS = [
  {
    id: 1,
    name: 'Organic Coffee Beans',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
    description: 'Premium organic coffee beans from Colombia',
    price: '$24.99',
    brand: 'Colombian Gold',
    ingredients: '100% Arabica coffee beans, organic certified',
    assistance: 'This is a premium organic coffee product. The price is $24.99 for a 12oz bag. It contains 100% Arabica coffee beans and is organic certified. Great value for quality coffee lovers.',
  },
  {
    id: 2,
    name: 'Fresh Avocados',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
    description: 'Fresh Hass avocados, ripe and ready',
    price: '$2.99 each',
    brand: 'Fresh Farm',
    ingredients: 'Fresh Hass avocados',
    assistance: 'These are fresh Hass avocados, priced at $2.99 each. They appear ripe and ready to eat. Perfect for salads, toast, or guacamole. Good source of healthy fats.',
  },
  {
    id: 3,
    name: 'Organic Honey',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
    description: 'Pure organic wildflower honey',
    price: '$12.99',
    brand: 'Nature\'s Best',
    ingredients: '100% pure organic wildflower honey',
    assistance: 'This is pure organic wildflower honey, priced at $12.99 for a 16oz jar. It\'s 100% pure with no additives. Great for natural sweetening and has antibacterial properties.',
  },
  {
    id: 4,
    name: 'Whole Grain Bread',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    description: 'Fresh baked whole grain bread',
    price: '$4.99',
    brand: 'Bakery Fresh',
    ingredients: 'Whole wheat flour, water, yeast, salt, honey',
    assistance: 'This is fresh baked whole grain bread, priced at $4.99. Made with whole wheat flour, it\'s a healthy option with fiber and nutrients. Great for sandwiches or toast.',
  },
]

const VoiceGuidedShopping = () => {
  const [cameraActive, setCameraActive] = useState(false)
  const [simulationActive, setSimulationActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [productInfo, setProductInfo] = useState<any>(null)
  const [assistance, setAssistance] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSimulationProduct, setCurrentSimulationProduct] = useState(0)
  const [shoppingHistory, setShoppingHistory] = useState<Array<{
    product: string
    info: any
    assistance: string
  }>>([])
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleImageCapture = (imageData: string | null) => {
    setCapturedImage(imageData)
    if (imageData) {
      setProductInfo(null)
      setAssistance(null)
      setQuestion('')
    }
  }

  const handleStartSimulation = () => {
    setSimulationActive(true)
    setCameraActive(false)
    setCurrentSimulationProduct(0)
    loadSimulationProduct(0)
    
    // Cycle through products every 8 seconds
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
  }

  const loadSimulationProduct = (index: number) => {
    const product = SIMULATION_PRODUCTS[index]
    if (product) {
      setCapturedImage(product.image)
      setProductInfo({
        description: product.description,
        price: product.price,
        brand: product.brand,
        ingredients: product.ingredients,
      })
      setAssistance(product.assistance)
      setQuestion('')
      
      // Automatically speak the assistance
      setTimeout(() => {
        handleSpeakAssistance(product.assistance)
      }, 500)
    }
  }

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [])

  const handleAnalyzeProduct = async (customQuestion?: string) => {
    if (!capturedImage) {
      alert('Please capture an image first')
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
        }, ...prev.slice(0, 4)])
      }
      
      // Automatically speak the assistance
      if (result.assistance) {
        handleSpeakAssistance(result.assistance)
      }
    } catch (error: any) {
      console.error('Shopping assistance error:', error)
      alert(error.message || 'Failed to analyze product')
    } finally {
      setLoading(false)
    }
  }

  const handleSpeakAssistance = async (text?: string) => {
    const textToSpeak = text || assistance
    if (!textToSpeak) return

    try {
      // Use Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel() // Stop any ongoing speech
        const utterance = new SpeechSynthesisUtterance(textToSpeak)
        utterance.rate = 0.85
        utterance.pitch = 1.0
        utterance.onstart = () => setIsPlaying(true)
        utterance.onend = () => setIsPlaying(false)
        utterance.onerror = () => setIsPlaying(false)
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error('Speech error:', error)
    }
  }

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }

  const quickQuestions = [
    'What is this product?',
    'What is the price?',
    'What are the ingredients?',
    'Is this on sale?',
    'Compare with similar products',
  ]

  return (
    <div className="voice-guided-shopping">
      <div className="section-header">
        <div className="header-content">
          <div className="header-icon">🛒</div>
          <div className="header-text">
            <div className="header-title-row">
              <h1 className="header-title">Voice Guided Shopping</h1>
              <FeatureInfoIcon
                title="Voice Guided Shopping"
                description="Get intelligent shopping assistance by capturing product images. Identify products, read labels, compare prices, and get recommendations through voice."
                howItWorks={[
                  'Capture a product image using your camera',
                  'AI analyzes the product and extracts information using Google Cloud Vision',
                  'Ask questions about price, ingredients, features, or comparisons',
                  'Get detailed product information and shopping recommendations',
                  'ElevenLabs text-to-speech reads all information aloud with natural voice',
                  'View shopping history of previously analyzed products'
                ]}
                features={[
                  'Product identification and recognition',
                  'Label reading and ingredient analysis',
                  'Price comparison suggestions',
                  'ElevenLabs-powered voice narration for hands-free shopping',
                  'Voice-based shopping assistance',
                  'Quick question buttons for common queries',
                  'Shopping history tracking'
                ]}
              />
            </div>
            <p className="header-subtitle">Capture products and get detailed voice descriptions, prices, and shopping assistance</p>
          </div>
        </div>
      </div>

      <div className="shopping-controls">
        <button
          className={`simulation-button ${simulationActive ? 'active' : ''}`}
          onClick={simulationActive ? handleStopSimulation : handleStartSimulation}
        >
          {simulationActive ? '⏹ Stop Simulation' : '🎬 Start Simulation'}
        </button>
        {!simulationActive && (
          <button
            className="camera-toggle-button"
            onClick={() => setCameraActive(!cameraActive)}
            aria-label={cameraActive ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraActive ? '📷 Stop Camera' : '📷 Start Camera'}
          </button>
        )}
      </div>

      {!simulationActive && (
        <CameraCapture
          active={cameraActive}
          onToggle={setCameraActive}
          onImageCapture={handleImageCapture}
          showUploadButton={false}
          hideToggleButton={true}
        />
      )}

      {simulationActive && (
        <div className="simulation-info">
          <div className="simulation-product-indicator">
            <span className="simulation-label">🎬 Simulation Mode</span>
            <span className="simulation-product-name">
              Product {currentSimulationProduct + 1} of {SIMULATION_PRODUCTS.length}: {SIMULATION_PRODUCTS[currentSimulationProduct]?.name}
            </span>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="product-analysis-section">
          <div className="image-preview-header">
            <h3>Captured Product</h3>
            <button className="clear-button" onClick={() => setCapturedImage(null)}>
              ✕ Clear
            </button>
          </div>
          <img src={capturedImage} alt="Product" className="preview-image" />

          <div className="question-section">
            <h3>Ask a Question (Optional)</h3>
            <input
              type="text"
              className="question-input"
              placeholder="e.g., What is the price? What are the ingredients?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            
            <div className="quick-questions">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  className="quick-question-button"
                  onClick={() => handleAnalyzeProduct(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>

            <button
              className="analyze-button"
              onClick={() => handleAnalyzeProduct()}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : '🔍 Analyze Product'}
            </button>
          </div>

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Analyzing product...</p>
            </div>
          )}

          {productInfo && (
            <div className="product-info-section">
              <h3>Product Information</h3>
              <div className="product-details">
                {productInfo.description && (
                  <p><strong>Description:</strong> {productInfo.description}</p>
                )}
                {productInfo.price && (
                  <p><strong>Price:</strong> {productInfo.price}</p>
                )}
                {productInfo.brand && (
                  <p><strong>Brand:</strong> {productInfo.brand}</p>
                )}
              </div>
            </div>
          )}

          {assistance && (
            <div className="assistance-section">
              <h3>Shopping Assistance</h3>
              <p className="assistance-text">{assistance}</p>
              <div className="voice-controls">
                {isPlaying ? (
                  <button className="stop-button" onClick={handleStopSpeaking}>
                    ⏹ Stop Voice
                  </button>
                ) : (
                  <button
                    className="play-button"
                    onClick={() => handleSpeakAssistance()}
                  >
                    🔊 Play Assistance
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {shoppingHistory.length > 0 && (
        <div className="shopping-history">
          <h3>Shopping History</h3>
          <div className="history-list">
            {shoppingHistory.map((item, idx) => (
              <div key={idx} className="history-item">
                <p className="history-product">{item.product}</p>
                <p className="history-assistance">{item.assistance}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!capturedImage && !simulationActive && (
        <div className="instruction-box">
          <p>💡 Start the simulation to see how it works, or enable the camera to capture real product images and get shopping assistance.</p>
        </div>
      )}
    </div>
  )
}

export default VoiceGuidedShopping

