# Quick Fix for Organization Policy

## Your Situation

Organization policy `iam.disableServiceAccountKeyCreation` is blocking service account key creation.

## Fastest Solution: Use Gemini API Key Only

**Time**: 2 minutes  
**Features**: Language learning mode only (no Vision API)

### Steps:

1. **Get Gemini API Key**:
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Update `.env`**:
   ```env
   GEMINI_API_KEY=your-key-here
   # Leave GOOGLE_APPLICATION_CREDENTIALS empty
   ```

3. **Done!** Language learning features will work.

---

## Better Solution: Use Application Default Credentials

**Time**: 5 minutes  
**Features**: Full features (Vision API + Gemini)

### Steps:

1. **Install gcloud CLI** (if needed):
   ```bash
   brew install google-cloud-sdk
   ```

2. **Authenticate**:
   ```bash
   gcloud auth application-default login
   ```

3. **Set project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Update `.env`**:
   ```env
   # Leave empty - will use ADC
   GOOGLE_APPLICATION_CREDENTIALS=
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GEMINI_API_KEY=your-gemini-key
   ```

5. **Grant yourself permissions** (if needed):
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="user:YOUR_EMAIL@gmail.com" \
     --role="roles/vision.user"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="user:YOUR_EMAIL@gmail.com" \
     --role="roles/aiplatform.user"
   ```

6. **Test**:
   ```bash
   gcloud auth application-default print-access-token
   ```

---

## Which Solution?

- **Need it working NOW?** → Use Gemini API key only
- **Need full features?** → Use Application Default Credentials

See `ORG_POLICY_SOLUTION.md` for detailed explanations.

