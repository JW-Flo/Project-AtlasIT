#!/bin/bash
set -euo pipefail

# Configuration
OKTA_DOMAIN=${OKTA_DOMAIN:-"flosports.okta.com"}
OKTA_API_TOKEN=${OKTA_API_TOKEN:-"00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"}
JIRA_DOMAIN=${JIRA_DOMAIN:-"flosports.atlassian.net"}
JIRA_API_TOKEN=${JIRA_API_TOKEN:-"your-jira-api-token"}
JIRA_EMAIL=${JIRA_EMAIL:-"ignite_admin@flosports.tv"}
CONTRACTOR_PROJECT=${CONTRACTOR_PROJECT:-"CONTR"}
DAYS_UNTIL_EXPIRY=${DAYS_UNTIL_EXPIRY:-90}
NOTIFICATION_DAYS=${NOTIFICATION_DAYS:-"0,14,76,90"}

echo "=== Project Ignite: Contractor Lifecycle Automation ==="
echo "Checking for new contractor onboarding requests in Jira..."

# Function to get open contractor onboarding requests from Jira
get_contractor_requests() {
  echo "Fetching contractor requests from Jira..."
  
  RESPONSE=$(curl -s -X GET \
    "https://${JIRA_DOMAIN}/rest/api/3/search" \
    -H "Authorization: Basic $(echo -n ${JIRA_EMAIL}:${JIRA_API_TOKEN} | base64)" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    --data-raw '{
      "jql": "project = '"${CONTRACTOR_PROJECT}"' AND status = \"Approved\" AND labels = \"needs-okta-processing\"",
      "fields": ["summary", "description", "customfield_10042", "customfield_10043", "customfield_10044", "customfield_10045"]
    }')
  
  echo "$RESPONSE" | jq -r '.issues[]'
}

# Function to create contractor in Okta
create_contractor_in_okta() {
  local FIRST_NAME="$1"
  local LAST_NAME="$2"
  local EMAIL="$3"
  local CONTRACTOR_TYPE="$4"
  local END_DATE="$5"
  local ISSUE_KEY="$6"
  
  echo "Creating contractor $FIRST_NAME $LAST_NAME in Okta..."
  
  # First check if user already exists
  USER_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://${OKTA_DOMAIN}/api/v1/users?search=profile.email eq \"${EMAIL}\"" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: SSWS ${OKTA_API_TOKEN}")
  
  if [[ "$USER_EXISTS" == "200" ]] && [[ $(curl -s "https://${OKTA_DOMAIN}/api/v1/users?search=profile.email eq \"${EMAIL}\"" -H "Authorization: SSWS ${OKTA_API_TOKEN}" | jq 'length') -gt 0 ]]; then
    echo "User $EMAIL already exists in Okta. Updating attributes..."
    
    # Get the user ID
    USER_ID=$(curl -s "https://${OKTA_DOMAIN}/api/v1/users?search=profile.email eq \"${EMAIL}\"" \
      -H "Authorization: SSWS ${OKTA_API_TOKEN}" | jq -r '.[0].id')
    
    # Update user attributes
    curl -s -X POST \
      "https://${OKTA_DOMAIN}/api/v1/users/${USER_ID}" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "Authorization: SSWS ${OKTA_API_TOKEN}" \
      -d '{
        "profile": {
          "firstName": "'"${FIRST_NAME}"'",
          "lastName": "'"${LAST_NAME}"'",
          "email": "'"${EMAIL}"'",
          "login": "'"${EMAIL}"'",
          "userType": "Contractor",
          "contractorType": "'"${CONTRACTOR_TYPE}"'",
          "contractEndDate": "'"${END_DATE}"'",
          "jiraTicket": "'"${ISSUE_KEY}"'"
        }
      }'
    
    echo "Updated user $EMAIL in Okta."
  else
    # Create new user
    USER_RESPONSE=$(curl -s -X POST \
      "https://${OKTA_DOMAIN}/api/v1/users?activate=true" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "Authorization: SSWS ${OKTA_API_TOKEN}" \
      -d '{
        "profile": {
          "firstName": "'"${FIRST_NAME}"'",
          "lastName": "'"${LAST_NAME}"'",
          "email": "'"${EMAIL}"'",
          "login": "'"${EMAIL}"'",
          "userType": "Contractor",
          "contractorType": "'"${CONTRACTOR_TYPE}"'",
          "contractEndDate": "'"${END_DATE}"'",
          "jiraTicket": "'"${ISSUE_KEY}"'"
        },
        "credentials": {
          "password": {
            "value": "'"$(openssl rand -base64 12)"'"
          }
        }
      }')
    
    echo "Created user $EMAIL in Okta."
    USER_ID=$(echo "$USER_RESPONSE" | jq -r '.id')
  fi
  
  # Assign appropriate groups based on contractor type
  if [ "$CONTRACTOR_TYPE" == "SRE" ]; then
    # Find AWS_WorkSpacesUser group ID
    GROUP_ID=$(curl -s \
      "https://${OKTA_DOMAIN}/api/v1/groups?q=AWS_WorkSpacesUser" \
      -H "Authorization: SSWS ${OKTA_API_TOKEN}" | jq -r '.[0].id')
    
    if [ -n "$GROUP_ID" ] && [ "$GROUP_ID" != "null" ]; then
      # Add user to the AWS_WorkSpacesUser group
      curl -s -X PUT \
        "https://${OKTA_DOMAIN}/api/v1/groups/${GROUP_ID}/users/${USER_ID}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -H "Authorization: SSWS ${OKTA_API_TOKEN}"
      
      echo "Added user $EMAIL to AWS_WorkSpacesUser group."
    fi
  fi
  
  # Schedule deactivation after 90 days
  schedule_deactivation_notification "$EMAIL" "$FIRST_NAME" "$LAST_NAME" "$USER_ID" "$END_DATE" "$ISSUE_KEY"
  
  return 0
}

