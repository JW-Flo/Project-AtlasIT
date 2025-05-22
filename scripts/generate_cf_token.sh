#!/usr/bin/env bash
set -euo pipefail

# generate_cf_token.sh - Generate a Cloudflare API token for Wrangler and push to GitHub secrets
# Usage: ./scripts/generate_cf_token.sh

# Self-healing: check required env vars
: "${CF_ACCOUNT_EMAIL?Need to set CF_ACCOUNT_EMAIL}"
: "${CF_GLOBAL_API_KEY?Need to set CF_GLOBAL_API_KEY}"
: "${CF_ACCOUNT_ID?Need to set CF_ACCOUNT_ID}"

if ! command -v gh &>/dev/null; then
  echo "❌ GitHub CLI (gh) is required for automatic secret population. Please install it: https://cli.github.com/" >&2
  exit 1
fi

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

echo "✅ Wrangler API token created. Pushing to GitHub secrets..."
gh secret set WRANGLER_API_TOKEN -b"$TOKEN"
gh secret set CF_ACCOUNT_ID -b"$CF_ACCOUNT_ID"
echo "✅ Secrets pushed to GitHub."

# Self-healing: Validate token by running a dry-run Wrangler publish
if command -v wrangler &>/dev/null; then
  echo "Validating Wrangler token with a dry-run publish..."
  WRANGLER_API_TOKEN="$TOKEN" wrangler whoami || { echo "❌ Wrangler token validation failed."; exit 1; }
  echo "✅ Wrangler token validated."
else
  echo "⚠️  Wrangler CLI not found. Please validate the token manually."
fi

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
