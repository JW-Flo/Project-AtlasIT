#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-https://www.atlasit.pro}"
ADMIN_COOKIE="${ADMIN_COOKIE:-}"

if [[ -z "$ADMIN_COOKIE" ]]; then
  echo "ADMIN_COOKIE is required (atlas_session cookie from a super-admin session)."
  exit 1
fi

curl --fail -sS -X POST "${API_URL}/api/admin/demo/reset" \
  -H "Cookie: atlas_session=${ADMIN_COOKIE}" \
  -H "content-type: application/json"

printf '\nDemo tenant reset complete.\n'
