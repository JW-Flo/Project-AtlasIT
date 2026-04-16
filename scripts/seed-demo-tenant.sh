#!/usr/bin/env bash
# seed-demo-tenant.sh
#
# Creates (or refreshes) the demo tenant for AtlasIT.
# Idempotent — safe to run multiple times (uses ON CONFLICT / checks before creating).
#
# What it does:
#   1. Creates demo@atlasit.pro tenant via onboarding API (if not already exists)
#   2. Logs in and gets a session token
#   3. Installs all 5 built-in compliance packs
#   4. Triggers compliance evaluation (scores all controls)
#   5. Creates 3 sample automation rules
#
# Usage:
#   ENV=dev API_URL=https://ahjoepuw96.execute-api.us-east-1.amazonaws.com \
#     ./scripts/seed-demo-tenant.sh
#
# Or use defaults (dev + hardcoded API GW URL):
#   ./scripts/seed-demo-tenant.sh
#
# Outputs:
#   Demo tenant credentials + login URL at the end.

set -euo pipefail
export MSYS_NO_PATHCONV=1

ENV="${ENV:-dev}"
API_URL="${API_URL:-https://ahjoepuw96.execute-api.us-east-1.amazonaws.com}"

DEMO_EMAIL="demo@atlasit.pro"
DEMO_PASSWORD="Demo@AtlasIT2026!"
DEMO_TENANT_NAME="AtlasIT Demo"
DEMO_TENANT_SLUG="atlasit-demo"

AWS_CMD="${AWS_CLI:-aws}"
if [ -f "C:/Program Files/Amazon/AWSCLIV2/aws.exe" ]; then
  AWS_CMD="C:/Program Files/Amazon/AWSCLIV2/aws.exe"
fi

echo "========================================="
echo "  AtlasIT Demo Tenant Seed — ENV=${ENV}"
echo "========================================="
echo ""

# ── Step 1: Sign up (idempotent — 409 if already exists) ─────────────────────
echo "Step 1: Creating demo tenant..."
SIGNUP_RESP=$(curl -s -X POST "${API_URL}/api/onboarding/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenantName\": \"${DEMO_TENANT_NAME}\",
    \"slug\": \"${DEMO_TENANT_SLUG}\",
    \"adminEmail\": \"${DEMO_EMAIL}\",
    \"adminPassword\": \"${DEMO_PASSWORD}\",
    \"plan\": \"free\"
  }")

SIGNUP_STATUS=$(echo "$SIGNUP_RESP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.status || 'unknown')")
echo "  Signup: ${SIGNUP_STATUS}"
if echo "$SIGNUP_RESP" | grep -q '"code":"CONFLICT"'; then
  echo "  (tenant already exists — continuing)"
fi

# ── Step 2: Login ─────────────────────────────────────────────────────────────
echo "Step 2: Logging in..."
LOGIN_RESP=$(curl -s -X POST "${API_URL}/api/v1/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${DEMO_EMAIL}\", \"password\": \"${DEMO_PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.data?.token || d.token || '')")
if [ -z "$TOKEN" ]; then
  echo "ERROR: Login failed. Response: ${LOGIN_RESP}"
  exit 1
fi
echo "  Token: ${TOKEN:0:16}..."

# ── Step 3: Install compliance packs ──────────────────────────────────────────
echo "Step 3: Installing compliance packs..."
PACK_IDS=(pack-soc2-builtin pack-iso27001-builtin pack-nist-csf-builtin pack-hipaa-builtin pack-gdpr-builtin)
for PACK_ID in "${PACK_IDS[@]}"; do
  RESULT=$(curl -s -X POST "${API_URL}/api/compliance/api/v1/compliance-packs/${PACK_ID}/install" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  STATUS=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.status || 'unknown')")
  echo "  ${PACK_ID}: ${STATUS}"
done

