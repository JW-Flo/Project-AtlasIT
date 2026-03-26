# CLAUDE.md

## General Preferences

- Keep code clean and modular: well-structured, separated concerns, reusable components
- Make changes with minimal explanation — focus on output over commentary
- Follow TDD: write tests first, then implementation
- Prefer simple, direct solutions over clever or over-engineered ones
- Avoid unnecessary abstractions — don't create helpers or wrappers for one-time use

## Languages & Frameworks

- **TypeScript/JavaScript**: Prefer TypeScript over plain JS. Use strict mode. Prefer `const` over `let`. Use modern ES features and async/await.
- **Python**: Use type hints. Follow PEP 8. Prefer f-strings. Use `pathlib` over `os.path`.
- **Go**: Follow standard Go conventions. Use `error` returns over panics. Keep interfaces small.

## Code Style

- Meaningful variable and function names over comments
- Small, focused functions with single responsibilities
- Explicit over implicit — avoid magic values and hidden behavior
- Keep files focused — split when a file handles multiple unrelated concerns

## Testing

- Write tests before implementation (TDD)
- Test behavior, not implementation details
- Use descriptive test names that explain the expected behavior
- Keep tests independent and isolated

## Git

- Write concise commit messages focused on "why" not "what"
- Prefer small, focused commits

## Checkpoint SOP

Once sufficient work has been completed on a feature branch (typically 3+ commits or a logical milestone), pause to checkpoint before continuing:

1. **Review** — Diff branch against main, verify all changes are intentional and tests pass
2. **Rebase** — `git fetch origin main && git rebase origin/main` to resolve conflicts early
3. **PR** — Open a PR with a summary and test plan (`gh pr create`)
4. **Merge** — Merge the PR once checks pass (`gh pr merge <num> --merge`)
5. **Validate** — Smoke-test deployed endpoints (health checks, key routes) to confirm deployment
6. **Continue** — Create a new branch for the next batch of work

Do not accumulate unbounded work on a branch without checkpointing. This prevents painful rebases, ensures incremental review, and catches deployment issues early.

## Secrets

- Secrets are managed in 1Password (vault: AWW_SHARED). Use `op` CLI with service account token.
- Never commit secrets to repo files. Use `wrangler secret put` for worker secrets.
- CF API token: 1Password item "Cloudflare - Personal : Actual" > CLOUDFLARE_ACCOUNT_ADMIN_API_TOKEN
- Groq: 1Password item "Groq Atlas IT API Credentials"
- GH_PAT: 1Password item "GH_PAT" or "GitHub PAT - Atlas IT"

## GitHub & PR Workflow

Use `gh` CLI for all GitHub operations — it is authenticated as JW-Flo.
Never use `curl + $GH_PAT` directly (`GH_PAT` is in 1Password but not exported to the shell).

Full PR workflow:

1. Create feature branch: `feat/<desc>` or `phase<N>/<desc>`
2. Commit with concise why-focused messages (no session URLs)
3. Push and open PR: `gh pr create --title "..." --body "..."`
4. Request Copilot review: `gh pr edit <num> --add-reviewer copilot`
5. Wait ~60s, check: `gh pr view <num> --json reviews,comments`
6. Address actionable findings; if no findings after 1-2 checks → merge
7. Merge: `gh pr merge <num> --squash`
8. Delete remote branch: `git push origin --delete <branch>`

Do not poll Copilot more than 2-3 times. If nothing reported, merge and move on.

## CI/CD & Deploy Validation

### Pre-push verification

Before committing changes to CI workflows, deploy configs, or shell scripts:

1. **Verify CLI flags exist** — run `npx wrangler deploy --help`, `npx wrangler --help`, etc. to confirm flags before using them. Do not guess CLI flags; wrangler, gh, and other tools change between versions.
2. **Test locally first** — run `npx wrangler deploy --dry-run --config <path> [--env <env>]` to confirm the bundle builds and config is valid before pushing.
3. **Validate shell scripts** — run `bash -n scripts/<name>.sh` to catch syntax errors (e.g., `local` outside functions, unclosed quotes).

### Wrangler named environments

Wrangler `[env.<name>]` sections do NOT inherit top-level bindings. Each named env must explicitly declare: `main`, `compatibility_date`, `compatibility_flags`, `[[env.<name>.d1_databases]]`, `[[env.<name>.kv_namespaces]]`, etc. Always verify by running `npx wrangler deploy --dry-run --config <path> --env <env>` and confirming all bindings appear in the output.

### Deploy workflow conventions

