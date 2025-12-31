#!/bin/bash
# Build and push Docker images locally to bypass Cloud Build permission issues

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"
REPO_NAME="voicecompanion"

echo "🔨 Building and pushing Docker images locally..."
echo ""

# Authenticate Docker
echo "1. Authenticating Docker with GCR..."
gcloud auth configure-docker gcr.io --quiet
echo ""

# Build and push backend (for linux/amd64 platform - Cloud Run requirement)
echo "2. Building backend image for linux/amd64..."
docker build --platform linux/amd64 -t gcr.io/${PROJECT_ID}/voicecompanion-backend:latest \
  -f backend/Dockerfile \
  backend

echo "3. Pushing backend image..."
docker push gcr.io/${PROJECT_ID}/voicecompanion-backend:latest
echo ""

# Build and push frontend (for linux/amd64 platform - Cloud Run requirement)
echo "4. Building frontend image for linux/amd64..."
docker build --platform linux/amd64 -t gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest \
  -f frontend/Dockerfile.cloudrun \
  frontend

echo "5. Pushing frontend image..."
docker push gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest
echo ""

echo "✅ Images pushed successfully!"
echo ""
echo "Next step: Deploy to Cloud Run:"
echo "  gcloud run services replace gcp/cloudrun.voicecompanion.yaml --region=${REGION}"

