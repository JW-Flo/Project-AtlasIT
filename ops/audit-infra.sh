#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="ops/snapshots"
mkdir -p "$OUT_DIR/d1" "$OUT_DIR/r2" "$OUT_DIR/kv"

log() { echo "[audit] $*" >&2; }

log "Snapshot D1 list"
npx --yes wrangler d1 list > "$OUT_DIR/d1/_d1_list.txt" || true

log "Sample KV namespaces (full list due to CLI)"
# Provide array of namespace IDs with labels
KV_TARGETS=(
  "IGNITE_KV:dabed08a24714d9cb66eee0a1fa97b22"
  "MCP_STORE:c7eba0c892bf4f2fbcf73fb60a38706c"
  "UNIFIED_DATA_CACHE:7838e32d8ad04855b13eb2d9aa4f9811"
  "ignite-docs:88514b613c2e4721a358352752580d65"
  "ATLAS_FLAGS:53a4e79cc3ff488c940e25d307cbb084"
)
for entry in "${KV_TARGETS[@]}"; do
  label="${entry%%:*}"; id="${entry##*:}"
  log "Listing KV $label ($id)"
  npx --yes wrangler kv key list --namespace-id "$id" > "$OUT_DIR/kv/${label}_keys.json" || true
  size=$(wc -l < "$OUT_DIR/kv/${label}_keys.json" | xargs)
  log "KV $label key count (lines): $size"

done

log "R2 inventory (wrangler CLI lacks list; placeholder for future API call or S3 API)"
cat > "$OUT_DIR/r2/README.txt" <<'EON'
Cloudflare wrangler (current version) does not expose an r2 object list command in this environment build.
To audit objects:
- Use Cloudflare Dashboard R2 browser, or
- Use s3-compatible tooling if access keys are configured (mc, aws s3 ls) once credentials bound.
Placeholder created to keep structure consistent.
EON

log "Done"
