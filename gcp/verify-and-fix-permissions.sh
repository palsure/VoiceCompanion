#!/bin/bash
# Comprehensive verification and fix for Artifact Registry permissions

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"
REPO_NAME="voicecompanion"

echo "🔍 Verifying Artifact Registry setup..."

# Get project number
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Project Number: ${PROJECT_NUMBER}"
echo "Cloud Build SA: ${CLOUD_BUILD_SA}"
echo ""

# Verify repository exists
echo "📦 Checking repository..."
if gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
  echo "✅ Repository exists"
else
  echo "❌ Repository doesn't exist. Creating..."
  gcloud artifacts repositories create ${REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="VoiceCompanion Docker images" \
    --project=${PROJECT_ID}
  echo "✅ Repository created"
fi
echo ""

# Verify project-level permissions
echo "🔐 Checking project-level permissions..."
if gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${CLOUD_BUILD_SA} AND bindings.role:roles/artifactregistry.writer" \
  --format="value(bindings.role)" | grep -q "artifactregistry.writer"; then
  echo "✅ Project-level permission exists"
else
  echo "⚠️  Granting project-level permission..."
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/artifactregistry.writer"
  echo "✅ Project-level permission granted"
fi
echo ""

# Verify repository-level permissions
echo "🔐 Checking repository-level permissions..."
if gcloud artifacts repositories get-iam-policy ${REPO_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${CLOUD_BUILD_SA} AND bindings.role:roles/artifactregistry.writer" \
  --format="value(bindings.role)" 2>/dev/null | grep -q "artifactregistry.writer"; then
  echo "✅ Repository-level permission exists"
else
  echo "⚠️  Granting repository-level permission..."
  gcloud artifacts repositories add-iam-policy-binding ${REPO_NAME} \
    --location=${REGION} \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/artifactregistry.writer" \
    --project=${PROJECT_ID}
  echo "✅ Repository-level permission granted"
fi
echo ""

# Check for organization policies
echo "🔍 Checking for organization policies..."
ORG_POLICIES=$(gcloud resource-manager org-policies list --project=${PROJECT_ID} 2>/dev/null | wc -l)
if [ "${ORG_POLICIES}" -gt 0 ]; then
  echo "⚠️  Found ${ORG_POLICIES} organization policies. Check if any block Artifact Registry access."
  gcloud resource-manager org-policies list --project=${PROJECT_ID} --format="table(name,spec.rules.enforce)"
else
  echo "✅ No organization policies found"
fi
echo ""

# Final verification
echo "📋 Final IAM policy summary:"
echo ""
echo "Repository IAM:"
gcloud artifacts repositories get-iam-policy ${REPO_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --format="table(bindings.role,bindings.members)" 2>/dev/null || echo "  (Could not retrieve - may need a moment)"
echo ""

echo "✅ Verification complete!"
echo ""
echo "⏳ IMPORTANT: IAM changes can take 5-10 minutes to fully propagate."
echo "   If builds still fail, wait 5-10 minutes and try again."
echo ""
echo "📝 Next: Run the build:"
echo "   gcloud builds submit --config gcp/cloudbuild.yaml \\"
echo "     --substitutions=_REGION=${REGION},_REPO=${REPO_NAME}"

