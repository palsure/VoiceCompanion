# VoiceCompanion Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├──────────────────────────────┬──────────────────────────────────────────┤
│     Web Frontend             │         Mobile App                        │
│   (React + Vite)             │    (React Native + Expo)                  │
│                              │                                           │
│  ┌──────────────────────┐   │  ┌──────────────────────┐                │
│  │   HomePage           │   │  │   HomeScreen          │                │
│  └──────────────────────┘   │  └──────────────────────┘                │
│  ┌──────────────────────┐   │  ┌──────────────────────┐                │
│  │   VoiceToArt         │   │  │ VoiceToImageScreen    │                │
│  └──────────────────────┘   │  └──────────────────────┘                │
│  ┌──────────────────────┐   │  ┌──────────────────────┐                │
│  │   ImageToVoice        │   │  │ ImageToVoiceScreen    │                │
│  └──────────────────────┘   │  └──────────────────────┘                │
│  ┌──────────────────────┐   │  ┌──────────────────────┐                │
│  │   ScriptToMusic       │   │  │ BlindGuidanceScreen   │                │
│  └──────────────────────┘   │  └──────────────────────┘                │
│  ┌──────────────────────┐   │  ┌──────────────────────┐                │
│  │   RealTimeGuidance    │   │  │ VoiceGuidedShopping   │                │
│  └──────────────────────┘   │  └──────────────────────┘                │
│  ┌──────────────────────┐   │  ┌──────────────────────┐                │
│  │   VoiceConversation   │   │  │ LearningModeScreen    │                │
│  └──────────────────────┘   │  └──────────────────────┘                │
└──────────────┬───────────────┴──────────────┬────────────────────────────┘
               │                              │
               │    Shared API Module         │
               │  ┌──────────────────────┐   │
               └──│  createApiClient()     │───┘
                  │  createApiServices()   │
                  │  - imageGenerationApi  │
                  │  - speechToTextApi     │
                  │  - textToSpeechApi     │
                  │  - musicApi             │
                  │  - galleryApi           │
                  │  - visionApi            │
                  │  - guidanceApi          │
                  └────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼───────────────────────────────────────────────┐
│                         BACKEND LAYER                                      │
│                    (Node.js + Express + TypeScript)                       │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         API Routes                                  │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  /api/image-generation  │  /api/music          │  /api/gallery     │  │
│  │  /api/speech-to-text    │  /api/text-to-speech │  /api/vision      │  │
│  │  /api/guidance          │  /api/conversation   │  /api/feedback    │  │
│  │  /api/progress           │  /api/language      │  /api/personalization││
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         Services Layer                               │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │ imagenService│  │elevenLabs    │  │ geminiService│             │  │
│  │  │              │  │Service       │  │              │             │  │
│  │  │ - generate() │  │ - textToSpeech│ │ - analyze()   │             │  │
│  │  │              │  │ - speechToText│ │ - describeScene│            │  │
│  │  │              │  │ - generateMusic││              │             │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │  │
│  │                                                                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │visionService │  │feedback      │  │progress      │             │  │
│  │  │              │  │Service       │  │Service       │             │  │
│  │  │ - analyze()  │  │ - analyze()  │  │ - get()      │             │  │
│  │  │ - detectText()│ │              │  │ - update()    │             │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────────────────────┘
                            │
                            │ API Calls
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Google Cloud │   │  ElevenLabs  │   │  Google      │
│              │   │              │   │  Cloud       │
│ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌──────────┐ │
│ │ Imagen   │ │   │ │ Text-to- │ │   │ │ Vision   │ │
│ │ (Vertex  │ │   │ │ Speech   │ │   │ │ API      │ │
│ │  AI)     │ │   │ └──────────┘ │   │ └──────────┘ │
│ └──────────┘ │   │ ┌──────────┐ │   │              │
│ ┌──────────┐ │   │ │ Speech-to│ │   │              │
│ │ Gemini   │ │   │ │ -Text    │ │   │              │
│ │ API      │ │   │ └──────────┘ │   │              │
│ └──────────┘ │   │ ┌──────────┐ │   │              │
│              │   │ │ Music    │ │   │              │
│              │   │ │ Generation│ │   │              │
│              │   │ └──────────┘ │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Data Flow

### Voice to Art Flow

```
User Voice/Text Input
    │
    ▼
Frontend/Mobile App
    │
    ▼
Speech-to-Text API (ElevenLabs)
    │
    ▼
Backend: /api/image-generation/generate
    │
    ├─► imagenService.generate()
    │       │
    │       ▼
    │   Google Imagen (Vertex AI)
    │       │
    │       ▼
    │   Generated Image (Base64)
    │
    ▼
Response to Client
    │
    ▼
Display Image + Save to Gallery
```

### Image to Voice Flow

