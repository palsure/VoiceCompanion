#!/bin/bash
# Test API proxy configuration

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"

echo "🧪 Testing API Proxy Configuration"
echo "===================================="
echo ""

# Get URLs
BACKEND_URL=$(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.url)')
FRONTEND_URL=$(gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(status.url)')

echo "Backend URL: ${BACKEND_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
echo ""

# Test 1: Backend health check
echo "1. Testing backend health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BACKEND_URL}/health" 2>&1 || echo "000")
echo "   ${BACKEND_URL}/health → HTTP ${HTTP_CODE}"
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend health check failed"
fi
echo ""

# Test 2: Backend gallery list (direct)
echo "2. Testing backend gallery list (direct)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BACKEND_URL}/api/gallery/list" 2>&1 || echo "000")
echo "   ${BACKEND_URL}/api/gallery/list → HTTP ${HTTP_CODE}"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ Backend route exists"
else
    echo "   ❌ Backend route returned ${HTTP_CODE}"
fi
echo ""

# Test 3: Frontend proxy to backend health
echo "3. Testing frontend proxy to backend health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${FRONTEND_URL}/health" 2>&1 || echo "000")
echo "   ${FRONTEND_URL}/health → HTTP ${HTTP_CODE}"
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Frontend proxy to /health works"
else
    echo "   ⚠️  Frontend /health returned ${HTTP_CODE}"
fi
echo ""

# Test 4: Frontend proxy to backend API
echo "4. Testing frontend proxy to backend API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${FRONTEND_URL}/api/gallery/list" 2>&1 || echo "000")
echo "   ${FRONTEND_URL}/api/gallery/list → HTTP ${HTTP_CODE}"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ Frontend proxy to /api/gallery/list works"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ 404 Not Found - path may not be preserved correctly"
    echo ""
    echo "   Debugging:"
    echo "   - Check nginx logs: ./gcp/check-nginx-errors.sh"
    echo "   - Verify BACKEND_URL: gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(spec.template.spec.containers[0].env)'"
else
    echo "   ⚠️  Got HTTP ${HTTP_CODE}"
fi
echo ""

# Test 5: Check nginx config
echo "5. Checking nginx configuration in logs..."
echo "   Looking for proxy_pass configuration..."
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=voicecompanion-frontend AND textPayload=~'proxy_pass'" \
  --limit=5 \
  --format="value(textPayload)" \
  --project=${PROJECT_ID} 2>/dev/null | head -3 || echo "   No proxy_pass logs found"
echo ""

echo "✅ Testing complete!"
echo ""
echo "If /api/gallery/list returns 404, the issue is likely:"
echo "  1. Nginx proxy_pass not preserving the /api path"
echo "  2. BACKEND_URL not set correctly"
echo "  3. Path rewriting issue in nginx config"

