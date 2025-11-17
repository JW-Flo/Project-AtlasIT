# Using 1Password in GitHub Actions (safe patterns)

This short guide explains how this repository prefers integrating 1Password secrets into CI workflows and provides a minimal example that uses the 1Password CLI (`op`) in a GitHub Actions job. The repo already includes local helper scripts and an `op-map.json` mapping in `ops/secrets/`.

Two main approaches

1. OIDC + 1Password Connect (recommended for ephemeral access)
   - Configure GitHub OIDC provider and 1Password Connect so workflows can request short-lived tokens without storing long-lived credentials in GitHub.
   - Advantage: no long-lived tokens in GitHub secrets; better audit trail.
   - Disadvantage: requires 1Password Connect deployment and some infra setup.
2. 1Password CLI with stored automation token (cost-free bootstrap)

- Store a 1Password automation/service token in GitHub Actions secrets (e.g., `OP_SERVICE_ACCOUNT_TOKEN` or `OP_AUTOMATION_TOKEN`).
- Advantage: minimal infra & zero hosting cost; good for small team or early phase.
- Disadvantage: long-lived token risk; MUST scope vault access tightly and rotate periodically.
- Transition path: migrate to Connect + OIDC once infra exists for short-lived tokens.

Example: minimal workflow using 1Password CLI (op) in a job

```yaml
name: ci-with-1password
on: [workflow_dispatch]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Install the 1Password CLI
      - name: Install 1Password CLI
        run: |
          sudo apt-get update && sudo apt-get install -y unzip
          curl -sS https://cache.agilebits.com/dist/1P/op2/pkg/v2.14.0/op_linux_amd64_v2.14.0.zip -o /tmp/op.zip
          unzip /tmp/op.zip -d /tmp/op && sudo mv /tmp/op/op /usr/local/bin/op

      # Authenticate using an automation token stored in GitHub Secrets
      - name: Sign in to 1Password (automation token)
        env:
          OP_AUTOMATION_TOKEN: ${{ secrets.OP_AUTOMATION_TOKEN }}
        run: |
          # This example assumes the token can be used with `op signin --raw` in your environment.
          eval "$(echo $OP_AUTOMATION_TOKEN)"
          # Alternatively use op account and op signin as appropriate for your Connect setup.

      - name: Read mapped secrets
        run: |
          chmod +x ops/secrets/op-inject.sh
          source ops/secrets/op-inject.sh

      - name: Use secret
        run: |
          echo "CF_ACCOUNT_ID=${CF_ACCOUNT_ID}" # safe for demo; do not echo real secrets
```

Security notes and repo conventions

- The repository uses `ops/secrets/op-map.json` to map env names to `op://` lookup paths. Prefer this approach for maintainability.
- Prefer ephemeral OIDC + 1Password Connect where possible (no persistent GitHub secret).
- Do not commit plaintext secrets. Rotate automation tokens if they are used.
- The helper `ops/secrets/op-inject.sh` is intended for local/dev usage; CI workflows may prefer `op run` or `op item get` directly.

Next steps

1. Autonomous workflow already provided: `.github/workflows/ci-with-1password-automation.yml` uses `OP_AUTOMATION_TOKEN` + `ci/load-automation-secrets.sh` mapping script.
2. (Optional) Add Connect-based workflow when infra is ready: `.github/workflows/ci-with-1password-connect.yml` (template present if added in branch).
3. (Optional) Add reusable validation workflow to dry-run secret mappings before live fetching.

Connect + OIDC (optional, future hardening)

- Short-lived token flow: GitHub Actions issues OIDC identity token -> exchange service / Connect gateway returns a temporary 1Password session -> workflow fetches secrets -> token expires quickly.
- Benefits: no persistent long-lived token in GitHub, stronger audit, easier revocation.
- Migration: keep automation token until exchange endpoint + Connect host deployed, then rotate & remove.

Token rotation quick runbook (automation token pattern)

1. Create new scoped token (read-only vault subset).
2. Add to GitHub as `OP_SERVICE_ACCOUNT_TOKEN_NEW`.
3. Update workflow env reference; run workflow to validate.
4. Remove old token from workflows, then revoke in 1Password.

Monitoring & audit (even without Connect)

- Review 1Password access logs for the automation token usage quarterly.
- Set calendar reminder for rotation (e.g., every 90 days).
- Keep vault scope minimal; avoid write permissions unless required.

Syncing secrets into GitHub (optional & generally discouraged)

- Runtime fetch is preferred. A manual sync template may be added but should be gated behind workflow_dispatch and reviewed for necessity.
