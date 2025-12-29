import { useState } from 'react'
import { shoppingApi } from '../services/api'
import CameraCapture from './CameraCapture'
import './VoiceGuidedShopping.css'

const VoiceGuidedShopping = () => {
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [productInfo, setProductInfo] = useState<any>(null)
  const [assistance, setAssistance] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [shoppingHistory, setShoppingHistory] = useState<Array<{
    product: string
    info: any
    assistance: string
  }>>([])

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
        <h2>🛒 Voice Guided Shopping</h2>
        <p>Capture products and get detailed voice descriptions, prices, and shopping assistance</p>
      </div>

      <CameraCapture
        active={cameraActive}
        onToggle={setCameraActive}
        onImageCapture={handleImageCapture}
      />

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

      {!capturedImage && (
        <div className="instruction-box">
          <p>💡 Enable the camera to capture product images and get shopping assistance.</p>
        </div>
      )}
    </div>
  )
}

export default VoiceGuidedShopping

