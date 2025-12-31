## Deploy VoiceCompanion to Google Cloud (Web + Backend + Mobile)

This repo contains:
- **Backend**: Node/Express (AI, vision, guidance, music, gallery, TTS)
- **Web Frontend**: Vite + React, served by nginx
- **Mobile**: React Native + Expo (distributed via Play Store / internal testing)

### Recommended deployment architecture

- **Google Cloud Run (multi-container)**: deploy **frontend + backend** together in one Cloud Run service.
  - nginx serves the SPA and proxies `/api/*` to `http://127.0.0.1:5000` (backend container)
  - avoids CORS and keeps the web app working exactly like docker-compose

### 0) Prereqs

- Install gcloud: `gcloud` CLI
- Choose:
  - **PROJECT_ID** (your GCP project)
  - **REGION** (recommended `us-central1`)

### 1) Enable required APIs

Run:

```bash
gcloud config set project PROJECT_ID
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  vision.googleapis.com \
  speech.googleapis.com \
  secretmanager.googleapis.com
```

### 2) Create Artifact Registry repo

```bash
gcloud artifacts repositories create voicecompanion \
  --repository-format=docker \
  --location=us-central1 \
  --description="VoiceCompanion images"
```

### 3) Create a Cloud Run service account + permissions

```bash
gcloud iam service-accounts create voicecompanion-sa \
  --display-name="VoiceCompanion Cloud Run SA"
```

Grant minimum roles (adjust as needed):

```bash
gcloud projects add-iam-policy-binding hackathon-482302 \
  --member="serviceAccount:voicecompanion-sa@hackathon-482302.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding hackathon-482302 \
  --member="serviceAccount:voicecompanion-sa@hackathon-482302.iam.gserviceaccount.com" \
  --role="roles/vision.user"

gcloud projects add-iam-policy-binding hackathon-482302 \
  --member="serviceAccount:voicecompanion-sa@hackathon-482302.iam.gserviceaccount.com" \
  --role="roles/speech.client"
```

### 4) Store secrets in Secret Manager

```bash
printf "%s" "YOUR_ELEVENLABS_KEY" | gcloud secrets create ELEVENLABS_API_KEY --data-file=-
printf "%s" "YOUR_GEMINI_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

Allow Cloud Run service account to access them:

```bash
gcloud secrets add-iam-policy-binding ELEVENLABS_API_KEY \
  --member="serviceAccount:voicecompanion-sa@hackathon-482302.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:voicecompanion-sa@hackathon-482302.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

If you see an error like **"Policy modification failed... For a binding with condition..."**, your org/project may already have a **conditional** IAM binding for that role. In that case, add the binding via the IAM UI, or create a custom role (see `GOOGLE_PERMISSIONS.md`) and bind that instead.

### 5) Build and push images with Cloud Build

#### 5a) Fix common Cloud Build IAM errors (403 on the source tarball)

If you see:
- `does not have storage.objects.get access to the Google Cloud Storage object`

it means the service account Cloud Build is using can’t read from the Cloud Build staging bucket (`gs://PROJECT_ID_cloudbuild`).

For your error, the blocked principal was:
- `1044930202278-compute@developer.gserviceaccount.com`

Grant it **Storage Object Viewer** on the staging bucket (fast unblock):

```bash
gcloud storage buckets add-iam-policy-binding gs://hackathon-482302_cloudbuild \
  --member="serviceAccount:1044930202278-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

Also ensure the **Cloud Build** service account can push images to Artifact Registry:

**Option 1: Grant at project level (recommended)**
```bash
gcloud projects add-iam-policy-binding hackathon-482302 \
  --member="serviceAccount:1044930202278@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

**Option 2: Grant directly on the repository (if project-level doesn't work)**
```bash
gcloud artifacts repositories add-iam-policy-binding voicecompanion \
  --location=us-central1 \
  --member="serviceAccount:1044930202278@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

**Quick fix script (recommended):**
```bash
# Run the automated fix script
./gcp/fix-artifact-registry.sh
```

**Or manually verify and fix:**

Verify the repository exists:
```bash
gcloud artifacts repositories describe voicecompanion --location=us-central1
```

If it doesn't exist, create it:
```bash
gcloud artifacts repositories create voicecompanion \
  --repository-format=docker \
  --location=us-central1 \
  --description="VoiceCompanion images"
```

**If you're still getting permission errors after running the script**, check which service account Cloud Build is actually using:
```bash
# Get the Cloud Build service account email
gcloud projects describe hackathon-482302 --format="value(projectNumber)@cloudbuild.gserviceaccount.com"
```

Then grant permissions to that specific account:
```bash
CLOUD_BUILD_SA=$(gcloud projects describe hackathon-482302 --format="value(projectNumber)@cloudbuild.gserviceaccount.com")
gcloud artifacts repositories add-iam-policy-binding voicecompanion \
  --location=us-central1 \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer"
```

If Cloud Build warns it **can’t write logs to Cloud Logging**, grant Logs Writer to the service account it’s using:

```bash
gcloud projects add-iam-policy-binding hackathon-482302 \
  --member="serviceAccount:1044930202278-compute@developer.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

From repo root:

```bash
gcloud builds submit --config gcp/cloudbuild.yaml \
  --substitutions=_REGION=REGION,_REPO=voicecompanion
```

This creates images:
- `REGION-docker.pkg.dev/PROJECT_ID/voicecompanion/backend:latest`
- `REGION-docker.pkg.dev/PROJECT_ID/voicecompanion/backend:$BUILD_ID`
- `REGION-docker.pkg.dev/PROJECT_ID/voicecompanion/frontend:latest`
- `REGION-docker.pkg.dev/PROJECT_ID/voicecompanion/frontend:$BUILD_ID`

### 6) Deploy Cloud Run multi-container service

Edit `gcp/cloudrun.voicecompanion.yaml` and replace:
- `PROJECT_ID`
- `REGION`

Then deploy:

```bash
gcloud run services replace gcp/cloudrun.voicecompanion.yaml --region REGION
gcloud run services add-iam-policy-binding voicecompanion \
  --region REGION \
  --member="allUsers" \
  --role="roles/run.invoker"
```

Set secrets as env vars (recommended):

```bash
gcloud run services update voicecompanion \
  --region REGION \
  --set-secrets=ELEVENLABS_API_KEY=ELEVENLABS_API_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars=GOOGLE_CLOUD_PROJECT_ID=PROJECT_ID,VERTEX_AI_LOCATION=us-central1
```

Get the URL:

```bash
gcloud run services describe voicecompanion --region REGION --format='value(status.url)'
```

### Gallery persistence note (important)

The backend gallery currently stores data on the filesystem (`backend/data/gallery`). Cloud Run filesystem is **ephemeral**, so for production persistence you should move gallery storage to:
- Cloud Storage (GCS) + Firestore/Datastore, or
- Cloud SQL

For hackathon demos it may still work, but it’s not guaranteed across instance restarts.

---

## Mobile (Android) distribution

Mobile apps are not deployed to Cloud Run. Recommended:
- Use **Expo EAS Build** to produce an Android App Bundle (AAB)
- Publish via Google Play Console (Internal testing / Closed testing / Production)

### EAS (high level)

```bash
cd mobile
npm install
npx expo login
npx eas build --platform android
```

Then upload the generated `.aab` to Google Play Console.


