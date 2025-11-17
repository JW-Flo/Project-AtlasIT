# Using 1Password in GitHub Actions (safe patterns)

This short guide explains how this repository prefers integrating 1Password secrets into CI workflows and provides a minimal example that uses the 1Password CLI (`op`) in a GitHub Actions job. The repo already includes local helper scripts and an `op-map.json` mapping in `ops/secrets/`.

Chosen approach: 1Password Connect (user directive)

We will run a 1Password Connect container on Docker Cloud for a 7‑day evaluation. OIDC is deferred; the repository will use a scoped Connect access token (`OP_CONNECT_TOKEN`) and host URL (`OP_CONNECT_HOST`) stored as GitHub Actions secrets.

Former alternatives (automation token / OIDC exchange) are documented only for future reference. Automation token fallback remains commented in CI workflow for emergency use during trial.

Example: minimal workflow using 1Password Connect in CI

```yaml
name: ci-with-1password-connect
on: [workflow_dispatch]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Load secrets from 1Password Connect
        uses: 1Password/load-secrets-action@v3
        with:
          export-env: |
            CF_ACCOUNT_ID=op://vault/Cloudflare/Account ID
            API_KEY=op://vault/Cloudflare/API Key/password
        env:
          OP_CONNECT_HOST: ${{ secrets.OP_CONNECT_HOST }}
          OP_CONNECT_TOKEN: ${{ secrets.OP_CONNECT_TOKEN }}
      - name: Use secret (masked)
        run: echo "CF_ACCOUNT_ID length: ${#CF_ACCOUNT_ID}" # do not echo entire values
```

Security notes and repo conventions

- `ops/secrets/op-map.json` maps env names to vault paths; continue using for consistency.
- OIDC deferred; Connect is authoritative for CI during trial.
- Do not commit plaintext secrets; scope Connect token minimally (read-only if possible).
- Local/dev may still use `op` CLI directly; avoid embedding tokens in source.

7‑Day Docker Cloud evaluation plan

Day 0: Deploy Connect container; create scoped token; set `OP_CONNECT_HOST`, `OP_CONNECT_TOKEN` secrets.
Day 1–2: Exercise CI; verify audit logs & vault scope.
Day 3–4: Assess performance, tighten vault scoping.
Day 5–6: Draft rotation & migration options (self-host / Cloudflare Worker proxy) if not continuing Docker Cloud.
Day 7: Decision checkpoint; rotate token if continuing or decommission container safely.

Token rotation quick runbook (Connect token)

1. Create new Connect token with minimal vault scope.
2. Add secret `OP_CONNECT_TOKEN_NEXT` in GitHub.
3. Update workflows to reference it; run CI.
4. Revoke old token; remove old secret.

Monitoring & audit

- Review Connect audit logs daily during trial.
- Add calendar reminder for rotation if extending beyond trial.

Dummy placeholder rationale

- Earlier examples used dummy paths to avoid leaking real secret metadata.
- Replace placeholders with actual `op://vault/Item/field` paths once Connect container is live.

Secret & variable matrix (GitHub / Docker Cloud)

| Purpose                   | GitHub Secret/Var                     | Docker Cloud Env          | Notes                                     |
| ------------------------- | ------------------------------------- | ------------------------- | ----------------------------------------- |
| Connect host URL          | (none, set in secret OP_CONNECT_HOST) | CONNECT_HOST (container)  | Example: https://connect.your-domain:8080 |
| Connect access token      | OP_CONNECT_TOKEN                      | CONNECT_TOKEN (optional)  | Keep scope minimal; rotate post-trial     |
| Fallback automation token | OP_SERVICE_ACCOUNT_TOKEN (optional)   | (not required)            | Only enable if Connect unstable           |
| Docker Hub username       | DOCKER_USER (Repository Variable)     | (not needed in container) | Used by build workflows                   |
| Docker Hub PAT            | DOCKER_PAT                            | (not needed in container) | Provide repo read/write or publish scope  |
| Vault item mappings       | op-map.json (in repo)                 | (none)                    | Paths only; no secret values              |

Rotation & fallback checklist

Weekly (during trial):

1. Review audit logs (identify unexpected vault access).
2. Confirm OP_CONNECT_TOKEN scope unchanged.
3. Validate health workflow success (`connect-health`).

If Connect outage:

1. Uncomment automation token fallback step in `ci-with-1password.yml`.
2. Add/verify `OP_SERVICE_ACCOUNT_TOKEN` secret.
3. Re-run CI, then restore Connect usage and re-comment fallback.

End of trial (Day 7):

1. Decide: continue Docker Cloud OR migrate.
2. If continue: issue new token, update secret, revoke old.
3. If migrate: stand up alternative (self-host / tunnel) → switch host secret → revoke Docker Cloud token.
4. Archive audit logs for security review.
