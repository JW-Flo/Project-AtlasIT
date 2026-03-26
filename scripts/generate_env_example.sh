#!/usr/bin/env bash
set -euo pipefail

cat > .env.example <<'EOF'
# Project Ignite Example Environment Variables

# --- Core Secrets ---
GH_PAT=
OPENAI_API_KEY=
TOGETHER_API_KEY=
SLACK_WEBHOOK_URL=
CF_ACCOUNT_ID=
CF_GLOBAL_API_KEY=
CF_ACCOUNT_EMAIL=
WRANGLER_API_TOKEN=
GITHUB_TOKEN=
CTX_PATH=./context/MasterSourceofTruth.txt
CF_ACCOUNT_ID=
CF_GLOBAL_API_KEY=
CF_ACCOUNT_EMAIL=
WRANGLER_API_TOKEN=
GITHUB_TOKEN=
CTX_PATH=./context/MasterSourceofTruth.txt

# --- Okta & Ramp Integration ---
OKTA_DOMAIN=
OKTA_API_TOKEN=
OKTA_API_TOKEN_SA=
RAMP_API_KEY=
RAMP_CLIENT_ID=
RAMP_CLIENT_SECRET=
GROUP_ID=
START_TIME=
END_TIME=

# --- GCP/AWS/Other Cloud ---
GCP_PROJECT_ID=
AWS_ACCESS_KEY_ID_SANDBOX=
AWS_SECRET_ACCESS_KEY_SANDBOX=
AWS_REGION=

echo "[INFO] .env.example generated at project root." 
git commit -m "Revert to the desired state"
# (Removed automatic git revert/push logic for safety.)
git checkout HEAD
git log -1

# Commit and push the changes to the repository
echo "📤 Committing and pushing the changes..."
git push origin main
