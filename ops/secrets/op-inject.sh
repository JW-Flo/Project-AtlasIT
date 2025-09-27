#!/usr/bin/env bash
set -euo pipefail
MAP_FILE="$(dirname "$0")/op-map.json"
if ! command -v op >/dev/null 2>&1; then
  echo "[ERROR] 1Password CLI (op) not found. Install: https://developer.1password.com/docs/cli" >&2
  exit 1
fi

jq -r '.mappings | to_entries[] | "export \(.key)=\(\"$(op read \(.value))\")"' "$MAP_FILE" 2>/dev/null |
while IFS= read -r line; do
  eval "$line"
  echo "Loaded $(echo "$line" | cut -d'=' -f1 | sed 's/export //')"
done

echo "All mapped secrets exported to current shell session." >&2

echo "TIP: Use 'op run --env-file=.env -- <command>' for ephemeral injection merging .env overrides."
