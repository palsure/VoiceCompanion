# Google Cloud Permissions Guide

## Required IAM Roles for VoiceCompanion

This guide lists the exact permissions needed for your Google Cloud service account.

## Minimum Required Roles

For VoiceCompanion to work, your service account needs these roles:

### 1. Cloud Vision API User
**Role Name**: `roles/vision.user`

**What it does**:
- Allows reading and analyzing images
- Enables text extraction from images
- Enables object detection
- Required for: Accessibility mode (camera features)

**Permissions included**:
- `vision.images.annotate`
- `vision.locations.get`
- `vision.operations.get`

---

### 2. Vertex AI User
**Role Name**: `roles/aiplatform.user`

**What it does**:
- Allows using Vertex AI services
- Enables Gemini API access via Vertex AI
- Required for: AI-powered responses and analysis

**Permissions included**:
- `aiplatform.endpoints.predict`
- `aiplatform.models.predict`
- `aiplatform.locations.get`

---

### 3. AI Platform User (Alternative)
**Role Name**: `roles/ml.developer`

**What it does**:
- Alternative role for Vertex AI access
- Sometimes needed alongside `aiplatform.user`

---

## Complete Permission List

### For Vision API Features
```
Required:
- roles/vision.user

Optional (for advanced features):
- roles/vision.admin (if you need to manage Vision API resources)
```

### For Gemini/Vertex AI Features
```
Required:
- roles/aiplatform.user

Alternative:
- roles/ml.developer
```

### For Both (Recommended Setup)
```
Minimum:
- roles/vision.user
- roles/aiplatform.user

Or use custom role with these permissions:
- vision.images.annotate
- vision.locations.get
- aiplatform.endpoints.predict
- aiplatform.models.predict
- aiplatform.locations.get
```

## How to Grant Permissions

### Method 1: Using Google Cloud Console (Web UI)

1. Go to: https://console.cloud.google.com/
2. Navigate to: **IAM & Admin > Service Accounts**
3. Click on your service account
4. Go to **"Permissions"** tab
5. Click **"Grant Access"** or **"Add Principal"**
6. Add these roles:
   - `Cloud Vision API User`
   - `Vertex AI User`
7. Click **"Save"**

### Method 2: Using gcloud CLI

```bash
# Set your project
export PROJECT_ID="your-project-id"
export SERVICE_ACCOUNT="voicecompanion@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Vision API role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/vision.user"

# Grant Vertex AI role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"
```

### Method 3: Using Terraform (if you use IaC)

```hcl
resource "google_project_iam_member" "vision_user" {
  project = var.project_id
  role    = "roles/vision.user"
  member  = "serviceAccount:${google_service_account.voicecompanion.email}"
}

resource "google_project_iam_member" "aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.voicecompanion.email}"
}
```

## Permission Breakdown by Feature

### Accessibility Mode Features

| Feature | Required Role | API Used |
|---------|--------------|----------|
| Camera scene description | `roles/vision.user` | Cloud Vision API |
| Text extraction from images | `roles/vision.user` | Cloud Vision API |
| Object detection | `roles/vision.user` | Cloud Vision API |
| Document reading | `roles/vision.user` | Cloud Vision API |
| Shopping assistance | `roles/vision.user` | Cloud Vision API |

### Language Learning Mode Features

| Feature | Required Role | API Used |
|---------|--------------|----------|
| Conversation responses | `roles/aiplatform.user` | Vertex AI (Gemini) |
| Language analysis | `roles/aiplatform.user` | Vertex AI (Gemini) |
| Grammar feedback | `roles/aiplatform.user` | Vertex AI (Gemini) |
| Cultural context | `roles/aiplatform.user` | Vertex AI (Gemini) |

### Shared Features

| Feature | Required Role | API Used |
|---------|--------------|----------|
| Multimodal understanding | Both roles | Vision + Vertex AI |
| Image + text analysis | Both roles | Vision + Vertex AI |

## Custom Role (Advanced)

If you want to create a custom role with minimal permissions:

```bash
# Create custom role
gcloud iam roles create voicecompanionRole \
  --project=YOUR_PROJECT_ID \
  --title="VoiceCompanion Role" \
  --description="Minimal permissions for VoiceCompanion" \
  --permissions=vision.images.annotate,vision.locations.get,aiplatform.endpoints.predict,aiplatform.models.predict,aiplatform.locations.get

# Grant custom role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voicecompanion@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/YOUR_PROJECT_ID/roles/voicecompanionRole"
```

## Verification

### Check Current Permissions

```bash
# List service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:voicecompanion@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

### Test Permissions

```bash
# Test Vision API access
gcloud auth activate-service-account --key-file=key.json
gcloud ml vision detect-text --image-path=test-image.jpg

# Test Vertex AI access
gcloud ai models list --region=us-central1
```

## Common Permission Issues

### Error: "Permission denied on resource"
**Solution**: 
- Verify service account has `roles/vision.user`
- Check APIs are enabled
- Ensure billing is enabled

### Error: "Service account does not have permission"
**Solution**:
- Grant `roles/aiplatform.user`
- Wait a few minutes for permissions to propagate
- Re-authenticate if needed

### Error: "API not enabled"
**Solution**:
- Enable Cloud Vision API
- Enable Vertex AI API
- Wait for activation (can take a few minutes)

## Security Best Practices

1. **Principle of Least Privilege**
   - Only grant the minimum required permissions
   - Don't use admin roles unless necessary

2. **Role Separation**
   - Use different service accounts for different environments
   - Production service account should have minimal permissions

3. **Regular Audits**
   - Review service account permissions periodically
   - Remove unused permissions

4. **Key Rotation**
   - Rotate service account keys regularly
   - Use key expiration dates when possible

## Quick Reference

### Minimum Setup (Recommended)
```bash
# Grant these two roles
roles/vision.user          # For Vision API
roles/aiplatform.user      # For Vertex AI/Gemini
```

### Full Setup (If you need more)
```bash
roles/vision.user          # Vision API
roles/aiplatform.user      # Vertex AI
roles/ml.developer         # Alternative AI Platform access
```

## Summary

**For VoiceCompanion, you need exactly 2 roles:**

1. ✅ `roles/vision.user` - For camera/image features
2. ✅ `roles/aiplatform.user` - For AI/Gemini features

That's it! These two roles provide all the permissions needed for the application to function.

