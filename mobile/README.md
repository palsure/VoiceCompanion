# VoiceCompanion Mobile App

React Native mobile application for VoiceCompanion using Expo.

## Features

- **Accessibility Mode**: Camera-based visual assistance for visually impaired users
- **Language Learning Mode**: Practice languages with intelligent feedback
- **Voice Interaction**: Natural voice conversations using ElevenLabs and Gemini
- **Progress Tracking**: Monitor your learning progress and get recommendations
- **Mobile-Optimized**: Native mobile experience with camera and microphone integration

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (for Mac) or Android Emulator
- Or Expo Go app on your physical device

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

Create a `.env` file in the `mobile` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

For physical device testing, use your computer's IP address:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
```

### 3. Start the App

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

### 4. Scan QR Code

- Use Expo Go app on your phone to scan the QR code
- Or press `i` for iOS simulator, `a` for Android emulator

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── LearningModeScreen.tsx
│   │   ├── AccessibilityModeScreen.tsx
│   │   └── ProgressScreen.tsx
│   ├── components/       # Reusable components
│   │   ├── VoiceConversation.tsx
│   │   ├── FeedbackPanel.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ScenarioSelector.tsx
│   │   └── ProgressTracker.tsx
│   ├── hooks/            # Custom hooks
│   │   └── useVoiceConversation.ts
│   └── services/          # API services
│       └── api.ts
├── App.tsx               # Main app component
└── package.json
```

## Mobile-Specific Features

### Camera Integration
- Uses `expo-camera` for camera access
- Automatic permission handling
- Image capture and base64 encoding

### Voice Input/Output
- Uses `expo-speech` for text-to-speech
- Uses `expo-av` for audio playback
- Voice recognition (requires additional library setup)

### Navigation
- React Navigation for screen navigation
- Stack navigator for main navigation flow
- Bottom tabs (optional) for quick access

## Development

### Running on Physical Device

1. Make sure your phone and computer are on the same network
2. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
3. Update `.env` with your IP address
4. Start backend: `docker compose -f docker-compose.dev.yml up`
5. Start mobile app: `npm start`
6. Scan QR code with Expo Go app

### Building for Production

```bash
# iOS
expo build:ios

# Android
expo build:android
```

## Permissions

The app requires:
- **Camera**: For visual assistance features
- **Microphone**: For voice conversations
- **Photo Library**: For image analysis

Permissions are automatically requested when needed.

## Troubleshooting

### API Connection Issues
- Ensure backend is running
- Check API URL in `.env`
- For physical device, use computer's IP address, not localhost
- Ensure firewall allows connections

### Camera Not Working
- Check permissions in device settings
- Restart the app after granting permissions
- On iOS, ensure Info.plist has camera usage description

### Voice Recognition Issues
- Install `@react-native-voice/voice` for voice recognition
- Check microphone permissions
- Test on physical device (simulators may have limitations)

## Next Steps

1. Install voice recognition library:
   ```bash
   npm install @react-native-voice/voice
   ```

2. Update `useVoiceConversation.ts` to use the voice library

3. Add push notifications for progress reminders

4. Add offline mode support

5. Implement background audio playback

## Notes

- The mobile app connects to the same backend API as the web app
- Ensure the backend is accessible from your mobile device/emulator
- For production, deploy backend to a public URL and update API_BASE_URL


