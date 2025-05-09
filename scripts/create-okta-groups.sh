#!/bin/bash
set -euo pipefail

# Check for DRY_RUN mode
DRY_RUN=${DRY_RUN:-false}

# Function to load .env file if it exists and we're not in GitHub Actions
load_env() {
  # Check if we are running in GitHub Actions
  if [ -z "${GITHUB_ACTIONS:-}" ] && [ -f .env ]; then
    echo "[INFO] Loading environment variables from .env file"
    set -a
    source .env
    set +a
  fi
}

# Load environment variables
load_env

# Check for required environment variables
if [ -z "${OKTA_DOMAIN:-}" ]; then
  echo "[ERROR] OKTA_DOMAIN is not set. You need to set this in GitHub Actions secrets or in your .env file."
  echo "[INFO] Example: export OKTA_DOMAIN=your-domain.okta.com"
  exit 1
fi

if [ -z "${OKTA_API_TOKEN_SA:-}" ]; then
  echo "[ERROR] OKTA_API_TOKEN_SA is not set. You need to set this in GitHub Actions secrets or in your .env file."
  echo "[INFO] Example: export OKTA_API_TOKEN_SA=your-api-token"
  exit 1
fi

# Define the groups to create
GROUPS=(
  "AWS_WorkSpacesAdmin"
  "AWS_WorkSpacesUser"
)

# Create groups in Okta
for GROUP in "${GROUPS[@]}"; do
  echo "[INFO] Creating Okta group: $GROUP"
  
  # Group payload
  GROUP_PAYLOAD="{
    \"profile\": {
      \"name\": \"$GROUP\",
      \"description\": \"$GROUP - Created by Project Ignite\"
    }
  }"
  
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would create Okta group with payload:"
    echo "$GROUP_PAYLOAD"
  else
    # Create the group via Okta API
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "Authorization: SSWS $OKTA_API_TOKEN_SA" \
      -d "$GROUP_PAYLOAD" \
      "https://$OKTA_DOMAIN/api/v1/groups")
    
    # Extract HTTP status code
    HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
    # Extract response body (remove the last line which is the status code)
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
    
    # Check if group creation was successful
    if [[ "$HTTP_STATUS" == 2* ]]; then
      echo "[SUCCESS] Created group $GROUP"
      # Extract and display the group ID
      GROUP_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
      echo "[INFO] Group ID: $GROUP_ID"
    elif [[ "$HTTP_STATUS" == "400" ]] && echo "$RESPONSE_BODY" | grep -q "duplicate"; then
      echo "[WARNING] Group $GROUP already exists"
    else
      echo "[ERROR] Failed to create group $GROUP. Status: $HTTP_STATUS"
      echo "$RESPONSE_BODY"
      exit 1
    fi
  fi
done

echo "[INFO] Okta group creation complete"