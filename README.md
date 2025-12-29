# VoiceCompanion

**VoiceCompanion** - An intelligent, voice-driven assistant that combines accessibility support for visually impaired users with immersive language learning capabilities. Built with ElevenLabs Agents for natural voice interaction and Google Cloud Gemini for intelligent understanding.

## Overview

VoiceCompanion is a unified platform offering two powerful modes:

### 👁️ Accessibility Mode
- **Visual Assistance**: Camera-based scene description and object identification
- **Document Reading**: Read letters, bills, recipes, and instructions aloud
- **Shopping Support**: Identify products, read labels, and compare items
- **Navigation Help**: Voice-guided directions and location descriptions
- **Daily Living**: Task management and daily assistance

### 📚 Language Learning Mode
- **Conversation Practice**: Natural voice interaction in target languages
- **Intelligent Feedback**: Real-time grammar, vocabulary, and pronunciation analysis
- **Cultural Context**: Learn idioms, formality levels, and cultural nuances
- **Personalized Learning**: Adaptive difficulty that adjusts to your skill level
- **Progress Tracking**: Detailed analytics and learning recommendations

## Features

- **Natural Voice Interaction**: Entirely voice-driven using ElevenLabs for lifelike, conversational voice synthesis
- **Multimodal AI**: Combines voice and visual inputs for intelligent understanding
- **Intelligent Understanding**: Google Cloud Gemini powers contextual understanding and helpful responses
- **Accessible by Design**: High contrast mode, keyboard navigation, and screen reader support
- **Real-Time Feedback**: Immediate corrections and suggestions for language learners
- **Progress Tracking**: Monitor improvement with detailed analytics

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Mobile**: React Native + Expo (iOS & Android)
- **Backend**: Node.js + Express + TypeScript
- **Voice**: ElevenLabs API (TTS + Agents)
- **AI**: Google Cloud Gemini 1.5 Pro
- **Vision**: Google Cloud Vision API (optional)
- **Deployment**: Google Cloud Run ready

## Prerequisites

- Node.js 18+ and npm
- ElevenLabs API key
- Google Cloud Gemini API key
- Google Cloud project (optional, for Vision API features)

## Setup Instructions

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Required
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development

# Optional (for Vision API features)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=./key.json
VERTEX_AI_LOCATION=us-central1
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend: http://localhost:5000

### 4. Run Mobile App (Optional)

**Terminal 3 - Mobile:**
```bash
cd mobile
npm install
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

See [mobile/MOBILE_SETUP.md](mobile/MOBILE_SETUP.md) for detailed mobile setup instructions.

## Usage

### Accessibility Mode

1. Select "Accessibility" mode
2. Enable camera to capture images
3. Ask questions like:
   - "What do you see?" - Describes the current camera view
   - "Read this document" - Reads text from captured images
   - "What is this product?" - Shopping assistance
   - "How do I get to [location]?" - Navigation help

### Language Learning Mode

1. Select "Language Learning" mode
2. Choose a scenario (Restaurant, Travel, Shopping, etc.)
3. Start conversation and practice speaking
4. Receive real-time feedback on grammar, vocabulary, and pronunciation
5. Track your progress and get personalized recommendations

## API Endpoints

### Conversation
- `POST /api/conversation` - Send a message and get AI response (supports both modes)

### Vision (Accessibility Mode)
- `POST /api/vision/analyze` - Analyze image (text + objects + description)
- `POST /api/vision/text` - Extract text from image

### Daily Living (Accessibility Mode)
- `POST /api/daily-living/read-document` - Read and explain documents
- `POST /api/daily-living/shopping-assist` - Shopping assistance
- `POST /api/daily-living/navigation` - Navigation help
- `POST /api/daily-living/tasks` - Task management

### Feedback (Learning Mode)
- `POST /api/feedback/analyze` - Analyze text for language learning feedback

### Progress (Learning Mode)
- `GET /api/progress` - Get user progress
- `POST /api/progress` - Update progress

### Language (Learning Mode)
- `POST /api/language/analyze` - Language analysis
- `POST /api/language/cultural` - Cultural context

### Personalization (Learning Mode)
- `GET /api/personalization/skill-level` - Skill assessment
- `GET /api/personalization/difficulty` - Adaptive difficulty
- `GET /api/personalization/recommendations` - Learning recommendations

## Project Structure

```
AI-Partner/
├── frontend/              # React web frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API services
├── mobile/                # React Native mobile app
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API services
├── backend/               # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
└── README.md
```

## Key Features Implementation

### ElevenLabs Integration
- Text-to-Speech API for natural voice responses
- Agents API structure (ready for full SDK integration)
- Real-time audio playback

### Google Cloud Gemini Integration
- Language analysis for grammar, vocabulary, and pronunciation
- Cultural context explanations
- Multimodal understanding (text + images)
- Adaptive response generation

### Google Cloud Vision API (Optional)
- Text extraction from images
- Object detection and identification
- Scene analysis

## Demo Scenarios

### Accessibility Mode
1. **"What do you see?"** - Real-time scene description
2. **"Read this"** - Document and text reading
3. **Shopping Assistance** - Product identification and label reading
4. **Navigation** - Voice-guided directions

### Learning Mode
1. **Restaurant Ordering** - Practice ordering food
2. **Travel & Directions** - Learn travel vocabulary
3. **Job Interview** - Prepare for interviews
4. **Casual Conversation** - Practice everyday language

## Competitive Advantages

1. **Dual Purpose**: Combines accessibility and learning in one platform
2. **Fully Voice-Driven**: No typing required - pure conversation
3. **Multimodal AI**: Combines voice and visual inputs
4. **Real-Time Feedback**: Immediate corrections and suggestions
5. **Personalized**: Adapts to individual needs and skill levels
6. **Accessible**: Built for users with visual impairments

## Future Enhancements

- Full ElevenLabs Agents SDK integration with streaming
- Multi-language support for accessibility mode
- Advanced pronunciation analysis with audio processing
- Offline mode for basic features
- Integration with smart home devices
- Full voice recognition integration in mobile app

## License

MIT

## Acknowledgments

- ElevenLabs for voice synthesis technology
- Google Cloud for AI and vision capabilities
- Built for accessibility, inclusion, and learning
