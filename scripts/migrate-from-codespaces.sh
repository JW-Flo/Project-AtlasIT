#!/usr/bin/env bash
# Automate migration from GitHub Codespaces to a local development setup.
# Safe, idempotent, and optionally dry-run.
#
# Usage examples:
#   scripts/migrate-from-codespaces.sh --codespace twilight-river-a1b2
#   scripts/migrate-from-codespaces.sh --codespace twilight-river-a1b2 --patch custom.patch --branch migrate/2025-11-18
#   scripts/migrate-from-codespaces.sh --codespace twilight-river-a1b2 --dry-run
#
# Flags:
#   --codespace <name>        Codespace name (required unless CODESPACE_NAME env set)
#   --patch <file>            Patch filename exported from Codespaces (default: workspace-changes.patch)
#   --repo-url <url>          Override repository URL
#   --dir <path>              Target directory for clone (default: Project-AtlasIT)
#   --branch <name>           Create and checkout a new branch after clone
#   --skip-patch              Skip attempting to download/apply patch
#   --skip-deps               Skip dependency installation
#   --skip-tests              Skip test + typecheck steps
#   --python                  Also install Python deps from requirements.txt if available
#   --dry-run                 Show actions without performing mutating operations
#   --force                   Continue on non-critical failures
#   -h | --help               Show help
#
# Steps performed:
#   1. Pre-flight checks (prerequisites)
#   2. Clone repo if absent
#   3. Optional: retrieve patch via gh codespace cp
#   4. Apply patch with safety check
#   5. Optional: create branch
#   6. Install dependencies (Node workspaces; optional Python)
#   7. Run validation (typecheck + unit tests)
#   8. Output next-step guidance
#
set -euo pipefail

### CONFIG DEFAULTS ###
REPO_URL_DEFAULT="https://github.com/JW-Flo/Project-AtlasIT.git"
REPO_DIR_DEFAULT="Project-AtlasIT"
PATCH_DEFAULT="workspace-changes.patch"

### STATE VARS ###
CODESPACE="${CODESPACE_NAME:-}" # may be overridden by flag
PATCH_NAME="$PATCH_DEFAULT"
REPO_URL="$REPO_URL_DEFAULT"
REPO_DIR="$REPO_DIR_DEFAULT"
CREATE_BRANCH=""
DO_PATCH=1
DO_DEPS=1
DO_TESTS=1
DO_PYTHON=0
DRY_RUN=0
FORCE=0

### UTILITIES ###
color_enabled=0
if command -v tput >/dev/null 2>&1 && [[ -t 2 ]]; then
  if tput colors 2>/dev/null | grep -qE '^(8|16|256)$'; then
    color_enabled=1
  fi
fi
bold=""; green=""; yellow=""; red=""; reset=""
if [[ $color_enabled -eq 1 ]]; then
  bold="$(tput bold)"; green="$(tput setaf 2)"; yellow="$(tput setaf 3)"; red="$(tput setaf 1)"; reset="$(tput sgr0)"
fi

log() { printf '%s[migrate]%s %s\n' "$bold" "$reset" "$1" >&2; }
warn() { printf '%s[migrate][warn]%s %s\n' "$yellow" "$reset" "$1" >&2; }
err() { printf '%s[migrate][error]%s %s\n' "$red" "$reset" "$1" >&2; }

die() { err "$1"; exit 1; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

usage() {
  sed -n '1,60p' "$0" | grep -E '^# ' | sed 's/^# //'
}

### ARG PARSING ###
while [[ $# -gt 0 ]]; do
  case "$1" in
    --codespace) CODESPACE="$2"; shift 2;;
    --patch) PATCH_NAME="$2"; shift 2;;
    --repo-url) REPO_URL="$2"; shift 2;;
    --dir) REPO_DIR="$2"; shift 2;;
    --branch) CREATE_BRANCH="$2"; shift 2;;
    --skip-patch) DO_PATCH=0; shift;;
    --skip-deps) DO_DEPS=0; shift;;
    --skip-tests) DO_TESTS=0; shift;;
    --python) DO_PYTHON=1; shift;;
    --dry-run) DRY_RUN=1; shift;;
    --force) FORCE=1; shift;;
    -h|--help) usage; exit 0;;
    *)
      if [[ -z "$CODESPACE" ]]; then
        CODESPACE="$1"; shift
      else
        warn "Ignoring unexpected arg: $1"; shift
      fi
      ;;
  esac
done

[[ -z "$CODESPACE" ]] && die "Codespace name required (flag --codespace or positional)."

### PREFLIGHT ###
log "Pre-flight checks..."
missing=()
for bin in git gh npm; do
  command_exists "$bin" || missing+=("$bin")
