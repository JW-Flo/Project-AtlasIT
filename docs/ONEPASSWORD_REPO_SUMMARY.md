# AtlasIT + 1Password Work Summary

## Repository Snapshot
- **Platform scope:** AtlasIT (Project Atlas) – Cloudflare Worker services, compliance/policy engines, adapters, and SvelteKit console app under `console-app/`.
- **Security posture:** Secrets are externalized; repo ships mapping files and scripts but no static credentials.
- **Branching/process:** Use `codex/{feature}` branches, evidence under `artifacts/`, and run logs in `ops/.codex.done` (see `ops/NAMING_CONVENTIONS.md`).

## 1Password Touchpoints
- **Local/CI injection:** `ops/secrets/op-inject.sh` loads env vars from `.env` plus 1Password via the CLI; mapping lives in `ops/secrets/op-map.json`. The workflow expects `op` installed and fails fast if missing.
- **Developer guide:** `ops/secrets/README.md` documents how to structure vault items, mapping format, and future CI integration (OIDC + 1Password Connect) without bundling secrets.
- **Deployment checklist:** `ops/DEPLOYMENT_SECRETS_CHECKLIST.md` enumerates required secrets, mapping usage, and guidance to store/generated values in 1Password before deploys.
- **Runtime hooks (placeholders):**
  - `utils/store_secret_and_notify.js` posts Slack notifications for secrets stored in the "AtlasIT Secrets" vault; storage call is a stub to fill with 1Password SDK/API.
  - `slack-approval-worker/index.js` includes a TODO to mark secrets approved in 1Password after Slack approvals.
  - `mcp-servers/github-mcp/authentication.js` has a placeholder `getCredentialsFrom1Password()` for GitHub App secrets.
- **Agent context:** Planning docs (`implementation_plan.md`, `mcp/project_guide.json`, `_qwen_full.md`) and historical context files reference 1Password as the source of truth for bot tokens and approvals; no secrets are committed.

## Gaps / Next Steps
- Implement real 1Password SDK/Connect calls in Slack approval and `store_secret_and_notify.js`, wiring vault/item names from `op-map.json` or env vars.
- Add CI-friendly `op run`/OIDC workflow to GitHub Actions to fetch secrets without local CLI state.
- Extend tests/linting to cover secret-fetch stubs once implementations are added.
