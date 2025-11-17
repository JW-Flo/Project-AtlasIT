#!/usr/bin/env bash
set -o pipefail
echo "Running 1Password credential shape tests"

names=(
  CF_ACCOUNT_ID CF_API_TOKEN CF_API_EMAIL OKTA_DOMAIN OKTA_API_TOKEN OKTA_CLIENT_ID OKTA_CLIENT_SECRET
  OPENAI_API_KEY TOGETHER_API_KEY SLACK_WEBHOOK_URL RAMP_API_KEY RAMP_CLIENT_ID RAMP_CLIENT_SECRET
  GITHUB_TOKEN GH_PAT DATABASE_URL S3_BUCKET AWS_ACCESS_KEY_ID_SANDBOX AWS_SECRET_ACCESS_KEY_SANDBOX
)

# Functional examples shaped to satisfy the validation logic in the reusable workflow.
declare -A valid_values=(
  [CF_ACCOUNT_ID]=0123456789abcdef0123456789abcdef
  [CF_API_TOKEN]=abcdefghijklmnopqrstuvwxyzABCDEFG1234
  [CF_API_EMAIL]=ops@example.com
  [OKTA_DOMAIN]=atlas.okta.com
  [OKTA_API_TOKEN]=00abcdefghijklmnopqrstuvwxYZ0123456789abcd
  [OKTA_CLIENT_ID]=abcdefghijklmnopqrstuvwx
  [OKTA_CLIENT_SECRET]=abcdefghijklmnopqrstuvwxyz123456
  [OPENAI_API_KEY]=sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234
  [TOGETHER_API_KEY]=tg-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234
  [SLACK_WEBHOOK_URL]=https://hooks.slack.com/services/T000/B000/XXXXXXXXXXXXXXXXXXXXXXXX
  [RAMP_API_KEY]=ABCDEFGHIJKLMNOPQRSTUVWX123456
  [RAMP_CLIENT_ID]=ABCDEFGHIJKL123456
  [RAMP_CLIENT_SECRET]=ABCDEFGHIJKLMNOPQRSTUVWX123456
  [GITHUB_TOKEN]=ghp_abcdefghijklmnopqrstuvwxyz123456
  [GH_PAT]=github_pat_11ABCDEFGHIJKLmnopqrstuvwxyz1234567
  [DATABASE_URL]=postgres://user:pass@db.example.com:5432/db
  [S3_BUCKET]=evidence-bucket-us
  [AWS_ACCESS_KEY_ID_SANDBOX]=AKIAABCDEFGHIJKLMNOP
  [AWS_SECRET_ACCESS_KEY_SANDBOX]=abcdEFGHijklMNOPqrstuvWXyz0123456789ABCD
)

# Values that should be rejected either for placeholder patterns or bad shapes.
declare -A invalid_values=(
  [CF_ACCOUNT_ID]=changeme
  [CF_API_TOKEN]=short
  [CF_API_EMAIL]=not-an-email
  [OKTA_DOMAIN]=example.com
  [OKTA_API_TOKEN]=placeholder
  [OKTA_CLIENT_ID]=shortid
  [OKTA_CLIENT_SECRET]=too_short
  [OPENAI_API_KEY]=placeholder
  [TOGETHER_API_KEY]=tg-short
  [SLACK_WEBHOOK_URL]=http://example.com/webhook
  [RAMP_API_KEY]=sample
  [RAMP_CLIENT_ID]=sample
  [RAMP_CLIENT_SECRET]=sample
  [GITHUB_TOKEN]=token
  [GH_PAT]=changeme
  [DATABASE_URL]=not_a_url
  [S3_BUCKET]=Invalid*Bucket
  [AWS_ACCESS_KEY_ID_SANDBOX]=AKIAINVALID
  [AWS_SECRET_ACCESS_KEY_SANDBOX]=short
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

total=0
pass=0

for name in "${names[@]}"; do
  ((total++))
  candidate="${valid_values[$name]:-}"
  if validate_value "$name" "$candidate"; then
    ((pass++))
  else
    echo "Expected valid $name to pass but it failed"
    exit 1
  fi

done

echo "Validated ${pass}/${total} functional sample credentials"

failures=0
for name in "${!invalid_values[@]}"; do
  candidate="${invalid_values[$name]:-}"
  if validate_value "$name" "$candidate"; then
    echo "Expected invalid $name to fail but it passed"
    ((failures++))
  fi
done

if [[ $failures -gt 0 ]]; then
  echo "Detected $failures invalid values that incorrectly passed validation"
  exit 1
fi

echo "Rejected all placeholder/malformed sample credentials as expected"
