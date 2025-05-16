#!/usr/bin/env bash
set -euo pipefail

# generate_cf_token.sh - Generate a Cloudflare API token for Wrangler and push to GitHub secrets
# Usage: ./scripts/generate_cf_token.sh

: "${CF_ACCOUNT_EMAIL?Need to set CF_ACCOUNT_EMAIL}"
: "${CF_GLOBAL_API_KEY?Need to set CF_GLOBAL_API_KEY}"
: "${CF_ACCOUNT_ID?Need to set CF_ACCOUNT_ID}"

TOKEN_NAME="wrangler-publish-$(date +%Y%m%d-%H%M%S)"

cat <<EOF > /tmp/wrangler_token_policy.json
{
  "name": "$TOKEN_NAME",
  "policies": [
    {
      "effect": "allow",
      "action": [
        "Workers Scripts:Edit",
        "Workers Scripts:Read"
      ],
      "resource": [
        "com.cloudflare.api.account.$CF_ACCOUNT_ID.worker" ]
    }
  ]
}
EOF

echo "Creating Cloudflare API token for Wrangler..."
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "X-Auth-Email: $CF_ACCOUNT_EMAIL" \
  -H "X-Auth-Key: $CF_GLOBAL_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/wrangler_token_policy.json)

TOKEN=$(echo "$RESPONSE" | grep -o '"value":"[^"]*' | cut -d'"' -f4)

if [[ -z "$TOKEN" ]]; then
  echo "Failed to create token. Response: $RESPONSE" >&2
  exit 1
fi

echo "✅ Wrangler API token created."

# Push token and account ID to GitHub secrets (requires gh CLI and auth)
if command -v gh &>/dev/null; then
  echo "Pushing token to GitHub secrets as WRANGLER_API_TOKEN..."
  gh secret set WRANGLER_API_TOKEN -b"$TOKEN"
  echo "✅ Token pushed to GitHub secrets."
  echo "Pushing CF_ACCOUNT_ID to GitHub secrets..."
  gh secret set CF_ACCOUNT_ID -b"$CF_ACCOUNT_ID"
  echo "✅ CF_ACCOUNT_ID pushed to GitHub secrets."
else
  echo "⚠️  GitHub CLI (gh) not found. Please install it or add the secrets manually."
  echo "WRANGLER_API_TOKEN: $TOKEN"
  echo "CF_ACCOUNT_ID: $CF_ACCOUNT_ID"
fi
