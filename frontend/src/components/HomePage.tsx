import PaletteIcon from './PaletteIcon'
import './HomePage.css'

interface HomePageProps {
  onNavigate: (page: string) => void
}

const HomePage = ({ onNavigate }: HomePageProps) => {
  const features = [
    {
      id: 'voice-to-art',
      icon: <PaletteIcon size={48} />,
      title: 'Voice to Art',
      description: 'Describe what you want to see, and we\'ll create it',
      color: '#9c27b0',
    },
    {
      id: 'image-to-voice',
      icon: '📸',
      title: 'Image to Voice',
      description: 'Get detailed voice descriptions of images',
      color: '#00bcd4',
    },
    {
      id: 'script-to-music',
      icon: '🎵',
      title: 'Script to Music',
      description: 'Convert your script or text into beautiful music',
      color: '#e91e63',
    },
    {
      id: 'real-time-guidance',
      icon: '🧭',
      title: 'Real-Time Guidance',
      description: 'Continuous voice guidance for safe navigation',
      color: '#4caf50',
    },
    {
      id: 'voice-guided-shopping',
      icon: '🛒',
      title: 'Voice Guided Shopping',
      description: 'Identify products, read labels, and get shopping assistance',
      color: '#ff9800',
    },
    {
      id: 'learning',
      icon: '📚',
      title: 'Language Learning',
      description: 'Practice languages with intelligent feedback',
      color: '#764ba2',
    },
  ]

  return (
    <div className="home-page">
      <div className="home-hero">
        <h2 className="home-title">Choose a feature to get started</h2>
      </div>
      
      <div className="features-grid">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="feature-tile"
            onClick={() => onNavigate(feature.id)}
            style={{ '--feature-color': feature.color } as React.CSSProperties}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
            <div className="feature-arrow">→</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomePage

