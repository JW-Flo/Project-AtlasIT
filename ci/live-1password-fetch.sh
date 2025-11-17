#!/usr/bin/env bash
set -euo pipefail

if ! command -v op >/dev/null 2>&1; then
  echo "1Password CLI (op) is required for live validation. Install it before running." >&2
  exit 2
fi

if [[ -z "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]]; then
  echo "OP_SERVICE_ACCOUNT_TOKEN must be set for live 1Password reads." >&2
  exit 2
fi

names=(
  CF_ACCOUNT_ID CF_API_TOKEN CF_API_EMAIL OKTA_DOMAIN OKTA_API_TOKEN OKTA_CLIENT_ID OKTA_CLIENT_SECRET \
  OPENAI_API_KEY TOGETHER_API_KEY SLACK_WEBHOOK_URL RAMP_API_KEY RAMP_CLIENT_ID RAMP_CLIENT_SECRET \
  GITHUB_TOKEN GH_PAT DATABASE_URL S3_BUCKET AWS_ACCESS_KEY_ID_SANDBOX AWS_SECRET_ACCESS_KEY_SANDBOX
)

mappings=(
  "CF_ACCOUNT_ID=op://AtlasIT Cloudflare/Cloudflare Account/Account ID"
  "CF_API_TOKEN=op://AtlasIT Cloudflare/Cloudflare API Token/credential"
  "CF_API_EMAIL=op://AtlasIT Cloudflare/Cloudflare Account/Email"
  "OKTA_DOMAIN=op://AtlasIT Okta/Okta Domain/domain"
  "OKTA_API_TOKEN=op://AtlasIT Okta/Okta API Token/credential"
  "OKTA_CLIENT_ID=op://AtlasIT Okta/Okta OIDC App/client_id"
  "OKTA_CLIENT_SECRET=op://AtlasIT Okta/Okta OIDC App/client_secret"
  "OPENAI_API_KEY=op://AI Providers/OpenAI/key"
  "TOGETHER_API_KEY=op://AI Providers/Together/key"
  "SLACK_WEBHOOK_URL=op://Integrations/Slack Webhook/url"
  "RAMP_API_KEY=op://Finance/Ramp/API Key"
  "RAMP_CLIENT_ID=op://Finance/Ramp/Client ID"
  "RAMP_CLIENT_SECRET=op://Finance/Ramp/Client Secret"
  "GITHUB_TOKEN=op://Automation/GitHub PAT/token"
  "GH_PAT=op://Automation/GitHub PAT/token"
  "DATABASE_URL=op://Databases/Primary Postgres/URL"
  "S3_BUCKET=op://AWS/S3 Evidence Bucket/name"
  "AWS_ACCESS_KEY_ID_SANDBOX=op://AWS/Sandbox User/access_key_id"
  "AWS_SECRET_ACCESS_KEY_SANDBOX=op://AWS/Sandbox User/secret_access_key"
)

is_placeholder() {
  shopt -s nocasematch
  local value="$1"
  local result=1
  case "$value" in
    changeme|change_me|placeholder|dummy|sample|example|todo|"*<*>*")
      result=0
      ;;
  esac
  shopt -u nocasematch
  return $result
}

validate_value() {
  local label="$1"; local value="$2"
  if [[ -z "$value" ]]; then
    return 1
  fi
  if is_placeholder "$value"; then
    return 1
  fi

  case "$label" in
    OPENAI_API_KEY)
      [[ "$value" =~ ^sk-[A-Za-z0-9]{20,}$ ]] || return 1
      ;;
    TOGETHER_API_KEY)
      [[ "$value" =~ ^(tg|sk)-[A-Za-z0-9]{20,}$ ]] || return 1
      ;;
    GITHUB_TOKEN|GH_PAT)
      [[ "$value" =~ ^(ghp_|github_pat_)[A-Za-z0-9_]{20,}$ ]] || return 1
      ;;
    CF_ACCOUNT_ID)
      [[ "$value" =~ ^[A-Fa-f0-9]{32}$ ]] || return 1
      ;;
    CF_API_EMAIL)
      [[ "$value" == *"@"* && "$value" == *.* ]] || return 1
      ;;
    CF_API_TOKEN)
      [[ "$value" =~ ^[A-Za-z0-9_-]{37,}$ ]] || return 1
      ;;
    OKTA_DOMAIN)
      [[ "$value" =~ \.okta\.com$ ]] || return 1
      ;;
    OKTA_API_TOKEN)
      [[ "$value" =~ ^00[A-Za-z0-9_-]{40,}$ ]] || return 1
      ;;
    OKTA_CLIENT_ID)
      [[ "$value" =~ ^[A-Za-z0-9]{20,}$ ]] || return 1
      ;;
    OKTA_CLIENT_SECRET)
      [[ ${#value} -ge 20 ]] || return 1
      ;;
    SLACK_WEBHOOK_URL)
      [[ "$value" =~ ^https://hooks.slack.com/ ]] || return 1
      ;;
    DATABASE_URL)
      [[ "$value" == *"://"* ]] || return 1
      ;;
    S3_BUCKET)
      [[ "$value" =~ ^[a-z0-9.-]+$ ]] || return 1
      ;;
    AWS_ACCESS_KEY_ID_SANDBOX)
      [[ "$value" =~ ^(AKIA|ASIA)[A-Z0-9]{16}$ ]] || return 1
      ;;
    AWS_SECRET_ACCESS_KEY_SANDBOX)
      [[ "$value" =~ ^[A-Za-z0-9/+=]{40}$ ]] || return 1
      ;;
    RAMP_API_KEY|RAMP_CLIENT_SECRET)
      [[ ${#value} -ge 24 ]] || return 1
      ;;
    RAMP_CLIENT_ID)
      [[ ${#value} -ge 12 ]] || return 1
      ;;
    *)
      [[ ${#value} -ge 8 ]] || return 1
      ;;
  esac
  return 0
}

failures=0
for mapping in "${mappings[@]}"; do
  name="${mapping%%=*}"
  ref="${mapping#*=}"
  raw_value="$(op read "$ref" 2>/dev/null || true)"

  if ! validate_value "$name" "$raw_value"; then
    echo "Validation failed for $name from $ref (value redacted)" >&2
    ((failures++))
    continue
  fi

  echo "Validated live secret for $name from $ref (value redacted)"
  unset raw_value
  sleep 0.1
  continue

done

if [[ $failures -gt 0 ]]; then
  echo "Live validation failed for $failures secret(s)." >&2
  exit 1
fi

echo "Live 1Password credential fetch and validation succeeded."
