# Permissions Quick Reference

## Required IAM Roles (2 Total)

Your service account needs exactly **2 roles**:

### 1. Cloud Vision API User
```
Role: roles/vision.user
```
**Why**: For camera/image analysis features in Accessibility mode

### 2. Vertex AI User  
```
Role: roles/aiplatform.user
```
**Why**: For Gemini AI features (conversations, language analysis)

---

## How to Grant (Web Console)

1. Go to: https://console.cloud.google.com/
2. Navigate: **IAM & Admin > Service Accounts**
3. Click your service account
4. Click **"Grant Access"** or **"Permissions"** tab
5. Add these roles:
   - ✅ **Cloud Vision API User** (`roles/vision.user`)
   - ✅ **Vertex AI User** (`roles/aiplatform.user`)
6. Click **"Save"**

---

## How to Grant (gcloud CLI)

```bash
# Set variables
PROJECT_ID="your-project-id"
SERVICE_ACCOUNT="voicecompanion@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Vision API permission
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/vision.user"

# Grant Vertex AI permission
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"
```

---

## What Each Role Does

| Role | Used For | Features |
|------|----------|----------|
| `roles/vision.user` | Vision API | Camera analysis, text extraction, object detection |
| `roles/aiplatform.user` | Vertex AI/Gemini | Conversations, language feedback, cultural context |

---

## APIs That Must Be Enabled

Before granting permissions, ensure these APIs are enabled:

1. **Cloud Vision API** - Required for Vision role
2. **Vertex AI API** - Required for AI Platform role
3. **Generative Language API** - For Gemini (usually auto-enabled)

Enable at: https://console.cloud.google.com/apis/library

---

## Verification

After granting permissions, verify:

```bash
# Check service account has the roles
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --format="table(bindings.role)"
```

You should see:
- `roles/vision.user`
- `roles/aiplatform.user`

---

## Summary

**Minimum Required:**
- ✅ `roles/vision.user`
- ✅ `roles/aiplatform.user`

**That's it!** These two roles provide all permissions needed.

