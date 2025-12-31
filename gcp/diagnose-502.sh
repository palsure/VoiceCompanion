#!/bin/bash
# Comprehensive diagnosis of 502 error

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"

echo "🔍 Comprehensive 502 Error Diagnosis"
echo "===================================="
echo ""

# 1. Check backend status
echo "1. Backend Service Status:"
echo "-------------------------"
BACKEND_URL=$(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.url)' 2>/dev/null || echo "")
if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend service not found or not accessible"
    exit 1
fi
echo "   Backend URL: ${BACKEND_URL}"
echo "   Status: $(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.conditions[0].status)')"
echo ""

# 2. Test backend directly
echo "2. Testing Backend Directly:"
echo "----------------------------"
if curl -s -f --max-time 10 "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo "   ✅ Backend /health is accessible"
    curl -s "${BACKEND_URL}/health" | head -1
else
    echo "   ❌ Backend /health is NOT accessible"
    echo "   This is the root cause!"
fi
echo ""

# 3. Check frontend environment variables
echo "3. Frontend Environment Variables:"
echo "---------------------------------"
ENV_VARS=$(gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(spec.template.spec.containers[0].env)' 2>/dev/null || echo "")
if echo "$ENV_VARS" | grep -q "BACKEND_URL"; then
    echo "   ✅ BACKEND_URL is set"
    echo "$ENV_VARS" | tr ',' '\n' | grep BACKEND_URL
else
    echo "   ❌ BACKEND_URL is NOT set!"
    echo "   This is likely the problem!"
fi
echo ""

# 4. Check frontend logs for nginx startup
echo "4. Frontend Nginx Startup Messages:"
echo "-----------------------------------"
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=voicecompanion-frontend AND (textPayload=~'nginx' OR textPayload=~'BACKEND_URL' OR textPayload=~'proxy_pass')" \
  --limit=20 \
  --format="value(textPayload)" \
  --project=${PROJECT_ID} 2>/dev/null | head -20 || echo "   No relevant logs found"
echo ""

# 5. Check for error logs
echo "5. Recent Error Logs:"
echo "--------------------"
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=voicecompanion-frontend AND severity>=ERROR" \
  --limit=10 \
  --format="table(timestamp,severity,textPayload)" \
  --project=${PROJECT_ID} 2>/dev/null | head -15 || echo "   No error logs found"
echo ""

# 6. Test frontend proxy
echo "6. Testing Frontend Proxy:"
echo "-------------------------"
FRONTEND_URL=$(gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(status.url)')
echo "   Frontend URL: ${FRONTEND_URL}"
echo "   Testing: ${FRONTEND_URL}/api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${FRONTEND_URL}/api/health" 2>&1 || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "   ✅ Proxy is working (HTTP ${HTTP_CODE})"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "   ❌ 502 Bad Gateway - nginx can't reach backend"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Connection failed - check network/DNS"
else
    echo "   ⚠️  Unexpected response (HTTP ${HTTP_CODE})"
fi
echo ""

# 7. Recommendations
echo "7. Recommendations:"
echo "------------------"
if ! echo "$ENV_VARS" | grep -q "BACKEND_URL"; then
    echo "   → BACKEND_URL is not set. Run:"
    echo "     gcloud run services update voicecompanion-frontend \\"
    echo "       --region=${REGION} \\"
    echo "       --set-env-vars=\"BACKEND_URL=${BACKEND_URL}\""
    echo ""
fi

if ! curl -s -f --max-time 10 "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo "   → Backend is not accessible. Check backend logs:"
    echo "     gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=voicecompanion-backend' --limit=20 --project=${PROJECT_ID}"
    echo ""
fi

echo "   → Rebuild and redeploy frontend:"
echo "     ./gcp/fix-502-complete.sh"
echo ""

