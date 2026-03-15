#!/usr/bin/env bash
set -euo pipefail

# AtlasIT: Repository Cleanup
# Removes Cloudflare-specific code after full AWS migration
#
# Usage:
#   ./scripts/cleanup-repo.sh --dry-run
#   ./scripts/cleanup-repo.sh --execute

MODE="${1:---dry-run}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[cleanup]${NC} $1"; }
warn() { echo -e "${YELLOW}[cleanup]${NC} $1"; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Files and directories to remove
REMOVE_PATHS=(
  # Legacy Terraform
  "terraform/cloudflare/"
  "infra/aws/"
  "AWS/"

  # Cloudflare platform adapters
  "packages/shared/src/platform/cloudflare/"

  # Wrangler configs
  "wrangler.toml"
  "wrangler.json"
  "compliance-worker/wrangler.toml"

  # Cloudflare-specific workflows
  ".github/workflows/vault-oidc-deploy.yml"
  ".github/workflows/deploy-connect.yml"
)

# NPM packages to remove from root package.json
PACKAGES_TO_REMOVE=(
  "@cloudflare/workers-types"
  "@sveltejs/adapter-cloudflare"
  "wrangler"
)

log "Files/directories to remove: ${#REMOVE_PATHS[@]}"
for path in "${REMOVE_PATHS[@]}"; do
  full_path="$PROJECT_ROOT/$path"
  if [[ -e "$full_path" ]]; then
    if [[ "$MODE" == "--execute" ]]; then
      log "Removing: $path"
      rm -rf "$full_path"
    else
      log "[DRY RUN] Would remove: $path"
    fi
  else
    warn "Already gone: $path"
  fi
done

echo ""
log "NPM packages to uninstall:"
for pkg in "${PACKAGES_TO_REMOVE[@]}"; do
  if [[ "$MODE" == "--execute" ]]; then
    log "Removing package: $pkg"
    npm uninstall "$pkg" 2>/dev/null || warn "Package $pkg not found"
  else
    log "[DRY RUN] Would uninstall: $pkg"
  fi
done

echo ""
if [[ "$MODE" == "--execute" ]]; then
  log "Repository cleanup complete"
  warn "Remember to:"
  warn "  1. Update imports that reference cloudflare platform adapters"
  warn "  2. Remove @cloudflare/workers-types from tsconfig.json"
  warn "  3. Run 'pnpm install' to update lockfile"
  warn "  4. Run tests to verify nothing is broken"
else
  log "Dry run complete. Re-run with --execute to perform cleanup."
fi
