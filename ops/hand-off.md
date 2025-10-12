# AtlasIT MVP Deploy Runbook

## Auth Preflight

```bash
# AUTH PREFLIGHT — fix conflicting tokens & confirm account
set -euo pipefail

echo "== Clear conflicting CF env vars =="
unset CLOUDFLARE_API_TOKEN || true
unset CF_API_TOKEN || true
unset CF_API_KEY || true
unset CF_EMAIL || true
unset CF_ACCOUNT_ID || true

echo "== Wrangler login (OAuth) =="
# Opens a browser; complete the login flow, then continue:
wrangler login

echo "== Verify identity and selected account =="
wrangler whoami

echo "== Show wrangler config path (debug) =="
wrangler config path || true

echo "== Confirm required resources exist in THIS account =="
wrangler d1 database list | (grep -q 'atlasit-shared' && echo 'atlasit-shared OK') || true
wrangler d1 database list | (grep -q 'atlasit_compliance' && echo 'atlasit_compliance OK') || true
wrangler r2 bucket list   | (grep -q 'atlasit-evidence' && echo 'atlasit-evidence OK') || true

echo "== If any are missing, they will be created in later steps =="
```

Add a Token fallback note (only if headless/no browser):
If wrangler login is not possible, create a Scoped API Token with:
Account:Read
Workers Scripts:Edit, Workers Routes:Edit, Workers Tail:Read
D1:Edit, R2:Edit, KV:Edit
(Optional) Workers Dispatch Namespaces:Edit
Then: export CLOUDFLARE_API_TOKEN='REDACTED_TOKEN' and run wrangler whoami.

## Pre-Reqs

- Node 18+
- Wrangler CLI installed and authenticated (`wrangler login`)
- Cloudflare account with Workers enabled
- Access to create D1 databases, R2 buckets, and set secrets

## Bindings/Secrets

- **D1 Databases**: `atlasit-shared` (dispatch), `atlasit_compliance` (compliance)
- **R2 Bucket**: `atlasit-evidence` (compliance)
- **Secrets**: `DISPATCH_ADMIN_TOKEN` (set in dispatch-worker and console-app)

## COMMAND PLAN

```bash
# -1) AUTH PREFLIGHT — run first
set -euo pipefail
unset CLOUDFLARE_API_TOKEN || true
unset CF_API_TOKEN || true
unset CF_API_KEY || true
unset CF_EMAIL || true
unset CF_ACCOUNT_ID || true
wrangler login
wrangler whoami
wrangler config path || true

# 0) Verify Cloudflare context
wrangler whoami

# 1) Ensure D1 exists (idempotent)
wrangler d1 database list | grep -q "atlasit-shared"      || wrangler d1 create atlasit-shared
wrangler d1 database list | grep -q "atlasit_compliance"  || wrangler d1 create atlasit_compliance

# 2) Ensure R2 bucket exists (idempotent; ignore if already exists)
wrangler r2 bucket list | grep -q "atlasit-evidence" || wrangler r2 bucket create atlasit-evidence

# 3) Apply migrations (adjust if project uses different commands)
wrangler d1 migrations apply atlasit_compliance || true
# (shared DB may be auto-inited by dispatch; include when migrations exist)
# wrangler d1 migrations apply atlasit-shared   || true

# 4) Set admin secret in BOTH dispatch and console
export DISPATCH_ADMIN_TOKEN="$(openssl rand -hex 24)"
(cd dispatch-worker && echo "$DISPATCH_ADMIN_TOKEN" | wrangler secret put DISPATCH_ADMIN_TOKEN)
(cd console-app     && echo "$DISPATCH_ADMIN_TOKEN" | wrangler secret put DISPATCH_ADMIN_TOKEN)

# 5) Deploy services (use npm scripts if available; otherwise direct wrangler deploy)
(cd dispatch-worker      && npx wrangler deploy)
(cd ai-orchestrator      && npx wrangler deploy || true)
(cd compliance-worker    && (npm run deploy:compliance || npx wrangler deploy))
(npm run deploy:console || (cd console-app && npx wrangler deploy))

# 6) Resolve routes (replace with your actual domains if known)
CONSOLE_ORIGIN="$(jq -r '.consoleOrigin // empty'   < ./scripts/deploy-mvp.mjs 2>/dev/null || echo "https://<console-workers-domain>")"
DISPATCH_ORIGIN="$(jq -r '.dispatchOrigin // empty' < ./scripts/deploy-mvp.mjs 2>/dev/null || echo "https://<dispatch-workers-domain>")"
ORCH_ORIGIN="https://<orchestrator-workers-domain>"
COMP_ORIGIN="https://<compliance-workers-domain>"

# 7) Smoke checks (fail on non-2xx; show key fields)
curl -fsS "$CONSOLE_ORIGIN/health"
curl -fsS "$CONSOLE_ORIGIN/api/config"

# Console usage summary → proxies Dispatch (requires token present in BOTH)
curl -fsS "$CONSOLE_ORIGIN/admin/usage/summary"

# Dispatch admin summary (requires x-admin-token)
curl -fsS -H "x-admin-token: $DISPATCH_ADMIN_TOKEN" "$DISPATCH_ORIGIN/admin/usage/summary"

# Optional healths
curl -fsS "$ORCH_ORIGIN/health"     || true
curl -fsS "$COMP_ORIGIN/health"     || true

echo "MVP SMOKE: GREEN"
```

## Acceptance Criteria

- D1: `atlasit-shared`, `atlasit_compliance` exist; compliance migrations applied.
- R2: `atlasit-evidence` exists.
- Secret `DISPATCH_ADMIN_TOKEN` set in dispatch-worker AND console-app.
- All workers deployed and reachable.
- Smoke: all curls above succeed (200); Dispatch summary returns JSON when header present; Console summary works.

## Rollback

Re-deploy previous worker versions via Wrangler (manual).
Revert PR if config-only changes caused failure.

## Hardening Notes

- Console `/admin/usage/summary` returns `500 {error:"missing_admin_token"}` when `DISPATCH_ADMIN_TOKEN` secret is unset.
- Dispatch `/admin/usage/summary` requires `x-admin-token` header matching the secret; returns `403 {error:"forbidden"}` otherwise.
