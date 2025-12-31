# Building and Pushing Docker Images Locally

Since Cloud Build is having permission issues with both Artifact Registry and GCR, you can build and push images locally, then deploy to Cloud Run.

## Prerequisites

1. Docker installed locally
2. `gcloud` CLI authenticated: `gcloud auth login`
3. Docker authenticated with GCR: `gcloud auth configure-docker gcr.io`

## Build and Push Images

### Backend

```bash
# Build
docker build -t gcr.io/hackathon-482302/voicecompanion-backend:latest -f backend/Dockerfile backend

# Push
docker push gcr.io/hackathon-482302/voicecompanion-backend:latest
```

### Frontend

```bash
# Build
docker build -t gcr.io/hackathon-482302/voicecompanion-frontend:latest -f frontend/Dockerfile.cloudrun frontend

# Push
docker push gcr.io/hackathon-482302/voicecompanion-frontend:latest
```

## Deploy to Cloud Run

After pushing, deploy using the Cloud Run YAML:

```bash
# Replace PROJECT_ID in the YAML file first
sed -i '' 's/PROJECT_ID/hackathon-482302/g' gcp/cloudrun.voicecompanion.yaml

# Deploy
gcloud run services replace gcp/cloudrun.voicecompanion.yaml --region=us-central1
```

## Alternative: Use Artifact Registry with Local Push

If you want to use Artifact Registry instead:

```bash
# Authenticate
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build backend
docker build -t us-central1-docker.pkg.dev/hackathon-482302/voicecompanion/backend:latest -f backend/Dockerfile backend

# Push backend
docker push us-central1-docker.pkg.dev/hackathon-482302/voicecompanion/backend:latest

# Build frontend
docker build -t us-central1-docker.pkg.dev/hackathon-482302/voicecompanion/frontend:latest -f frontend/Dockerfile.cloudrun frontend

# Push frontend
docker push us-central1-docker.pkg.dev/hackathon-482302/voicecompanion/frontend:latest
```

Then update `gcp/cloudrun.voicecompanion.yaml` to use Artifact Registry image paths.

