#!/bin/bash
set -euo pipefail

# Okta domain and token - REPLACE WITH YOUR ACTUAL TOKEN
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# Just create these two groups with proper descriptions
echo "Creating AWS_WorkSpacesAdmin group..."
curl -X POST \
  "https://$OKTA_DOMAIN/api/v1/groups" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS $OKTA_API_TOKEN" \
  -d '{
    "profile": {
      "name": "AWS_WorkSpacesAdmin",
      "description": "Administrators with full access to manage AWS WorkSpaces"
    }
  }'

echo -e "\n\nCreating AWS_WorkSpacesUser group..."
curl -X POST \
  "https://$OKTA_DOMAIN/api/v1/groups" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS $OKTA_API_TOKEN" \
  -d '{
    "profile": {
      "name": "AWS_WorkSpacesUser",
      "description": "Standard users with basic access to AWS WorkSpaces"
    }
  }'

echo -e "\n\nDone!"