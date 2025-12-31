#!/bin/bash
# Rebuild frontend with correct platform and deploy

set -e

PROJECT_ID="hackathon-482302"

echo "🔨 Rebuilding frontend image for linux/amd64..."
echo ""

# Rebuild frontend (for linux/amd64 platform - Cloud Run requirement)
docker build --platform linux/amd64 -t gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest \
  -f frontend/Dockerfile.cloudrun \
  frontend

echo ""
echo "📤 Pushing frontend image..."
docker push gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest

echo ""
echo "🚀 Deploying frontend..."
echo ""

# Get backend URL first
REGION="us-central1"
BACKEND_URL=$(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.url)')
echo "Backend URL: ${BACKEND_URL}"
echo ""

# Deploy frontend
gcloud run deploy voicecompanion-frontend \
  --image=gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="BACKEND_URL=${BACKEND_URL}" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=10

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(status.url)')
echo ""
echo "✅ Frontend deployed at: ${FRONTEND_URL}"
echo ""
echo "🎉 Deployment complete! Your app is live at: ${FRONTEND_URL}"

