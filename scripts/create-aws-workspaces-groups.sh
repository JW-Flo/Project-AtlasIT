#!/bin/bash
set -euo pipefail

# Okta credentials - REPLACE WITH YOUR ACTUAL TOKEN
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# Define the two groups we need with proper descriptions
GROUPS=(
  "AWS_WorkSpacesAdmin:Administrators with full access to manage AWS WorkSpaces"
  "AWS_WorkSpacesUser:Standard users with basic access to AWS WorkSpaces"
)

echo "=== CREATING AWS WORKSPACES GROUPS ==="
echo "This script will ONLY create these specific groups (no deletions):"
for GROUP_INFO in "${GROUPS[@]}"; do
  GROUP_NAME="${GROUP_INFO%%:*}"
  GROUP_DESC="${GROUP_INFO#*:}"
  echo "  - '$GROUP_NAME' with description: '$GROUP_DESC'"
done
echo ""

# Function to check if a group exists
check_group() {
  local GROUP_NAME="$1"
  
  echo "[INFO] Checking if group exists: $GROUP_NAME"
  
  RESPONSE=$(curl -s -X GET \
    "https://$OKTA_DOMAIN/api/v1/groups?q=$GROUP_NAME" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN")
  
  # Check if there's a group with exactly this name
  if echo "$RESPONSE" | grep -q "\"profile\":{\"name\":\"$GROUP_NAME\""; then
    echo "[INFO] Group $GROUP_NAME already exists"
    return 0
  else
    echo "[INFO] Group $GROUP_NAME does not exist"
    return 1
  fi
}

# Function to create a group
create_group() {
  local GROUP_NAME="$1"
  local GROUP_DESC="$2"
  
  echo "[INFO] Creating group: $GROUP_NAME with description: $GROUP_DESC"
  
  # Group payload
  GROUP_PAYLOAD="{
    \"profile\": {
      \"name\": \"$GROUP_NAME\",
      \"description\": \"$GROUP_DESC\"
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

# Process each group
for GROUP_INFO in "${GROUPS[@]}"; do
  GROUP_NAME="${GROUP_INFO%%:*}"
  GROUP_DESC="${GROUP_INFO#*:}"
  
  # Check if group exists first
  if ! check_group "$GROUP_NAME"; then
    # Group doesn't exist, create it
    create_group "$GROUP_NAME" "$GROUP_DESC"
  else
    echo "[INFO] Group $GROUP_NAME already exists, skipping creation"
  fi
  
  echo "--------------------------------------"
done

echo ""
echo "=== SUMMARY ==="
echo "✅ Checked/created these AWS WorkSpaces groups:"
for GROUP_INFO in "${GROUPS[@]}"; do
  GROUP_NAME="${GROUP_INFO%%:*}"
  echo "  - $GROUP_NAME"
done
echo ""
echo "⚠️  NO groups were deleted during this process ⚠️"
echo ""
echo "This script is safe to keep in your repository for future reference."