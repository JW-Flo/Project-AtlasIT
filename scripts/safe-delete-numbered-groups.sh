#!/bin/bash
set -euo pipefail

# Okta domain and token - REPLACE WITH YOUR ACTUAL TOKEN
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# List of only the numbered groups to delete - these are EXACT matches
NUMBERED_GROUPS=("20" "12" "61" "79" "80" "81" "399" "400" "701" "33")

# Default to dry-run mode (no actual deletions)
DRY_RUN=true

# Function to find a group's ID by its exact name
find_group_id() {
  local GROUP_NAME="$1"
  
  echo "Looking for group with EXACT name: '$GROUP_NAME'"
  
  # Search for the group by exact name
  SEARCH_RESPONSE=$(curl -s -X GET \
    "https://$OKTA_DOMAIN/api/v1/groups?q=$GROUP_NAME" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN")
  
  # Extract the group ID if found - we'll double check the name match is exact
  if echo "$SEARCH_RESPONSE" | grep -q '"id"'; then
    # Parse out all groups returned
    echo "$SEARCH_RESPONSE" | python3 -c '
import sys, json
data = json.load(sys.stdin)
for group in data:
  if "profile" in group and "name" in group["profile"] and group["profile"]["name"] == "'"$GROUP_NAME"'":
    print(group["id"])
    exit(0)
print("")
' || echo ""
  else
    echo ""
  fi
}

# Function to delete a group by ID
delete_group() {
  local GROUP_NAME="$1"
  local GROUP_ID="$2"
  
  echo "⚠️  DELETING group: '$GROUP_NAME' (ID: $GROUP_ID)"
  
  if [ "$DRY_RUN" = true ]; then
    echo "🔒 DRY RUN MODE - No deletion performed"
    return 0
  fi
  
  DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE \
    "https://$OKTA_DOMAIN/api/v1/groups/$GROUP_ID" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN")
  
  HTTP_STATUS="${DELETE_RESPONSE: -3}"
  
  if [[ "$HTTP_STATUS" == "204" ]]; then
    echo "✅ Successfully deleted group: '$GROUP_NAME'"
    return 0
  else
    echo "❌ Failed to delete group: '$GROUP_NAME' - Status: $HTTP_STATUS"
    echo "Response: $DELETE_RESPONSE"
    return 1
  fi
}

# Display all groups that will be processed
echo "==============================================="
echo "🔍 ANALYSIS: NUMBERED GROUPS TO BE PROCESSED"
echo "==============================================="
echo "This script will ONLY process these specific groups:"
for GROUP_NAME in "${NUMBERED_GROUPS[@]}"; do
  echo "  - '$GROUP_NAME'"
done
echo ""
echo "NO OTHER groups will be affected."
echo "==============================================="

# Ask for confirmation
echo ""
read -p "Do you want to run in dry-run mode first? (Recommended) [Y/n]: " DRY_RUN_CONFIRM
if [[ "$DRY_RUN_CONFIRM" != "n" && "$DRY_RUN_CONFIRM" != "N" ]]; then
  DRY_RUN=true
  echo "🔒 Running in DRY RUN mode (no actual deletions)"
else
  read -p "⚠️  WARNING: This will ACTUALLY DELETE groups. Are you sure? Type 'YES' to confirm: " CONFIRM
  if [[ "$CONFIRM" != "YES" ]]; then
    echo "Operation canceled. No groups were deleted."
    exit 0
  fi
  DRY_RUN=false
  echo "⚠️  LIVE MODE - Groups will be ACTUALLY DELETED"
fi

echo ""
echo "==============================================="
echo "PROCESSING GROUPS"
echo "==============================================="

# Process each numbered group individually
for GROUP_NAME in "${NUMBERED_GROUPS[@]}"; do
  echo "Processing group: '$GROUP_NAME'"
  
  # Get the group ID
  GROUP_ID=$(find_group_id "$GROUP_NAME")
  
  # If we found an ID, delete the group
  if [ -n "$GROUP_ID" ]; then
    # Double confirmation for each deletion in live mode
    if [ "$DRY_RUN" = false ]; then
      read -p "Ready to delete group '$GROUP_NAME'. Proceed? [y/N]: " DELETE_CONFIRM
      if [[ "$DELETE_CONFIRM" != "y" && "$DELETE_CONFIRM" != "Y" ]]; then
        echo "Skipping deletion of '$GROUP_NAME'"
        continue
      fi
    fi
    
    delete_group "$GROUP_NAME" "$GROUP_ID"
  else
    echo "Group '$GROUP_NAME' not found, nothing to delete"
  fi
  
  # Add a separator between groups for readability
  echo "--------------------------------------"
done

echo -e "\n"
if [ "$DRY_RUN" = true ]; then
  echo "🔒 DRY RUN COMPLETE - No groups were actually deleted"
  echo "Run the script again with 'n' for dry-run to perform actual deletion"
else
  echo "🎉 Clean-up complete! Only the specified numbered groups were processed."
fi