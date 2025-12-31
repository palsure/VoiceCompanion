#!/bin/bash
# List all Cloud Run services and their status

set -e

PROJECT_ID="hackathon-482302"
REGION="us-central1"

echo "📋 Cloud Run Services"
echo "===================="
echo ""

echo "Services in ${REGION}:"
gcloud run services list --region=${REGION} --project=${PROJECT_ID} --format="table(metadata.name,status.url,status.conditions[0].status,spec.template.spec.containerConcurrency,spec.template.spec.containers[0].image)"

echo ""
echo "To see all regions:"
echo "  gcloud run services list --project=${PROJECT_ID}"
echo ""

