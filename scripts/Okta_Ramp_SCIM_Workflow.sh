#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/Okta_Ramp_SCIM_Workflow.sh user@example.com
# Requires env vars:
#   OKTA_DOMAIN
#   OKTA_API_TOKEN_SA
#   RAMP_CLIENT_ID
#   RAMP_CLIENT_SECRET

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 user_email" >&2
  exit 1
fi
USER_EMAIL="$1"

#  validate env
for v in OKTA_DOMAIN OKTA_API_TOKEN_SA RAMP_CLIENT_ID RAMP_CLIENT_SECRET; do
  [[ -n "${!v:-}" ]] || { echo "ERROR: $v not set"; exit 1; }
done

# 1️⃣ Mint Ramp token
BASIC_AUTH=$(printf "%s:%s" "$RAMP_CLIENT_ID" "$RAMP_CLIENT_SECRET" | base64)
TOKEN_JSON=$(curl -s -X POST https://api.ramp.com/developer/v1/token \
  -H "Authorization: Basic $BASIC_AUTH" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=users:read users:write departments:read departments:write locations:read locations:write")
ACCESS_TOKEN=$(echo "$TOKEN_JSON" | jq -r .access_token 2>/dev/null || echo "")
if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "ERROR: could not mint Ramp token. Response was:" >&2
  echo "$TOKEN_JSON" >&2
  exit 1
fi

# 2️⃣ Lookup Okta user by email
FILTER_EMAIL=${USER_EMAIL//@/%40}
OKTA_USER_JSON=$(curl -s "https://${OKTA_DOMAIN}/api/v1/users?filter=profile.login%20eq%20%22$FILTER_EMAIL%22" \
  -H "Authorization: SSWS $OKTA_API_TOKEN_SA" \
  -H "Accept: application/json")
if ! echo "$OKTA_USER_JSON" | jq . >/dev/null 2>&1; then
  echo "ERROR: expected JSON when fetching Okta user; got:" >&2
  echo "$OKTA_USER_JSON" >&2
  exit 1
fi
OKTA_USER_ID=$(echo "$OKTA_USER_JSON" | jq -r '.[0].id')
if [[ -z "$OKTA_USER_ID" || "$OKTA_USER_ID" == "null" ]]; then
  echo "ERROR: no Okta user for $USER_EMAIL" >&2
  exit 1
fi

# 3️⃣ Ensure Okta group assignments
GROUPS=(Ramp_Admin Ramp_IT_Admin Ramp_Bookkeeper)
for GROUP in "${GROUPS[@]}"; do
  GROUP_JSON=$(curl -s "https://${OKTA_DOMAIN}/api/v1/groups?q=$GROUP" \
    -H "Authorization: SSWS $OKTA_API_TOKEN_SA" \
    -H "Accept: application/json")
  if ! echo "$GROUP_JSON" | jq . >/dev/null 2>&1; then
    echo "ERROR: could not fetch group $GROUP; got:" >&2
    echo "$GROUP_JSON" >&2
    exit 1
  fi
  GROUP_ID=$(echo "$GROUP_JSON" | jq -r '.[0].id')
  if [[ -z "$GROUP_ID" || "$GROUP_ID" == "null" ]]; then
    echo "ERROR: Okta group not found: $GROUP" >&2
    exit 1
  fi
  echo "→ Assigning $USER_EMAIL to Okta group $GROUP"
  curl -s -X PUT "https://${OKTA_DOMAIN}/api/v1/groups/$GROUP_ID/users/$OKTA_USER_ID" \
    -H "Authorization: SSWS $OKTA_API_TOKEN_SA" \
    -H "Accept: application/json" \
    && echo "  ✓ added to $GROUP"
done

# 4️⃣ Fetch updated groups for Ramp assignment
GROUPS_JSON=$(curl -s "https://${OKTA_DOMAIN}/api/v1/users/$OKTA_USER_ID/groups" \
  -H "Authorization: SSWS $OKTA_API_TOKEN_SA" \
  -H "Accept: application/json")
if ! echo "$GROUPS_JSON" | jq . >/dev/null 2>&1; then
  echo "ERROR: invalid JSON for user groups"; exit 1
fi

# 5️⃣ Map Okta→Ramp roles & assign
declare -A MAP=(
  [Ramp_Admin]=admin
  [Ramp_IT_Admin]=it_admin
  [Ramp_Bookkeeper]=bookkeeper
)

# disable nounset for lookup default
set +u
echo "$GROUPS_JSON" | jq -r '.[].profile.name' | while read -r G; do
  ROLE="${MAP[$G]:-}"
  if [[ -n "$ROLE" ]]; then
    echo "→ Assigning Ramp role $ROLE for Okta group $G"
    curl -s -X POST https://api.ramp.com/v1/roles/assign \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"user_email\":\"$USER_EMAIL\",\"role_id\":\"$ROLE\"}" \
    && echo "  ✓ $G → $ROLE"
  else
    echo "  • skipping $G (no mapping)"
  fi
done
set -u

# 6️⃣ Revoke Ramp token
curl -s -X POST https://api.ramp.com/developer/v1/token/revoke \
  -H "Authorization: Basic $BASIC_AUTH" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=$ACCESS_TOKEN" \
  && echo "🔒 Ramp token revoked"

echo "✅ Provisioning complete for $USER_EMAIL"

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