# Function to schedule deactivation notifications
schedule_deactivation_notification() {
  local EMAIL="$1"
  local FIRST_NAME="$2"
  local LAST_NAME="$3"
  local USER_ID="$4"
  local END_DATE="$5"
  local ISSUE_KEY="$6"
  
  echo "Scheduling notifications for user $EMAIL with end date $END_DATE..."
  
  # For demo purposes, we'll create a Cloud Functions trigger event in Firestore
  # In production, this would be handled by actual Cloud Functions and Pub/Sub
  
  # Create a notification document for each day in NOTIFICATION_DAYS
  IFS=',' read -ra DAYS <<< "$NOTIFICATION_DAYS"
  for DAY in "${DAYS[@]}"; do
    NOTIFY_DATE=$(date -j -v+${DAY}d +%Y-%m-%d)
    echo "Scheduling notification for $DAY days from now: $NOTIFY_DATE"
    
    # This would be a Cloud Functions call in production
    echo "Created notification for $EMAIL on $NOTIFY_DATE ($DAY days) - Ticket: $ISSUE_KEY"
  done
  
  # Update Jira ticket with Okta processing status
  update_jira_ticket "$ISSUE_KEY" "$EMAIL" "$END_DATE"
  
  return 0
}

# Function to update Jira ticket
update_jira_ticket() {
  local ISSUE_KEY="$1"
  local EMAIL="$2" 
  local END_DATE="$3"
  
  echo "Updating Jira ticket $ISSUE_KEY..."
  
  COMMENT="{
    \"body\": {
      \"type\": \"doc\",
      \"version\": 1,
      \"content\": [
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Contractor successfully created in Okta: $EMAIL. Contract end date: $END_DATE\"
            }
          ]
        }
      ]
    }
  }"
  
  curl -s -X POST \
    "https://${JIRA_DOMAIN}/rest/api/3/issue/${ISSUE_KEY}/comment" \
    -H "Authorization: Basic $(echo -n ${JIRA_EMAIL}:${JIRA_API_TOKEN} | base64)" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "$COMMENT"
  
  # Remove the "needs-okta-processing" label
  curl -s -X PUT \
    "https://${JIRA_DOMAIN}/rest/api/3/issue/${ISSUE_KEY}" \
    -H "Authorization: Basic $(echo -n ${JIRA_EMAIL}:${JIRA_API_TOKEN} | base64)" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d '{
      "update": {
        "labels": [
          {"remove": "needs-okta-processing"},
          {"add": "okta-processed"}
        ]
      }
    }'
  
  echo "Jira ticket $ISSUE_KEY updated."
  return 0
}

# Main execution
CONTRACTOR_REQUESTS=$(get_contractor_requests)

if [ -z "$CONTRACTOR_REQUESTS" ]; then
  echo "No new contractor onboarding requests found."
  exit 0
else
  echo "Processing contractor requests..."
  
  # For each contractor request
  echo "$CONTRACTOR_REQUESTS" | while read -r REQUEST; do
    ISSUE_KEY=$(echo "$REQUEST" | jq -r '.key')
    SUMMARY=$(echo "$REQUEST" | jq -r '.fields.summary')
    FIRST_NAME=$(echo "$REQUEST" | jq -r '.fields.customfield_10042')
    LAST_NAME=$(echo "$REQUEST" | jq -r '.fields.customfield_10043')
    EMAIL=$(echo "$REQUEST" | jq -r '.fields.customfield_10044')
    CONTRACTOR_TYPE=$(echo "$REQUEST" | jq -r '.fields.customfield_10045')
    
    # Calculate end date (90 days from now)
    END_DATE=$(date -j -v+${DAYS_UNTIL_EXPIRY}d +%Y-%m-%d)
    
    echo "Processing contractor request for $FIRST_NAME $LAST_NAME ($EMAIL)..."
    create_contractor_in_okta "$FIRST_NAME" "$LAST_NAME" "$EMAIL" "$CONTRACTOR_TYPE" "$END_DATE" "$ISSUE_KEY"
  done
  
  echo "Contractor onboarding requests processed successfully."
  exit 0
fi
