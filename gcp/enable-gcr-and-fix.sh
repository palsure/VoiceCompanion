#!/bin/bash
# Enable Container Registry API and verify GCR access

set -e

PROJECT_ID="hackathon-482302"
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Enabling Container Registry API..."
gcloud services enable containerregistry.googleapis.com --project=${PROJECT_ID} 2>&1 | grep -v "already enabled" || echo "✅ Already enabled"
echo ""

echo "Granting Storage Admin to Cloud Build SA (required for GCR)..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/storage.admin" \
  --condition=None 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

echo "✅ Container Registry should now be accessible"
echo ""
echo "Note: If GCR still fails, your project may have been migrated to Artifact Registry."
echo "In that case, we'll need to use Artifact Registry with a user-managed service account."

