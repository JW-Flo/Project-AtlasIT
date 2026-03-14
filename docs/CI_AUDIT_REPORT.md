# CI Audit Report - AtlasIT Monorepo

**Date:** March 14, 2026
**Repository:** AtlasIT (Cloudflare Workers + Node/TypeScript monorepo)
**Scope:** GitHub Actions workflows, TypeScript configuration, package.json consistency

---

## Executive Summary

The CI/CD pipeline has **5 critical issues** that may cause PR #116's Cloudflare Workers Build failures:

1. **Dangerous git operations** in 5 workflows (`git revert`, `git push origin main`)
2. **Missing script references** in production deployment workflow
3. **Uninitialized workspace packages** (missing node_modules prevents type checking)
4. **Invalid placeholder values** in workflows (`<commit-hash>`, hardcoded URLs)
5. **Empty/stale workflow stubs** (5 disabled workflows cluttering CI)

---

## 1. Workflow Audit

### Active Workflows (Production/CI)

| Workflow | Triggers | Purpose | Status |
|----------|----------|---------|--------|
| **cloudflare-workers.yml** | push, PR, dispatch | Workers CI/build/deploy | ⚠️ CRITICAL |
| **deploy.yml** | push (main), PR, dispatch | Project Ignite CI/CD | ⚠️ CRITICAL |
| **ignite-deploy.yml** | dispatch only | Ignite deployment pipeline | ⚠️ CRITICAL |
| **deploy-orchestrator.yml** | dispatch | AI Orchestrator deploy | ✓ ACTIVE |
| **deploy-console.yml** | dispatch, workflow_dispatch | Console app deployment | ✓ ACTIVE |
| **deploy-connect.yml** | dispatch | Connect server deployment | ✓ ACTIVE |
| **build.yml** | tags (v*) | Docker multi-arch build | ✓ ACTIVE |
| **cloudflare-ai-worker.yml** | dispatch | AI Worker deployment | ✓ ACTIVE |
| **playwright-smoke.yml** | dispatch | E2E smoke tests | ✓ ACTIVE |
| **post-deploy-smoke.yml** | workflow_run | Post-deploy validation | ✓ ACTIVE |
| **eslint.yml** | push, PR | Linting checks | ✓ ACTIVE |
| **codacy.yml** | push, PR | Code quality (Codacy) | ✓ ACTIVE |
| **sonarqube.yml** | push, PR | SonarQube scanning | ✓ ACTIVE |
| **sonar.yml** | push, PR | SonarCloud analysis | ✓ ACTIVE |

### Stale/Disabled Workflows

| Workflow | Status | Reason |
|----------|--------|--------|
| **1password-automation-token-template.yml** | EMPTY (0 lines) | Template stub, never configured |
| **ci-with-1password-oidc.yml** | EMPTY (1 line) | Disabled, OIDC variant unused |
| **connect-health.yml** | EMPTY (1 line) | Stub, never implemented |
| **connect-token-health.yml** | EMPTY (1 line) | Stub, never implemented |
| **sync-secrets-from-connect.yml** | EMPTY (1 line) | Disabled, last commit removed content |
| **ci-use-1password-example.yml** | INACTIVE | Example only, not used |
| **ci-with-1password.yml** | INACTIVE | Legacy 1Password integration |
| **ci-with-1password-connect.yml** | INACTIVE | Legacy 1Password Connect |
| **ci-with-1password-automation.yml** | INACTIVE | Legacy 1Password Automation |

---

## 2. CRITICAL ISSUES FOUND

### 🔴 Issue #1: Dangerous Git Operations (5 workflows)

**Affected Workflows:**
- `cloudflare-workers.yml` (lines 107-112)
- `deploy.yml` (lines 108-112)
- `ignite-deploy.yml` (lines 42-46)
- `deploy-okta-ramp-sync.yml`
- `deploy-ramp-role-promoter.yml`

**Problem:**
```yaml
- name: Revert repository to desired state
  run: |
    git revert --no-commit <commit-hash>
    git commit -m "Revert to desired state"
    git push origin main  # ❌ Force-pushes to main!
```

**Risk:**
- **Force-pushes to main** (unprotected?)
- **Data loss**: Commits can be lost if branch protection is misconfigured
- **CI breaks main**: If deployment fails, main branch is corrupted
- **PR #116 failure**: These workflows might be running on PR and corrupting history

**Recommendation:**
- Remove all `git revert` and `git push origin main` from deployment workflows
- Use Cloudflare Rollback API instead (if needed)
- Replace with webhook notifications to Slack on failure
- Enforce branch protection: "Require status checks to pass before merging"

