#!/bin/bash
set -euo pipefail

# Okta domain and token - REPLACE WITH YOUR ACTUAL TOKEN
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# List of all the numbered groups to delete
NUMBERED_GROUPS=("20" "12" "61" "79" "80" "81" "399" "400" "701" "33")

# Function to find a group's ID by its name
find_group_id() {
  local GROUP_NAME="$1"
  
  echo "Looking for group: $GROUP_NAME"
  
  # Search for the group by name
  SEARCH_RESPONSE=$(curl -s -X GET \
    "https://$OKTA_DOMAIN/api/v1/groups?q=$GROUP_NAME" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS $OKTA_API_TOKEN")
  
  # Extract the group ID if found
  if echo "$SEARCH_RESPONSE" | grep -q '"id"'; then
    GROUP_ID=$(echo "$SEARCH_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Found group $GROUP_NAME with ID: $GROUP_ID"
    echo "$GROUP_ID"
  else
    echo "Group $GROUP_NAME not found"
    echo ""
  fi
}

# Delete each numbered group
for GROUP_NAME in "${NUMBERED_GROUPS[@]}"; do
  echo "Processing group: $GROUP_NAME"
  
  # Get the group ID
  GROUP_ID=$(find_group_id "$GROUP_NAME")
  
  # If we found an ID, delete the group
  if [ -n "$GROUP_ID" ]; then
    echo "Deleting group: $GROUP_NAME (ID: $GROUP_ID)"
    
    DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE \
      "https://$OKTA_DOMAIN/api/v1/groups/$GROUP_ID" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "Authorization: SSWS $OKTA_API_TOKEN")
    
    HTTP_STATUS="${DELETE_RESPONSE: -3}"
    
    if [[ "$HTTP_STATUS" == "204" ]]; then
      echo "✅ Successfully deleted group: $GROUP_NAME"
    else
      echo "❌ Failed to delete group: $GROUP_NAME - Status: $HTTP_STATUS"
      echo "Response: $DELETE_RESPONSE"
    fi
  else
    echo "Skipping $GROUP_NAME - not found"
  fi
  
  # Add a separator between groups for readability
  echo "--------------------------------------"
done

echo -e "\n"
echo "🎉 Clean-up complete! All numbered groups have been processed."
echo -e "\n"
echo "Don't forget to save these successful scripts for future reference:"
echo "- simple-okta-groups.sh (creates AWS_WorkSpacesAdmin and AWS_WorkSpacesUser groups)"
echo "- delete-numbered-groups.sh (deletes the incorrectly created numbered groups)"