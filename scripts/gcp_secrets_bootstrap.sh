#!/usr/bin/env bash
set -euo pipefail
: "${RAMP_API_TOKEN?Need RAMP_API_TOKEN env var}"

# Create the secret if it doesn't exist
if ! gcloud secrets describe ramp_api_token >/dev/null 2>&1; then
  gcloud secrets create ramp_api_token --replication-policy=automatic
fi

echo -n "$RAMP_API_TOKEN" | gcloud secrets versions add ramp_api_token --data-file=-

echo "[INFO] ramp_api_token secret updated."

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
