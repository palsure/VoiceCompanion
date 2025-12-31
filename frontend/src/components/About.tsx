import FeatureInfoIcon from './FeatureInfoIcon'
import './About.css'

interface AboutProps {
  onNavigate: (page: string) => void
}

const About = ({ onNavigate }: AboutProps) => {
  const features = [
    {
      name: 'Voice to Art',
      description: 'Transform your voice descriptions into stunning AI-generated artwork using Google Imagen',
      icon: '🎨'
    },
    {
      name: 'Image to Voice',
      description: 'Get detailed, natural language descriptions of images using Google Vision and Gemini AI',
      icon: '📸'
    },
    {
      name: 'Script to Music',
      description: 'Convert your lyrics or text into beautiful music compositions',
      icon: '🎵'
    },
    {
      name: 'Real-Time Guidance',
      description: 'Continuous voice guidance for safe navigation using camera stream analysis',
      icon: '🧭'
    },
    {
      name: 'Voice Guided Shopping',
      description: 'Identify products, read labels, and get shopping assistance through voice commands',
      icon: '🛒'
    },
    {
      name: 'Language Learning',
      description: 'Practice languages with intelligent feedback and personalized scenarios',
      icon: '📚'
    }
  ]

  const technologies = [
    {
      name: 'ElevenLabs',
      description: 'Natural voice interaction, speech-to-text, and text-to-speech',
      category: 'Voice AI'
    },
    {
      name: 'Google Cloud Gemini',
      description: 'Multimodal AI for understanding context, generating descriptions, and intelligent responses',
      category: 'AI/ML'
    },
    {
      name: 'Google Imagen',
      description: 'Advanced text-to-image generation for creating artwork from descriptions',
      category: 'Image Generation'
    },
    {
      name: 'Google Cloud Vision API',
      description: 'Image analysis and object detection for accessibility features',
      category: 'Computer Vision'
    },
    {
      name: 'React & TypeScript',
      description: 'Modern web framework for responsive and accessible user interfaces',
      category: 'Frontend'
    },
    {
      name: 'Web Speech API',
      description: 'Browser-native speech recognition and synthesis for voice mode',
      category: 'Browser APIs'
    }
  ]

  return (
    <div className="about-page">
      <div className="about-header">
        <div className="header-content">
          <div className="about-icon">👁️</div>
          <div className="header-text">
            <div className="header-title-row">
              <h1 className="about-title">About VoiceCompanion</h1>
              <FeatureInfoIcon
                title="About VoiceCompanion"
                description="VoiceCompanion is an intelligent, voice-driven assistant designed to make technology more accessible, especially for visually impaired users, while providing powerful creative tools for everyone."
                howItWorks={[
                  'Voice Mode enables complete hands-free navigation using "Hey Companion" wake word',
                  'All features work seamlessly with voice commands and screen readers',
                  'AI-powered features use Google Cloud Gemini, Imagen, and Vision APIs',
                  'ElevenLabs powers all text-to-speech features with natural, human-like voices',
                  'ElevenLabs Music Generation API creates professional-quality music compositions',
                  'The "Invisible Interface" allows users to interact without seeing the screen'
                ]}
                features={[
                  'Complete voice navigation system',
                  'Accessibility-first design',
                  'ElevenLabs integration for high-quality voice synthesis across all features',
                  'ElevenLabs Music Generation for Script to Music feature',
                  'AI-powered creative tools',
                  'Real-time guidance and assistance',
                  'Language learning with feedback',
                  'Multimodal AI capabilities'
                ]}
              />
            </div>
            <p className="about-subtitle">An intelligent, voice-driven assistant for accessibility and creativity</p>
          </div>
        </div>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-text">
            VoiceCompanion is designed to make technology more accessible, especially for visually impaired users, 
            while providing powerful creative tools for everyone. We combine cutting-edge AI with intuitive voice 
            interfaces to create an "Invisible Interface" that works naturally with your voice.
          </p>
        </section>

        <section className="about-section">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-large">{feature.icon}</div>
                <h3 className="feature-name">{feature.name}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2 className="section-title">Technologies Used</h2>
          <div className="technologies-grid">
            {technologies.map((tech, index) => (
              <div key={index} className="tech-card">
                <div className="tech-header">
                  <h3 className="tech-name">{tech.name}</h3>
                  <span className="tech-category">{tech.category}</span>
                </div>
                <p className="tech-description">{tech.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2 className="section-title">Accessibility</h2>
          <p className="section-text">
            VoiceCompanion is built with accessibility at its core. Our voice mode allows complete hands-free 
            navigation, and all features are designed to work seamlessly with screen readers and voice commands. 
            We believe technology should be accessible to everyone, regardless of ability.
          </p>
        </section>

        <div className="about-actions">
          <button 
            className="back-to-home-button"
            onClick={() => onNavigate('home')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default About

