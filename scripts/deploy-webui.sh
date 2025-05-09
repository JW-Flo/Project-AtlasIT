#!/bin/bash
set -e

echo "Building Docker image for dashboard..."
docker build -t gcr.io/$GCP_PROJECT_ID/ignite-dashboard:latest -f docker/Dockerfile .

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
