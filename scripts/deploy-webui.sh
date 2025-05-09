#!/bin/bash
set -e

# Check for GCP_PROJECT_ID and set default if not present
if [ -z "${GCP_PROJECT_ID:-}" ]; then
  echo "[INFO] GCP_PROJECT_ID not set, using default: ignite-459301"
  GCP_PROJECT_ID="ignite-459301"
fi

# Check for DRY_RUN mode
DRY_RUN=${DRY_RUN:-false}

echo "Building Docker image for dashboard..."
docker build -t gcr.io/$GCP_PROJECT_ID/ignite-dashboard:latest -f docker/Dockerfile .

if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY RUN] Skipping Docker push and Cloud Run deployment"
  echo "[DRY RUN] Would have pushed: gcr.io/$GCP_PROJECT_ID/ignite-dashboard:latest"
  echo "[DRY RUN] Would have deployed to Cloud Run: ignite-dashboard"
  echo "[DRY RUN] Fake deployment complete. Service URL would be: https://ignite-dashboard-xxxxx-uc.a.run.app"
else
  echo "Pushing Docker image to Google Container Registry..."
  docker push gcr.io/$GCP_PROJECT_ID/ignite-dashboard:latest

  echo "Deploying to Google Cloud Run..."
  gcloud run deploy ignite-dashboard \
    --image gcr.io/$GCP_PROJECT_ID/ignite-dashboard:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --project $GCP_PROJECT_ID \
    --set-env-vars OKTA_DOMAIN=$OKTA_DOMAIN,OKTA_API_TOKEN_SA=$OKTA_API_TOKEN_SA,ROCKETCYBER_API_TOKEN=$ROCKETCYBER_API_TOKEN,DATTO_EDR_TOKEN=$DATTO_EDR_TOKEN,ZIP_API_KEY=$ZIP_API_KEY,GCP_PROJECT_ID=$GCP_PROJECT_ID,AWS_ACCESS_KEY_ID_SANDBOX=$AWS_ACCESS_KEY_ID_SANDBOX,AWS_SECRET_ACCESS_KEY_SANDBOX=$AWS_SECRET_ACCESS_KEY_SANDBOX,AWS_REGION=$AWS_REGION

  echo "Deployment complete. Fetching service URL..."
  gcloud run services describe ignite-dashboard --platform managed --region us-central1 --project $GCP_PROJECT_ID --format 'value(status.url)'
fi
