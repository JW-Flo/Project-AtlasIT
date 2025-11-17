# GitHub Actions + 1Password

This workflow replaces the local `op-inject.sh` helper when running builds, tests, or deploys in CI. It uses the official [1Password Load Secrets action](https://developer.1password.com/docs/ci-cd/github-actions/) to hydrate environment variables using the same mappings defined in `ops/secrets/op-map.json`.

## How it works

- A repository or organization secret `OP_SERVICE_ACCOUNT_TOKEN` stores the 1Password service account token (scoped to the AtlasIT vaults referenced in `op-map.json`).
- `.github/workflows/1password-secrets.yml` authenticates with that token and exports secrets as environment variables inside the `load-secrets` job.
- Secrets are exposed to downstream jobs via `needs: load-secrets.outputs.*` so builds/tests/deploys can set `env:` entries without reloading them.
- All variables are masked in logs by the action and the export step.
- Pre-existing environment values (including GitHub-provided `GITHUB_TOKEN` or caller-provided overrides) are compared against the 1Password values and only functional credentials (non-empty, non-placeholder, format-valid) are exported, ensuring we keep the working token regardless of source.
  - The workflow fails fast if neither the 1Password entry nor the pre-existing value is usable for a given variable.

### Validation coverage

The export step applies semantic checks per credential to avoid leaking placeholders or stale tokens between systems:

- Prefix/shape checks for API tokens: `OPENAI_API_KEY` (`sk-...`), `TOGETHER_API_KEY` (`tg-`/`sk-`), GitHub tokens (`ghp_`/`github_pat_`), Okta tokens (`00` prefix + length), Cloudflare (`CF_ACCOUNT_ID` hex, `CF_API_TOKEN` length/pattern), and AWS keys (`AKIA`/`ASIA` + 40-char secret).
- URL structure checks: `SLACK_WEBHOOK_URL` must start with `https://hooks.slack.com/`; `DATABASE_URL` must contain `://`; `OKTA_DOMAIN` must end with `.okta.com`.
- Basic shape guards: emails for `CF_API_EMAIL`, DNS-safe names for `S3_BUCKET`, and minimum-length checks for Ramp client credentials.
- Any value failing these checks (or matching placeholder patterns like `changeme`/`<token>`) is rejected; if no source passes, the workflow errors early instead of exporting broken values.

#### Local validation harness

Run `ci/test-1password-secrets.sh` to exercise the same shape/placeholder validation logic locally. The script feeds known-good samples (matching the patterns above) and intentionally broken placeholders to confirm the guards reject malformed values before they would reach downstream jobs.

#### Live credential fetch check

- The reusable workflow itself performs the authoritative fetch from 1Password. A live retrieval requires a populated `OP_SERVICE_ACCOUNT_TOKEN` GitHub secret and a workflow run (either via a caller workflow using `workflow_call` or a manual `workflow_dispatch`).
- Pass `run_live_check: true` when invoking the workflow (or flip the dispatch input) to install the 1Password CLI on the runner and execute `ci/live-1password-fetch.sh`, which reads the mapped items directly from 1Password using the service account token.
  - The script validates each returned value using the same placeholder/shape checks as the export step and only writes redacted success/failure lines to the GitHub Actions summary.
- During a run, the `Load secrets from 1Password` step writes out masked values for every mapped item. The subsequent validation step will prefer those values if they pass shape checks; otherwise, it falls back to any pre-existing GitHub/environment-provided credentials.
- If neither source passes validation for a variable, the job fails fast and the GitHub Actions summary will call out which credentials were rejected (e.g., placeholder patterns, malformed formats).
- Because the runner used here does not have access to the AtlasIT 1Password tenant, live retrieval cannot be exercised locally; trigger the workflow in GitHub with the service account token present to confirm end-to-end fetching.

##### Local/live smoke

- Provide `OP_SERVICE_ACCOUNT_TOKEN` and ensure the 1Password CLI (`op`) is installed, then run `./ci/live-1password-fetch.sh` locally or as part of a self-hosted runner to confirm the service account can read and validate all mapped credentials without logging the secret values.

## Variables provided

The workflow publishes the following outputs (name → 1Password path), mirroring `op-map.json`:

- `CF_ACCOUNT_ID` → `op://AtlasIT Cloudflare/Cloudflare Account/Account ID`
- `CF_API_TOKEN` → `op://AtlasIT Cloudflare/Cloudflare API Token/credential`
- `CF_API_EMAIL` → `op://AtlasIT Cloudflare/Cloudflare Account/Email`
- `OKTA_DOMAIN` → `op://AtlasIT Okta/Okta Domain/domain`
- `OKTA_API_TOKEN` → `op://AtlasIT Okta/Okta API Token/credential`
- `OKTA_CLIENT_ID` → `op://AtlasIT Okta/Okta OIDC App/client_id`
- `OKTA_CLIENT_SECRET` → `op://AtlasIT Okta/Okta OIDC App/client_secret`
- `OPENAI_API_KEY` → `op://AI Providers/OpenAI/key`
- `TOGETHER_API_KEY` → `op://AI Providers/Together/key`
- `SLACK_WEBHOOK_URL` → `op://Integrations/Slack Webhook/url`
- `RAMP_API_KEY` → `op://Finance/Ramp/API Key`
- `RAMP_CLIENT_ID` → `op://Finance/Ramp/Client ID`
- `RAMP_CLIENT_SECRET` → `op://Finance/Ramp/Client Secret`
- `GITHUB_TOKEN` → `op://Automation/GitHub PAT/token`
- `GH_PAT` → `op://Automation/GitHub PAT/token`
- `DATABASE_URL` → `op://Databases/Primary Postgres/URL`
- `S3_BUCKET` → `op://AWS/S3 Evidence Bucket/name`
- `AWS_ACCESS_KEY_ID_SANDBOX` → `op://AWS/Sandbox User/access_key_id`
- `AWS_SECRET_ACCESS_KEY_SANDBOX` → `op://AWS/Sandbox User/secret_access_key`

## Using in workflows

```yaml
jobs:
  secrets:
    uses: ./.github/workflows/1password-secrets.yml
    secrets:
      OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}

  build:
    needs: secrets
    runs-on: ubuntu-latest
    env:
      CF_API_TOKEN: ${{ needs.secrets.outputs.CF_API_TOKEN }}
      OPENAI_API_KEY: ${{ needs.secrets.outputs.OPENAI_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

Downstream jobs reference `needs.secrets.outputs.*` for any variable in the list above; values remain masked in logs. Each variable is validated to reject placeholder-like values (e.g., `changeme`, `<token>`) and will prefer the 1Password credential when it passes validation, otherwise falling back to a pre-existing GitHub/runner-provided value. If neither source is usable, the workflow fails fast instead of propagating a broken credential.

## Rotation

1. Create or rotate the 1Password service account in the AtlasIT tenant; grant access to the vaults used in `op-map.json`.
2. Update the GitHub secret `OP_SERVICE_ACCOUNT_TOKEN` in the repository/organization with the new token.
3. If any underlying item paths change, update both `ops/secrets/op-map.json` and the mapping in `.github/workflows/1password-secrets.yml` to keep CI aligned with local tooling.
4. If a GitHub secret already provides a working value, it will be preserved over the 1Password value—verify which source should be authoritative before rotation.
5. Re-run affected GitHub Actions workflows; no code changes are required for downstream jobs that already read `needs.secrets.outputs.*`.
