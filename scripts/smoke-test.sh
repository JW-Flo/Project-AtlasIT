#!/usr/bin/env bash
# Usage: ./scripts/smoke-test.sh <worker-name> <base-url>
# Example: ./scripts/smoke-test.sh core-api https://api.atlasit.pro
#
# Exit codes: 0 = all checks passed, 1 = one or more checks failed

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
WORKER_NAME="${1:-}"
BASE_URL="${2:-}"
MAX_RETRIES="${SMOKE_RETRIES:-4}"
RETRY_SLEEP="${SMOKE_SLEEP:-8}"
TIMEOUT="${SMOKE_TIMEOUT:-15}"

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

pass()    { echo -e "${GREEN}[PASS]${RESET} $*"; }
fail()    { echo -e "${RED}[FAIL]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
info()    { echo -e "${CYAN}[INFO]${RESET} $*"; }
section() { echo -e "\n${BOLD}=== $* ===${RESET}"; }

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
if [ -z "$WORKER_NAME" ] || [ -z "$BASE_URL" ]; then
  echo "Usage: $0 <worker-name> <base-url>"
  echo "  e.g. $0 core-api https://api.atlasit.pro"
  exit 1
fi

# Strip trailing slash from base URL
BASE_URL="${BASE_URL%/}"

# ---------------------------------------------------------------------------
# Helper: HTTP GET with retry/backoff
# Returns 0 on success (200), 1 on failure.
# Sets LAST_HTTP_CODE and LAST_BODY as globals.
# ---------------------------------------------------------------------------
LAST_HTTP_CODE=""
LAST_BODY=""

http_get_with_retry() {
  local url="$1"
  local expect_code="${2:-200}"
  local attempt=0
  local code body

  while [ "$attempt" -lt "$MAX_RETRIES" ]; do
    attempt=$(( attempt + 1 ))
    info "Attempt $attempt/$MAX_RETRIES: GET $url"

    body=$(curl -sSL --max-time "$TIMEOUT" "$url" 2>/dev/null || true)
    code=$(curl -sSL -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")

    LAST_HTTP_CODE="$code"
    LAST_BODY="$body"

    if [ "$code" = "$expect_code" ]; then
      return 0
    fi

    warn "Got HTTP $code (expected $expect_code)"
    if [ "$attempt" -lt "$MAX_RETRIES" ]; then
      info "Waiting ${RETRY_SLEEP}s before retry..."
      sleep "$RETRY_SLEEP"
    fi
  done

  return 1
}

# ---------------------------------------------------------------------------
# Worker-specific health path and expected fields
# ---------------------------------------------------------------------------
# Defaults
HEALTH_PATH="/health"
HEALTH_FIELDS=("status")  # JSON fields to verify exist (non-empty check)
EXTRA_PROBE_PATH=""        # optional secondary probe (informational)

case "$WORKER_NAME" in
  core-api)
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status" "timestamp")
    EXTRA_PROBE_PATH="/api/health"
    ;;
  ai-orchestrator|orchestrator)
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status")
    ;;
  compliance-worker|compliance)
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status")
    EXTRA_PROBE_PATH="/api/compliance/snapshot"
    ;;
  console-app|console)
    # Console is a SvelteKit app — probe root for 200, no JSON
    HEALTH_PATH="/"
    HEALTH_FIELDS=()
    ;;
  dispatch-worker|dispatch)
    HEALTH_PATH="/"
    HEALTH_FIELDS=("ok")
    ;;
  onboarding)
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status")
    ;;
  slack-notification-agent|slack-agent)
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status")
    ;;
  documentation-worker|docs)
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status")
    ;;
  apex-redirect|apex-redirect-worker)
    # Apex redirect returns 301/302 — verify the redirect works, not JSON
    HEALTH_PATH="/"
    HEALTH_FIELDS=()
    ;;
  email-worker|email)
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status")
    ;;
  *)
    # Generic fallback
    HEALTH_PATH="/health"
    HEALTH_FIELDS=("status")
    ;;
esac

HEALTH_URL="${BASE_URL}${HEALTH_PATH}"

# ---------------------------------------------------------------------------
# Run checks
# ---------------------------------------------------------------------------
FAILURES=0

section "Smoke test: $WORKER_NAME @ $BASE_URL"
info "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
info "Max retries: $MAX_RETRIES, sleep: ${RETRY_SLEEP}s, timeout: ${TIMEOUT}s"

# --- Check 1: Health endpoint returns 200 ---
section "Health endpoint"
if http_get_with_retry "$HEALTH_URL" "200"; then
  pass "Health endpoint returned HTTP 200"

  # --- Check 2: Validate expected JSON fields ---
  if [ ${#HEALTH_FIELDS[@]} -gt 0 ] && [ -n "$LAST_BODY" ]; then
    section "Response field validation"
    for field in "${HEALTH_FIELDS[@]}"; do
      # Use grep to check if the field key appears in the JSON response
      if echo "$LAST_BODY" | grep -q "\"${field}\""; then
        pass "Field '${field}' present in response"
      else
        fail "Field '${field}' missing from response body"
        warn "Response body: $(echo "$LAST_BODY" | head -c 500)"
        FAILURES=$(( FAILURES + 1 ))
      fi
    done
  fi
else
  fail "Health endpoint did not return 200 after $MAX_RETRIES attempts (last code: $LAST_HTTP_CODE)"
  FAILURES=$(( FAILURES + 1 ))
fi

# --- Check 3: Optional secondary probe (informational, non-blocking) ---
if [ -n "$EXTRA_PROBE_PATH" ]; then
  EXTRA_URL="${BASE_URL}${EXTRA_PROBE_PATH}"
  section "Secondary probe (informational): $EXTRA_URL"
  extra_code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$EXTRA_URL" 2>/dev/null || echo "000")
  if [ "$extra_code" = "200" ]; then
    pass "Secondary probe returned HTTP 200"
  elif [ "$extra_code" = "000" ]; then
    warn "Secondary probe unreachable (timeout or DNS) — may be transient"
  else
    warn "Secondary probe returned HTTP $extra_code — may need migrations or secrets"
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
section "Summary"
if [ "$FAILURES" -eq 0 ]; then
  pass "All smoke tests passed for ${WORKER_NAME}"
  exit 0
else
  fail "$FAILURES check(s) failed for ${WORKER_NAME}"
  exit 1
fi
