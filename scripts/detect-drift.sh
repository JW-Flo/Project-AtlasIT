#!/usr/bin/env bash
# detect-drift.sh — Run terraform plan across all root modules and report drift.
#
# Usage:
#   ./scripts/detect-drift.sh                # Detect-only mode
#   ./scripts/detect-drift.sh --fix          # Interactive apply for drifted modules
#   ./scripts/detect-drift.sh --module dev   # Check a single environment
#
# Exit codes:
#   0 — No drift detected
#   1 — Error during execution
#   2 — Drift detected in one or more modules

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIX_MODE=false
SINGLE_MODULE=""
DRIFT_FOUND=false
ERROR_FOUND=false

# ── Parse arguments ──────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fix)
      FIX_MODE=true
      shift
      ;;
    --module)
      SINGLE_MODULE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--fix] [--module <env>]"
      echo ""
      echo "Options:"
      echo "  --fix            Interactively apply changes for drifted modules"
      echo "  --module <env>   Check only a specific environment (dev, staging, prod)"
      echo "  -h, --help       Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# ── Discover root modules ───────────────────

ROOT_MODULES=()

# Cloudflare environments
for env_dir in "$REPO_ROOT"/terraform/environments/*/; do
  if [[ -f "$env_dir/main.tf" ]]; then
    env_name="$(basename "$env_dir")"
    if [[ -n "$SINGLE_MODULE" && "$env_name" != "$SINGLE_MODULE" ]]; then
      continue
    fi
    ROOT_MODULES+=("$env_dir")
  fi
done

# Standalone cloudflare module
if [[ -z "$SINGLE_MODULE" && -f "$REPO_ROOT/terraform/cloudflare/main.tf" ]]; then
  ROOT_MODULES+=("$REPO_ROOT/terraform/cloudflare/")
fi

# Top-level terraform (Phase 0 baseline)
if [[ -z "$SINGLE_MODULE" && -f "$REPO_ROOT/terraform/main.tf" ]]; then
  ROOT_MODULES+=("$REPO_ROOT/terraform/")
fi

if [[ ${#ROOT_MODULES[@]} -eq 0 ]]; then
  echo "No Terraform root modules found."
  exit 1
fi

# ── Colors (if terminal) ────────────────────

if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BOLD='' RESET=''
fi

# ── Run terraform plan per module ────────────

echo -e "${BOLD}AtlasIT Drift Detection${RESET}"
echo "========================================"
echo "Checking ${#ROOT_MODULES[@]} root module(s)..."
echo ""

SUMMARY=()

for module_dir in "${ROOT_MODULES[@]}"; do
  module_name="$(realpath --relative-to="$REPO_ROOT" "$module_dir")"
  echo -e "${CYAN}>> Module: ${module_name}${RESET}"

  # Init (suppress chatty output)
  if ! terraform -chdir="$module_dir" init -input=false -no-color -backend=false > /dev/null 2>&1; then
    echo -e "   ${YELLOW}Init: using -backend=false (no remote state configured)${RESET}"
  fi

  # Plan with detailed exit code
  set +e
  plan_output=$(terraform -chdir="$module_dir" plan -detailed-exitcode -input=false -no-color 2>&1)
  exit_code=$?
  set -e

  case $exit_code in
    0)
      echo -e "   ${GREEN}Status: No drift detected${RESET}"
      SUMMARY+=("${GREEN}OK${RESET}  $module_name")
      ;;
    1)
      echo -e "   ${RED}Status: Error during plan${RESET}"
      echo "   ---"
      echo "$plan_output" | tail -20 | sed 's/^/   /'
      echo "   ---"
      SUMMARY+=("${RED}ERR${RESET} $module_name")
      ERROR_FOUND=true
      ;;
    2)
      echo -e "   ${YELLOW}Status: DRIFT DETECTED${RESET}"
      # Extract resource changes from plan output
      echo "$plan_output" | grep -E '^\s*(#|~|\+|-)' | head -30 | sed 's/^/   /'
      SUMMARY+=("${YELLOW}DRIFT${RESET} $module_name")
      DRIFT_FOUND=true

      if [[ "$FIX_MODE" == true ]]; then
        echo ""
        echo -e "   ${BOLD}Full plan output:${RESET}"
        echo "$plan_output" | sed 's/^/   /'
        echo ""
        read -rp "   Apply changes to $module_name? [y/N] " answer
        if [[ "$answer" =~ ^[Yy] ]]; then
          echo -e "   ${CYAN}Applying...${RESET}"
          terraform -chdir="$module_dir" apply -auto-approve -input=false -no-color
          echo -e "   ${GREEN}Applied successfully${RESET}"
        else
          echo -e "   ${YELLOW}Skipped${RESET}"
        fi
      fi
      ;;
  esac
  echo ""
done

# ── Summary ──────────────────────────────────

echo "========================================"
echo -e "${BOLD}Summary${RESET}"
echo "----------------------------------------"
for line in "${SUMMARY[@]}"; do
  echo -e "  $line"
done
echo "----------------------------------------"

if [[ "$ERROR_FOUND" == true ]]; then
  echo -e "${RED}Errors occurred during drift detection.${RESET}"
  exit 1
elif [[ "$DRIFT_FOUND" == true ]]; then
  echo -e "${YELLOW}Infrastructure drift detected. Review changes above.${RESET}"
  exit 2
else
  echo -e "${GREEN}No drift detected across all modules.${RESET}"
  exit 0
fi
