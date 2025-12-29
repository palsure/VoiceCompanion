# Google Cloud Credentials - Quick Summary

## What is GOOGLE_APPLICATION_CREDENTIALS?

It's the **file path** to a JSON key file that contains credentials for a Google Cloud service account. This file allows your application to authenticate with Google Cloud services.

## Two Ways to Get It

### Method 1: Simple (Gemini API Only) ⚡

**Best for**: Language learning features only

1. Go to: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env`:
   ```env
   GEMINI_API_KEY=your-key-here
   ```
4. **Done!** No service account needed.

**Limitation**: Won't work for Vision API (camera/image features)

---

### Method 2: Full Setup (All Features) 🔧

**Best for**: Full functionality including Vision API

#### Step 1: Create Service Account Key File

**Option A: Using Web Console** (Easiest)
1. Go to: https://console.cloud.google.com/
2. Create/Select project
3. Enable APIs: Cloud Vision API, Vertex AI API
4. Go to: IAM & Admin > Service Accounts
5. Create service account
6. Grant roles: "Cloud Vision API User", "Vertex AI User"
7. Create key: Click service account > Keys tab > Add Key > JSON
8. Download the JSON file

**Option B: Using gcloud CLI**
```bash
# Create service account
gcloud iam service-accounts create voicecompanion \
  --display-name="VoiceCompanion"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voicecompanion@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/vision.user"

# Create key file
gcloud iam service-accounts keys create key.json \
  --iam-account=voicecompanion@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### Step 2: Place the File

```bash
# For local development
mv ~/Downloads/your-project-xxxxx.json backend/key.json

# For Docker (or also in root)
mv ~/Downloads/your-project-xxxxx.json key.json
```

#### Step 3: Update .env

```env
# In backend/.env or root .env
GOOGLE_APPLICATION_CREDENTIALS=./key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-gemini-key  # Still needed!
```

#### Step 4: Get Gemini API Key

Even with service account, you still need Gemini API key:
1. Go to: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env`:
   ```env
   GEMINI_API_KEY=your-key-here
   ```

## File Structure

```
AI-Partner/
├── .env                    # Contains: GOOGLE_APPLICATION_CREDENTIALS=./key.json
├── key.json               # The service account key file (DO NOT COMMIT!)
└── backend/
    ├── .env               # Same variables
    └── key.json           # Alternative location
```

## Important Notes

1. **Never commit `key.json` to Git** - It's already in `.gitignore`
2. **The path is relative** - `./key.json` means "in the same directory"
3. **For Docker**: The file is mounted as read-only (`:ro`) for security
4. **You need BOTH**:
   - Service account key (for Vision API)
   - Gemini API key (for Gemini features)

## Quick Checklist

- [ ] Google Cloud project created
- [ ] APIs enabled (Vision API, Vertex AI API)
- [ ] Service account created
- [ ] Service account has correct roles
- [ ] Key file downloaded (`key.json`)
- [ ] Key file placed in project
- [ ] `.env` updated with `GOOGLE_APPLICATION_CREDENTIALS=./key.json`
- [ ] Gemini API key obtained
- [ ] `.env` updated with `GEMINI_API_KEY=...`
- [ ] `GOOGLE_CLOUD_PROJECT_ID` set in `.env`

## Troubleshooting

**"Could not load credentials"**
- Check file path is correct
- Verify file exists
- Ensure path is relative to where app runs

**"Permission denied"**
- Check service account has correct roles
- Verify APIs are enabled
- Ensure billing is enabled (required for some APIs)

## Need Help?

See detailed guides:
- `GOOGLE_CLOUD_SETUP.md` - Full detailed guide
- `QUICK_SETUP.md` - Quick reference

