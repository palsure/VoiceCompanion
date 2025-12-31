#!/bin/bash
# Grant all necessary permissions to Cloud Build service account

set -e

PROJECT_ID="hackathon-482302"
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Granting permissions to: ${CLOUD_BUILD_SA}"
echo ""

# Artifact Registry Writer (for pushing images)
echo "1. Granting roles/artifactregistry.writer..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

# Storage Admin (for GCR and general storage access)
echo "2. Granting roles/storage.admin..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/storage.admin" \
  --condition=None 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

# Storage Object Viewer (for reading source from GCS)
echo "3. Granting roles/storage.objectViewer..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/storage.objectViewer" \
  --condition=None 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

# Logging Writer (for build logs)
echo "4. Granting roles/logging.logWriter..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/logging.logWriter" \
  --condition=None 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

# Also grant at repository level for Artifact Registry
REGION="us-central1"
REPO_NAME="voicecompanion"

echo "5. Granting repository-level roles/artifactregistry.writer..."
gcloud artifacts repositories add-iam-policy-binding ${REPO_NAME} \
  --location=${REGION} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --project=${PROJECT_ID} 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

echo "✅ All permissions granted!"
echo ""
echo "⏳ Wait 2-3 minutes for IAM propagation, then try the build again:"
echo "   gcloud builds submit --config gcp/cloudbuild.yaml \\"
echo "     --substitutions=_REGION=${REGION},_REPO=${REPO_NAME}"

