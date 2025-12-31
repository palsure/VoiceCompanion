#!/bin/bash
# Delete old Cloud Run revisions (keeps current serving revisions)

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"

echo "🧹 Deleting Old Cloud Run Revisions"
echo "====================================="
echo ""

# Get current serving revisions
echo "1. Getting current serving revisions..."
FRONTEND_REV=""
BACKEND_REV=""

if gcloud run services describe voicecompanion-frontend --region=${REGION} --project=${PROJECT_ID} &>/dev/null; then
    FRONTEND_REV=$(gcloud run services describe voicecompanion-frontend --region=${REGION} --project=${PROJECT_ID} --format='value(status.latestReadyRevisionName)' 2>/dev/null || echo "")
    echo "   Frontend current revision: ${FRONTEND_REV}"
fi

if gcloud run services describe voicecompanion-backend --region=${REGION} --project=${PROJECT_ID} &>/dev/null; then
    BACKEND_REV=$(gcloud run services describe voicecompanion-backend --region=${REGION} --project=${PROJECT_ID} --format='value(status.latestReadyRevisionName)' 2>/dev/null || echo "")
    echo "   Backend current revision: ${BACKEND_REV}"
fi

echo ""

# List all revisions
echo "2. Finding old revisions..."
ALL_REVISIONS=$(gcloud run revisions list --region=${REGION} --project=${PROJECT_ID} --format='value(metadata.name)' 2>/dev/null || echo "")

if [ -z "$ALL_REVISIONS" ]; then
    echo "   No revisions found"
    exit 0
fi

# Filter out current revisions
OLD_REVISIONS=""
while IFS= read -r rev; do
    if [ ! -z "$rev" ] && [ "$rev" != "$FRONTEND_REV" ] && [ "$rev" != "$BACKEND_REV" ]; then
        OLD_REVISIONS="${OLD_REVISIONS}${rev}\n"
    fi
done <<< "$ALL_REVISIONS"

if [ -z "$OLD_REVISIONS" ]; then
    echo "   ✅ No old revisions to delete (all revisions are in use)"
    exit 0
fi

echo "   Old revisions to delete:"
echo "$OLD_REVISIONS" | grep -v '^$' | while read rev; do
    if [ ! -z "$rev" ]; then
        echo "     - $rev"
    fi
done

echo ""
read -p "3. Delete these old revisions? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "4. Deleting old revisions..."
echo "$OLD_REVISIONS" | grep -v '^$' | while read rev; do
    if [ ! -z "$rev" ]; then
        echo "   Deleting $rev..."
        gcloud run revisions delete "$rev" \
          --region=${REGION} \
          --project=${PROJECT_ID} \
          --quiet 2>/dev/null || echo "     ⚠️  Failed to delete $rev (may already be deleted)"
    fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""

