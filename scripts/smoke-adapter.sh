#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACT_DIR="$ROOT_DIR/artifacts/pr4_adapter"
LOG_FILE="$ARTIFACT_DIR/smoke.log"
JUNIT_FILE="$ARTIFACT_DIR/junit.xml"
SBOM_FILE="$ARTIFACT_DIR/sbom.json"
RUN_FILE="$ARTIFACT_DIR/RUN.json"
ADAPTER_NAME="example-hr-suite"
ADAPTER_DIR="$ROOT_DIR/adapters/$ADAPTER_NAME"
SCHEMA_FILE="$ROOT_DIR/contracts/examples/example-openapi.json"
CONTRACT_FILE="$ROOT_DIR/contracts/examples/example-contract.json"

mkdir -p "$ARTIFACT_DIR"
rm -f "$LOG_FILE" "$JUNIT_FILE" "$SBOM_FILE" "$RUN_FILE"
rm -rf "$ADAPTER_DIR"

{
  echo "[$(date -Iseconds)] smoke:start"
  echo "[$(date -Iseconds)] building generator package"
  npm run build:adapter-gen > /dev/null

  echo "[$(date -Iseconds)] generating adapter scaffold"
  node "$ROOT_DIR/packages/adapter-gen/dist/cli.js" gen \
    --schema "$SCHEMA_FILE" \
    --name "Example HR Suite" \
    --out "$ROOT_DIR/adapters" \
    --force > /dev/null

  echo "[$(date -Iseconds)] compiling adapter"
  npx tsc -p "$ADAPTER_DIR/tsconfig.json" > /dev/null

  echo "[$(date -Iseconds)] building simulator package"
  npm run build:adapter-sim > /dev/null

  echo "[$(date -Iseconds)] running simulator"
  node "$ROOT_DIR/packages/adapter-sim/dist/cli.js" sim \
    --adapter "$ADAPTER_DIR" \
    --contract "$CONTRACT_FILE" \
    --junit "$JUNIT_FILE"

  echo "[$(date -Iseconds)] generating sbom"
  if command -v syft > /dev/null 2>&1; then
    syft "$ADAPTER_DIR" -o json > "$SBOM_FILE"
  else
    node - <<'NODE' "$ADAPTER_DIR" "$SBOM_FILE"
const fs = require('node:fs');
const path = require('node:path');
const adapterDir = process.argv[2];
const output = process.argv[3];
const pkg = JSON.parse(fs.readFileSync(path.join(adapterDir, 'package.json'), 'utf8'));
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      builder: 'fallback',
      name: pkg.name,
      version: pkg.version,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ) + '\n',
);
NODE
  fi

  echo "[$(date -Iseconds)] smoke:complete"
} | tee "$LOG_FILE"

node - <<'NODE' "$RUN_FILE" "$ADAPTER_DIR"
const fs = require('node:fs');
const path = require('node:path');
const runFile = process.argv[2];
const adapterDir = process.argv[3];
const manifestPath = path.join(adapterDir, 'atlasit.adapter.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const summary = {
  task: 'PR4 Adapter Generator smoke',
  completedAt: new Date().toISOString(),
  adapter: manifest.slug,
  featureFlag: manifest.featureFlag,
  artifacts: {
    log: 'artifacts/pr4_adapter/smoke.log',
    junit: 'artifacts/pr4_adapter/junit.xml',
    sbom: 'artifacts/pr4_adapter/sbom.json'
  }
};
fs.writeFileSync(runFile, JSON.stringify(summary, null, 2) + '\n');
NODE
