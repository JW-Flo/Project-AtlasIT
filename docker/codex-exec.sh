#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <repo-root> [prId] [agentId]" >&2
  exit 1
fi

REPO_ROOT="$1"
shift || true

if [[ ! -d "$REPO_ROOT" ]]; then
  echo "[codex] repo root '$REPO_ROOT' not found" >&2
  exit 1
fi

if [[ $# -ge 1 && -n "${1:-}" ]]; then
  export CODEX_PR_ID="$1"
  shift || true
fi

if [[ $# -ge 1 && -n "${1:-}" ]]; then
  export CODEX_AGENT_ID="$1"
  shift || true
fi

export CODEX_REPO_ROOT="$REPO_ROOT"
CONFIG_PATH="$REPO_ROOT/codex-work.json"

readarray -t PROTECTED_GLOBS < <(
  NODE_CONFIG_PATH="$CONFIG_PATH" node <<'NODE'
const fs = require('fs');
const configPath = process.env.NODE_CONFIG_PATH;
if (!configPath || !fs.existsSync(configPath)) {
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const globs = Object.values(data.protected || {}).flat().filter(Boolean);
for (const glob of globs) {
  console.log(glob);
}
NODE
) || true

check_protected_changes() {
  if [[ ! -f "$CONFIG_PATH" || ${#PROTECTED_GLOBS[@]} -eq 0 ]]; then
    return 0
  fi

  local glob_payload=""
  if [[ ${#PROTECTED_GLOBS[@]} -gt 0 ]]; then
    glob_payload=$(printf '%s\n' "${PROTECTED_GLOBS[@]}")
  fi

  NODE_REPO_ROOT="$REPO_ROOT" NODE_PROTECTED_GLOBS="$glob_payload" node <<'NODE'
const { execSync } = require('child_process');
const repoRoot = process.env.NODE_REPO_ROOT;
const globs = (process.env.NODE_PROTECTED_GLOBS || '').split(/\n/).filter(Boolean);
if (!globs.length) {
  process.exit(0);
}

let statusOutput = '';
try {
  statusOutput = execSync('git status --porcelain', { cwd: repoRoot, encoding: 'utf8' });
} catch (err) {
  console.error('[codex] failed to read git status:', err.message);
  process.exit(1);
}

const lines = statusOutput.split(/\n+/).map(line => line.trim()).filter(Boolean);
if (!lines.length) {
  process.exit(0);
}

const files = [];
for (const line of lines) {
  if (!line) continue;
  if (line.startsWith('?? ')) {
    files.push(line.slice(3).trim());
  } else if (line.includes(' -> ')) {
    const target = line.split(' -> ').pop();
    if (target) files.push(target.trim());
  } else if (line.length > 3) {
    files.push(line.slice(3).trim());
  }
}

if (!files.length) {
  process.exit(0);
}

let Minimatch;
try {
  Minimatch = require('minimatch').Minimatch;
} catch (err) {
  console.error('[codex] minimatch dependency missing:', err.message);
  process.exit(1);
}

const matchers = globs.map(glob => new Minimatch(glob, { dot: true, nocase: false, nocomment: true, noext: false }));
const violations = [];

for (const file of files) {
  for (const matcher of matchers) {
    if (matcher.match(file)) {
      violations.push({ file, glob: matcher.pattern });
      break;
    }
  }
}

if (violations.length) {
  console.error('\n[codex] write attempt detected in protected areas');
  for (const { file, glob } of violations) {
    console.error(`  - ${file} (matched ${glob})`);
  }
  console.error('\nUpdate codex-work.json if this change is intentional.');
  process.exit(42);
}
NODE
}

if [[ ${#PROTECTED_GLOBS[@]} -gt 0 ]]; then
  echo "[codex] enforcing protected paths from codex-work.json"
  for glob in "${PROTECTED_GLOBS[@]}"; do
    echo "  - $glob"
  done
else
  echo "[codex] no protected globs detected"
fi

check_protected_changes
trap check_protected_changes EXIT
trap 'check_protected_changes' ERR

cd "$REPO_ROOT"

echo "[codex] git status --porcelain"
git status --porcelain

echo "[codex] no task dispatcher configured; exiting"
