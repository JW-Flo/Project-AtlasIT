#!/usr/bin/env bash
set -euo pipefail

# Cleanup script for legacy Cloudflare resources after infrastructure rebuild.
# SAFETY: This script only echoes destructive commands by default.
# To actually execute, export EXECUTE=1 in your shell OR pass --apply.

ACCOUNT_ID="620865722bd88ef0a77dbbb60c91392e"
APPLY=0
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=1
fi
if [[ "${EXECUTE:-0}" == "1" ]]; then
  APPLY=1
fi

cmd() {
  if [[ $APPLY -eq 1 ]]; then
    echo "> RUN  $*" >&2
    eval "$@"
  else
    echo "> DRY  $*"
  fi
}

echo "[info] Starting legacy cleanup (mode: $([[ $APPLY -eq 1 ]] && echo APPLY || echo DRY-RUN))"

echo "[step] Listing D1 databases (capture any not in new atlas_* set you intend to retain)" >&2
npx --yes wrangler d1 list || true

echo "Enter comma-separated D1 database *names* to DELETE (e.g. guestbook_demo,atlasit_dev) or blank to skip:" >&2
read -r D1_NAMES
if [[ -n "$D1_NAMES" ]]; then
  IFS=',' read -r -a ARR <<< "$D1_NAMES"
  for name in "${ARR[@]}"; do
    name_trim="$(echo "$name" | xargs)"
    [[ -z "$name_trim" ]] && continue
    cmd "npx --yes wrangler d1 delete $name_trim -y"
  done
fi

echo "[step] Listing KV namespaces" >&2
npx --yes wrangler kv namespace list || true

echo "Enter comma-separated KV namespace IDs to DELETE (or blank to skip):" >&2
read -r KV_IDS
if [[ -n "$KV_IDS" ]]; then
  IFS=',' read -r -a KARR <<< "$KV_IDS"
  for id in "${KARR[@]}"; do
    id_trim="$(echo "$id" | xargs)"
    [[ -z "$id_trim" ]] && continue
    cmd "npx --yes wrangler kv namespace delete --namespace-id $id_trim"
  done
fi

echo "[step] Listing R2 buckets" >&2
npx --yes wrangler r2 bucket list || true

echo "Enter comma-separated R2 bucket names to DELETE (or blank to skip):" >&2
read -r R2_NAMES
if [[ -n "$R2_NAMES" ]]; then
  IFS=',' read -r -a RARR <<< "$R2_NAMES"
  for name in "${RARR[@]}"; do
    n_trim="$(echo "$name" | xargs)"
    [[ -z "$n_trim" ]] && continue
    cmd "npx --yes wrangler r2 bucket delete $n_trim"
  done
fi

echo "[step] Queues (skipped) - queues not provisioned on current plan" >&2

echo "[done] Cleanup script finished." >&2
if [[ $APPLY -ne 1 ]]; then
  echo "Run with --apply or EXECUTE=1 to perform deletions." >&2
fi
