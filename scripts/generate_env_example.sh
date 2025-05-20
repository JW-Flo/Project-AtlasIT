#!/usr/bin/env bash
set -euo pipefail

cat > .env.example <<'EOF'
# Project Ignite Example Environment Variables

# --- Core Secrets ---
GH_PAT=
OPENAI_API_KEY=
TOGETHER_API_KEYtgp_v1_D6DofWSYYdwom90eedeZgdomJUjPc0Im1Mhv_Rixu-k=
SLACK_WEBHOOK_URL=
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

# --- Miscellaneous ---
MCP_URL=https://project-ignite.kd8jc7v8cd.workers.dev
EOF

echo "[INFO] .env.example generated at project root." 