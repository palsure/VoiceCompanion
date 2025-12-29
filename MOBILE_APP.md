# VoiceCompanion Mobile App

VoiceCompanion is now available as a native mobile app for iOS and Android! Built with React Native and Expo.

## Features

✅ **Native Mobile Experience**
- Optimized UI for mobile screens
- Touch-friendly interactions
- Smooth scrolling and animations

✅ **Camera Integration**
- Native camera access for visual assistance
- Image capture and analysis
- Photo library integration

✅ **Voice Features**
- Text-to-speech for responses
- Audio playback support
- Voice input (ready for integration)

✅ **Offline-Ready Architecture**
- API service abstraction
- Network error handling
- Local state management

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Or Expo Go app on your phone

### Installation

```bash
cd mobile
npm install
```

### Configuration

Create `.env` file:

```env
# For iOS Simulator or Android Emulator
EXPO_PUBLIC_API_URL=http://localhost:5000

# For physical device (use your computer's IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
```

### Running

1. **Start Backend** (in project root):
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

2. **Start Mobile App**:
   ```bash
   cd mobile
   npm start
   ```

3. **Choose Platform**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app

## Project Structure

```
mobile/
├── src/
│   ├── screens/              # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── LearningModeScreen.tsx
│   │   ├── AccessibilityModeScreen.tsx
│   │   └── ProgressScreen.tsx
│   ├── components/           # Reusable components
│   │   ├── VoiceConversation.tsx
│   │   ├── FeedbackPanel.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ScenarioSelector.tsx
│   │   └── ProgressTracker.tsx
│   ├── hooks/                # Custom hooks
│   │   └── useVoiceConversation.ts
│   └── services/             # API services
│       └── api.ts
├── App.tsx                   # Main app component
├── app.json                  # Expo configuration
└── package.json
```

## Key Differences from Web App

### Navigation
- Uses React Navigation instead of single-page layout
- Stack navigator for screen transitions
- Native back button support

### UI Components
- `View` instead of `div`
- `Text` instead of `p`, `span`, etc.
- `TouchableOpacity` instead of `button`
- `ScrollView` for scrollable content
- `StyleSheet` for styling (no CSS)

### Permissions
- Automatic permission requests
- Native permission dialogs
- Permission status handling

### Camera
- Uses `expo-camera` for native camera access
- `expo-image-picker` for photo library
- Base64 encoding for API transmission

### Voice
- `expo-speech` for text-to-speech
- `expo-av` for audio playback
- Voice recognition ready (requires `@react-native-voice/voice`)

## Mobile-Specific Features

### Camera Integration
- Real-time camera preview
- Image capture with quality control
- Photo library access
- Base64 encoding for API

### Voice Input/Output
- Text-to-speech for responses
- Audio playback from ElevenLabs
- Voice recognition placeholder (ready for integration)

### Network Handling
- Configurable API base URL
- Network error handling
- Timeout management
- Retry logic ready

## Development

### Testing on Physical Device

1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. Update `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_IP:5000
   ```

3. Ensure backend is accessible:
   - Check firewall settings
   - Verify backend is running
   - Test API URL in browser

### Building for Production

```bash
# iOS
expo build:ios

# Android
expo build:android
```

## Next Steps

### Voice Recognition
To enable voice input, install:
```bash
npm install @react-native-voice/voice
```

Then update `src/hooks/useVoiceConversation.ts` to use the voice library.

### Push Notifications
Add push notifications for progress reminders:
```bash
expo install expo-notifications
```

### Offline Support
Implement offline mode with AsyncStorage:
```bash
npm install @react-native-async-storage/async-storage
```

## Troubleshooting

### Can't Connect to Backend
- ✅ Check backend is running
- ✅ Verify API URL in `.env`
- ✅ For physical device, use computer's IP, not localhost
- ✅ Check firewall allows connections
- ✅ Ensure phone and computer on same network

### Camera Not Working
- ✅ Grant camera permissions in device settings
- ✅ Restart app after granting permissions
- ✅ Check `app.json` has camera permission descriptions

### Audio Not Playing
- ✅ Check device volume
- ✅ Ensure microphone permissions granted
- ✅ Test on physical device (simulators may have limitations)

### Build Errors
- ✅ Clear cache: `expo start -c`
- ✅ Reinstall dependencies: `rm -rf node_modules && npm install`
- ✅ Check Expo SDK version compatibility

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Voice](https://github.com/react-native-voice/voice)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)

## Support

For issues or questions:
1. Check [mobile/MOBILE_SETUP.md](mobile/MOBILE_SETUP.md)
2. Review [mobile/README.md](mobile/README.md)
3. Check Expo documentation
4. Review backend API documentation


