#!/bin/bash
set -euo pipefail

# Okta credentials - REPLACE WITH YOUR ACTUAL TOKEN
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"

# List of all the numbered groups to delete - add any others you find
NUMBERED_GROUPS=("20" "12" "61" "79" "80" "81" "399" "400" "701" "33")

echo "DELETING ALL NUMBERED GROUPS - NO CONFIRMATION"

# Delete each numbered group
for GROUP_NAME in "${NUMBERED_GROUPS[@]}"; do
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
    
    # Delete the group using its ID - no confirmation
    echo "DELETING group: $GROUP_NAME (ID: $GROUP_ID)"
    DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE \
      "https://$OKTA_DOMAIN/api/v1/groups/$GROUP_ID" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "Authorization: SSWS $OKTA_API_TOKEN")
    
    HTTP_STATUS="${DELETE_RESPONSE: -3}"
    
    if [[ "$HTTP_STATUS" == "204" ]]; then
      echo "DELETED group: $GROUP_NAME"
    else
      echo "FAILED to delete group: $GROUP_NAME - Status: $HTTP_STATUS"
    fi
  else
    echo "Group $GROUP_NAME not found, skipping"
  fi
  
  echo "--------------------------------------"
done

echo "DONE - All numbered groups processed"