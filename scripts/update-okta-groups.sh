#!/bin/bash
set -euo pipefail

# Okta credentials
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# Define the two groups we really want with proper descriptions
declare -A PROPER_GROUPS
PROPER_GROUPS["AWS_WorkSpacesAdmin"]="Administrators with full access to manage AWS WorkSpaces"
PROPER_GROUPS["AWS_WorkSpacesUser"]="Standard users with basic access to AWS WorkSpaces"

# Define incorrect numbered groups to fix or delete
declare -A NUMBERED_GROUPS
NUMBERED_GROUPS["20"]="Delete"  # Set to Delete to remove, or a description to keep with updated description
NUMBERED_GROUPS["12"]="Delete"
NUMBERED_GROUPS["61"]="Delete"
NUMBERED_GROUPS["79"]="Delete"
NUMBERED_GROUPS["80"]="Delete"
NUMBERED_GROUPS["81"]="Delete"
NUMBERED_GROUPS["399"]="Delete"
NUMBERED_GROUPS["400"]="Delete"
NUMBERED_GROUPS["701"]="Delete"
# Add any other numbered groups from your screenshot

echo "=== UPDATING OKTA GROUPS ==="

# Function to search for a group by name
find_group() {
  local GROUP_NAME="$1"
  
  echo "[INFO] Searching for group: $GROUP_NAME"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN" \
    "https://$OKTA_DOMAIN/api/v1/groups?q=$GROUP_NAME")
    
  # Extract HTTP status code
  HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
  # Extract response body (remove the last line which is the status code)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [[ "$HTTP_STATUS" == 2* ]]; then
    # Check if group exists and extract its ID
    if echo "$RESPONSE_BODY" | grep -q '"id"'; then
      GROUP_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
      echo "[INFO] Found group $GROUP_NAME with ID: $GROUP_ID"
      echo "$GROUP_ID"
      return 0
    else
      echo "[INFO] Group $GROUP_NAME not found"
      echo ""
      return 1
    fi
  else
    echo "[ERROR] Failed to search for group $GROUP_NAME. Status: $HTTP_STATUS"
    echo "$RESPONSE_BODY"
    echo ""
    return 1
  fi
}

# Function to delete a group by ID
delete_group() {
  local GROUP_NAME="$1"
  local GROUP_ID="$2"
  
  echo "[INFO] Deleting group: $GROUP_NAME (ID: $GROUP_ID)"
  
  DEL_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN" \
    "https://$OKTA_DOMAIN/api/v1/groups/$GROUP_ID")
    
  # Extract HTTP status code for delete operation
  DEL_STATUS=$(echo "$DEL_RESPONSE" | tail -n1)
  
  if [[ "$DEL_STATUS" == 2* ]]; then
    echo "[SUCCESS] Deleted group $GROUP_NAME"
    return 0
  else
    echo "[ERROR] Failed to delete group $GROUP_NAME. Status: $DEL_STATUS"
    return 1
  fi
}

# Function to update a group description
update_group() {
  local GROUP_ID="$1"
  local GROUP_NAME="$2"
  local NEW_DESCRIPTION="$3"
  
  echo "[INFO] Updating group $GROUP_NAME with new description: $NEW_DESCRIPTION"
  
  UPDATE_PAYLOAD="{
    \"profile\": {
      \"name\": \"$GROUP_NAME\",
      \"description\": \"$NEW_DESCRIPTION\"
    }
  }"
  
  UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN" \
    -d "$UPDATE_PAYLOAD" \
    "https://$OKTA_DOMAIN/api/v1/groups/$GROUP_ID")
  
  # Extract HTTP status code
  UPDATE_STATUS=$(echo "$UPDATE_RESPONSE" | tail -n1)
  
  if [[ "$UPDATE_STATUS" == 2* ]]; then
    echo "[SUCCESS] Updated group $GROUP_NAME with new description"
    return 0
  else
    echo "[ERROR] Failed to update group $GROUP_NAME. Status: $UPDATE_STATUS"
    return 1
  fi
}

# Function to create a group
create_group() {
  local GROUP_NAME="$1"
  local DESCRIPTION="$2"
  
  echo "[INFO] Creating group: $GROUP_NAME with description: $DESCRIPTION"
  
  GROUP_PAYLOAD="{
    \"profile\": {
      \"name\": \"$GROUP_NAME\",
      \"description\": \"$DESCRIPTION\"
    }
  }"
  
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
    echo "[SUCCESS] Created group $GROUP_NAME"
    # Extract and display the group ID
    GROUP_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "[INFO] Group ID: $GROUP_ID"
    return 0
  elif [[ "$HTTP_STATUS" == "400" ]] && echo "$RESPONSE_BODY" | grep -q "duplicate"; then
    echo "[WARNING] Group $GROUP_NAME already exists"
    return 0
  else
    echo "[ERROR] Failed to create group $GROUP_NAME. Status: $HTTP_STATUS"
    echo "$RESPONSE_BODY"
    return 1
  fi
}

# Step 1: Handle numbered groups (delete or update)
for GROUP_NAME in "${!NUMBERED_GROUPS[@]}"; do
  GROUP_ID=$(find_group "$GROUP_NAME")
  
  if [ -n "$GROUP_ID" ]; then
    if [ "${NUMBERED_GROUPS[$GROUP_NAME]}" == "Delete" ]; then
      delete_group "$GROUP_NAME" "$GROUP_ID"
    else
      update_group "$GROUP_ID" "$GROUP_NAME" "${NUMBERED_GROUPS[$GROUP_NAME]}"
    fi
  else
    echo "[INFO] Numbered group $GROUP_NAME not found, nothing to do"
  fi
done

# Step 2: Create or update the proper AWS WorkSpaces groups
for GROUP_NAME in "${!PROPER_GROUPS[@]}"; do
  GROUP_ID=$(find_group "$GROUP_NAME")
  
  if [ -n "$GROUP_ID" ]; then
    # Update existing group with proper description
    update_group "$GROUP_ID" "$GROUP_NAME" "${PROPER_GROUPS[$GROUP_NAME]}"
  else
    # Create new group with proper description
    create_group "$GROUP_NAME" "${PROPER_GROUPS[$GROUP_NAME]}"
  fi
done

echo "[INFO] Group updates complete!"
echo ""
echo "=== SUMMARY ==="
echo "- Updated or deleted incorrectly named numbered groups"
echo "- Created or updated AWS_WorkSpacesAdmin and AWS_WorkSpacesUser groups with proper descriptions"