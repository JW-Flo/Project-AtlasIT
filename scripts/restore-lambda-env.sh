#!/usr/bin/env bash
# restore-lambda-env.sh
#
# Restores the FULL Lambda environment (infra vars + secrets) for all 7 functions.
# Run this after env vars are wiped or after a fresh terraform apply.
#
# Usage: ENV=dev ./scripts/restore-lambda-env.sh

set -euo pipefail
export MSYS_NO_PATHCONV=1

ENV="${ENV:-dev}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
ACCOUNT_ID="457335975503"

AWS_CMD="${AWS_CLI:-aws}"
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

echo "Reading secrets from SSM..."
get_ssm() {
  "$AWS_CMD" ssm get-parameter \
    --name "/atlasit/${ENV}/secrets/$1" \
    --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo ""
}

DATABASE_URL=$(get_ssm "database-url")
INTERNAL_API_KEY=$(get_ssm "internal-api-key")
WEBHOOK_SECRET=$(get_ssm "webhook-secret")
CRED_ENCRYPTION_KEY=$(get_ssm "cred-encryption-key")
GROQ_API_KEY=$(get_ssm "groq-api-key")

if [[ -z "$DATABASE_URL" ]]; then
  echo "ERROR: DATABASE_URL not in SSM. Cannot proceed."
  exit 1
fi
if [[ -z "$INTERNAL_API_KEY" || "$INTERNAL_API_KEY" == "PLACEHOLDER" ]]; then
  echo "ERROR: INTERNAL_API_KEY not set in SSM."
  exit 1
fi

echo "Building full environment JSON..."

ENV_JSON=$(node -e "
const env = {
  NODE_ENV: '${ENV}',
  AWS_REGION_APP: '${REGION}',
  EVIDENCE_BUCKET: 'atlasit-evidence-${ENV}-${ACCOUNT_ID}',
  POLICIES_BUCKET: 'atlasit-policies-${ENV}-${ACCOUNT_ID}',
  ARTIFACTS_BUCKET: 'atlasit-artifacts-${ENV}-${ACCOUNT_ID}',
  IDEMPOTENCY_TABLE: 'atlasit-idem-${ENV}',
  SESSIONS_TABLE: 'atlasit-sessions-${ENV}',
  CACHE_TABLE: 'atlasit-cache-${ENV}',
  FLAGS_TABLE: 'atlasit-feature-flags-${ENV}',
  EVENT_BUS_NAME: 'atlasit-${ENV}',
  SQS_STEP_TASKS_URL: 'https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/atlasit-step-tasks-${ENV}',
  SSM_PREFIX: '/atlasit/${ENV}',
  DATABASE_URL: process.env.DB_URL,
  INTERNAL_API_KEY: process.env.IAK,
  WEBHOOK_SECRET: process.env.WHS,
  CRED_ENCRYPTION_KEY: process.env.CEK,
};
if (process.env.GROQ_KEY && process.env.GROQ_KEY !== 'PLACEHOLDER') {
  env.GROQ_API_KEY = process.env.GROQ_KEY;
}
console.log(JSON.stringify({ Variables: env }));
" DB_URL="$DATABASE_URL" \
  IAK="$INTERNAL_API_KEY" \
  WHS="$WEBHOOK_SECRET" \
  CEK="$CRED_ENCRYPTION_KEY" \
  GROQ_KEY="${GROQ_API_KEY:-}")

echo "Applying full env to ${#LAMBDAS[@]} Lambda functions..."

for FUNCTION_NAME in "${LAMBDAS[@]}"; do
  echo -n "  Updating ${FUNCTION_NAME}... "
  "$AWS_CMD" lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "$ENV_JSON" \
    --region "$REGION" \
    --query 'LastModified' --output text
done

echo ""
echo "Done. Full env vars restored for all Lambda functions."
echo "Verify: \"$AWS_CMD\" lambda get-function-configuration --function-name atlasit-core-api-${ENV} --query 'Environment.Variables | keys(@)'"
