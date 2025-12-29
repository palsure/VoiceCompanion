# Google Cloud Setup Guide

This guide will help you set up Google Cloud credentials for VoiceCompanion, including the Vision API and Gemini API.

## Prerequisites

- Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "voicecompanion")
5. Click **"Create"**
6. Wait for the project to be created and select it

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **"APIs & Services" > "Library"**
2. Search for and enable the following APIs:
   - **Cloud Vision API** (for image analysis)
   - **Vertex AI API** (for Gemini)
   - **Generative Language API** (for Gemini)

   To enable an API:
   - Click on the API name
   - Click **"Enable"**
   - Wait for it to be enabled

## Step 3: Create a Service Account

1. Go to **"IAM & Admin" > "Service Accounts"**
2. Click **"Create Service Account"**
3. Fill in the details:
   - **Service account name**: `voicecompanion-service`
   - **Service account ID**: (auto-generated)
   - **Description**: "Service account for VoiceCompanion"
4. Click **"Create and Continue"**

## Step 4: Grant Permissions

1. In the **"Grant this service account access to project"** section, add these roles:
   - **Cloud Vision API User** (for Vision API)
   - **Vertex AI User** (for Gemini)
   - **AI Platform User** (for Vertex AI)

2. Click **"Continue"**
3. Click **"Done"**

## Step 5: Create and Download Service Account Key

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key" > "Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. The JSON key file will be downloaded automatically

**Important**: Save this file securely! It contains credentials that should not be shared.

## Step 6: Set Up Credentials in Your Project

### Option A: For Local Development

1. Move the downloaded JSON file to your project:
   ```bash
   # Move the file to backend directory
   mv ~/Downloads/your-project-xxxxx-xxxxx.json backend/key.json
   ```

2. Update `backend/.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./key.json
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

### Option B: For Docker

1. Move the JSON file to your project root:
   ```bash
   mv ~/Downloads/your-project-xxxxx-xxxxx.json key.json
   ```

2. Update root `.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./key.json
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

3. Make sure the file is accessible in Docker (you may need to mount it as a volume)

## Step 7: Get Gemini API Key (Alternative Method)

If you prefer using just the Gemini API key without service account:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select your project
4. Copy the API key
5. Add it to your `.env` file:
   ```env
   GEMINI_API_KEY=your-api-key-here
   ```

**Note**: This method is simpler but doesn't support Vision API. For full functionality, use the service account method.

## Step 8: Verify Setup

### Test Vision API Access

```bash
# Test if credentials are working
gcloud auth application-default print-access-token
```

### Test in Your Application

1. Start your application
2. Try using the Vision API features (camera capture in Accessibility mode)
3. Check logs for any authentication errors

## Security Best Practices

1. **Never commit the key file to Git**
   - The `.gitignore` should already exclude `.env` and `*.json` key files
   - Verify: `git check-ignore key.json`

2. **Use environment variables in production**
   - Don't store keys in code
   - Use secret management services (Google Secret Manager, etc.)

3. **Restrict service account permissions**
   - Only grant the minimum required permissions
   - Regularly review and rotate keys

4. **For Docker/Production**
   - Mount credentials as secrets, not as files in the image
   - Use Docker secrets or Kubernetes secrets

## Troubleshooting

### Error: "Could not load the default credentials"

**Solution**:
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Check the file exists and is readable
- Ensure the path is relative to where the app runs

### Error: "Permission denied" or "Access denied"

**Solution**:
- Verify the service account has the correct roles
- Check that APIs are enabled in your project
- Ensure billing is enabled (some APIs require it)

### Error: "Project not found"

**Solution**:
- Verify `GOOGLE_CLOUD_PROJECT_ID` matches your project ID
- Check the project ID in Google Cloud Console

### Vision API not working

**Solution**:
- Ensure Cloud Vision API is enabled
- Check service account has "Cloud Vision API User" role
- Verify billing is enabled (Vision API requires billing)

## Quick Reference

### Required Environment Variables

```env
# For service account method (recommended)
GOOGLE_APPLICATION_CREDENTIALS=./key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-gemini-key  # Optional if using service account

# OR for simple Gemini-only method
GEMINI_API_KEY=your-gemini-key
```

### File Structure

```
AI-Partner/
├── .env                    # Root .env (for Docker)
├── backend/
│   ├── .env               # Backend .env (for local dev)
│   └── key.json          # Service account key (DO NOT COMMIT)
└── key.json              # Alternative location for Docker
```

## Next Steps

After setting up credentials:

1. ✅ Verify APIs are enabled
2. ✅ Service account created with correct roles
3. ✅ Key file downloaded and placed correctly
4. ✅ Environment variables set in `.env` files
5. ✅ Test the application

## Additional Resources

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
- [Vision API Documentation](https://cloud.google.com/vision/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)

