# Managing Cloud Run Services

This guide explains how to manage and clean up Cloud Run services.

## List Services

View all Cloud Run services:

```bash
./gcp/list-services.sh
```

Or manually:
```bash
gcloud run services list --region=us-central1 --project=hackathon-482302
```

## Delete a Service

Delete a specific Cloud Run service:

```bash
./gcp/delete-service.sh <service-name>
```

Example:
```bash
./gcp/delete-service.sh voicecompanion-frontend
```

Or manually:
```bash
gcloud run services delete <service-name> \
  --region=us-central1 \
  --project=hackathon-482302
```

## Clean Up Old Revisions

Cloud Run keeps old revisions for rollback purposes. To delete old revisions:

1. List all revisions:
```bash
gcloud run revisions list --region=us-central1 --project=hackathon-482302
```

2. Delete a specific revision:
```bash
gcloud run revisions delete <revision-name> \
  --region=us-central1 \
  --project=hackathon-482302
```

3. Delete all old revisions (not serving traffic):
```bash
# Get current serving revisions
FRONTEND_REV=$(gcloud run services describe voicecompanion-frontend --region=us-central1 --format='value(status.latestReadyRevisionName)')
BACKEND_REV=$(gcloud run services describe voicecompanion-backend --region=us-central1 --format='value(status.latestReadyRevisionName)')

# Delete all other revisions
gcloud run revisions list --region=us-central1 --format='value(metadata.name)' | \
  grep -v "$FRONTEND_REV" | grep -v "$BACKEND_REV" | \
  xargs -I {} gcloud run revisions delete {} --region=us-central1 --quiet
```

## Check Service Status

Check if a service is running:

```bash
gcloud run services describe <service-name> \
  --region=us-central1 \
  --format='value(status.conditions[0].status)'
```

## View Service Costs

Check Cloud Run usage and costs:

```bash
# View Cloud Run metrics
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=10 \
  --project=hackathon-482302
```

Or check in the Google Cloud Console:
- Go to **Cloud Run** → **Services**
- Click on a service to see metrics and costs

## Cleanup Script

Run the cleanup helper:

```bash
./gcp/cleanup-unused.sh
```

This will:
- List all services
- Show old revisions
- Provide options for cleanup

## Important Notes

⚠️ **Warning**: 
- Deleting a service will make it unavailable immediately
- Old revisions are kept for rollback - deleting them prevents rollback
- Cloud Run charges for:
  - **CPU time** while handling requests
  - **Memory** allocated
  - **Requests** processed
  - **Minimum instances** (if configured)

💡 **Cost Optimization**:
- Set `--min-instances=0` to scale to zero when not in use
- Use `--max-instances` to limit scaling
- Delete unused services to avoid charges
- Clean up old revisions periodically

## Current Active Services

The following services should be kept active:
- `voicecompanion-frontend` - Frontend web application
- `voicecompanion-backend` - Backend API server

