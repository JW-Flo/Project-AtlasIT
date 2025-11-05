# AtlasIT Operations Runbook

## CI/CD Pipeline (PR-CI-001)

### Overview

This section documents the GitHub Actions CI/CD pipeline for automated build, test, security scanning, and evidence generation.

### Pipeline Components

#### 1. CI Workflow (`.github/workflows/ci.yml`)

Triggers on:

- Pull requests to any branch
- Pushes to `main` branch

**Jobs:**

- **build-test-sbom**: Builds code, runs tests, generates SBOM, scans for vulnerabilities, and creates evidence artifacts
- **codeql**: Performs CodeQL security analysis for JavaScript/TypeScript

**Steps:**

1. Checkout code
2. Setup Node.js 20 with npm caching
3. Install dependencies
4. Validate environment variables
5. Run linter
6. Build shared packages and run unit tests
7. Generate SBOM (Software Bill of Materials)
8. Run Trivy vulnerability scanner
9. Upload security results to GitHub Security tab
10. Generate evidence artifacts (SHA-256 hashes, timestamps)
11. Upload artifacts to GitHub Actions
12. (Main branch only) Upload evidence to R2 bucket

#### 2. Security Workflow (`.github/workflows/security.yml`)

Triggers on:

- Pull requests
- Pushes to `main` branch
- Nightly schedule (2 AM UTC)
- Manual workflow dispatch

**Jobs:**

- **lint-and-scan**: Runs linting, secret scanning, npm audit, and Trivy dependency scanning

### COMMAND PLAN

#### Local CI Execution

```bash
# 1. Install dependencies
npm install

# 2. Validate environment
npm run validate:env

# 3. Run linter
npm run lint

# 4. Build and test with SBOM generation
npm run ci:run

# 5. Generate evidence artifacts
npm run evidence:emit

# 6. View generated artifacts
ls -la artifacts/ci/
ls -la artifacts/evidence/
cat artifacts/evidence/EV-ci-run.json
```

#### Verify CI Pipeline

```bash
# Trigger CI workflow manually (requires GitHub CLI)
gh workflow run ci.yml

# View workflow runs
gh run list --workflow=ci.yml

# View workflow logs
gh run view <run-id> --log
```

### TEST PLAN

#### Pre-Deployment Validation

1. **Lint Check**

   ```bash
   npm run lint
   # Expected: No linting errors
   ```

2. **Unit Tests**

   ```bash
   npm run test:unit
   # Expected: All tests pass
   ```

3. **Environment Validation**

   ```bash
   npm run validate:env
   # Expected: All required env vars present or have defaults
   ```

4. **CI Run (Full)**

   ```bash
   npm run ci:run
   # Expected: Build succeeds, tests pass, SBOM generated
   ```

5. **Evidence Generation**

   ```bash
   npm run evidence:emit
   # Expected: EV-ci-run.json created with SHA-256 hashes
   ```

6. **Artifact Verification**

   ```bash
   # Check SBOM
   test -f artifacts/ci/sbom.json && echo "SBOM: OK" || echo "SBOM: MISSING"

   # Check evidence
   test -f artifacts/evidence/EV-ci-run.json && echo "Evidence: OK" || echo "Evidence: MISSING"

   # Verify evidence structure
   cat artifacts/evidence/EV-ci-run.json | jq '.evidenceHash' && echo "Evidence hash: OK"
   ```

#### GitHub Actions Validation

1. **Verify workflow files exist**

   ```bash
   test -f .github/workflows/ci.yml && echo "CI workflow: OK"
   test -f .github/workflows/security.yml && echo "Security workflow: OK"
   ```

2. **Validate workflow syntax**

   ```bash
   # Using act (GitHub Actions local runner) if installed
   act --list
   ```

3. **Push to PR and verify**
   - Create/update PR
   - Verify CI workflow triggers automatically
   - Check that CodeQL job runs
   - Verify Trivy scans complete
   - Confirm artifacts are uploaded

4. **Verify Security Tab**
   - Navigate to repository Security tab
   - Confirm CodeQL alerts appear (if any)
   - Confirm Trivy vulnerability results appear

#### Acceptance Criteria

- ✅ CI workflow triggers on PR and main push
- ✅ Security workflow triggers on PR, push, and nightly schedule
- ✅ Build, test, and lint steps complete successfully
- ✅ SBOM generation produces `artifacts/ci/sbom.json`
- ✅ Evidence generation produces `artifacts/evidence/EV-ci-run.json` with SHA-256 hashes
- ✅ CodeQL analysis runs and uploads results
- ✅ Trivy vulnerability scanning runs and uploads results
- ✅ Artifacts uploaded to GitHub Actions
- ✅ No static secrets in workflows (using OIDC tokens)
- ✅ Security results visible in GitHub Security tab

### Evidence Artifact Schema

The `EV-ci-run.json` file contains:

```json
{
  "version": "1.0.0",
  "type": "ci-run-evidence",
  "generatedAt": "ISO-8601 timestamp",
  "ci": {
    "runId": "GitHub Actions run ID",
    "sha": "Git commit SHA",
    "ref": "Git ref (branch/tag)",
    "actor": "GitHub actor who triggered run",
    "repository": "Repository name"
  },
  "artifacts": [
    {
      "name": "artifact filename",
      "path": "relative path",
      "sha256": "SHA-256 hash",
      "timestamp": "ISO-8601 timestamp"
    }
  ],
  "checksums": {
    "sbom": "SHA-256 of sbom.json",
    "buildLog": "SHA-256 of build.log",
    "testLog": "SHA-256 of test.log"
  },
  "metadata": {
    "nodeVersion": "Node.js version",
    "platform": "OS platform",
    "arch": "CPU architecture"
  },
  "evidenceHash": "SHA-256 hash of entire evidence record"
}
```

### Vault OIDC Integration

**Current Implementation:**

- GitHub Actions provides built-in OIDC tokens via `id-token: write` permission
- No static secrets stored in repository
- OIDC tokens used for authenticating to external services (when configured)

**Future R2 Upload:**
To enable R2 evidence upload:

1. Configure Cloudflare API token with R2 access
2. Store token as GitHub secret: `CLOUDFLARE_R2_TOKEN`
3. Update workflow to use Wrangler CLI for R2 upload
4. Or use OIDC federation with Cloudflare Workers

---

## MVP Deploy Runbook

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
