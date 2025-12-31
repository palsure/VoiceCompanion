#!/bin/bash
# Immediate fix for Artifact Registry permissions
# This script will identify the correct service account and grant permissions

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"
REPO_NAME="voicecompanion"

echo "🔍 Identifying Cloud Build service account..."

# Get project number to construct the correct service account email
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "✅ Cloud Build service account: ${CLOUD_BUILD_SA}"
echo ""

# Step 1: Ensure repository exists
echo "📦 Step 1: Checking repository..."
if ! gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
  echo "   Creating repository..."
  gcloud artifacts repositories create ${REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="VoiceCompanion Docker images" \
    --project=${PROJECT_ID}
  echo "   ✅ Repository created"
else
  echo "   ✅ Repository exists"
fi
echo ""

# Step 2: Grant project-level permission
echo "🔐 Step 2: Granting project-level permission..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None 2>&1 | grep -v "already has role" || echo "   ✅ Permission already granted (or granted now)"
echo ""

# Step 3: Grant repository-level permission
echo "🔐 Step 3: Granting repository-level permission..."
gcloud artifacts repositories add-iam-policy-binding ${REPO_NAME} \
  --location=${REGION} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --project=${PROJECT_ID} 2>&1 | grep -v "already has role" || echo "   ✅ Permission already granted (or granted now)"
echo ""

# Step 4: Verify
echo "✅ Step 4: Verifying permissions..."
echo ""
echo "Repository IAM bindings:"
gcloud artifacts repositories get-iam-policy ${REPO_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --format="table(bindings.role,bindings.members)" 2>/dev/null || echo "   (Could not retrieve policy - may need a moment to propagate)"
echo ""

# Step 5: Wait a moment for IAM propagation
echo "⏳ Waiting 5 seconds for IAM propagation..."
sleep 5

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Wait 10-30 seconds for IAM changes to propagate"
echo "   2. Run: gcloud builds submit --config gcp/cloudbuild.yaml \\"
echo "           --substitutions=_REGION=${REGION},_REPO=${REPO_NAME}"
echo ""
echo "💡 If it still fails, check:"
echo "   - Organization policies may be blocking Artifact Registry access"
echo "   - Run: gcloud artifacts repositories get-iam-policy ${REPO_NAME} --location=${REGION}"
echo "   - Verify ${CLOUD_BUILD_SA} appears in the output"

