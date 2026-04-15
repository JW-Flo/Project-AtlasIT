#!/usr/bin/env bash
# update-lambda-stripe-env.sh
#
# Reads Stripe credentials from SSM Parameter Store and merges them into the
# core-api Lambda environment. Run this once after populating SSM with real values.
#
# Usage:
#   ENV=dev ./scripts/update-lambda-stripe-env.sh
#   ENV=prod ./scripts/update-lambda-stripe-env.sh
#
# Prerequisites:
#   - AWS CLI v2 configured with sufficient permissions
#   - SSM params already populated (see instructions below)
#
# To populate SSM with real values (run once per environment):
#   aws ssm put-parameter --name "/atlasit/dev/secrets/stripe-api-key" \
#     --value "sk_live_..." --type SecureString --overwrite
#   aws ssm put-parameter --name "/atlasit/dev/secrets/stripe-webhook-secret" \
#     --value "whsec_..." --type SecureString --overwrite
#   aws ssm put-parameter --name "/atlasit/dev/billing/stripe-price-starter-monthly" \
#     --value "price_..." --type String --overwrite
#   # ... repeat for all 6 price IDs

set -euo pipefail

ENV="${ENV:-dev}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
FUNCTION_NAME="atlasit-core-api-${ENV}"
SSM_PREFIX="/atlasit/${ENV}"

echo "Reading Stripe config from SSM for env=${ENV}..."

STRIPE_API_KEY=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/secrets/stripe-api-key" \
  --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo "")

STRIPE_WEBHOOK_SECRET=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/secrets/stripe-webhook-secret" \
  --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo "")

STARTER_MONTHLY=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/billing/stripe-price-starter-monthly" \
  --query 'Parameter.Value' --output text 2>/dev/null || echo "")
STARTER_ANNUAL=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/billing/stripe-price-starter-annual" \
  --query 'Parameter.Value' --output text 2>/dev/null || echo "")
PROFESSIONAL_MONTHLY=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/billing/stripe-price-professional-monthly" \
  --query 'Parameter.Value' --output text 2>/dev/null || echo "")
PROFESSIONAL_ANNUAL=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/billing/stripe-price-professional-annual" \
  --query 'Parameter.Value' --output text 2>/dev/null || echo "")
ENTERPRISE_MONTHLY=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/billing/stripe-price-enterprise-monthly" \
  --query 'Parameter.Value' --output text 2>/dev/null || echo "")
ENTERPRISE_ANNUAL=$(aws ssm get-parameter \
  --name "${SSM_PREFIX}/billing/stripe-price-enterprise-annual" \
  --query 'Parameter.Value' --output text 2>/dev/null || echo "")

if [[ -z "$STRIPE_API_KEY" || "$STRIPE_API_KEY" == "PLACEHOLDER" ]]; then
  echo "ERROR: STRIPE_API_KEY not set in SSM. Populate /atlasit/${ENV}/secrets/stripe-api-key first."
  exit 1
fi

echo "Fetching current Lambda env vars for ${FUNCTION_NAME}..."

# Get current env vars and merge Stripe keys in using Python (avoids jq dependency issues)
CURRENT_ENV=$(aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query 'Environment.Variables' \
  --output json 2>/dev/null || echo "{}")

MERGED_ENV=$(python3 - <<PYEOF
import json, sys

current = json.loads("""${CURRENT_ENV}""")

stripe_vars = {
  "STRIPE_API_KEY": "${STRIPE_API_KEY}",
  "STRIPE_SECRET_KEY": "${STRIPE_API_KEY}",
  "STRIPE_WEBHOOK_SECRET": "${STRIPE_WEBHOOK_SECRET}",
  "STRIPE_PRICE_STARTER_MONTHLY": "${STARTER_MONTHLY}",
  "STRIPE_PRICE_STARTER_ANNUAL": "${STARTER_ANNUAL}",
  "STRIPE_PRICE_PROFESSIONAL_MONTHLY": "${PROFESSIONAL_MONTHLY}",
  "STRIPE_PRICE_PROFESSIONAL_ANNUAL": "${PROFESSIONAL_ANNUAL}",
  "STRIPE_PRICE_ENTERPRISE_MONTHLY": "${ENTERPRISE_MONTHLY}",
  "STRIPE_PRICE_ENTERPRISE_ANNUAL": "${ENTERPRISE_ANNUAL}",
}

# Remove empty values (unpopulated price IDs)
stripe_vars = {k: v for k, v in stripe_vars.items() if v and v != "PLACEHOLDER"}

merged = {**current, **stripe_vars}
print(json.dumps({"Variables": merged}))
PYEOF
)

echo "Updating Lambda environment for ${FUNCTION_NAME}..."
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --environment "$MERGED_ENV" \
  --region "$REGION"

echo ""
echo "Done. Stripe env vars applied to ${FUNCTION_NAME}."
echo "Verify with: aws lambda get-function-configuration --function-name ${FUNCTION_NAME} --query 'Environment.Variables.STRIPE_API_KEY'"
