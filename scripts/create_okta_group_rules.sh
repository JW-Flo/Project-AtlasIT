#!/usr/bin/env bash
# Script: create_okta_group_rules.sh
# Purpose: Create an Okta group rule so that anyone in the parent group `AWS_Admin` is automatically added to `AWS_WorkSpacesAdmin`.
# Usage: Ensure OKTA_DOMAIN, OKTA_API_TOKEN, and the target group IDs are set (or discoverable).
#-------------------------------------------------------------------------------
set -euo pipefail

: "${OKTA_DOMAIN?Need to set OKTA_DOMAIN}"
: "${OKTA_API_TOKEN?Need to set OKTA_API_TOKEN}"
: "${AWS_ADMIN_GROUP_ID?Need AWS_ADMIN_GROUP_ID (Okta group ID for AWS_Admin)}"
: "${WORKSPACES_ADMIN_GROUP_ID?Need WORKSPACES_ADMIN_GROUP_ID (Okta group ID for AWS_WorkSpacesAdmin)}"

BASE_URL="https://${OKTA_DOMAIN}"
HEADERS=(
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
)

RULE_NAME="Add AWS_Admin to AWS_WorkSpacesAdmin"

# Check if rule exists
existing_rule_id=$(curl -s "${BASE_URL}/api/v1/groups/rules" "${HEADERS[@]}" | jq -r --arg RULE_NAME "$RULE_NAME" '.[] | select(.name==$RULE_NAME) | .id')

if [[ -n "$existing_rule_id" ]]; then
  echo "[INFO] Rule '$RULE_NAME' already exists (ID: $existing_rule_id). Skipping creation."
  exit 0
fi

payload=$(jq -n \
  --arg name "$RULE_NAME" \
  --arg cond_gid "$AWS_ADMIN_GROUP_ID" \
  --arg act_gid "$WORKSPACES_ADMIN_GROUP_ID" \
  '{
    type: "group_rule",
    name: $name,
    conditions: {
      people: {
        groups: {
          include: [$cond_gid]
        }
      }
    },
    actions: {
      assignUserToGroups: {
        groupIds: [$act_gid]
      }
    }
  }')

resp=$(curl -s -X POST "${BASE_URL}/api/v1/groups/rules" "${HEADERS[@]}" -d "$payload")
new_id=$(echo "$resp" | jq -r '.id // empty')

if [[ -z "$new_id" ]]; then
  echo "[ERROR] Failed to create rule. Response: $resp" >&2
  exit 1
fi

echo "[SUCCESS] Created rule '$RULE_NAME' (ID: $new_id)." 