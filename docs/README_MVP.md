# AtlasIT MVP Deploy (Demo-Ready)

See `ops/hand-off.md` for the authoritative deploy runbook and smoke tests.

This guide deploys a minimal, working demo stack on AWS:

- Dispatch API (Lambda + API Gateway gateway path)
- Compliance API (demo compliance API with Aurora + S3 bindings)
- AI Orchestrator (health, rate/quota; optional)
- Console App (SvelteKit UI on S3 + CloudFront)

## Prereqs

- Node 18+
- AWS CLI configured (`aws configure` or SSO)
- Terraform state/backend access for shared AWS resources
- Run Auth Preflight first: see `ops/hand-off.md` (clears conflicting env and refreshes AWS auth/session)

## One-shot deploy

```bash
# from repo root
npm install --workspaces --include-workspace-root
npm run deploy:mvp
```

Optional smoke after deploy:

```bash
export CONSOLE_PUBLIC_URL="https://console.YOURDOMAIN.com"
node scripts/deploy-mvp.mjs
```

## Manual endpoints

- Console: /console/platform-status
- Console health API: /api/health
- Runtime config: /api/config
- Compliance API: /api/compliance/health, /api/compliance/snapshot
- Dispatch: /\_\_health, /admin/usage/summary (requires x-admin-token)
- Orchestrator: /health

## Notes

- Health/config responses are append-only by convention.
- Aurora writes are parameterized.
- Demo auth toggles are environment-variable driven; re-enable for prod.

---

Append-only doc; keep concise.
