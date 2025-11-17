# Using 1Password in GitHub Actions (safe patterns)

This short guide explains how this repository prefers integrating 1Password secrets into CI workflows and provides a minimal example that uses the 1Password CLI (`op`) in a GitHub Actions job. The repo already includes local helper scripts and an `op-map.json` mapping in `ops/secrets/`.

Two main approaches

1. OIDC + 1Password Connect (recommended for ephemeral access)
   - Configure GitHub OIDC provider and 1Password Connect so workflows can request short-lived tokens without storing long-lived credentials in GitHub.
   - Advantage: no long-lived tokens in GitHub secrets; better audit trail.
   - Disadvantage: requires 1Password Connect deployment and some infra setup.

2. 1Password CLI with stored automation token (legacy / local dev)

- Local developer flows can use the `op` CLI and an automation token, but this repo has standardized on 1Password Connect for CI.
- Advantage: quick to set up for local development and debugging.
- Disadvantage: automation tokens should not be used broadly in CI; prefer Connect/OIDC for production.

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

-- If you want I can add a sample reusable workflow `1password-secrets.yml` that validates mappings (non-live) and optionally runs a live-check in GitHub Actions via Connect. The repo now prefers Connect/OIDC.

Connect + OIDC quick note

- When possible prefer using 1Password Connect with an OIDC exchange so GitHub Actions can obtain short-lived tokens.
- The high-level flow is: GitHub Actions issues an OIDC identity token -> your Connect or identity gateway exchanges it for a short-lived 1Password token -> the workflow uses the short-lived token to fetch secrets.
- Implementing the exchange requires configuration on your 1Password Connect deployment and identity provider and is environment specific. Contact your infrastructure/security team and consult 1Password Connect docs for steps.

Repository token and usage

- Primary token name in this repository: `op_atlas_it_connect_server_pat` (stored in GitHub repository secrets and as an env secret on the Connect host).
- Expires: 2026-02-15 23:59:59 UTC.
- Storage: GitHub repository secrets + environment secret on the Connect host (as you noted).
- Scope (for documentation): read & write access to the associated repo and Connect server for the initial standup. When your OIDC/auth flows are ready, replace this with a read-only token or short-lived OIDC-based tokens.

Immediate recommended actions while this token remains Read & Write:

1. Limit the token's vault scope to the absolute minimum required (e.g., `PP_SHARED_SECRETS`), not all vaults.
2. Enable and monitor 1Password Connect audit logs for any unexpected activity.
3. Schedule a rotation window: provision a read-only token (for example `op_atlas_it_connect_server_pat_ro`) when your OIDC/auth flow is ready, and retire the read/write token promptly.
4. Consider setting up an alert (Splunk/CloudWatch/Slack) for any write events from the CI token.

Runbook: rotate and validate token (when ready)

1. In 1Password Admin: Create a new Access Token scoped to required vault(s) with Read-only permissions.
2. In GitHub repository Settings -> Secrets: Add the new read-only secret (e.g., `op_atlas_it_connect_server_pat_ro`) and keep the old token in place temporarily.
3. Edit `.github/workflows/ci-with-1password-connect.yml` to reference the new secret name.
4. Trigger the workflow manually via "Run workflow" and confirm the verification step lists vaults and subsequent steps succeed.
5. If successful, remove/rotate the old read/write token in 1Password and delete the secret in GitHub.

Monitoring and audit

- Ensure Connect audit logs are enabled and monitor for unexpected writes or operations from the CI token during the period it has write permission.
- Consider creating a scheduled job to rotate the CI token periodically (the 1Password API can be used for automation or perform rotation manually as part of a quarterly security task).

Syncing secrets into GitHub (optional)

- This repository includes a template workflow `.github/workflows/sync-secrets-from-connect.yml` which can be run
  manually or on a schedule to sync a small set of secrets from 1Password Connect into GitHub repository secrets.
- The workflow uses `secrets.op_atlas_it_connect_server_pat` to read from Connect and `secrets.PAT_TOKEN` (a repo PAT)
  to write secrets into GitHub. The PAT needs `repo` and `write:packages`/`admin:repo_hook` or the newer secret write scopes
  (see GitHub docs) to allow programmatic secret writes. Only enable this workflow if you understand the security tradeoffs.

Usage notes

- Keep `PAT_TOKEN` scoped minimally and rotate it regularly. Prefer running the sync workflow manually during controlled maintenance windows.
- Alternatively, prefer runtime secret fetching in deployed services (the service talks to Connect at runtime using a Connect token) instead of syncing secrets into GH if possible.
