# Mobile App Setup Guide

## Quick Start

### 1. Install Expo CLI

```bash
npm install -g expo-cli
```

### 2. Install Dependencies

```bash
cd mobile
npm install
```

### 3. Configure API URL

Create `.env` file:

```env
# For iOS Simulator or Android Emulator
EXPO_PUBLIC_API_URL=http://localhost:5000

# For physical device, use your computer's IP:
# EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
```

### 4. Start Backend

Make sure the backend is running:

```bash
# In project root
docker compose -f docker-compose.dev.yml up
```

### 5. Start Mobile App

```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## Finding Your Computer's IP Address

### macOS/Linux
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows
```bash
ipconfig
```

Look for IPv4 address (usually starts with 192.168.x.x or 10.x.x.x)

## Voice Recognition Setup (Optional)

To enable voice input, install:

```bash
npm install @react-native-voice/voice
```

Then update `src/hooks/useVoiceConversation.ts` to use the voice library.

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Troubleshooting

### Can't connect to backend
- Check backend is running
- Verify API URL in `.env`
- For physical device, use computer's IP, not localhost
- Check firewall settings

### Camera not working
- Grant camera permissions in device settings
- Restart app after granting permissions

### Audio not playing
- Check device volume
- Ensure microphone permissions granted
- Test on physical device (simulators may have limitations)


