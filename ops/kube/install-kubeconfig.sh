#!/usr/bin/env bash
set -euo pipefail
TARGET="$HOME/.kube"
FILE="$TARGET/config"
TEMPLATE="$(dirname "$0")/kubeconfig.template.yaml"

mkdir -p "$TARGET"
if [[ -f "$FILE" ]]; then
  cp "$FILE" "$FILE.bak.$(date +%s)"
  echo "Existing kubeconfig backed up to $FILE.bak.$(date +%s)" >&2
fi
cp "$TEMPLATE" "$FILE"
echo "Template copied to $FILE. Edit placeholders (CHANGE_ME_*) before use." >&2
