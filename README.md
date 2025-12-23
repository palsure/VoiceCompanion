# EchoSight

**EchoSight** - An intelligent, voice-driven accessibility assistant that helps users with visual impairments navigate daily life through natural conversation. Built with ElevenLabs for natural voice interaction and Google Cloud Vertex AI/Gemini for intelligent understanding.

## Features

- **Natural Voice Interaction**: Entirely voice-driven using ElevenLabs for lifelike, conversational voice synthesis
- **Visual Assistance**: Camera-based scene description, text reading, and object identification
- **Intelligent Understanding**: Google Cloud Vertex AI/Gemini powers contextual understanding and helpful responses
- **Daily Living Support**: Document reading, shopping assistance, navigation help, and task management
- **Accessible by Design**: High contrast mode, adjustable font sizes, keyboard navigation, and screen reader support

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Voice**: ElevenLabs API
- **AI**: Google Cloud Vertex AI / Gemini
- **Vision**: Google Cloud Vision API
- **Deployment**: Google Cloud Run

## What is EchoSight?

**EchoSight** combines the power of voice (Echo) and vision (Sight) to create an intelligent accessibility companion. It helps users with visual impairments navigate daily life through natural conversation, using AI to see, understand, and describe the world around them.

## Prerequisites

- Node.js 18+ and npm
- Google Cloud account with billing enabled
- ElevenLabs API key
- Google Cloud project with the following APIs enabled:
  - Vertex AI API
  - Cloud Vision API
  - Cloud Run API

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

### 2. Google Cloud Setup

1. Create a new Google Cloud project or use an existing one
2. Enable the required APIs:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable vision.googleapis.com
   gcloud services enable run.googleapis.com
   ```

3. Create a service account:
   ```bash
   gcloud iam service-accounts create voice-vision-companion \
     --display-name="Voice Vision Companion Service Account"
   ```

4. Grant necessary permissions:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:voice-vision-companion@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:voice-vision-companion@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/vision.user"
   ```

5. Create and download a service account key:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=voice-vision-companion@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

6. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
GOOGLE_APPLICATION_CREDENTIALS=./key.json

# Vertex AI Configuration
VERTEX_AI_LOCATION=us-central1
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=8080
NODE_ENV=development

# Frontend API URL
VITE_API_URL=http://localhost:8080
```

### 4. Run the Application

**Development Mode:**

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8080`.

## Usage

1. **Start Voice Interaction**: Click the microphone button to start listening
2. **Enable Camera**: Click "Start Camera" to enable visual assistance features
3. **Capture Images**: Click "Capture" to take a photo that will be sent with your next message
4. **Ask Questions**: 
   - "What do you see?" - Describes the current camera view
   - "Read this" - Reads text from captured images
   - "Describe this scene" - Provides detailed scene description
   - "What is this product?" - Shopping assistance
   - "Add a task: [task]" - Task management
   - "How do I get to [location]?" - Navigation help
   - Natural conversation about daily tasks, shopping, navigation, etc.

### Voice Commands Examples

- **Visual Assistance**:
  - "What do you see?"
  - "Read this document"
  - "Describe what's in front of me"
  - "What text is on this sign?"

- **Shopping**:
  - "What is this product?"
  - "What's the price?"
  - "Read the label"
  - "Is this expired?"

- **Daily Tasks**:
  - "Add a task: [description]"
  - "What are my tasks?"
  - "I completed [task]"

- **Navigation**:
  - "How do I get to [location]?"
  - "What's the next turn?"
  - "Describe where I am"

## Project Structure

```
AI-Partner/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API services
├── backend/           # Node.js backend server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic services
└── README.md
```

## API Endpoints

### Conversation
- `POST /api/conversation` - Send a message and get AI response

### Vision
- `POST /api/vision/analyze` - Analyze image (text + objects + description)
- `POST /api/vision/text` - Extract text from image

### Voice
- `POST /api/voice/tts` - Convert text to speech
- `GET /api/voice/voices` - Get available voices

## Deployment

### Deploy Backend to Cloud Run

```bash
cd backend
gcloud run deploy voice-vision-companion-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ELEVENLABS_API_KEY=your_key,GEMINI_API_KEY=your_key
```

### Deploy Frontend

The frontend can be deployed to any static hosting service (Firebase Hosting, Vercel, Netlify, etc.):

```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

## Development

### Building for Production

```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build:backend
```

### Linting

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && npm run lint
```

## Troubleshooting

### Camera Access Issues
- Ensure HTTPS is enabled (required for camera access in browsers)
- Check browser permissions for camera access

### API Errors
- Verify all API keys are correctly set in `.env`
- Check Google Cloud service account permissions
- Ensure required APIs are enabled in Google Cloud Console

### Voice Recognition Issues
- Use Chrome or Edge for best Web Speech API support
- Check microphone permissions in browser settings

## License

MIT

## Acknowledgments

- ElevenLabs for voice synthesis technology
- Google Cloud for AI and vision capabilities
- Built for accessibility and inclusion

