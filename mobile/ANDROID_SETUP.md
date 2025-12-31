# Android App Setup Guide - Voice to Art

## Quick Start for Android

### Prerequisites

1. **Node.js 18+** installed
2. **Android Studio** installed with:
   - Android SDK (API level 33+)
   - Android Emulator configured
   - OR a physical Android device with USB debugging enabled

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### Step 2: Configure API URL

Create a `.env` file in the `mobile` directory:

```env
# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000

# For physical Android device (use your computer's IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
```

**Note:** Android Emulator uses `10.0.2.2` instead of `localhost` to access your host machine.

### Step 3: Start Backend Server

In the project root directory:

```bash
docker compose -f docker-compose.dev.yml up
```

Or if running backend directly:

```bash
cd backend
npm install
npm run dev
```

### Step 4: Run Android App

```bash
cd mobile
npm start
```

Then press `a` to open Android Emulator, or scan the QR code with Expo Go app on your physical device.

### Alternative: Direct Android Build

```bash
cd mobile
npm run android
```

This will:
1. Start Metro bundler
2. Build the Android app
3. Install on connected device/emulator
4. Launch the app

## Voice to Art Feature

The Voice to Art feature is already integrated in the Android app:

### Features Available:
- ✅ Voice input for art descriptions
- ✅ Text input for art descriptions
- ✅ Style selection (Realistic, Artistic, Cartoon, Abstract, Photographic)
- ✅ Image generation using Google Imagen
- ✅ Save generated images to device gallery
- ✅ Full screen image preview

### How to Use:

1. **Open the App** → Navigate to "Voice to Art" from the home screen
2. **Enter Description**:
   - Tap the microphone button to record your voice description
   - OR type your description in the text field
3. **Select Style**: Choose from available art styles
4. **Generate**: Tap "✨ Create Art" button
5. **Save**: Once generated, tap "💾 Save to Gallery" to save to your device

## Troubleshooting

### Backend Connection Issues

**Problem:** App can't connect to backend

**Solutions:**
- For Emulator: Use `http://10.0.2.2:5000` in `.env`
- For Physical Device: 
  1. Find your computer's IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
  2. Use `http://YOUR_IP:5000` in `.env`
  3. Ensure phone and computer are on same WiFi network
  4. Check firewall allows connections on port 5000

### Camera/Microphone Permissions

**Problem:** Voice input or camera not working

**Solutions:**
1. Go to Android Settings → Apps → VoiceCompanion → Permissions
2. Enable:
   - Microphone
   - Camera (if using camera features)
   - Storage (for saving images)
3. Restart the app

### Image Generation Errors

**Problem:** Images not generating

**Solutions:**
- Check backend logs for API errors
- Verify Google Cloud credentials are configured
- Check Imagen API is enabled in Google Cloud Console
- Ensure billing is enabled for Vertex AI

### Build Errors

**Problem:** `npm run android` fails

**Solutions:**
```bash
# Clean build
cd mobile/android
./gradlew clean

# Rebuild
cd ..
npm run android
```

### Metro Bundler Issues

**Problem:** Metro bundler not starting

**Solutions:**
```bash
# Clear cache
npm start -- --reset-cache

# Or
npx expo start --clear
```

## Building APK for Distribution

### Development Build

```bash
cd mobile
npx expo run:android
```

This creates a debug APK at:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### Production Build

1. **Update app.json** with your app details:
```json
{
  "expo": {
    "android": {
      "package": "com.voicecompanion.app",
      "versionCode": 1
    }
  }
}
```

2. **Build APK**:
```bash
cd mobile
eas build --platform android --profile production
```

Or manually:
```bash
cd mobile/android
./gradlew assembleRelease
```

APK will be at:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

## Testing on Physical Device

### Method 1: Expo Go (Easiest)

1. Install Expo Go from Google Play Store
2. Start the app: `npm start`
3. Scan QR code with Expo Go app
4. App loads instantly

### Method 2: Development Build

1. Connect device via USB
2. Enable USB debugging in Developer Options
3. Run: `npm run android`
4. App installs and launches automatically

### Method 3: Install APK Directly

1. Build APK: `cd mobile/android && ./gradlew assembleDebug`
2. Transfer `app-debug.apk` to device
3. Install from device (enable "Install from Unknown Sources")

## Voice to Art - Android Specific Notes

### Permissions Required:
- ✅ Microphone (for voice input)
- ✅ Storage/Media Library (for saving images)

### Performance Tips:
- Use WiFi for faster image generation
- Generated images are cached locally
- Large images may take time to save - be patient

### Known Limitations:
- Voice recording quality depends on device microphone
- Image generation time varies (10-30 seconds)
- Large images may cause memory issues on older devices

## Next Steps

- Test all art styles
- Try voice input with different descriptions
- Save multiple images to gallery
- Share generated art with friends!

For more help, check:
- `MOBILE_SETUP.md` - General mobile setup
- `README.md` - Project overview
- Backend logs for API errors