```
User Uploads/Captures Image
    │
    ▼
Frontend/Mobile App
    │
    ▼
Backend: /api/vision/analyze
    │
    ├─► visionService.analyze()
    │       │
    │       ├─► Google Vision API (text, objects)
    │       │
    │       └─► geminiService.describeScene()
    │               │
    │               ▼
    │           Google Gemini (narrative description)
    │
    ▼
Backend: /api/text-to-speech/generate
    │
    ├─► elevenLabsService.textToSpeech()
    │       │
    │       ▼
    │   ElevenLabs TTS API
    │       │
    │       ▼
    │   Audio File (MP3)
    │
    ▼
Response to Client
    │
    ▼
Play Audio Description
```

### Script to Music Flow

```
User Input (Lyrics/Description)
    │
    ▼
Frontend/Mobile App
    │
    ▼
Backend: /api/music/generate
    │
    ├─► elevenLabsService.generateMusic()
    │       │
    │       ▼
    │   ElevenLabs Music API
    │       │
    │       ▼
    │   Audio File (MP3)
    │
    ▼
Response to Client
    │
    ▼
Play/Download Music
```

### Real-Time Guidance Flow

```
Camera Stream / Simulation
    │
    ▼
Capture Frame
    │
    ▼
Backend: /api/guidance/realtime
    │
    ├─► visionService.analyze()
    │       │
    │       ├─► Google Vision API
    │       │
    │       └─► geminiService.describeScene()
    │               │
    │               ▼
    │           Context-Aware Description
    │
    ▼
Backend: /api/text-to-speech/generate
    │
    ├─► elevenLabsService.textToSpeech()
    │       │
    │       ▼
    │   Navigation Guidance Audio
    │
    ▼
Response to Client
    │
    ▼
Play Voice Guidance
```

## Component Architecture

### Frontend Components

```
App.tsx (Router)
    │
    ├─► HomePage
    │       └─► Feature Tiles
    │
    ├─► VoiceToArt
    │       ├─► Text/Voice Input
    │       ├─► Style Selector
    │       ├─► Image Display
    │       └─► Gallery Tab
    │
    ├─► ImageToVoice
    │       ├─► CameraCapture
    │       ├─► Image Preview
    │       └─► Description Display
    │
    ├─► ScriptToMusic
    │       ├─► Text/Voice Input
    │       ├─► Style Selector
    │       └─► Music Player
    │
    ├─► RealTimeGuidance
    │       ├─► CameraCapture
    │       ├─► Simulation Mode
    │       └─► Guidance Display
    │
    └─► VoiceConversation
            ├─► Speech Recognition
            └─► Audio Playback
```

### Mobile Components

```
App.tsx (Navigation)
    │
    ├─► HomeScreen
    │       └─► Feature Cards
    │
    ├─► VoiceToImageScreen
    │       ├─► Voice Input
    │       ├─► Image Display
    │       └─► Gallery Management
    │
    ├─► ImageToVoiceScreen
    │       ├─► Camera/Gallery
    │       ├─► Image Analysis
    │       └─► Voice Playback
    │
    ├─► BlindGuidanceScreen
    │       ├─► Camera Stream
    │       └─► Voice Guidance
    │
    └─► LearningModeScreen
            ├─► Scenario Selector
            └─► Conversation UI
```

## Technology Stack Details

### Frontend
- **React 18+**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing (web)
- **CSS Modules**: Component styling

### Mobile
- **React Native**: Mobile framework
- **Expo**: Development platform
- **React Navigation**: Navigation library
- **Expo AV**: Audio/video playback
- **Expo Image Picker**: Image selection
- **Expo Media Library**: Gallery access
- **Expo Speech**: Text-to-speech

### Backend
- **Node.js**: Runtime
- **Express**: Web framework
- **TypeScript**: Type safety
- **Axios**: HTTP client
- **CORS**: Cross-origin support

### Shared Module
- **Axios**: HTTP client
- **TypeScript**: Shared types
- **Common API**: Unified interface

### External Services
- **ElevenLabs**: Voice synthesis, speech-to-text, music generation
- **Google Cloud Gemini**: AI understanding and generation
- **Google Imagen**: Image generation
- **Google Vision API**: Image analysis

## Security & Authentication

- **API Keys**: Stored in environment variables
- **CORS**: Configured for development and production
- **Input Validation**: All user inputs validated
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Implemented for API endpoints (future)

## Deployment Architecture

### Development
```
Docker Compose
    ├─► Backend Container (Port 5000)
    ├─► Frontend Container (Port 3001)
    └─► Shared Volume Mount
```

### Production (Future)
```
Google Cloud Run
    ├─► Backend Service
    ├─► Frontend Service (Static)
    └─► CDN (for static assets)
```

## Database (Future)

Currently using:
- **localStorage** (client-side) for gallery
- **In-memory** storage for progress/feedback

Future:
- **Firestore** or **PostgreSQL** for persistent storage
- **User authentication** and data isolation
- **Cloud Storage** for images and audio files

