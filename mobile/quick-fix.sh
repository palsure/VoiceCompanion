#!/bin/bash

# Quick Fix Script for Android App Not Loading
# Run this from the mobile directory: bash quick-fix.sh

echo "🔧 VoiceCompanion Android App - Quick Fix"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    echo "   cd mobile && bash quick-fix.sh"
    exit 1
fi

echo "Step 1: Checking Node.js version..."
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version should be 18+. Current: $(node --version)"
else
    echo "✅ Node.js version OK: $(node --version)"
fi

echo ""
echo "Step 2: Checking for .env file..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating one..."
    cat > .env << EOF
# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000

# For Physical Device, uncomment and use your computer's IP:
# EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
EOF
    echo "✅ Created .env file with default Android emulator settings"
else
    echo "✅ .env file exists"
    echo "   Current API URL: $(grep EXPO_PUBLIC_API_URL .env | head -1 || echo 'Not set')"
fi

echo ""
echo "Step 3: Checking shared module..."
if [ ! -f "../shared/src/api.ts" ]; then
    echo "❌ Shared module not found at ../shared/src/api.ts"
    echo "   This is required for the app to work"
    exit 1
else
    echo "✅ Shared module found"
fi

echo ""
echo "Step 4: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
else
    echo "✅ node_modules exists"
fi

echo ""
echo "Step 5: Clearing caches..."
rm -rf .expo
rm -rf node_modules/.cache
echo "✅ Caches cleared"

echo ""
echo "Step 6: Checking Android setup..."
if [ ! -d "android" ]; then
    echo "⚠️  Android directory not found. This is normal for Expo managed workflow."
    echo "   Run: npx expo prebuild to generate native directories"
else
    echo "✅ Android directory exists"
    if [ -f "android/gradlew" ]; then
        chmod +x android/gradlew
        echo "✅ Gradle wrapper is executable"
    fi
fi

echo ""
echo "========================================"
echo "✅ Quick fix complete!"
echo ""
echo "Next steps:"
echo "1. Make sure backend is running:"
echo "   docker compose -f docker-compose.dev.yml up"
echo ""
echo "2. Start the app:"
echo "   npm start"
echo ""
echo "3. Press 'a' for Android emulator or scan QR code"
echo ""
echo "If still not working, check TROUBLESHOOTING.md for detailed steps"

