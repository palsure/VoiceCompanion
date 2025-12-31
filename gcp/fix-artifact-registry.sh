#!/bin/bash
# Fix Artifact Registry permissions for Cloud Build
# Run this script to ensure the repository exists and Cloud Build has write access

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"
REPO_NAME="voicecompanion"
CLOUD_BUILD_SA="${PROJECT_ID}@cloudbuild.gserviceaccount.com"

echo "🔧 Fixing Artifact Registry setup for Cloud Build..."

# Step 1: Check if repository exists
echo "📦 Checking if repository exists..."
if ! gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
  echo "❌ Repository doesn't exist. Creating it..."
  gcloud artifacts repositories create ${REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="VoiceCompanion Docker images" \
    --project=${PROJECT_ID}
  echo "✅ Repository created"
else
  echo "✅ Repository exists"
fi

# Step 2: Grant project-level permission (recommended)
echo "🔐 Granting project-level Artifact Registry Writer role..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None || echo "⚠️  Project-level binding may already exist (this is OK)"

# Step 3: Grant repository-level permission (more specific)
echo "🔐 Granting repository-level Artifact Registry Writer role..."
gcloud artifacts repositories add-iam-policy-binding ${REPO_NAME} \
  --location=${REGION} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --project=${PROJECT_ID} || echo "⚠️  Repository-level binding may already exist (this is OK)"

# Step 4: Verify permissions
echo "✅ Verifying permissions..."
echo ""
echo "Repository IAM policy:"
gcloud artifacts repositories get-iam-policy ${REPO_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --format="table(bindings.role,bindings.members)"

echo ""
echo "✅ Setup complete! You can now run:"
echo "   gcloud builds submit --config gcp/cloudbuild.yaml \\"
echo "     --substitutions=_REGION=${REGION},_REPO=${REPO_NAME}"

