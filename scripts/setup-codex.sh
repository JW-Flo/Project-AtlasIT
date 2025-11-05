#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Initializing Codex environment..."
bash "${SCRIPT_DIR}/setup-atlasit.sh" --non-interactive
echo "Codex ready."
