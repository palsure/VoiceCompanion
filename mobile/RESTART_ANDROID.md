# Restart Android App - Quick Guide

## Method 1: Reload App (Fastest)

### If Metro bundler is already running:
1. Press `r` in the Metro bundler terminal to reload
2. OR shake device/emulator and tap "Reload"
3. OR press `Ctrl+M` (Windows/Linux) or `Cmd+M` (Mac) in emulator, then tap "Reload"

### If app is open:
- **Physical Device:** Shake device → Tap "Reload"
- **Emulator:** Press `Ctrl+M` (Windows/Linux) or `Cmd+M` (Mac) → Tap "Reload"

## Method 2: Restart Metro Bundler

```bash
cd mobile

# Stop current Metro bundler (Ctrl+C if running)
# Then restart with cache clear
npm start -- --clear
```

Then press `a` to launch on Android emulator.

## Method 3: Full Restart (Clear Everything)

```bash
cd mobile

# Stop Metro bundler if running (Ctrl+C)

# Clear all caches
rm -rf .expo
rm -rf node_modules/.cache

# Restart
npm start -- --clear
```

Press `a` for Android emulator.

## Method 4: Rebuild and Reinstall App

```bash
cd mobile

# Stop Metro bundler (Ctrl+C)

# Uninstall existing app
adb uninstall com.voicecompanion.app

# Rebuild and reinstall
npm run android
```

## Method 5: Quick Reload via ADB

```bash
# Reload app without restarting Metro
adb shell input keyevent 82  # Open dev menu
# Then tap "Reload" on screen

# OR force stop and restart
adb shell am force-stop com.voicecompanion.app
adb shell am start -n com.voicecompanion.app/.MainActivity
```

## Method 6: Complete Reset

```bash
cd mobile

# Stop everything
# Press Ctrl+C in Metro terminal

# Clear everything
rm -rf node_modules
rm -rf .expo
rm -rf android/app/build
rm package-lock.json

# Reinstall
npm install

# Restart
npm start
```

Press `a` for Android.

## Keyboard Shortcuts in Metro Bundler

- `r` - Reload app
- `a` - Open Android emulator
- `i` - Open iOS simulator
- `j` - Open debugger
- `m` - Toggle menu
- `Ctrl+C` - Stop Metro bundler

## Troubleshooting Restart Issues

### App won't reload:
```bash
# Kill all Metro processes
pkill -f "expo start"
pkill -f "metro"

# Restart
cd mobile
npm start
```

### App stuck on loading:
```bash
# Clear app data
adb shell pm clear com.voicecompanion.app

# Restart app
npm run android
```

### Metro bundler won't start:
```bash
cd mobile
npm start -- --reset-cache --clear
```

