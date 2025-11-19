#!/usr/bin/env bash
# Safe stub for 1Password CLI (op) installation.
# Purpose: Avoid hard‑coding brittle repository steps that previously failed in CI/container.
# Behavior:
#   - If 'op' is already available, report version and exit 0.
#   - If not present, print manual installation instructions and exit 0 WITHOUT attempting network changes.
# This keeps local/bootstrap flows non-blocking while still guiding developers.
set -euo pipefail

if command -v op >/dev/null 2>&1; then
  echo "[install-op-cli] 1Password CLI already present: $(op --version)" >&2
  exit 0
fi

cat >&2 <<'EOF'
[install-op-cli] 1Password CLI not detected.

Manual Installation Options (choose ONE):
  1. Official Docs (recommended – always current):
       https://developer.1password.com/docs/cli/get-started/
  2. Homebrew (macOS / Linux):
       brew install 1password-cli
  3. Direct Download (Linux x64/arm64 – replace VERSION with latest):
       curl -LO https://cache.agilebits.com/dist/1P/op2/pkg/VERSION/op_linux_amd64_VERSION.zip
       unzip op_linux_amd64_*.zip -d op-bin && sudo mv op-bin/op /usr/local/bin/op

Post-Install Steps:
  op --version          # verify binary
  op signin <account>.1password.com <email>
  export OP_VAULT=AtlasIT
  export WRANGLER_ENV=core
  ./scripts/secrets/op-sync.sh   # (optional) sync secrets into Wrangler

Why stubbed? Previous automated APT repository attempts produced 404 errors in containerized Debian variants.
This script is intentionally non-invasive to prevent CI/devcontainer failures.
EOF

exit 0
