#!/bin/bash
# Check backend logs to diagnose startup issues

PROJECT_ID="hackathon-482302"
REGION="us-central1"
SERVICE="voicecompanion-backend"

echo "📋 Checking recent logs for ${SERVICE}..."
echo ""

gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE}" \
  --project=${PROJECT_ID} \
  --limit=50 \
  --format="table(timestamp,severity,textPayload)" \
  --freshness=1h

echo ""
echo "💡 To see more detailed logs, visit:"
echo "   https://console.cloud.google.com/run/detail/${REGION}/${SERVICE}/logs?project=${PROJECT_ID}"

