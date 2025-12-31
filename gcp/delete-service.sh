#!/bin/bash
# Delete a Cloud Run service or revision

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"

if [ -z "$1" ]; then
    echo "❌ Usage: ./gcp/delete-service.sh <service-name-or-revision> [--revision]"
    echo ""
    echo "Examples:"
    echo "  ./gcp/delete-service.sh voicecompanion-frontend          # Delete service"
    echo "  ./gcp/delete-service.sh voicecompanion-frontend-00009-rzs --revision  # Delete revision"
    echo ""
    echo "Available services:"
    gcloud run services list --region=${REGION} --project=${PROJECT_ID} --format="value(metadata.name)"
    echo ""
    echo "Available revisions:"
    gcloud run revisions list --region=${REGION} --project=${PROJECT_ID} --format="value(metadata.name)" | head -10
    exit 1
fi

NAME=$1
IS_REVISION=false

if [ "$2" = "--revision" ] || [[ "$NAME" =~ -[0-9]{5}-[a-z0-9]+$ ]]; then
    IS_REVISION=true
fi

if [ "$IS_REVISION" = true ]; then
    echo "🗑️  Deleting Cloud Run revision: ${NAME}"
    echo "=========================================="
    echo ""
    
    # Confirm deletion
    read -p "Are you sure you want to delete revision ${NAME}? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Cancelled."
        exit 0
    fi
    
    echo "Deleting revision..."
    gcloud run revisions delete ${NAME} \
      --region=${REGION} \
      --project=${PROJECT_ID} \
      --quiet
    
    echo ""
    echo "✅ Revision ${NAME} deleted successfully"
else
    echo "🗑️  Deleting Cloud Run service: ${NAME}"
    echo "=========================================="
    echo ""
    
    # Confirm deletion
    read -p "Are you sure you want to delete service ${NAME}? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Cancelled."
        exit 0
    fi
    
    echo "Deleting service..."
    gcloud run services delete ${NAME} \
      --region=${REGION} \
      --project=${PROJECT_ID} \
      --quiet
    
    echo ""
    echo "✅ Service ${NAME} deleted successfully"
fi
echo ""

