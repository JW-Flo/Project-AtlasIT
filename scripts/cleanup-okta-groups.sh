#!/bin/bash
set -euo pipefail

# Okta credentials - THE DOMAIN AND TOKEN NEED TO BE UPDATED
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# Define the correct groups we want
CORRECT_GROUPS=(
  "AWS_WorkSpacesAdmin"
  "AWS_WorkSpacesUser"
)

# Wrong groups to delete (update with the actual number-based groups that were created)
WRONG_GROUPS=(
  "20"
  "12"
  "61"
  # Add any other numbered groups that were incorrectly created
)

echo "=== CLEANING UP INCORRECT OKTA GROUPS ==="

# Step 1: Delete the incorrect groups
for GROUP in "${WRONG_GROUPS[@]}"; do
  echo "[INFO] Deleting incorrect group: $GROUP"
  
  # First, get the group ID
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN" \
    "https://$OKTA_DOMAIN/api/v1/groups?q=$GROUP")
    
  # Extract HTTP status code
  HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
  # Extract response body (remove the last line which is the status code)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [[ "$HTTP_STATUS" == 2* ]]; then
    # Check if group exists and extract its ID
    if echo "$RESPONSE_BODY" | grep -q '"id"'; then
      GROUP_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
      echo "[INFO] Found incorrect group $GROUP with ID: $GROUP_ID"
      
      # Delete the group using its ID
      DEL_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -H "Authorization: SSWS $OKTA_API_TOKEN" \
        "https://$OKTA_DOMAIN/api/v1/groups/$GROUP_ID")
        
      # Extract HTTP status code for delete operation
      DEL_STATUS=$(echo "$DEL_RESPONSE" | tail -n1)
      
      if [[ "$DEL_STATUS" == 2* ]]; then
        echo "[SUCCESS] Deleted incorrect group $GROUP"
      else
        echo "[ERROR] Failed to delete group $GROUP. Status: $DEL_STATUS"
      fi
    else
      echo "[INFO] Group $GROUP not found, nothing to delete"
    fi
  else
    echo "[ERROR] Failed to search for group $GROUP. Status: $HTTP_STATUS"
    echo "$RESPONSE_BODY"
  fi
done

echo "=== CREATING CORRECT AWS WORKSPACES GROUPS ==="

# Step 2: Create the correct groups
for GROUP in "${CORRECT_GROUPS[@]}"; do
  echo "[INFO] Creating Okta group: $GROUP"
  
  # Group payload
  GROUP_PAYLOAD="{
    \"profile\": {
      \"name\": \"$GROUP\",
      \"description\": \"$GROUP - Created by Project Ignite\"
    }
  }"
  
  # Create the group via Okta API
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

echo "[INFO] Cleanup and group creation complete!"
echo ""
echo "=== SUMMARY ==="
echo "- Removed incorrect numbered groups"
echo "- Created or verified AWS_WorkSpacesAdmin and AWS_WorkSpacesUser groups"