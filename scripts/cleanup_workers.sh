#!/usr/bin/env bash
set -euo pipefail

# Create backup directory if it doesn't exist
mkdir -p backup

# 1. Search and clean up stale workflows
for workflow in .github/workflows/*.yml; do
  if [[ "$(basename "$workflow")" != "cloudflare-workers.yml" && "$(basename "$workflow")" != dispatch-*.yml ]]; then
    if ! grep -qr "$(basename "$workflow")" .; then
      echo "Deleted: $workflow"
      rm "$workflow"
    fi
  fi
done

# 2. Check and clean up wrangler.toml or wrangler.jsonc
for config in wrangler.toml wrangler.jsonc; do
  if [[ -f "$config" ]]; then
    if ! grep -q 'name = "atlasit-core"' "$config" || ! grep -q '\[dispatch_namespaces\]' "$config"; then
      mv "$config" backup/
      echo "Backed up: $config"
    fi
  fi
done

# 3. Find and clean up stale index.js
if [[ -f "index.js" ]]; then
  if ! grep -q 'env.dispatcher' index.js; then
    mv index.js backup/
    echo "Backed up: index.js"
  fi
fi

# 4. Ensure backup directory exists (already created at the start)
echo "Cleanup completed."

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
