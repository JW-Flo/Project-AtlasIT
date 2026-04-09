#!/usr/bin/env bash
set -euo pipefail

# Autonomous secret loader using 1Password automation token (service account style).
# Guard rails:
#  - Requires OP_AUTOMATION_TOKEN exported (GitHub secret).
#  - Reads mapping file ops/secrets/op-map.json (version + mappings object).
#  - Exports each mapped secret into the current shell environment.
#  - Masks values in GitHub Actions logs by printing only prefixes.
#  - Fails fast on missing CLI, token, mapping, or unreadable item.
#  - Does NOT write back to 1Password (read-only usage).
#
# SECURITY NOTES:
#  - Long-lived automation tokens are higher risk than Connect/OIDC.
#    Scope the token to only required vault/items and rotate frequently.
#  - Restrict who can run workflows that include this loader.
#  - Consider migrating to Connect/OIDC when infra is ready.

MAPPING_FILE="ops/secrets/op-map.json"

if [[ -z "${OP_AUTOMATION_TOKEN:-}" ]]; then
  echo "[automation-secrets] Missing OP_AUTOMATION_TOKEN environment variable" >&2
  exit 2
fi

if ! command -v op >/dev/null 2>&1; then
  echo "[automation-secrets] 1Password CLI 'op' not found" >&2
  exit 3
fi

if [[ ! -f "$MAPPING_FILE" ]]; then
  echo "[automation-secrets] Mapping file $MAPPING_FILE not found" >&2
  exit 4
fi

if ! jq -e '.mappings | type == "object"' "$MAPPING_FILE" >/dev/null 2>&1; then
  echo "[automation-secrets] Invalid mapping file structure (missing .mappings object)" >&2
  exit 5
fi

echo "[automation-secrets] Loading secrets from 1Password using automation token"

# Iterate mappings: key=env var, value=op://path
while IFS=$'=' read -r env_key op_path; do
  [[ -z "$env_key" || -z "$op_path" ]] && continue
  if [[ ! "$op_path" =~ ^op:// ]]; then
    echo "[automation-secrets] Skipping $env_key (invalid path: $op_path)" >&2
    continue
  fi
  # Read secret value; attempt multiple field types
  set +e
  secret_val=$(op read "$op_path" 2>/dev/null)
  rc=$?
  set -e
  if [[ $rc -ne 0 || -z "$secret_val" ]]; then
    echo "[automation-secrets] Failed to read $op_path for $env_key" >&2
    exit 6
  fi
  # Export and mask
  export "$env_key"="$secret_val"
  prefix=${secret_val:0:6}
  echo "[automation-secrets] Loaded $env_key (prefix: ${prefix}***)"
done < <(jq -r '.mappings | to_entries | .[] | "\(.key)=\(.value)"' "$MAPPING_FILE")

echo "[automation-secrets] All mapped secrets loaded."
