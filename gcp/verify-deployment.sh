#!/bin/bash
# Verify deployment and test API connectivity

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"

echo "🔍 Verifying Deployment"
echo "======================"
echo ""

# Get URLs
BACKEND_URL=$(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.url)')
FRONTEND_URL=$(gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(status.url)')

echo "Backend URL:  ${BACKEND_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
echo ""

# Check backend environment variables
echo "Backend environment variables:"
gcloud run services describe voicecompanion-backend \
  --region=${REGION} \
  --format='value(spec.template.spec.containers[0].env)' | tr ',' '\n' | grep -E '(NODE_ENV|PORT|PROJECT_ID)' || echo "No env vars found"
echo ""

# Check frontend environment variables
echo "Frontend environment variables:"
gcloud run services describe voicecompanion-frontend \
  --region=${REGION} \
  --format='value(spec.template.spec.containers[0].env)' | tr ',' '\n' | grep BACKEND_URL || echo "BACKEND_URL not found!"
echo ""

# Test backend directly
echo "Testing backend /health endpoint directly..."
if curl -s -f "${BACKEND_URL}/health" > /dev/null; then
    echo "✅ Backend /health is accessible"
    curl -s "${BACKEND_URL}/health" | head -1
else
    echo "❌ Backend /health is NOT accessible"
fi
echo ""

# Test backend API endpoint
echo "Testing backend /api/image-generation/generate (should fail without POST data)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BACKEND_URL}/api/image-generation/generate" -H "Content-Type: application/json" -d '{}' || echo "000")
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend API endpoint is accessible (got ${HTTP_CODE})"
else
    echo "⚠️  Backend API endpoint returned ${HTTP_CODE}"
fi
echo ""

# Test frontend proxy
echo "Testing frontend proxy to /api/image-generation/generate..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${FRONTEND_URL}/api/image-generation/generate" -H "Content-Type: application/json" -d '{}' || echo "000")
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend proxy is working (got ${HTTP_CODE})"
else
    echo "❌ Frontend proxy returned ${HTTP_CODE} (expected 400 or 200)"
    echo "   This indicates the proxy is not working correctly"
fi
echo ""

echo "To check nginx logs:"
echo "gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=voicecompanion-frontend' --limit=10 --project=${PROJECT_ID}"

