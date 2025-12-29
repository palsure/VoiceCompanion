# VoiceLens - Project Summary

## Overview

**VoiceLens** is an intelligent, voice-driven accessibility assistant that helps users with visual impairments navigate daily life through natural conversation. It combines real-time visual understanding with practical daily living support.

## Problem Statement

People with visual impairments face daily challenges:
- Reading documents, labels, and signs
- Identifying products while shopping
- Navigating unfamiliar environments
- Managing daily tasks independently
- Accessing visual information

## Solution

A fully voice-driven companion that:
- **Sees** through the camera and describes what's there
- **Reads** text from documents, labels, and signs
- **Understands** context and provides helpful responses
- **Speaks** naturally using ElevenLabs' lifelike voice
- **Assists** with shopping, navigation, and daily tasks

## Key Features

### 1. Natural Voice Interaction
- Entirely voice-driven interface
- ElevenLabs for human-like voice synthesis
- Web Speech API for speech recognition
- No visual interface required

### 2. Visual Assistance
- Real-time camera integration
- Scene description using Gemini Vision
- Text extraction with Google Cloud Vision API
- Object detection and identification

### 3. Daily Living Support
- **Document Reading**: Read letters, bills, recipes, instructions
- **Shopping Assistance**: Identify products, read labels, compare items
- **Navigation Help**: Voice-guided directions and location descriptions
- **Task Management**: Voice-controlled scheduling and reminders

### 4. Accessibility First
- High contrast mode
- Adjustable font sizes
- Keyboard navigation
- Screen reader compatible
- Built for users with visual impairments

## Technology Stack

### Frontend
- React + TypeScript
- Vite for fast development
- Web Speech API for voice input
- Camera API for visual input

### Backend
- Node.js + Express + TypeScript
- Google Cloud Run for deployment

### AI & Services
- **ElevenLabs**: Voice synthesis and speech-to-text
- **Google Cloud Gemini**: Multimodal AI understanding
- **Google Cloud Vision API**: Text extraction and object detection

## Architecture Highlights

1. **Multimodal AI**: Combines voice and visual inputs for intelligent understanding
2. **Conversation Memory**: Maintains context across multiple interactions
3. **Graceful Degradation**: Works even if some services are unavailable
4. **Cloud-Native**: Scalable architecture on Google Cloud
5. **Accessible Design**: WCAG compliant, keyboard navigable

## Demo Highlights

1. **"What do you see?"** - Real-time scene description
2. **"Read this"** - Document and text reading
3. **Shopping Assistance** - Product identification and label reading
4. **Task Management** - Voice-controlled daily tasks
5. **Navigation** - Voice-guided directions

## Impact

- **Independence**: Enables users to navigate daily life independently
- **Accessibility**: Makes visual information accessible through voice
- **Natural Interaction**: Conversational, not command-based
- **Practical**: Solves real-world problems users face daily

## Technical Innovation

1. **Multimodal Understanding**: Seamlessly combines voice and visual inputs
2. **Context-Aware**: Maintains conversation context for natural dialogue
3. **Real-Time Processing**: Low-latency voice interaction
4. **Intelligent Responses**: AI-powered understanding and helpful responses

## Future Enhancements

- Offline mode for basic features
- Multi-language support
- Integration with smart home devices
- Advanced navigation with GPS
- Recipe reading and cooking assistance
- Medication label reading

## Hackathon Fit

This project perfectly demonstrates:
- ✅ ElevenLabs integration for natural voice
- ✅ Google Cloud Vertex AI/Gemini for intelligence
- ✅ Multimodal AI capabilities
- ✅ Real-world problem solving
- ✅ Accessibility and inclusion
- ✅ Creative use of technology

## Getting Started

See README.md for complete setup instructions.

Quick start:
```bash
./setup.sh
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

## Team & Credits

Built for the ElevenLabs + Google Cloud hackathon challenge.

