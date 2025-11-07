# Agent Operations Runbook

## Overview

This runbook provides operational guidelines for agents (Copilot, Codegen, Cursor) working on AtlasIT issues, including credential management, CI/CD workflows, and Linear conventions.

## Table of Contents

1. [Ticket Intake](#1-ticket-intake)
2. [Planning Discipline (Copilot)](#2-planning-discipline-copilot)
3. [Execution (Codegen/Cursor)](#3-execution-codegenCursor)
4. [PR & CI Etiquette (GitHub Copilot)](#4-pr--ci-etiquette-github-copilot)
5. [Linear Conventions](#5-linear-conventions)
6. [Security & Compliance Guardrails](#6-security--compliance-guardrails)
7. [Runbooks to Keep Current](#7-runbooks-to-keep-current)
8. [Credential Management Across Environments](#credential-management-across-environments)
   - [Environment Types](#environment-types)
   - [Required Credentials](#required-credentials)
   - [Credential Sync Process](#credential-sync-process)
   - [Validation](#validation)
   - [Credential Generation](#credential-generation)
   - [Security Best Practices](#security-best-practices)
   - [Troubleshooting](#troubleshooting)
   - [Related Documentation](#related-documentation)
9. [Evidence Artifacts](#evidence-artifacts)
10. [Rollback](#rollback)

## 1. Ticket Intake

- If an issue is ambiguous, propose an "Issue Plan" comment with Objective, AC, Evidence, Tests, and Risks. Proceed when a human or Copilot acknowledges with ✅.

## 2. Planning Discipline (Copilot)

- Split work so each PR is < ~300 LOC changed where possible.
- Add a `### COMMAND PLAN` section in the PR description the executors can follow.
- Mark specific steps as **READY**; executors must only perform READY steps.

## 3. Execution (Codegen/Cursor)

- Implement only READY items. Create or extend tests first.
- Wire **evidence emission** (hash + URI) where behavior is validated.
- If a schema/OPA/policy is touched, add/update its test and documentation in the same PR.
- Never commit credentials. Fetch via Vault/OIDC at runtime or in CI.

## 4. PR & CI Etiquette (GitHub Copilot)

- Ensure CI includes: lint → unit → security scan (CodeQL/Trivy) → e2e (if present).
- Block merge if schemas or OPA tests weren't updated alongside behavior changes.
- Post PR checklists and nudge for missing artifacts or runbook updates.

## 5. Linear Conventions

- Titles: `[{module}] short action phrase` (e.g., `[cdt] add OFFBOARDING_DEPROVISION_24H control`).
- Labels: `module:*`, `risk:*` (`low|med|high`), `security`, `needs-decision`, `blocked`.
- Each issue must declare its **Evidence** (filenames/paths) and **Owner/DRI**.
- Move issues only after PR links are attached and summary comment is posted.

## 6. Security & Compliance Guardrails

- Enforce SoD: the same agent that writes a feature should not self-approve merging when policy files changed.
- Emit structured logs for any side-effecting action (`trace_id`, `tenant_id`, `subject_id`).
- Prefer deterministic runners and idempotent steps; use circuit breakers and jittered retries for external calls.

## 7. Runbooks to Keep Current

- **Webhook backlog recovery**, **DO migration**, **Idempotency conflicts**, and **Edge failover**. When a PR affects any of these, update the corresponding runbook section before merge.

## Credential Management Across Environments

### Environment Types

1. **Local Development** - Developer workstations using `.env` or 1Password CLI
2. **CI/CD (GitHub Actions)** - Automated builds and tests using dummy or real secrets
3. **Staging/Production (Cloudflare)** - Live deployments using wrangler secrets

### Required Credentials

#### Core Cloudflare Platform

| Variable             | Purpose                        | CI Value                      | Production Source               |
| -------------------- | ------------------------------ | ----------------------------- | ------------------------------- |
| CF_ACCOUNT_ID        | Cloudflare account identifier  | dummy-cf-account-id-ci        | GitHub Secrets or wrangler.toml |
| CLOUDFLARE_API_TOKEN | API authentication (preferred) | dummy-cloudflare-api-token-ci | GitHub Secrets                  |
| CF_API_TOKEN         | Legacy API token (fallback)    | dummy-cloudflare-api-token-ci | GitHub Secrets                  |
| D1_DATABASE          | D1 database binding name       | ATLAS_ONBOARDING_DB           | wrangler.toml bindings          |
| KV_NAMESPACE         | KV namespace binding name      | atlasit_kv                    | wrangler.toml bindings          |
| R2_BUCKET            | R2 bucket name                 | atlasit-evidence              | wrangler.toml bindings          |

#### Service API Keys

| Variable             | Purpose                   | CI Value              | Production Source |
| -------------------- | ------------------------- | --------------------- | ----------------- |
| ONBOARDING_API_KEY   | Onboarding service auth   | dummy-onboarding-ci   | wrangler secrets  |
| ORCHESTRATOR_API_KEY | Orchestrator service auth | dummy-orchestrator-ci | wrangler secrets  |

### Credential Sync Process

#### 1. Local Development Setup

```bash
# Copy environment template
cp .env.example .env

# Option A: Manual editing (for non-sensitive defaults)
vi .env

# Option B: Use 1Password CLI (recommended for real secrets)
op run --env-file=.env -- npm run dev
```

See `ops/secrets/README.md` for detailed 1Password integration.

#### 2. CI/CD Configuration

All CI workflows should include dummy credentials for validation:

```yaml
env:
  # Cloudflare platform credentials (dummy values for CI validation)
  CF_ACCOUNT_ID: dummy-cf-account-id-ci
  CLOUDFLARE_API_TOKEN: dummy-cloudflare-api-token-ci
  D1_DATABASE: ATLAS_ONBOARDING_DB
  KV_NAMESPACE: atlasit_kv
  R2_BUCKET: atlasit-evidence
  # Service API keys (dummy values for CI validation)
  ONBOARDING_API_KEY: dummy-onboarding-ci
  ORCHESTRATOR_API_KEY: dummy-orchestrator-ci
```

For deployment workflows that need real credentials, use GitHub Secrets:

```yaml
env:
  CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### 3. Production Deployment

Real credentials must be set using wrangler commands:

```bash
# Set service API keys
cd onboarding
wrangler secret put ONBOARDING_API_KEY
wrangler secret put API_ALLOWED_KEYS

cd ../ai-orchestrator
wrangler secret put ORCHESTRATOR_API_KEY
wrangler secret put API_ALLOWED_KEYS
wrangler secret put ONBOARDING_API_KEY  # for cross-service calls
```

Platform credentials (CF_ACCOUNT_ID, token) and bindings (D1, KV, R2) are configured in `wrangler.toml`.

### Validation

Before any commit or deploy:

```bash
# Validate all required environment variables are present
npm run validate:env
```

This script checks for:

- Core Cloudflare platform credentials
- Service API keys
- Optional features (e.g., Okta when FEATURE_IDP_OKTA=true)

### Credential Generation

Generate secure API keys:

```bash
# Generate 24-byte hex keys for service authentication
openssl rand -hex 24  # Use for ONBOARDING_API_KEY
openssl rand -hex 24  # Use for ORCHESTRATOR_API_KEY
```

**Security Notes:**

- Store generated keys immediately in 1Password or GitHub Secrets - never save to disk or commit
- Clear terminal history after generation: `history -d $((HISTCMD-1))`
- Use environment-specific keys (dev/staging/prod) - never reuse across environments
- Pipe directly to clipboard if available: `openssl rand -hex 24 | pbcopy` (macOS) or `| xclip` (Linux)

### Security Best Practices

1. **Never commit real secrets** - Use `.env` (gitignored) or 1Password
2. **Use dummy values in CI** - For validation-only workflows
3. **Use GitHub Secrets for deployments** - Protected and encrypted
4. **Rotate regularly** - Follow schedule in `ops/DEPLOYMENT_SECRETS_CHECKLIST.md`
5. **Principle of least privilege** - Scope tokens to minimum required permissions
6. **Audit access** - Review who has access to secrets quarterly

### Troubleshooting

| Issue                            | Cause                        | Solution                                    |
| -------------------------------- | ---------------------------- | ------------------------------------------- |
| CI validation fails              | Missing env vars in workflow | Add dummy values to workflow `env:` section |
| Deployment fails with auth error | Missing or expired secrets   | Regenerate and update GitHub Secrets        |
| Local dev can't access services  | Missing .env file            | Copy from .env.example and populate         |
| Wrangler deploy fails            | Bindings misconfigured       | Check wrangler.toml matches env var names   |

### Related Documentation

- `.env.example` - Environment variable template
- `ops/secrets/README.md` - 1Password CLI integration
- `ops/DEPLOYMENT_SECRETS_CHECKLIST.md` - Complete secret inventory
- `DEPLOY_ENV.md` - Deployment environment reference
- `scripts/validate-env.mjs` - Validation script implementation

## Evidence Artifacts

When syncing credentials:

- Document in `artifacts/credential-sync/sync-{timestamp}.json`
- Include: environments updated, credentials rotated, validation passed
- Hash and store in R2 for audit trail

## Rollback

If credential changes break deployments:

1. Revert to previous working values in GitHub Secrets
2. Re-run failed deployments
3. Document incident in `artifacts/incidents/`
4. Update this runbook with lessons learned