---

### 🔴 Issue #2: Missing Script References in ignite-deploy.yml

**Affected Workflow:** `ignite-deploy.yml` (lines 23-32)

**Problem:**
```yaml
- name: Ingest Jira → Okta
  run: scripts/ingest-jira.sh          # ❌ FILE NOT FOUND
- name: Lock down Okta roles
  run: scripts/lockdown-okta.sh        # ❌ FILE NOT FOUND
- name: Init BigQuery/Firestore schema
  run: scripts/init-schema.sh          # ❌ FILE NOT FOUND
```

**Verification:**
```bash
✓ scripts/smoke-test-ai-worker.sh        (exists)
✓ scripts/deploy-webui.sh                (exists)
✗ scripts/ingest-jira.sh                 (MISSING)
✗ scripts/lockdown-okta.sh               (MISSING)
✗ scripts/init-schema.sh                 (MISSING)
```

**Impact:**
- Workflow will fail at first missing script
- Blocking any Ignite deployments
- Prevents validation of deployment readiness

**Recommendation:**
- Either create the missing scripts or comment out those steps
- Add `|| true` if steps are optional (non-blocking)
- Document what each missing script should do

---

### 🟡 Issue #3: Invalid Placeholder Values

**Affected Workflows:** `deploy.yml`, `ignite-deploy.yml`

**Problem:**
```yaml
git checkout <commit-hash>    # ❌ Literal placeholder, not substituted
```

**Impact:**
- Script fails because `<commit-hash>` is not a valid git reference
- Indicates copy-paste from template without proper parameterization

**Recommendation:**
- Remove placeholder lines or replace with proper environment variable injection
- Use GitHub Context: `${{ github.sha }}` for current commit

---

### 🟡 Issue #4: TypeScript Build Validation Blocked

**Problem:**
- `npm install` not running in CI (no cached node_modules)
- `npm run typecheck` command exists but cannot execute without TypeScript installation
- Prevents validation of PR #116's TypeScript compilation

**Analysis:**
```
Root tsconfig.json: ✓ Valid
Workspace packages: ✓ All exist
  - packages/shared, packages/adapter-gen, packages/edge-utils, etc.

Paths mapping: ✓ Correct
  - @atlasit/shared → packages/shared/src
  - @atlasit/idp → packages/idp/src
  - @atlasit/edge-utils → packages/edge-utils/src
```

**Recommendation:**
- Add explicit `npm ci` (clean install) step in all build workflows
- Cache `.npm` directory to speed up installs
- Run `npm run typecheck` before deployment (catching TS errors early)

---

### 🟡 Issue #5: Cloudflare Secrets Configuration Inconsistency

**Finding:**
Workflows use both:
- `WRANGLER_API_TOKEN` + `CF_ACCOUNT_ID` (correct, modern wrangler)
- `CLOUDFLARE_API_TOKEN` (legacy, different permissions)

**Affected Workflows:**
- `cloudflare-workers.yml` line 66 (uses `CLOUDFLARE_API_TOKEN`)
- `deploy-orchestrator.yml` (uses `CF_API_TOKEN` - alias?)
- `deploy-console.yml` (uses `CF_API_TOKEN`)

**Recommendation:**
- Standardize on `WRANGLER_API_TOKEN` + `CF_ACCOUNT_ID` across all workflows
- Remove legacy `CLOUDFLARE_API_TOKEN` usage
- Verify secret names in GitHub Actions Secrets match documentation

---

## 3. Package.json & Workspace Validation

### Workspace Packages Listed (Root package.json)
```json
"workspaces": [
  "packages/*",           // 10 packages found ✓
  "onboarding",          // ✓ exists
  "ai-orchestrator",     // ✓ exists
  "mcp*",                // 4 MCPs found (mcp, mcp-idp, mcp-mobile, mcp-servers) ✓
  "documentation-worker", // ✓ exists
  "slack-approval-worker", // ✓ exists
  "console-app"          // ✓ exists
]
```

**Status:** ✓ All workspace packages exist

### Packages Found in `packages/` Directory
```
✓ packages/adapter-gen
✓ packages/adapter-sim
✓ packages/auth
✓ packages/edge-utils
✓ packages/idp
✓ packages/idp-adapters
✓ packages/idp-sim
✓ packages/jw-site (subtree from external repo)
✓ packages/research-engine
✓ packages/shared
```

**Status:** ✓ All packages have package.json (required)

---

## 4. TypeScript Configuration Analysis

### Root tsconfig.json Validation

**Compiler Options:** ✓ Strict mode enabled
```json
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"forceConsistentCasingInFileNames": true
```

