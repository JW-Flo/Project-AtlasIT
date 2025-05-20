#!/usr/bin/env bash
# Script: create_okta_groups.sh
# Purpose: Idempotently create Okta groups `AWS_WorkSpacesAdmin` and `AWS_WorkSpacesUser`.
# Usage: Ensure OKTA_DOMAIN and OKTA_API_TOKEN are set in your environment. Then run:
#   ./scripts/create_okta_groups.sh
#-------------------------------------------------------------------------------
set -euo pipefail

# --- Validate required environment variables ---
: "${OKTA_DOMAIN?Need to set OKTA_DOMAIN, e.g. flosports.okta.com}"
: "${OKTA_API_TOKEN?Need to set OKTA_API_TOKEN (Okta API token)}"

BASE_URL="https://${OKTA_DOMAIN}"
API_ENDPOINT="${BASE_URL}/api/v1/groups"
HEADERS=(
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
)

create_group() {
  local name="$1"
  local description="$2"

  echo "[INFO] Ensuring group '${name}' exists…"

  # Check if group already exists
  local existing_id
  existing_id=$(curl -s "${BASE_URL}/api/v1/groups?q=${name}&limit=1" "${HEADERS[@]}" | jq -r '.[0].id // empty')

  if [[ -n "${existing_id}" ]]; then
    echo "[INFO] Group '${name}' already exists in Okta (ID: ${existing_id}). Skipping creation."
    return 0
  fi

  # Create the group
  local payload
  payload=$(jq -n --arg name "${name}" --arg desc "${description}" '{profile: {name: $name, description: $desc}}')

  response=$(curl -s -X POST "${API_ENDPOINT}" "${HEADERS[@]}" -d "${payload}")
  new_id=$(echo "${response}" | jq -r '.id')

  if [[ "${new_id}" == "null" || -z "${new_id}" ]]; then
    echo "[ERROR] Failed to create group '${name}'. Response: ${response}" >&2
    return 1
  fi

  echo "[SUCCESS] Created group '${name}' (ID: ${new_id})."
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

create_group "AWS_WorkSpacesAdmin" "Admin role for AWS WorkSpaces in sandbox with full workspace admin permissions." && \
create_group "AWS_WorkSpacesUser" "User role for AWS WorkSpaces sandbox with connect-only permissions."

echo "[INFO] All done." 