#!/bin/bash
set -e

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
