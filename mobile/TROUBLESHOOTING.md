# Android App Not Loading - Troubleshooting Guide

## Quick Diagnostic Steps

### 1. Check Metro Bundler Status

```bash
cd mobile
npm start
```

**Expected:** Metro bundler should start and show QR code
**If it fails:** Check error messages below

### 2. Check for Common Errors

#### Error: "Cannot find module '../../../shared/src/api'"

**Solution:**
```bash
# Make sure shared module exists
cd ../shared
npm install

# Rebuild mobile app
cd ../mobile
npm start -- --reset-cache
```

#### Error: "Network request failed" or "Connection refused"

**Solution:**
1. **For Android Emulator:**
   - Use `http://10.0.2.2:5000` (NOT localhost)
   - Create `.env` file in `mobile/` directory:
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
   ```

2. **For Physical Device:**
   - Find your computer's IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
   - Use that IP in `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
   ```

3. **Verify Backend is Running:**
   ```bash
   # Check if backend is accessible
   curl http://localhost:5000/api/health
   # Or in browser: http://localhost:5000/api/health
   ```

#### Error: "App crashed" or "White screen"

**Solution:**
```bash
# Clear all caches
cd mobile
rm -rf node_modules
rm -rf .expo
npm install
npm start -- --clear
```

#### Error: "Unable to resolve module" or "Module not found"

**Solution:**
```bash
cd mobile
# Clear watchman (if installed)
watchman watch-del-all

# Clear Metro bundler cache
npm start -- --reset-cache

# If still failing, reinstall dependencies
rm -rf node_modules
npm install
```

### 3. Check Android Emulator/Device

#### For Android Emulator:
```bash
# Check if emulator is running
adb devices

# If no devices, start emulator from Android Studio
# Or run:
emulator -avd <your_avd_name>
```

#### For Physical Device:
1. Enable USB debugging in Developer Options
2. Connect via USB
3. Verify connection: `adb devices`
4. Should show your device ID

### 4. Check Logs

#### View Metro Bundler Logs:
- Check terminal where `npm start` is running
- Look for red error messages

#### View Android Logs:
```bash
# View all logs
adb logcat

# Filter for React Native errors
adb logcat | grep -i "react"

# Filter for JavaScript errors
adb logcat | grep -i "js"
```

#### View Expo Logs:
- Press `j` in Metro bundler to open debugger
- Check browser console for errors

### 5. Verify Configuration

#### Check app.json:
```bash
cd mobile
cat app.json
```

Should have:
- Valid package name: `"package": "com.voicecompanion.app"`
- Android permissions configured
- Valid icon and splash screen paths

#### Check package.json:
```bash
cd mobile
cat package.json
```

Should have:
- All dependencies installed
- Scripts configured correctly

### 6. Common Fixes

#### Fix 1: Rebuild Android App
```bash
cd mobile/android
./gradlew clean
cd ..
npm run android
```

#### Fix 2: Clear Expo Cache
```bash
cd mobile
npx expo start --clear
```

#### Fix 3: Reinstall Dependencies
```bash
cd mobile
rm -rf node_modules
rm package-lock.json
npm install
```

#### Fix 4: Check Shared Module
```bash
# Verify shared module exists
ls -la ../shared/src/api.ts

# If missing, check if it's built
cd ../shared
npm install
```

#### Fix 5: Update Expo
```bash
cd mobile
npx expo install --fix
```

### 7. Network Issues

#### Test Backend Connection:
```bash
# From your computer
curl http://localhost:5000/api/health

# From Android emulator (using adb shell)
adb shell
curl http://10.0.2.2:5000/api/health
```

#### Firewall Issues:
- Ensure port 5000 is not blocked
- Check firewall settings allow Node.js/Expo

### 8. Specific Error Messages

#### "Unable to resolve module @react-navigation/native"
```bash
cd mobile
npm install @react-navigation/native @react-navigation/stack
npm start -- --reset-cache
```

#### "Error: spawnSync ./gradlew EACCES"
```bash
cd mobile/android
chmod +x gradlew
cd ..
```

#### "SDK location not found"
- Open Android Studio
- Go to Preferences → Appearance & Behavior → System Settings → Android SDK
- Note the SDK location
- Set `ANDROID_HOME` environment variable

#### "Execution failed for task ':app:installDebug'"
```bash
# Uninstall existing app
adb uninstall com.voicecompanion.app

# Rebuild
cd mobile
npm run android
```

### 9. Complete Reset

If nothing works, do a complete reset:

```bash
cd mobile

# Remove all caches and builds
rm -rf node_modules
rm -rf .expo
rm -rf android/app/build
rm -rf android/.gradle
rm package-lock.json

# Reinstall
npm install

# Clear Metro cache
npm start -- --clear
```

### 10. Check System Requirements

- **Node.js:** Should be 18+ (check with `node --version`)
- **Java:** Should be JDK 11+ (check with `java -version`)
- **Android SDK:** Should be API 33+ (check in Android Studio)
- **Expo CLI:** Should be latest (update with `npm install -g expo-cli`)

## Still Not Working?

### Get Detailed Error Information:

1. **Run with verbose logging:**
   ```bash
   cd mobile
   EXPO_DEBUG=true npm start
   ```

2. **Check Android Studio Logcat:**
   - Open Android Studio
   - Connect device/emulator
   - View → Tool Windows → Logcat
   - Filter by "ReactNativeJS" or "ERROR"

3. **Check Metro Bundler output:**
   - Look for red error messages
   - Check for module resolution errors
   - Verify all imports are correct

4. **Test with Expo Go:**
   ```bash
   cd mobile
   npm start
   # Scan QR code with Expo Go app
   # This bypasses native build issues
   ```

## Quick Test Commands

```bash
# Test 1: Verify backend is running
curl http://localhost:5000/api/health

# Test 2: Verify Android device connected
adb devices

# Test 3: Verify dependencies
cd mobile && npm list --depth=0

# Test 4: Verify Expo
npx expo --version

# Test 5: Clear and restart
cd mobile && npm start -- --clear
```

## Contact for Help

If none of these solutions work, please provide:
1. Full error message from Metro bundler
2. Output of `adb logcat` filtered for errors
3. Your `.env` file contents (without sensitive data)
4. Node.js and Expo versions
5. Whether using emulator or physical device

