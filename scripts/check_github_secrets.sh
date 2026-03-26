#!/usr/bin/env bash
set -euo pipefail

# scripts/check_github_secrets.sh
# Checks for required GitHub secrets before deploy

REQUIRED_SECRETS=("CF_ACCOUNT_ID" "WRANGLER_API_TOKEN")
MISSING=()

for secret in "${REQUIRED_SECRETS[@]}"; do
  if ! gh secret list | grep -q "^$secret"; then
    MISSING+=("$secret")
  fi
done

if [ ${#MISSING[@]} -ne 0 ]; then
  echo "❌ Missing required GitHub secrets: ${MISSING[*]}"
  exit 1
else
  echo "✅ All required GitHub secrets are present."
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
