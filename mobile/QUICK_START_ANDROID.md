# Quick Start - Fix Android App Not Loading

## Immediate Steps to Fix

### Step 1: Run Quick Fix Script

```bash
cd mobile
bash quick-fix.sh
```

This will:
- ✅ Check your setup
- ✅ Create `.env` file if missing
- ✅ Clear caches
- ✅ Verify dependencies

### Step 2: Verify Backend is Running

```bash
# In project root (not mobile directory)
docker compose -f docker-compose.dev.yml up
```

**OR** if running backend directly:
```bash
cd backend
npm run dev
```

### Step 3: Check Backend is Accessible

Open browser and go to: `http://localhost:5000/api/health`

Should see a response. If not, backend isn't running.

### Step 4: Start Android App

```bash
cd mobile
npm start
```

Then:
- Press `a` for Android emulator
- OR scan QR code with Expo Go app on your phone

## Most Common Issues

### Issue 1: "Cannot connect to backend"

**Fix:**
1. Create `.env` file in `mobile/` directory:
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
   ```
   (For emulator - use `10.0.2.2`, NOT `localhost`)

2. For physical device, use your computer's IP:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
   ```

3. Restart Metro bundler after creating `.env`:
   ```bash
   npm start -- --clear
   ```

### Issue 2: "Module not found" or "Cannot resolve module"

**Fix:**
```bash
cd mobile
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Issue 3: "App crashes on startup" or "White screen"

**Fix:**
```bash
cd mobile
# Clear everything
rm -rf node_modules .expo android/app/build
npm install
npm start -- --clear
```

### Issue 4: Android Emulator not connecting

**Fix:**
1. Open Android Studio
2. Tools → Device Manager
3. Start an emulator
4. Verify it's running: `adb devices`
5. Should show device ID

### Issue 5: Physical device not connecting

**Fix:**
1. Enable USB debugging:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging
2. Connect via USB
3. Verify: `adb devices` should show your device
4. If not, install device drivers

## Still Not Working?

### Get Error Details:

1. **Check Metro Bundler output:**
   - Look for red error messages
   - Copy the full error

2. **Check Android logs:**
   ```bash
   adb logcat | grep -i "react\|error\|exception"
   ```

3. **Try Expo Go (bypasses build issues):**
   ```bash
   cd mobile
   npm start
   # Scan QR code with Expo Go app
   ```

### Common Error Messages:

#### "Network request failed"
→ Backend not running or wrong API URL in `.env`

#### "Unable to resolve module"
→ Run `npm install` and `npm start -- --reset-cache`

#### "SDK location not found"
→ Set `ANDROID_HOME` environment variable to your Android SDK path

#### "Execution failed for task"
→ Run `cd android && ./gradlew clean && cd .. && npm run android`

## Need More Help?

See `TROUBLESHOOTING.md` for comprehensive troubleshooting guide.

