#!/usr/bin/env bash
# update-lambda-core-env.sh
#
# Reads core secrets from SSM and merges them into ALL 7 Lambda functions.
# Run this once after populating SSM, or whenever secrets rotate.
#
# Usage:
#   ENV=dev  ./scripts/update-lambda-core-env.sh
#   ENV=prod ./scripts/update-lambda-core-env.sh
#
# Prerequisites:
#   - AWS CLI v2 configured with sufficient permissions
#   - SSM params already populated:
#       /atlasit/{env}/secrets/internal-api-key    (SecureString)
#       /atlasit/{env}/secrets/webhook-secret       (SecureString)
#       /atlasit/{env}/secrets/cred-encryption-key  (SecureString)
#       /atlasit/{env}/secrets/groq-api-key         (SecureString, optional)
#
# Generate and store secrets (run once):
#   aws ssm put-parameter --name "/atlasit/dev/secrets/internal-api-key" \
#     --value "$(openssl rand -hex 32)" --type SecureString --overwrite
#   aws ssm put-parameter --name "/atlasit/dev/secrets/webhook-secret" \
#     --value "$(openssl rand -hex 32)" --type SecureString --overwrite
#   aws ssm put-parameter --name "/atlasit/dev/secrets/cred-encryption-key" \
#     --value "$(openssl rand -hex 32)" --type SecureString --overwrite

set -euo pipefail
export MSYS_NO_PATHCONV=1  # Prevent Git Bash from mangling /path SSM names

ENV="${ENV:-dev}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
SSM_PREFIX="/atlasit/${ENV}/secrets"

AWS_CMD="${AWS_CLI:-aws}"
# Windows: use full path if aws.exe is available
if [ -f "C:/Program Files/Amazon/AWSCLIV2/aws.exe" ]; then
  AWS_CMD="C:/Program Files/Amazon/AWSCLIV2/aws.exe"
fi

LAMBDAS=(
  "atlasit-core-api-${ENV}"
  "atlasit-compliance-api-${ENV}"
  "atlasit-orchestrator-${ENV}"
  "atlasit-onboarding-api-${ENV}"
  "atlasit-scheduler-${ENV}"
  "atlasit-slack-handler-${ENV}"
  "atlasit-dlq-processor-${ENV}"
)

echo "Reading core secrets from SSM for env=${ENV}..."

get_ssm() {
  "$AWS_CMD" ssm get-parameter \
    --name "${SSM_PREFIX}/$1" \
    --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo ""
}

INTERNAL_API_KEY=$(get_ssm "internal-api-key")
WEBHOOK_SECRET=$(get_ssm "webhook-secret")
CRED_ENCRYPTION_KEY=$(get_ssm "cred-encryption-key")
GROQ_API_KEY=$(get_ssm "groq-api-key")

if [[ -z "$INTERNAL_API_KEY" || "$INTERNAL_API_KEY" == "PLACEHOLDER" ]]; then
  echo "ERROR: INTERNAL_API_KEY not set in SSM. Run:"
  echo "  aws ssm put-parameter --name '${SSM_PREFIX}/internal-api-key' \\"
  echo "    --value \"\$(openssl rand -hex 32)\" --type SecureString --overwrite"
  exit 1
fi

echo "Applying secrets to ${#LAMBDAS[@]} Lambda functions..."

for FUNCTION_NAME in "${LAMBDAS[@]}"; do
  echo -n "  Updating ${FUNCTION_NAME}... "

  CURRENT_ENV=$("$AWS_CMD" lambda get-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --query 'Environment.Variables' \
    --output json 2>/dev/null || echo "{}")

  MERGED=$(node -e "
const cur = JSON.parse(process.env.CURRENT_JSON || '{}');
cur.INTERNAL_API_KEY = process.env.IAK;
cur.WEBHOOK_SECRET = process.env.WHS;
cur.CRED_ENCRYPTION_KEY = process.env.CEK;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'PLACEHOLDER') {
  cur.GROQ_API_KEY = process.env.GROQ_API_KEY;
}
console.log(JSON.stringify({Variables: cur}));
" CURRENT_JSON="$CURRENT_ENV" \
  IAK="$INTERNAL_API_KEY" \
  WHS="$WEBHOOK_SECRET" \
  CEK="$CRED_ENCRYPTION_KEY" \
  GROQ_API_KEY="${GROQ_API_KEY:-}")

  "$AWS_CMD" lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "$MERGED" \
    --region "$REGION" \
    --query 'LastModified' --output text
done

echo ""
echo "Done. Core env vars applied to all Lambda functions."
echo "Verify: \$AWS_CMD lambda get-function-configuration --function-name atlasit-core-api-${ENV} --query 'Environment.Variables.INTERNAL_API_KEY'"