**Path Mappings:** ✓ Valid
```json
"@atlasit/shared": ["./packages/shared/src"],
"@atlasit/idp": ["./packages/idp/src"],
"@atlasit/edge-utils": ["./packages/edge-utils/src"]
```

**Include Paths:** ⚠️ Some paths may not exist
```
✓ onboarding/src/**/*.ts
✓ ai-orchestrator/**/*.ts
✓ packages/*/src/**/*.ts
⚠️ ai-orchestrator/** (duplicates line above)
⚠️ shared/services/**/*.ts (unclear if exists)
```

**Status:** ⚠️ TypeScript setup appears valid, but `npm install` must run first

---

## 5. Build Script Validation

### Key Build Scripts
```bash
npm run build                    # Runs parallel build:* tasks
npm run build:shared            # packages/shared build
npm run build:orchestrator      # ai-orchestrator
npm run build:console           # console-app (Vite)
npm run typecheck               # tsc -p tsconfig.json --noEmit
```

**Issue:** Cannot validate without node_modules installed

---

## 6. Summary Table: Workflow Issues by Severity

| Severity | Count | Workflows | Resolution |
|----------|-------|-----------|-----------|
| 🔴 Critical | 5 | Dangerous git ops + missing scripts | **MUST FIX** |
| 🟡 Medium | 3 | Invalid placeholders, secrets inconsistency, no npm ci | **SHOULD FIX** |
| 🟢 Low | 5 | Stale/empty workflow stubs | **CLEANUP** |

---

## 7. Recommendations (Priority Order)

### Priority 1: Critical Fixes (Before Next Deployment)

1. **Remove all `git revert` and `git push origin main` from workflows**
   - Affects: cloudflare-workers.yml, deploy.yml, ignite-deploy.yml, deploy-okta-ramp-sync.yml, deploy-ramp-role-promoter.yml
   - Replace with: Slack notifications on failure, manual rollback instructions

2. **Fix missing script references in ignite-deploy.yml**
   - Either create scripts/ingest-jira.sh, scripts/lockdown-okta.sh, scripts/init-schema.sh
   - Or remove those steps with clear comments explaining why

3. **Add `npm ci` step to all workflows**
   - Ensures node_modules are populated
   - Required for TypeScript type checking to work

### Priority 2: Medium Fixes (Within 1 Sprint)

4. **Remove invalid `<commit-hash>` placeholders**
   - Use proper git references or environment variables
   - Clean up copy-paste template remnants

5. **Standardize Cloudflare secrets**
   - Use `WRANGLER_API_TOKEN` + `CF_ACCOUNT_ID` everywhere
   - Document in README.md

6. **Run `npm run typecheck` in CI**
   - Add to build workflow before deployment
   - Catches TypeScript errors early (prevents PR #116 issues)

### Priority 3: Cleanup (Next Sprint)

7. **Remove stale/empty workflow files**
   - Delete: 1password-automation-token-template.yml, ci-with-1password-oidc.yml, connect-health.yml, connect-token-health.yml, sync-secrets-from-connect.yml
   - Archive unused workflows to `docs/workflows-archived/`

8. **Consolidate 1Password workflows**
   - Keep one reference implementation
   - Remove ci-use-1password-example.yml, ci-with-1password*.yml variants

---

## 8. Appendix: Workflow Dependency Graph

```
build.yml (on: tags)
  └─ Docker multi-arch build → ghcr.io

cloudflare-workers.yml (on: push, PR, dispatch)
  ├─ npm install
  ├─ npm test
  ├─ npm run deploy
  ├─ AI Worker deployment
  ├─ Smoke tests
  └─ ❌ git revert (DANGEROUS)

deploy.yml (on: push main, PR, dispatch)
  ├─ Python + Node setup
  ├─ Docker image build
  └─ ❌ git revert (DANGEROUS)

ignite-deploy.yml (on: dispatch only)
  ├─ Terraform setup
  ├─ ❌ scripts/ingest-jira.sh (MISSING)
  ├─ ❌ scripts/lockdown-okta.sh (MISSING)
  ├─ ❌ scripts/init-schema.sh (MISSING)
  └─ ❌ git revert (DANGEROUS)

deploy-orchestrator.yml, deploy-console.yml, etc.
  └─ Wrangler deployments (using CF_API_TOKEN or WRANGLER_API_TOKEN)
```

---

## 9. References

- **Cloudflare Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **GitHub Actions Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **TypeScript strict mode:** https://www.typescriptlang.org/tsconfig#strict

---

**Report generated by:** CI Audit Agent
**Next review date:** After fixes are applied (within 1 week)
