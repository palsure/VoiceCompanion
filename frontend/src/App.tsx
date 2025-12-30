import { useState } from 'react'
import VoiceConversation from './components/VoiceConversation'
import FeedbackPanel from './components/FeedbackPanel'
import ProgressTracker from './components/ProgressTracker'
import ScenarioSelector from './components/ScenarioSelector'
import CameraCapture from './components/CameraCapture'
import VoiceToArt from './components/VoiceToArt'
import ImageToVoice from './components/ImageToVoice'
import RealTimeGuidance from './components/RealTimeGuidance'
import VoiceGuidedShopping from './components/VoiceGuidedShopping'
import HomePage from './components/HomePage'
import AnimatedLogo from './components/AnimatedLogo'
import ScriptToMusic from './components/ScriptToMusic'
import './App.css'

type Page = 'home' | 'accessibility' | 'learning' | 'voice-to-art' | 'image-to-voice' | 'script-to-music' | 'real-time-guidance' | 'voice-guided-shopping'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('spanish')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('beginner')
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  return (
    <div className="app" role="main">
      <header className="app-header" role="banner">
        <div className="header-content">
          <AnimatedLogo size={96} />
          <div className="header-text">
            <h1>VoiceCompanion</h1>
            <p>Your Intelligent Voice Assistant for Accessibility & Learning</p>
          </div>
          {currentPage !== 'home' && (
            <button className="back-button" onClick={handleBackToHome} aria-label="Back to home">
              ← Back to Home
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'home' ? (
          <HomePage onNavigate={handleNavigate} />
        ) : currentPage === 'voice-to-art' ? (
          <div className="app-content voice-to-art-content">
            <div className="left-panel full-width">
              <VoiceToArt />
            </div>
          </div>
        ) : currentPage === 'image-to-voice' ? (
          <div className="app-content voice-to-art-content">
            <div className="left-panel full-width">
              <ImageToVoice />
            </div>
          </div>
        ) : currentPage === 'script-to-music' ? (
          <div className="app-content voice-to-art-content">
            <div className="left-panel full-width">
              <ScriptToMusic />
            </div>
          </div>
        ) : currentPage === 'real-time-guidance' ? (
          <div className="app-content voice-to-art-content">
            <div className="left-panel full-width">
              <RealTimeGuidance />
            </div>
          </div>
        ) : currentPage === 'voice-guided-shopping' ? (
          <div className="app-content voice-to-art-content">
            <div className="left-panel full-width">
              <VoiceGuidedShopping />
            </div>
          </div>
        ) : currentPage === 'learning' ? (
          <div className="app-content">
            <div className="left-panel">
              <ScenarioSelector
                selectedScenario={selectedScenario}
                onSelectScenario={setSelectedScenario}
                selectedLanguage={selectedLanguage}
                onSelectLanguage={setSelectedLanguage}
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={setSelectedDifficulty}
              />
              <VoiceConversation
                scenario={selectedScenario}
                onFeedback={setCurrentFeedback}
                mode="learning"
                targetLanguage={selectedLanguage}
                difficulty={selectedDifficulty}
              />
            </div>

            <div className="right-panel">
              <FeedbackPanel feedback={currentFeedback} targetLanguage={selectedLanguage} />
              <ProgressTracker />
            </div>
          </div>
        ) : (
          <div className="app-content">
            <div className="left-panel">
              <CameraCapture
                active={cameraActive}
                onToggle={setCameraActive}
                onImageCapture={setCapturedImage}
              />
              <VoiceConversation
                scenario={null}
                onFeedback={setCurrentFeedback}
                mode="accessibility"
                capturedImage={capturedImage}
              />
            </div>

            <div className="right-panel">
              <FeedbackPanel feedback={currentFeedback} />
            </div>
          </div>
        )}
      </main>
      
      <footer className="app-footer" role="contentinfo">
        <p>Built with ❤️ using ElevenLabs Agents & Google Cloud Gemini</p>
      </footer>
    </div>
  )
}

export default App

