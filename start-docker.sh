#!/bin/bash

echo "🚀 VoiceCompanion Docker Startup Script"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found"
    echo "Creating .env from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file"
        echo "⚠️  Please edit .env and add your API keys before continuing"
        echo ""
        read -p "Press Enter to continue after adding API keys, or Ctrl+C to exit..."
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
else
    echo "✅ .env file found"
fi

echo ""
echo "Building and starting containers..."
echo ""

# Build and start containers
docker compose -f docker-compose.dev.yml up --build

