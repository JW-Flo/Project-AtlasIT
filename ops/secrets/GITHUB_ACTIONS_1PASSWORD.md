# Using 1Password in GitHub Actions (safe patterns)

This short guide explains how this repository prefers integrating 1Password secrets into CI workflows and provides a minimal example that uses the 1Password CLI (`op`) in a GitHub Actions job. The repo already includes local helper scripts and an `op-map.json` mapping in `ops/secrets/`.

Two main approaches

1. OIDC + 1Password Connect (recommended for ephemeral access)
   - Configure GitHub OIDC provider and 1Password Connect so workflows can request short-lived tokens without storing long-lived credentials in GitHub.
   - Advantage: no long-lived tokens in GitHub secrets; better audit trail.
   - Disadvantage: requires 1Password Connect deployment and some infra setup.

2. 1Password CLI with stored automation token (simpler to bootstrap)
   - Store a 1Password automation token (Connect or personal) in GitHub Actions secrets (e.g., `OP_AUTOMATION_TOKEN`). Use `op signin --raw` or `OP_SESSION_xxx` approaches.
   - Advantage: quick to set up for CI runs that need to read secrets.
   - Disadvantage: must protect the automation token and rotate it periodically.

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

- If you want I can add a sample `ci-with-1password.yml` workflow file under `.github/workflows/` wired to the repo's `op-map.json` and demonstrating OIDC/Connect usage (this will be a template; you'll need to configure 1Password Connect or provide an automation token in Actions secrets).