# ── Step 4: Trigger compliance evaluation ────────────────────────────────────
echo "Step 4: Running compliance evaluation..."
INTERNAL_API_KEY=$("$AWS_CMD" ssm get-parameter \
  --name "/atlasit/${ENV}/secrets/internal-api-key" \
  --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo "")

if [ -n "$INTERNAL_API_KEY" ]; then
  EVAL_RESP=$(curl -s -X POST "${API_URL}/api/compliance/internal/compliance-packs/evaluate-all" \
    -H "x-internal-api-key: ${INTERNAL_API_KEY}" \
    -H "Content-Type: application/json")
  INSTALLS=$(echo "$EVAL_RESP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(String(d.data?.installs || 0))")
  echo "  Evaluated ${INSTALLS} pack installations"
else
  echo "  WARNING: Could not read INTERNAL_API_KEY from SSM — skipping evaluation"
fi

# ── Step 4b: Publish trust center ─────────────────────────────────────────────
echo "Step 4b: Publishing trust center..."
TENANT_ID=$(curl -s "${API_URL}/api/v1/dashboard" \
  -H "Authorization: Bearer ${TOKEN}" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.data?.tenant?.id || '')")

if [ -n "$TENANT_ID" ]; then
  curl -s -X PATCH "${API_URL}/api/v1/tenants/${TENANT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"config": {"trust_center_public": true}}' > /dev/null
  echo "  Trust center published"
else
  echo "  WARNING: Could not get tenant ID — skipping trust center publish"
fi

# ── Step 5: Create automation rules (skip if already exist) ──────────────────
echo "Step 5: Checking/creating automation rules..."

# Get existing rules count
RULES_RESP=$(curl -s "${API_URL}/orchestrator/api/v1/automation/rules" \
  -H "Authorization: Bearer ${TOKEN}")
RULES_COUNT=$(echo "$RULES_RESP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(String(d.data?.total || d.data?.items?.length || 0))")

if [ "${RULES_COUNT}" -ge 3 ] 2>/dev/null; then
  echo "  Already have ${RULES_COUNT} rules — skipping creation"
else
  echo "  Creating 3 sample automation rules..."

  curl -s -X POST "${API_URL}/orchestrator/api/v1/automation/rules" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"Alert on New Employee Onboarding","description":"Notify security team when a new employee joins and needs access provisioning","triggerType":"user_created","conditions":[],"actions":[{"type":"notify","channel":"slack","message":"New employee joined. Initiate access provisioning workflow."}],"enabled":true}' > /dev/null

  curl -s -X POST "${API_URL}/orchestrator/api/v1/automation/rules" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"Auto-Revoke Access on Offboarding","description":"Automatically revoke all application access when an employee leaves","triggerType":"user_deactivated","conditions":[],"actions":[{"type":"revoke_access","scope":"all_integrations"},{"type":"notify","channel":"slack","message":"Access revoked for departed employee"}],"enabled":true}' > /dev/null

  curl -s -X POST "${API_URL}/orchestrator/api/v1/automation/rules" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"MFA Compliance Enforcement","description":"Create incident when a user account is detected without MFA enabled","triggerType":"schedule","conditions":[{"field":"user.mfa_enabled","operator":"eq","value":false}],"actions":[{"type":"create_incident","severity":"medium"}],"enabled":true}' > /dev/null

  echo "  3 rules created"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  Demo Tenant Ready"
echo "========================================="
echo "  URL:      https://www.atlasit.pro/login"
echo "  Email:    ${DEMO_EMAIL}"
echo "  Password: ${DEMO_PASSWORD}"
echo "  Token:    ${TOKEN:0:32}..."
echo ""
echo "  What's seeded:"
echo "  - Tenant: ${DEMO_TENANT_NAME} (slug: ${DEMO_TENANT_SLUG})"
echo "  - 5 compliance packs: SOC2, ISO27001, NIST-CSF, HIPAA, GDPR"
echo "  - Compliance scores evaluated"
echo "  - 3 automation rules (onboarding, offboarding, MFA)"
echo ""
