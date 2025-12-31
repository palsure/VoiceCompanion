#!/bin/bash
# Cleanup unused Cloud Run services and revisions

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"

echo "🧹 Cloud Run Cleanup"
echo "==================="
echo ""

# List all services
echo "1. Current Cloud Run Services:"
echo "-------------------------------"
gcloud run services list --region=${REGION} --project=${PROJECT_ID} --format="table(metadata.name,status.url,status.conditions[0].status)"
echo ""

# List old revisions (not serving traffic)
echo "2. Old Revisions (not serving traffic):"
echo "----------------------------------------"
REVISIONS=$(gcloud run revisions list --region=${REGION} --project=${PROJECT_ID} --format="value(metadata.name)" | grep -v "$(gcloud run services describe voicecompanion-frontend --region=${REGION} --format='value(status.latestReadyRevisionName)' 2>/dev/null || echo '')" | grep -v "$(gcloud run services describe voicecompanion-backend --region=${REGION} --format='value(status.latestReadyRevisionName)' 2>/dev/null || echo '')" || true)

if [ -z "$REVISIONS" ]; then
    echo "   No old revisions found"
else
    echo "$REVISIONS" | while read rev; do
        if [ ! -z "$rev" ]; then
            echo "   - $rev"
        fi
    done
fi
echo ""

# Check for unused services
echo "3. Services to Keep:"
echo "-------------------"
echo "   - voicecompanion-frontend (active)"
echo "   - voicecompanion-backend (active)"
echo ""

echo "4. Options:"
echo "----------"
echo "   a) Delete a specific service:"
echo "      ./gcp/delete-service.sh <service-name>"
echo ""
echo "   b) Delete old revisions (keeps current ones):"
echo "      ./gcp/delete-old-revisions.sh"
echo ""
echo "   Or delete a specific revision:"
echo "      ./gcp/delete-service.sh <revision-name> --revision"
echo ""
echo "   c) List all services:"
echo "      ./gcp/list-services.sh"
echo ""
echo "⚠️  Note: Deleting services will make them unavailable. Make sure you want to delete them!"
echo ""

