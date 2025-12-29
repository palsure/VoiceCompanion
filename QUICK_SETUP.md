# Quick Setup Guide - Google Cloud Credentials

## Fastest Method: Gemini API Key Only

If you only need Gemini (for language learning features), this is the simplest:

1. Go to: https://makersuite.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key
4. Add to `.env`:
   ```env
   GEMINI_API_KEY=your-key-here
   ```

**Note**: This won't work for Vision API features (camera/image analysis).

## Full Setup: Service Account (For All Features)

### 1. Create Project & Enable APIs

```bash
# Install gcloud CLI (if not installed)
# macOS: brew install google-cloud-sdk
# Then run:
gcloud init
```

Or use the web console:
- Go to: https://console.cloud.google.com/
- Create new project
- Enable: Cloud Vision API, Vertex AI API

### 2. Create Service Account

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create service account
gcloud iam service-accounts create voicecompanion \
  --display-name="VoiceCompanion Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voicecompanion@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/vision.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voicecompanion@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 3. Create and Download Key

```bash
# Create key file
gcloud iam service-accounts keys create key.json \
  --iam-account=voicecompanion@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 4. Update .env

```env
GOOGLE_APPLICATION_CREDENTIALS=./key.json
GOOGLE_CLOUD_PROJECT_ID=YOUR_PROJECT_ID
GEMINI_API_KEY=your-gemini-key  # Still needed for Gemini
```

## Web Console Method (No CLI)

1. **Create Project**: https://console.cloud.google.com/
2. **Enable APIs**: 
   - APIs & Services > Library
   - Enable: "Cloud Vision API", "Vertex AI API"
3. **Create Service Account**:
   - IAM & Admin > Service Accounts > Create
   - Name: `voicecompanion`
   - Grant roles: "Cloud Vision API User", "Vertex AI User"
4. **Download Key**:
   - Click on service account > Keys tab > Add Key > Create new key (JSON)
   - Save as `key.json` in your project
5. **Get Gemini Key**: https://makersuite.google.com/app/apikey

## Verify Setup

```bash
# Test credentials
export GOOGLE_APPLICATION_CREDENTIALS=./key.json
gcloud auth application-default print-access-token
```

If you see a token, credentials are working!

## For Docker

Make sure to:
1. Place `key.json` in project root
2. Mount it in docker-compose.yml (already configured)
3. Set `GOOGLE_APPLICATION_CREDENTIALS=/app/key.json` in container