- All deploy jobs are in `.github/workflows/deploy-on-merge.yml`
- Workers behind CF Access need `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` env vars for smoke tests
- Subdirectory `pnpm install --no-frozen-lockfile` is required for workers not in the root `workspaces` array (core-api, dispatch-worker) and for workspace members with local devDependencies (ai-orchestrator, compliance-worker)
- Use `WRANGLER_LOG=debug` env var for deploy debugging (NOT `--log-level` which doesn't exist on `wrangler deploy`)
- Smoke tests use `scripts/smoke-test.sh <worker-name> <base-url>` — supports CF Access auth headers when env vars are set

### Workspace membership

Workers in `package.json` `workspaces`: packages/_, onboarding, ai-orchestrator, compliance-worker, mcp_, documentation-worker, slack-approval-worker, console-app.

NOT in workspaces (standalone installs): core-api, dispatch-worker, slack-notification-agent, marketplace, apex-redirect-worker.

## Parallel Agent Rules

Write agents (those that edit files) MUST use isolated worktrees.
Pass `isolation: "worktree"` on the Task tool for any agent that modifies files.
Read-only/Explore agents may run in parallel without isolation.
Never launch multiple write agents against the same branch — they will overwrite each other.

## Agent Model Selection

- **haiku**: scaffolding, boilerplate, pattern-following codegen, file searches, templated work
- **sonnet**: implementing against existing patterns, code review, judgment calls, most feature work
- **opus**: novel architecture decisions, hard debugging, system design trade-offs
  Do not use opus for cookie-cutter or pattern-following work.

## Project Architecture

AtlasIT is a multi-tenant IT automation and compliance platform on Cloudflare.

### Components

- `console-app/` — SvelteKit + Tailwind (Cloudflare Pages). Primary UI with onboarding, compliance, directory, marketplace, workflows, policies, incidents, access requests, admin panel
- `compliance-worker/` — Evidence-grounded compliance scoring (incorporates adapter pass/fail status), adapter evidence collection, policy evaluation (stub — hashing only, no Rego runtime)
- `ai-orchestrator/` — Event routing, workflow execution (WorkflowDO), queue consumer, DLQ
- `core-api/` — Central API (Hono): tenants, events, agents, flags, credentials, dead-letter
- `onboarding/` — Tenant provisioning
- `slack-notification-agent/` — Outbound Slack MCP agent (event → Slack webhook)
- `packages/shared/` — Common types, auth, logging, middleware (rate-limit, security-headers, auth), platform adapters, observability (logger, metrics, tracer, SLOs)
- `packages/mcp-sdk/` — MCP agent SDK (client + server, HMAC signing)
- `packages/connector-schema/` — ConnectorManifest Zod schemas + manifest templates for all 35 apps
- `packages/adapter-gen/` — Adapter code generator (manifest JSON → full CF Worker scaffold)
- `adapters/okta/` — Okta connector (directory sync, webhooks, SCIM 2.0 provisioning)
- `adapters/google-workspace/` — Google Workspace connector (OAuth 2.0, user/group sync)
- `adapters/<slug>/` — 35 adapters (9 core-tier hand-written, 2 production, 24 scaffolded)
- `dispatch-worker/` — Queue-driven workflow step dispatch
- `scheduler-worker/` — Cron-based scheduled task execution
- `marketplace/` — App catalog and install/uninstall management
- `apex-redirect-worker/` — Root domain redirect handling
- `mcp/` — MCP server (desktop agent protocol)
- `mcp-idp/` — MCP identity provider (OIDC/SAML bridge)
- `mcp-mobile/` — MCP mobile client endpoint
- `slack-approval-worker/` — Slack interactive approval workflows
- `apps/atlasit-web/` — Marketing / landing site
- `infra/github-proxy/` — GitHub API proxy for CI
- `shared/services/cdt/` — Compliance Definition & Testing rule engine (60 rules)
- `ops/oidc/` — GitHub Actions OIDC → 1Password Connect exchange worker

### Storage (Cloudflare D1/KV/R2/Queues)

- D1 `ATLAS_SHARED_DB` — tenants, users, preferences, directory, compliance, audit, console_user_roles
- KV `KV_SESSIONS` — session management
- KV `KV_CACHE` — general cache (compliance scores, API responses)
- KV `KV_FEATURE_FLAGS` — feature flag storage (rollout %, tenant overrides)
- KV `MCP_STORE` — MCP agent state and configuration
- R2 `atlasit-evidence` — policies, evidence, artifacts
- Queues `atlasit-step-tasks` — workflow step dispatch

### Console App Conventions

- API routes in `console-app/src/routes/api/` — all require auth guard (`locals.user` check)
- Proxy routes use `_proxy-helpers.ts` for upstream worker calls with `x-tenant-id` header
- Tenant preferences stored as JSON in `tenant_preferences` table (key/value per tenant)
- Compliance frameworks: SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR
- Shared session store at `$lib/stores/session.ts` — fetch once, consume everywhere

### Key Patterns

- Auth: CF Access JWT → `UserPrincipal` via `$lib/auth/provider.ts`
- Tenant isolation: all data queries scoped by `tenant_id` from authenticated session
- Scoring: weighted status (not_started=0, in_progress=0.25, implemented=0.75, verified=1.0); adapter pass/fail caps `implemented` to `in_progress` on failure; verification attestation promotes to `verified`
- Evidence pipeline: events → classifier → locker (R2+D1) → CDT evaluate → weighted scores; adapter evidence collected on 5-min cron, daily full re-evaluation at 02:00 UTC; `parseControlRef()` handles multi-segment framework prefixes (ISO-27001, NIST-CSF)
- Integrations catalog: `$lib/data/integrations.ts` (AuthModel: platform_oauth | tenant_oauth | api_key | service_account)

### Adapter Pipeline

- **Registry**: `shared/integrations/registry-detailed.ts` — OAuth URLs, scopes, API endpoints for all 35 apps
- **Manifests**: `packages/connector-schema/src/templates.ts` — ConnectorManifest JSON per app (auth, capabilities, config, events, webhooks)
- **Scaffold**: `packages/adapter-gen/src/scaffold.ts` — `scaffoldAdapter(manifest, outputDir)` generates full CF Worker
- **Output**: `adapters/<slug>/` — `src/index.ts`, `src/auth.ts`, `src/config.ts`, `wrangler.toml`, `package.json`, `tsconfig.json`, `migrations/`
- **Validation**: `packages/connector-schema` exports `validateManifest()` for Zod validation
- **Auth models**: `oauth2` (Microsoft 365, Jira, etc.), `api_key` (BambooHR, Stripe, etc.), `tenant_oauth` (Auth0, Workday), `service_account` (AWS, GCP)
