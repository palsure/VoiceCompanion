#!/bin/bash
# Deploy with cost-optimized settings (scale to zero, minimal resources)

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"
SERVICE_ACCOUNT="voicecompanion-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "💰 Deploying with Cost-Optimized Settings"
echo "=========================================="
echo ""
echo "This deployment uses:"
echo "  - min-instances=0 (scale to zero when idle)"
echo "  - Minimal CPU/memory allocation"
echo "  - Request-based pricing only"
echo ""

# Deploy backend with cost-optimized settings
echo "1. Deploying backend (cost-optimized)..."
gcloud run deploy voicecompanion-backend \
  --image=gcr.io/${PROJECT_ID}/voicecompanion-backend:latest \
  --region=${REGION} \
  --platform=managed \
  --service-account=${SERVICE_ACCOUNT} \
  --allow-unauthenticated \
  --port=5000 \
  --set-env-vars="NODE_ENV=production,VERTEX_AI_LOCATION=us-central1,GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}" \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=5 \
  --min-instances=0 \
  --cpu-throttling \
  --no-cpu-boost

# Get backend URL
BACKEND_URL=$(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.url)')
echo "✅ Backend deployed at: ${BACKEND_URL}"
echo ""

# Extract hostname from backend URL for nginx Host header
BACKEND_HOST=$(echo ${BACKEND_URL} | sed 's|https\?://||' | sed 's|/.*||')
echo "📝 Backend hostname: ${BACKEND_HOST}"
echo ""

# Deploy frontend with cost-optimized settings
echo "2. Deploying frontend (cost-optimized)..."
gcloud run deploy voicecompanion-frontend \
  --image=gcr.io/${PROJECT_ID}/voicecompanion-frontend:latest \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="BACKEND_URL=${BACKEND_URL},BACKEND_HOST=${BACKEND_HOST}" \
  --memory=256Mi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=3 \
  --min-instances=0 \
  --cpu-throttling \
  --no-cpu-boost

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(status.url)')
echo ""
echo "✅ Frontend deployed at: ${FRONTEND_URL}"
echo ""
echo "💰 Cost Optimization Settings:"
echo "   ✅ min-instances=0 (scale to zero when idle)"
echo "   ✅ Minimal memory allocation"
echo "   ✅ CPU throttling enabled"
echo "   ✅ Limited max instances"
echo ""
echo "💡 Cost Estimate:"
echo "   - Backend: ~\$0.00002400 per request + \$0.00000250 per GB-second"
echo "   - Frontend: ~\$0.00002400 per request + \$0.00000250 per GB-second"
echo "   - No charges when idle (scaled to zero)"
echo ""
echo "📊 Monitor costs:"
echo "   gcloud billing budgets list"
echo "   https://console.cloud.google.com/billing"
echo ""

