#!/bin/bash
# Rebuild backend with gallery fix and deploy

set -e

PROJECT_ID="hackathon-482302"

echo "🔨 Rebuilding backend image with gallery fix..."
echo ""

# Rebuild backend (for linux/amd64 platform - Cloud Run requirement)
docker build --platform linux/amd64 -t gcr.io/${PROJECT_ID}/voicecompanion-backend:latest \
  -f backend/Dockerfile \
  backend

echo ""
echo "📤 Pushing backend image..."
docker push gcr.io/${PROJECT_ID}/voicecompanion-backend:latest

echo ""
echo "🚀 Deploying services..."
echo ""

# Run the deployment script
./gcp/deploy-to-cloudrun.sh

