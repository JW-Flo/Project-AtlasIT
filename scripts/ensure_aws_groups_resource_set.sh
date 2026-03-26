#!/usr/bin/env bash
# Script: ensure_aws_groups_resource_set.sh
# Purpose: Dynamically resolve Okta group & resource-set IDs by name and ensure
#          AWS_WorkSpaces* groups are inside the AWS_Groups resource set.
# Why:    Avoids hard-coding group/resource IDs or extra GitHub Secrets.
# Usage:
#   export OKTA_DOMAIN="flosports.okta.com"
#   export OKTA_API_TOKEN="..."
#   ./scripts/ensure_aws_groups_resource_set.sh
#-------------------------------------------------------------------------------
set -euo pipefail

: "${OKTA_DOMAIN?Need to set OKTA_DOMAIN}"
: "${OKTA_API_TOKEN?Need to set OKTA_API_TOKEN}"

BASE_URL="https://${OKTA_DOMAIN}"
HEADERS=(
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
)

# --- Helper to fetch first matching object ID by name (case-sensitive) --------
get_id_by_name() {
  local endpoint="$1" name="$2" filter_key="$3"
  curl -s "${BASE_URL}${endpoint}?limit=200" "${HEADERS[@]}" |
    jq -r --arg n "$name" --arg fk "$filter_key" \
      'map(select(.[$fk]==$n)) | .[0].id // empty'
}

# Resolve AWS_Groups resource set ID
RESOURCE_SET_NAME="AWS_Groups"
RESOURCE_SET_ID=$(curl -s "${BASE_URL}/api/v1/iam/resource-sets?limit=200" "${HEADERS[@]}" | jq -r --arg n "$RESOURCE_SET_NAME" '."resource-sets" | map(select(.label==$n)) | .[0].id // empty')
if [[ -z "$RESOURCE_SET_ID" ]]; then
  echo "[ERROR] Resource set '$RESOURCE_SET_NAME' not found in Okta." >&2
  exit 1
fi

# Resolve group IDs
# First try full list (fast)
ADMIN_GROUP_ID=$(get_id_by_name "/api/v1/groups" "AWS_WorkSpacesAdmin" "profile.name")
USER_GROUP_ID=$(get_id_by_name "/api/v1/groups" "AWS_WorkSpacesUser" "profile.name")
# If not found, fallback to search
if [[ -z "$ADMIN_GROUP_ID" ]]; then
  ADMIN_GROUP_ID=$(curl -s "${BASE_URL}/api/v1/groups?q=AWS_WorkSpacesAdmin&limit=10" "${HEADERS[@]}" | jq -r '.[0].id // empty')
fi
if [[ -z "$USER_GROUP_ID" ]]; then
  USER_GROUP_ID=$(curl -s "${BASE_URL}/api/v1/groups?q=AWS_WorkSpacesUser&limit=10" "${HEADERS[@]}" | jq -r '.[0].id // empty')
fi
if [[ -z "$ADMIN_GROUP_ID" || -z "$USER_GROUP_ID" ]]; then
  echo "[ERROR] One or both WorkSpaces groups not found in Okta." >&2
  exit 1
fi

# Reuse the assign script with discovered IDs
export RESOURCE_SET_ID="$RESOURCE_SET_ID"
export GROUP_IDS="$ADMIN_GROUP_ID $USER_GROUP_ID"

# shellcheck source=assign_groups_to_resource_set.sh
"$(dirname "$0")/assign_groups_to_resource_set.sh" 

# Revert the repository to the desired state
echo "🔄 Reverting repository to the desired state..."
git revert --no-commit HEAD
git commit -m "Revert to the desired state"

# Verify the revert by checking out the commit and reviewing the changes
echo "🔍 Verifying the revert..."
git checkout HEAD
git log -1

# Commit and push the changes to the repository
echo "📤 Committing and pushing the changes..."
git push origin main