done
if [[ ${#missing[@]} -gt 0 ]]; then
  msg="Missing required commands: ${missing[*]}"
  if [[ $FORCE -eq 1 ]]; then
    warn "$msg (continuing due to --force)"
  else
    die "$msg"
  fi
fi

if [[ $DO_PYTHON -eq 1 ]]; then
  command_exists python3 || warn "python3 not found; skipping Python dependency install." && DO_PYTHON=0
fi

[[ $DRY_RUN -eq 1 ]] && log "DRY RUN enabled – no mutations will occur."

if [[ -d .git ]]; then
  log "Detected existing git repository in current directory; will operate in-place."
  REPO_DIR="."
fi

log "Codespace: $CODESPACE | Repo URL: $REPO_URL | Directory: $REPO_DIR"
log "Patch: $PATCH_NAME | Patch enabled: $DO_PATCH | Branch: ${CREATE_BRANCH:-<none>}"

### STEP 1: Clone repository if needed ###
if [[ "$REPO_DIR" != "." ]]; then
  if [[ ! -d "$REPO_DIR/.git" ]]; then
    log "Cloning repository into $REPO_DIR"
    if [[ $DRY_RUN -eq 0 ]]; then
      git clone "$REPO_URL" "$REPO_DIR" || die "Clone failed"
    fi
  else
    log "Repository already present; skipping clone"
  fi
else
  log "Skipping clone (in-place operation)."
fi

### STEP 2: Retrieve patch from Codespace (optional) ###
if [[ $DO_PATCH -eq 1 ]]; then
  log "Attempting patch copy from codespace..."
  if [[ $DRY_RUN -eq 0 ]]; then
    if gh codespace cp "${CODESPACE}:/workspaces/Project-AtlasIT/${PATCH_NAME}" "$PATCH_NAME" 2>/dev/null; then
      log "Patch downloaded: $PATCH_NAME"
    else
      warn "Patch not found or copy failed; continuing."
    fi
  else
    log "(dry-run) Would execute: gh codespace cp ${CODESPACE}:.../${PATCH_NAME} ."
  fi
fi

cd "$REPO_DIR" || die "Could not enter repo directory"

### STEP 3: Apply patch if present ###
PATCH_PATH="../$PATCH_NAME"
[[ "$REPO_DIR" == "." ]] && PATCH_PATH="$PATCH_NAME"
if [[ $DO_PATCH -eq 1 && -f "$PATCH_PATH" ]]; then
  log "Applying patch (safety check) from $PATCH_PATH ..."
  if git apply --check "$PATCH_PATH" >/dev/null 2>&1; then
    if [[ $DRY_RUN -eq 0 ]]; then
      if git apply "$PATCH_PATH"; then
        log "Patch applied successfully."
      else
        warn "Patch apply failed unexpectedly."
      fi
    else
      log "(dry-run) Patch would be applied."
    fi
  else
    warn "Patch failed dry-run check; generating rejects (if attempted)."
    if [[ $DRY_RUN -eq 0 ]]; then
      if git apply --reject --whitespace=fix "$PATCH_PATH" 2>/dev/null; then
        warn "Partial patch applied; review *.rej files.";
      else
        warn "Reject application also failed; manual review required."
      fi
    fi
  fi
fi

### STEP 4: Create branch if requested ###
if [[ -n "$CREATE_BRANCH" ]]; then
  if git rev-parse --verify "$CREATE_BRANCH" >/dev/null 2>&1; then
    log "Branch $CREATE_BRANCH already exists; checking out."
    [[ $DRY_RUN -eq 0 ]] && git checkout "$CREATE_BRANCH"
  else
    log "Creating branch $CREATE_BRANCH"
    [[ $DRY_RUN -eq 0 ]] && git checkout -b "$CREATE_BRANCH"
  fi
fi

### STEP 5: Install dependencies ###
if [[ $DO_DEPS -eq 1 ]]; then
  if [[ -f package.json ]]; then
    if grep -q '"install:all"' package.json; then
      log "Installing Node workspace dependencies (install:all)"
      [[ $DRY_RUN -eq 0 ]] && npm run install:all || true
    else
      log "Installing Node dependencies (workspaces)"
      [[ $DRY_RUN -eq 0 ]] && npm install --workspaces --include-workspace-root || npm install || true
    fi
  else
    warn "package.json missing; skipping Node dependencies."
  fi
  if [[ $DO_PYTHON -eq 1 && -f requirements.txt ]]; then
    log "Installing Python dependencies from requirements.txt"
    [[ $DRY_RUN -eq 0 ]] && python3 -m pip install -r requirements.txt || warn "Python install failed"
  fi
else
  log "Dependency installation skipped (--skip-deps)."
fi

### STEP 6: Validation ###
if [[ $DO_TESTS -eq 1 ]]; then
  log "Running typecheck (non-blocking)"
  if [[ $DRY_RUN -eq 0 ]]; then
    npm run typecheck || warn "Typecheck failed (review later)."
  fi
  log "Running unit tests (non-blocking: test:unit)"
  if [[ $DRY_RUN -eq 0 ]]; then
    npm run test:unit || warn "Unit tests failed (review later)."
  fi
else
  log "Tests skipped (--skip-tests)."
fi

### STEP 7: Summary / Next steps ###
log "Migration complete.";
echo "---" >&2
echo "NEXT STEPS:" >&2
if [[ "$REPO_DIR" == "." ]]; then
  echo "  # Already inside repository root" >&2
else
  echo "  cd $REPO_DIR" >&2
fi
[[ -n "$CREATE_BRANCH" ]] && echo "  git add -A && git commit -m 'migrate: apply patch' && git push -u origin $CREATE_BRANCH" >&2 || echo "  git add -A && git commit -m 'migrate: initial local import'" >&2
echo "  wrangler secret put <KEY> --env core  # reseed secrets" >&2
echo "  npm run dev:core                      # start core workers" >&2
echo "  npm run validate:env && npm run typecheck" >&2
echo "  npm test                               # full test suite" >&2
echo "---" >&2
log "Finished at $(date -u '+%Y-%m-%dT%H:%M:%SZ')";
