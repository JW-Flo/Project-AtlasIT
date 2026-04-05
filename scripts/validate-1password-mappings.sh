#!/usr/bin/env bash
set -euo pipefail
# Simple validator: reads ops/secrets/op-map.json and verifies environment overrides or placeholders
MAP_FILE="$(dirname "$0")/../ops/secrets/op-map.json"
if [ ! -f "$MAP_FILE" ]; then
  echo "Map file not found: $MAP_FILE" >&2
  exit 1
fi

echo "Validating 1Password mapping shapes and placeholders"
jq -r '.mappings | to_entries[] | "KEY=\(.key) PATH=\(.value)"' "$MAP_FILE" | while read -r line; do
  KEY=$(echo "$line" | awk '{print $1}' | cut -d= -f2)
  PATH=$(echo "$line" | awk '{print $2}' | cut -d= -f2)
  # Check for obvious placeholder values in environment
  VAL=${!KEY:-}
  if [ -z "$VAL" ]; then
    echo "WARN: $KEY not set in environment; will rely on Connect mapping: $PATH"
  else
    # basic shape checks: non-empty and not a placeholder
    if [[ "$VAL" =~ (changeme|CHANGE_ME|your-password|password_here) ]]; then
      echo "FAIL: $KEY contains placeholder value"
      exit 2
    fi
    echo "OK: $KEY provided via env and looks valid (redacted length=${#VAL})"
  fi
done

echo "Validation complete"
