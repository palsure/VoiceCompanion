#!/bin/bash
# Deploy frontend and backend as separate Cloud Run services

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"
SERVICE_ACCOUNT="voicecompanion-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Deploying to Cloud Run..."
echo ""

# Deploy backend first
echo "1. Deploying backend..."
gcloud run deploy voicecompanion-backend \
  --image=gcr.io/${PROJECT_ID}/voicecompanion-backend:latest \
  --region=${REGION} \
  --platform=managed \
  --service-account=${SERVICE_ACCOUNT} \
  --allow-unauthenticated \
  --port=5000 \
  --set-env-vars="NODE_ENV=production,VERTEX_AI_LOCATION=us-central1,GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}" \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=10 \
  --cpu-throttling \
  --min-instances=0

# Get backend URL
BACKEND_URL=$(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.url)')
echo "✅ Backend deployed at: ${BACKEND_URL}"
echo ""

# Deploy frontend
echo "2. Deploying frontend..."
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
echo "📝 Note: Update frontend nginx config to proxy to ${BACKEND_URL}/api"
echo "   Then rebuild and redeploy frontend."

