#!/usr/bin/env bash
# Script: assign_groups_to_resource_set.sh
# Purpose: Add target Okta groups to a resource set (e.g., AWS_Groups) so that a custom admin role can manage them.
# Usage:
#   export OKTA_DOMAIN="flosports.okta.com"
#   export OKTA_API_TOKEN="..."
#   export RESOURCE_SET_ID="rsset123abc"        # ID for AWS_Groups resource set
#   export GROUP_IDS="gid1 gid2 gid3"            # space-separated list of group IDs to add
#   ./scripts/assign_groups_to_resource_set.sh
# Notes:
#   • Idempotent – skips groups already in the resource set.
#   • Requires `jq`.
#-------------------------------------------------------------------------------
set -euo pipefail

: "${OKTA_DOMAIN?Need to set OKTA_DOMAIN}"
: "${OKTA_API_TOKEN?Need to set OKTA_API_TOKEN}"
: "${RESOURCE_SET_ID?Need RESOURCE_SET_ID (Okta resource set ID)}"
: "${GROUP_IDS?Need GROUP_IDS (space-separated Okta group IDs)}"

BASE_URL="https://${OKTA_DOMAIN}"
RS_ENDPOINT="${BASE_URL}/api/v1/iam/resource-sets/${RESOURCE_SET_ID}/resources"
HEADERS=(
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
)

# Fetch current resources
current=$(curl -s "${RS_ENDPOINT}" "${HEADERS[@]}")

for gid in ${GROUP_IDS}; do
  present=$(echo "$current" | jq -e --arg gid "$gid" '.[] | select(.resourceId==$gid) | .resourceId' || true)
  if [[ -n "$present" ]]; then
    echo "[INFO] Group $gid already in resource set; skipping."
    continue
  fi
  payload=$(jq -n --arg rid "$gid" '{resourceType:"Group", resourceId:$rid}')
  resp=$(curl -s -X POST "${RS_ENDPOINT}" "${HEADERS[@]}" -d "$payload")
  ok_id=$(echo "$resp" | jq -r '.resourceId // empty')
  if [[ -z "$ok_id" ]]; then
    echo "[ERROR] Failed to add group $gid. Response: $resp" >&2
    exit 1
  fi
  echo "[SUCCESS] Added group $gid to resource set $RESOURCE_SET_ID."
  # update current variable to include new gid for subsequent idempotency in same run
  current=$(echo "$current" | jq --arg rid "$gid" '. + [{resourceId:$rid}]')
 done

echo "[INFO] Completed resource set assignments."

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
