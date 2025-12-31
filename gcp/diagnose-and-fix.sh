#!/bin/bash
# Comprehensive diagnostic and fix for Artifact Registry push issues

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"
REPO_NAME="voicecompanion"

echo "🔍 Diagnosing Artifact Registry push issue..."
echo ""

# Get project number and service account
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Project: ${PROJECT_ID}"
echo "Project Number: ${PROJECT_NUMBER}"
echo "Cloud Build SA: ${CLOUD_BUILD_SA}"
echo ""

# Step 1: Verify repository exists and get details
echo "📦 Step 1: Verifying repository..."
if gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
  echo "✅ Repository exists"
  REPO_FORMAT=$(gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --project=${PROJECT_ID} --format="value(format)")
  echo "   Format: ${REPO_FORMAT}"
else
  echo "❌ Repository does NOT exist! Creating it now..."
  gcloud artifacts repositories create ${REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="VoiceCompanion Docker images" \
    --project=${PROJECT_ID}
  echo "✅ Repository created"
  sleep 5  # Wait for repository to be fully created
fi
echo ""

# Step 2: Check current IAM bindings
echo "🔐 Step 2: Checking IAM bindings..."
echo ""
echo "Project-level bindings for Cloud Build SA:"
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${CLOUD_BUILD_SA}" \
  --format="table(bindings.role)" 2>/dev/null | grep -i artifact || echo "  (No Artifact Registry roles found)"
echo ""

echo "Repository-level bindings:"
gcloud artifacts repositories get-iam-policy ${REPO_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --format="table(bindings.role,bindings.members)" 2>/dev/null || echo "  (Could not retrieve)"
echo ""

# Step 3: Grant permissions (force refresh)
echo "🔐 Step 3: Granting/refreshing permissions..."
echo ""

echo "Granting project-level permission..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

echo "Granting repository-level permission..."
gcloud artifacts repositories add-iam-policy-binding ${REPO_NAME} \
  --location=${REGION} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --project=${PROJECT_ID} 2>&1 | grep -v "already has role" || echo "✅ Already granted"
echo ""

# Step 4: Verify API is enabled
echo "🔌 Step 4: Verifying APIs are enabled..."
APIS=$(gcloud services list --enabled --project=${PROJECT_ID} --format="value(config.name)" 2>/dev/null)
if echo "${APIS}" | grep -q "artifactregistry.googleapis.com"; then
  echo "✅ Artifact Registry API is enabled"
else
  echo "⚠️  Artifact Registry API not enabled. Enabling now..."
  gcloud services enable artifactregistry.googleapis.com --project=${PROJECT_ID}
  echo "✅ API enabled"
fi

if echo "${APIS}" | grep -q "cloudbuild.googleapis.com"; then
  echo "✅ Cloud Build API is enabled"
else
  echo "⚠️  Cloud Build API not enabled. Enabling now..."
  gcloud services enable cloudbuild.googleapis.com --project=${PROJECT_ID}
  echo "✅ API enabled"
fi
echo ""

# Step 5: Wait and provide next steps
echo "⏳ Waiting 10 seconds for IAM propagation..."
sleep 10

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Wait 2-5 more minutes for full IAM propagation"
echo "   2. Run: gcloud builds submit --config gcp/cloudbuild.yaml \\"
echo "           --substitutions=_REGION=${REGION},_REPO=${REPO_NAME}"
echo ""
echo "💡 If it STILL fails after waiting, try this workaround:"
echo "   Use Container Registry (GCR) instead of Artifact Registry:"
echo "   - Change image tags to: gcr.io/${PROJECT_ID}/backend:latest"
echo "   - GCR doesn't require explicit repository creation"
echo ""
echo "🔍 To check what service account Cloud Build is actually using:"
echo "   gcloud builds list --limit=1 --format='value(serviceAccount)'"

