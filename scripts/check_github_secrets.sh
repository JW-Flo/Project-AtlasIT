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
