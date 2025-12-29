# Solution for Organization Policy Blocking Service Account Keys

## Problem

Your organization has enforced a policy (`iam.disableServiceAccountKeyCreation`) that prevents creating service account key files. This is a common security policy in enterprise Google Cloud organizations.

## Solutions (Choose One)

### Solution 1: Use Gemini API Key Only (Simplest) ⚡

**Best for**: Quick setup, language learning features only

This bypasses the service account requirement entirely for Gemini features.

1. **Get Gemini API Key**:
   - Go to: https://makersuite.google.com/app/apikey
   - Create API key
   - Copy the key

2. **Update `.env`**:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   # Leave GOOGLE_APPLICATION_CREDENTIALS empty or remove it
   ```

3. **Limitations**:
   - ✅ Works for: Language learning mode, conversations, feedback
   - ❌ Won't work for: Vision API features (camera, image analysis)
   - ❌ Won't work for: Accessibility mode camera features

**This is the fastest solution if you only need language learning features!**

---

### Solution 2: Use Application Default Credentials (Local Dev)

**Best for**: Local development with full features

Use your personal Google account credentials instead of a service account key.

1. **Install gcloud CLI** (if not installed):
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from:
   # https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with your account**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Update `.env`**:
   ```env
   # Remove or leave empty
   # GOOGLE_APPLICATION_CREDENTIALS=
   
   # Keep these
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GEMINI_API_KEY=your-gemini-key
   ```

5. **Update backend code** to use ADC:
   The code should automatically use Application Default Credentials if `GOOGLE_APPLICATION_CREDENTIALS` is not set.

**Note**: This uses your personal account, so make sure you have the required permissions on the project.

---

### Solution 3: Request Policy Exception

**Best for**: If you have admin access or can contact your admin

1. **Contact your Google Cloud organization admin**
2. **Request exception** for your project or service account
3. **Provide justification**: "Hackathon project requiring service account key for local development"

**Policy exception request should include**:
- Project ID
- Service account email
- Justification
- Duration needed

---

### Solution 4: Use Workload Identity Federation (Advanced)

**Best for**: Production deployments, CI/CD

This is more complex but works around the policy for cloud deployments.

1. **Set up Workload Identity Pool**
2. **Configure OIDC provider**
3. **Map external identity to service account**

**Note**: This is complex and typically used for production, not local dev.

---

### Solution 5: Use a Personal Google Cloud Project

**Best for**: Hackathon/development projects

If you have a personal Google account (not organization-managed):

1. **Create a new project** with your personal account
2. **This project won't have the organization policy**
3. **Create service account key** in the personal project
4. **Use that key** for development

---

## Recommended Approach for Hackathon

### Quick Setup (Language Learning Only)

1. Use **Solution 1** (Gemini API key only)
2. Skip Vision API features
3. Focus on language learning mode

### Full Features Setup

1. Use **Solution 2** (Application Default Credentials)
2. Authenticate with `gcloud auth application-default login`
3. Use your personal account permissions
4. Works for both Vision API and Gemini

---

## Code Changes Needed

### For Solution 1 (Gemini Only)

No code changes needed! Just:
- Set `GEMINI_API_KEY` in `.env`
- Leave `GOOGLE_APPLICATION_CREDENTIALS` empty
- Vision API features will gracefully fail

### For Solution 2 (ADC)

The code should already work! The Vision API client will automatically use Application Default Credentials if `GOOGLE_APPLICATION_CREDENTIALS` is not set.

**Verify in `backend/src/services/visionService.ts`**:
```typescript
// This should work with ADC if GOOGLE_APPLICATION_CREDENTIALS is not set
this.client = new ImageAnnotatorClient({
  projectId: config.googleCloudProjectId,
  // keyFilename is optional - if not provided, uses ADC
})
```

---

## Step-by-Step: Solution 2 (ADC) Setup

### 1. Install gcloud CLI

```bash
# macOS
brew install google-cloud-sdk

# Verify installation
gcloud --version
```

### 2. Authenticate

```bash
# Login with your Google account
gcloud auth login

# Set up Application Default Credentials
gcloud auth application-default login

# Select your account and grant permissions
```

### 3. Set Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

### 4. Verify Permissions

Make sure your account has:
- `roles/vision.user` (or equivalent)
- `roles/aiplatform.user` (or equivalent)

Grant if needed:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/vision.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/aiplatform.user"
```

### 5. Update .env

```env
# Leave empty or remove
GOOGLE_APPLICATION_CREDENTIALS=

# Set project ID
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Gemini API key (still needed)
GEMINI_API_KEY=your-gemini-key
```

### 6. Test

```bash
# Test ADC is working
gcloud auth application-default print-access-token

# Should return an access token
```

---

## Troubleshooting

### Error: "Could not load the default credentials"

**Solution**:
- Run: `gcloud auth application-default login`
- Make sure you're logged in: `gcloud auth list`

### Error: "Permission denied"

**Solution**:
- Verify your account has the required roles
- Check: `gcloud projects get-iam-policy YOUR_PROJECT_ID`

### Error: "API not enabled"

**Solution**:
- Enable APIs in Google Cloud Console
- Wait a few minutes for activation

---

## Summary

**Fastest Solution**: Use Gemini API key only (Solution 1)
- ✅ Quick setup
- ✅ Works for language learning
- ❌ No Vision API features

**Best Solution**: Use Application Default Credentials (Solution 2)
- ✅ Full features
- ✅ No service account key needed
- ✅ Works around organization policy
- ⚠️ Requires gcloud CLI setup

Choose based on your needs!

