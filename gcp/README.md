# GCP Deployment Scripts

This folder contains scripts and configuration files for deploying VoiceCompanion to Google Cloud Run.

## Essential Files

### Deployment Scripts
- **`cloudbuild.yaml`** - Cloud Build configuration for building Docker images
- **`deploy-to-cloudrun.sh`** - Main deployment script (deploys frontend and backend as separate services)
- **`build-and-push-local.sh`** - Build and push Docker images locally to GCR

### Service Management
- **`list-services.sh`** - List all Cloud Run services
- **`delete-service.sh`** - Delete a Cloud Run service or revision
- **`delete-old-revisions.sh`** - Delete old revisions (keeps current serving ones)
- **`cleanup-unused.sh`** - Cleanup helper script

### Diagnostics & Testing
- **`test-api-proxy.sh`** - Test API proxy configuration
- **`diagnose-502.sh`** - Diagnose 502 Bad Gateway errors
- **`verify-deployment.sh`** - Verify deployment status

### Documentation
- **`MANAGE_SERVICES.md`** - Guide for managing Cloud Run services

## Quick Start

### Deploy to Cloud Run
```bash
# Build and push images
./gcp/build-and-push-local.sh

# Deploy services
./gcp/deploy-to-cloudrun.sh
```

### Manage Services
```bash
# List services
./gcp/list-services.sh

# Delete old revisions
./gcp/delete-old-revisions.sh

# Cleanup unused resources
./gcp/cleanup-unused.sh
```

### Troubleshooting
```bash
# Test API proxy
./gcp/test-api-proxy.sh

# Diagnose 502 errors
./gcp/diagnose-502.sh

# Verify deployment
./gcp/verify-deployment.sh
```

## Architecture

- **Backend**: Deployed as `voicecompanion-backend` service
- **Frontend**: Deployed as `voicecompanion-frontend` service (nginx proxy)
- **Container Registry**: Uses GCR (`gcr.io/PROJECT_ID/...`)
- **Environment Variables**: `BACKEND_URL` and `BACKEND_HOST` set for frontend nginx

For detailed deployment instructions, see the main [README.md](../README.md) and deployment documentation.

