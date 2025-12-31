#!/bin/bash
# Rebuild frontend with updated nginx config and deploy both services

set -e

PROJECT_ID="hackathon-482302"

echo "🔨 Rebuilding frontend image with updated nginx config..."
echo ""

# Rebuild frontend (for linux/amd64 platform - Cloud Run requirement)
docker build --platform linux/amd64 -t gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest \
  -f frontend/Dockerfile.cloudrun \
  frontend

echo ""
echo "📤 Pushing frontend image..."
docker push gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest

echo ""
echo "🚀 Deploying services..."
echo ""

# Run the deployment script
./gcp/deploy-to-cloudrun.sh

