# AtlasIT Roadmap

**Last updated:** March 2026

This roadmap tracks implementation phases from foundation through market readiness. See `STATUS.md` for current deployment state and `CLAUDE.md` for coding standards.

## Phase 0 — Foundation ✅

- Cloudflare Workers deployed (onboarding, orchestrator, docs)
- D1 schemas (13 root + 8 worker migrations)
- Shared types package with Zod schemas
- Vitest + Miniflare test harness
- Structured logging, error handling middleware
- `packages/shared` with auth, middleware, platform adapters

## Phase 1 — Workflow Durability + Auth Hardening ✅ (PR #139)

- Unified workflow types (shared RunState/StepState)
- EvidenceEmitter wired into WorkflowDO (R2-backed)
- Queue dispatch via QueueBus (Cloudflare Queues)
- Dead letter queue integration (DLQ + replay)
- D1-backed RBAC (console_user_roles table, unknown users → viewer)
- Shared auth middleware enforced on core-api and ai-orchestrator
- Dev bypass validation script

## Phase 2 — MCP Orchestration ✅ (PR #140)

- Compensation dispatch (queued via QueueBus, not instant)
- Per-step timeout tracking with stepDeadline
- Compensation failure escalation to DLQ
- Slack notification MCP agent (event → Slack webhook)
- Inbound HMAC signature verification on event ingestion
- E2E orchestration integration tests (event → agent → workflow)

## Phase 3 — Marketplace & Integrations ✅ (Pre-existing)

- Marketplace API (GET /apps, POST /install, DELETE /uninstall)
- Connector schema package with Zod validation
- Adapter generator pipeline (research → scaffold → compile)
- Google Workspace connector (OAuth 2.0, user/group sync)
- Okta connector (directory sync + webhook events)
- Marketplace UI (SvelteKit: catalog, install, configure)
- Credential vault (AES-GCM envelope encryption)
- Feature flag system (KV-backed, rollout %, tenant overrides, kill switches)
- E2E connector install flow test

## Phase 4 — Hardening & Production ✅ (PR #141)

- Okta SCIM 2.0 provisioning endpoints (Users + Groups CRUD, filter parsing)
- k6 load testing scripts (smoke/load/stress/soak for 3 services)
- IaC drift detection (OPA/Conftest policies, GH Actions workflow)
- OIDC exchange worker hardened (GitHub JWT validation, rate limiting, repo allowlists)
- CF Workers-native observability (W3C traceparent tracer, Analytics Engine metrics)
- Rate limiting middleware (KV-backed, per-endpoint)
- Security headers middleware (CSP, HSTS, X-Frame-Options)

## Phase 5 — Operational Readiness (Next)

- [ ] Production deployment of all workers with env promotion
- [ ] API key rotation automation
- [ ] Penetration testing (OWASP top 10)
- [ ] Production deployment runbook and incident response
- [ ] Custom domain DNS configuration
- [ ] Workers Paid plan upgrade for queue bindings

## Phase 6 — Market Readiness (Future)

- [ ] Multi-tenant billing and usage metering
- [ ] LLM-backed policy refinement with redline diff
- [ ] Real-time risk anomaly detection
- [ ] Plugin API for third-party compliance packs
- [ ] Advanced analytics and reporting

## Cross-Cutting Concerns

| Concern | Strategy |
|---------|----------|
| Schema Evolution | Versioned D1 migrations + idempotent backfills |
| Secrets | 1Password (vault: AWW_SHARED) + wrangler secret put |
| Config | Environment gating via wrangler.toml [env.*] sections |
| Performance | Precompute aggregates into KV; Queues for heavy ops |
| Testing | Vitest + Miniflare; 356 tests (49 files) |
| Observability | Structured JSON logging, SLO burn-rate alerting, Analytics Engine metrics |
| IaC | Terraform + OPA policies + daily drift detection |
