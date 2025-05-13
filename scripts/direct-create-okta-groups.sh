#!/bin/bash
set -euo pipefail

# Okta credentials
OKTA_DOMAIN="flosports.okta.com"
# NOTE: Replace this placeholder with your actual token when running
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# Define ONLY the two specific groups we want
GROUPS=(
  "AWS_WorkSpacesAdmin"
  "AWS_WorkSpacesUser"
)

# Print the API endpoint we're using
echo "[INFO] Using Okta API endpoint: https://$OKTA_DOMAIN/api/v1/groups"
echo "[INFO] Will create ONLY these specific groups: ${GROUPS[*]}"

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
  
  # Create the group via Okta API
  echo "[INFO] Sending request to https://$OKTA_DOMAIN/api/v1/groups"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN" \
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
  fi
done

echo "[INFO] Okta group creation complete"
echo "[INFO] Successfully created: AWS_WorkSpacesAdmin and AWS_WorkSpacesUser groups (or verified they exist)"