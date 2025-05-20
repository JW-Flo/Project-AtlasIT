#!/usr/bin/env bash
# file: qwen_call.sh  –  Usage:  qwen_call.sh "Deploy Ignite MCP Workers"
set -euo pipefail

# ---- static repo metadata ---------------------------------------------------
GITHUB_REPO="JW-Flo/Project-Ignite"
SYSTEM_PROMPT_FILE="$(dirname "$0")/system_prompt.txt"
MODEL="qwen-7b-instruct"
# -----------------------------------------------------------------------------

# ---- 1️⃣  pull every Secret from the repo ------------------------------------
# Requires gh CLI authenticated with `gh auth login --hostname github.com --scopes repo,read:org`
mapfile -t SECRET_ROWS < <(gh secret list --repo "$GITHUB_REPO" --visibility=all --json name)
for row in "${SECRET_ROWS[@]}"; do
  name=$(jq -r '.name' <<<"$row")
  # skip if already defined in parent shell (interactive override wins)
  if [[ -z "${!name-}" ]]; then
    export "$name"="$(gh secret view "$name" --repo "$GITHUB_REPO" -q .value)"
  fi
done
# -----------------------------------------------------------------------------

# ---- 2️⃣  sanity-check critical vars upfront ---------------------------------
required=(
  TOGETHER_API_KEY GITHUB_TOKEN CF_API_TOKEN CF_ACCOUNT_ID CF_NAMESPACE
  MCP_AUTHLESS_WORKERS_API_TOKEN WRANGLER_API_TOKEN CF_GLOBAL_API_KEY
  CF_ACCOUNT_EMAIL MCP_HOST DATTO_EDR_TOKEN ROCKETCYBER_API_TOKEN
)
for v in "${required[@]}"; do
  [[ -z "${!v-}" ]] && { echo "ERROR: $v not set"; exit 1; }
done
# -----------------------------------------------------------------------------

# ---- 3️⃣  helper to wrap messages in JSON ------------------------------------
jq_msg() { jq -cn --arg role "$1" --arg content "$2" '{role:$role,content:$content}'; }
# -----------------------------------------------------------------------------

USER_TASK="$*"
PAYLOAD=$(jq -cn --argjson msgs "[
  $(jq_msg system "$(cat "$SYSTEM_PROMPT_FILE")"),
  $(jq_msg user "$USER_TASK")
]" '{model:$ENV.MODEL,messages:$msgs}')

# ---- 4️⃣  streaming loop w/ on-demand repo & CF fetch ------------------------
while : ; do
  RESP=$(curl -s https://api.together.ai/v1/chat/completions \
          -H "Authorization: Bearer $TOGETHER_API_KEY" \
          -H "Content-Type: application/json" \
          -d "$PAYLOAD")
  MSG=$(jq -r '.choices[0].message.content' <<<"$RESP")
  printf '%s\n' "$MSG"

  case "$MSG" in
    *"<<GET REPO "*">>"*)
      FILE_PATH=$(sed -n 's/.*<<GET REPO :\(.*\)>>.*/\1/p' <<<"$MSG")
      CONTENT=$(gh api "repos/$GITHUB_REPO/contents/$FILE_PATH" \
                 -H "Accept: application/vnd.github.v3.raw" 2>/dev/null \
               || echo "ERROR: repo file $FILE_PATH not found.")
      PAYLOAD=$(jq --arg role user --arg content "$CONTENT" \
                 '.messages += [{role:$role,content:$content}]' <<<"$PAYLOAD")
      continue ;;
    *"<<GET CF "*">>"*)
      CF_PATH=$(sed -n 's/.*<<GET CF :\(.*\)>>.*/\1/p' <<<"$MSG")
      CF_JSON=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
                "https://api.cloudflare.com/client/v4$CF_PATH")
      PAYLOAD=$(jq --arg role user --arg content "$CF_JSON" \
                 '.messages += [{role:$role,content:$content}]' <<<"$PAYLOAD")
      continue ;;
    *) break ;;
  esac
done
