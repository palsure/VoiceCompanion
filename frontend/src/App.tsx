import { useState } from 'react'
import { VoiceModeProvider, useVoiceMode } from './contexts/VoiceModeContext'
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
import About from './components/About'
import FeatureInfoIcon from './components/FeatureInfoIcon'
import './App.css'

type Page = 'home' | 'accessibility' | 'learning' | 'voice-to-art' | 'image-to-voice' | 'script-to-music' | 'real-time-guidance' | 'voice-guided-shopping' | 'about'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('spanish')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('beginner')
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const handleNavigate = (page: string) => {
    console.log('📍 handleNavigate called in App.tsx with page:', page, 'currentPage:', currentPage)
    setCurrentPage(page as Page)
    console.log('📍 Page state updated to:', page)
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  return (
    <VoiceModeProvider onNavigate={handleNavigate} currentPage={currentPage}>
      <AppContent 
        currentPage={currentPage}
        handleNavigate={handleNavigate}
        handleBackToHome={handleBackToHome}
        selectedScenario={selectedScenario}
        setSelectedScenario={setSelectedScenario}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        currentFeedback={currentFeedback}
        setCurrentFeedback={setCurrentFeedback}
        cameraActive={cameraActive}
        setCameraActive={setCameraActive}
        capturedImage={capturedImage}
        setCapturedImage={setCapturedImage}
      />
    </VoiceModeProvider>
  )
}

interface AppContentProps {
  currentPage: Page
  handleNavigate: (page: string) => void
  handleBackToHome: () => void
  selectedScenario: string | null
  setSelectedScenario: (scenario: string | null) => void
  selectedLanguage: string
  setSelectedLanguage: (language: string) => void
  selectedDifficulty: string
  setSelectedDifficulty: (difficulty: string) => void
  currentFeedback: any
  setCurrentFeedback: (feedback: any) => void
  cameraActive: boolean
  setCameraActive: (active: boolean) => void
  capturedImage: string | null
  setCapturedImage: (image: string | null) => void
}

const AppContent = ({
  currentPage,
  handleNavigate,
  handleBackToHome,
  selectedScenario,
  setSelectedScenario,
  selectedLanguage,
  setSelectedLanguage,
  selectedDifficulty,
  setSelectedDifficulty,
  currentFeedback,
  setCurrentFeedback,
  cameraActive,
  setCameraActive,
  capturedImage,
  setCapturedImage
}: AppContentProps) => {
  const { isVoiceModeEnabled, toggleVoiceMode, isWakeWordActive } = useVoiceMode()

  return (
    <div className="app" role="main">
      <header className="app-header" role="banner">
        <div className="header-content">
          <button 
            className="logo-button"
            onClick={handleBackToHome}
            aria-label="Go to home page"
          >
            <AnimatedLogo size={96} />
          </button>
          <div className="header-text">
            <h1>VoiceCompanion</h1>
            <p>Your Intelligent Voice Assistant for Accessibility & Learning</p>
          </div>
          <div className="header-actions">
            {/* Voice Mode Toggle */}
            <div className="global-voice-mode-toggle">
              <label className="voice-mode-toggle">
                <span className="voice-mode-label">
                  🎙️ Voice Mode 
                  {isWakeWordActive && <span className="listening-indicator"> (Listening...)</span>}
                  {isVoiceModeEnabled && !isWakeWordActive && <span className="ready-indicator"> (Ready)</span>}
                </span>
                <input
                  type="checkbox"
                  checked={isVoiceModeEnabled}
                  onChange={toggleVoiceMode}
                  className="voice-mode-switch"
                />
                <span className="voice-mode-slider"></span>
              </label>
            </div>
            {currentPage !== 'home' && (
              <button className="back-button" onClick={handleBackToHome} aria-label="Back to home">
                ← Back to Home
              </button>
            )}
            <button 
              className="about-button" 
              onClick={() => handleNavigate('about')}
              aria-label="About VoiceCompanion"
            >
              <span className="about-button-icon">👁️</span> About
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'home' ? (
          <HomePage onNavigate={handleNavigate} />
        ) : currentPage === 'about' ? (
          <About onNavigate={handleNavigate} />
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
          <div className="app-content learning-content">
            <div className="learning-header-section">
              <div className="section-header">
                <div className="header-content">
                  <div className="header-icon">📚</div>
                  <div className="header-text">
                    <div className="header-title-row">
                      <h1 className="header-title">Language Learning</h1>
                      <FeatureInfoIcon
                        title="Language Learning"
                        description="Practice languages with intelligent feedback and personalized scenarios. Get real-time pronunciation feedback and progress tracking."
                        howItWorks={[
                          'Select your target language and difficulty level',
                          'Choose a scenario (restaurant, travel, shopping, etc.)',
                          'Practice conversations in your chosen scenario',
                          'Receive real-time feedback on pronunciation and grammar',
                          'ElevenLabs provides natural voice examples and pronunciation guidance',
                          'Track your progress and achievements',
                          'Learn vocabulary and phrases specific to each scenario'
                        ]}
                        features={[
                          'Multiple languages supported (Spanish, French, German, Italian, and more)',
                          'Scenario-based learning (restaurant, travel, shopping, etc.)',
                          'ElevenLabs text-to-speech for natural pronunciation examples',
                          'Real-time pronunciation feedback',
                          'Progress tracking and achievements',
                          'Difficulty levels (Beginner, Intermediate, Advanced)',
                          'Personalized learning paths'
                        ]}
                      />
                    </div>
                    <p className="header-subtitle">Practice languages with intelligent feedback and personalized scenarios</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="learning-main-content">
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

