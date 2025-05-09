#!/bin/bash
set -e

# Check for GCP_PROJECT_ID and set default if not present
if [ -z "${GCP_PROJECT_ID:-}" ]; then
  echo "[INFO] GCP_PROJECT_ID not set, using default: ignite-459301"
  GCP_PROJECT_ID="ignite-459301"
fi

# Check for DRY_RUN mode
DRY_RUN=${DRY_RUN:-false}

if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY RUN] Skipping Cloud Function deployment"
  echo "[DRY RUN] Would have deployed: ingest_alerts function from cloud-functions/ directory"
  echo "[DRY RUN] Fake deployment complete. Function URL would be: https://us-central1-$GCP_PROJECT_ID.cloudfunctions.net/ingest_alerts"
else
  echo "Deploying ingest_alerts Cloud Function to Google Cloud Functions..."
  gcloud functions deploy ingest_alerts \
    --runtime python310 \
    --trigger-http \
    --allow-unauthenticated \
    --entry-point main \
    --source cloud-functions \
    --project $GCP_PROJECT_ID \
    --region us-central1 \
    --set-env-vars OKTA_DOMAIN=$OKTA_DOMAIN,OKTA_API_TOKEN_SA=$OKTA_API_TOKEN_SA,ROCKETCYBER_API_TOKEN=$ROCKETCYBER_API_TOKEN,DATTO_EDR_TOKEN=$DATTO_EDR_TOKEN,ZIP_API_KEY=$ZIP_API_KEY,GCP_PROJECT_ID=$GCP_PROJECT_ID,AWS_ACCESS_KEY_ID_SANDBOX=$AWS_ACCESS_KEY_ID_SANDBOX,AWS_SECRET_ACCESS_KEY_SANDBOX=$AWS_SECRET_ACCESS_KEY_SANDBOX,AWS_REGION=$AWS_REGION

  echo "Cloud Function deployment complete. Fetching function URL..."
  gcloud functions describe ingest_alerts --region us-central1 --project $GCP_PROJECT_ID --format 'value(httpsTrigger.url)'
fi
