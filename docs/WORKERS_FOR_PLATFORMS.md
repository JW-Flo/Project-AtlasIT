# Workers for Platforms (AtlasIT Dispatch)

## Overview

AtlasIT leverages Cloudflare Workers for Platforms (WfP) to allow tenant‑specific extension scripts ("user Workers") to run behind a single dynamic dispatch Worker (`atlasit-dispatch`). This enables controlled multi‑tenant extensibility (integrations, custom logic) without exposing the core platform internals.

```text
Client -> atlasit-dispatch (dynamic dispatch Worker)
      |  Auth, quota, logging, policy
      v
    dispatch namespace (ignite-dispatcher-namespace)
      |-- t_demo_hello (user Worker)
      |-- t_<tenant>_<script>
```

## Core Components

| Component                                        | Purpose                                      |
| ------------------------------------------------ | -------------------------------------------- |
| dispatch namespace `ignite-dispatcher-namespace` | Registry of tenant user Workers              |
| Dynamic dispatch Worker `atlasit-dispatch`       | Auth + routing + metering + fallback         |
| User Worker (e.g. `t_demo_hello`)                | Tenant-provided (or generated) logic         |
| D1 DB `atlasit-shared`                           | Invocation + script metadata tables (future) |

## Current Status (Phase 1)

- Dynamic dispatch Worker scaffolded at `dispatch-worker/`.
- Basic routing: `/ext/:tenant/:script/...` -> user Worker `t_<tenant>_<script>`.
- Placeholder auth: header `x-tenant-auth` must equal reversed tenantId (`demo` -> `omed`).
- Invocation logging table auto‑created lazily (tenant_invocations); minimal schema.
- D1 database bound (id: 4c219864-76be-4453-a494-a4e0904e9cbc).

## Roadmap

| Phase | Focus                                                                    |
| ----- | ------------------------------------------------------------------------ |
| 1     | Dispatch + basic logging (DONE)                                          |
| 2     | Registration API, script metadata (tenant_scripts + versions)            |
| 3     | Quotas (daily), circuit breaker, audit logs                              |
| 4     | Version pinning, staged rollout, blue/green                              |
| 5     | Policy sandbox (restricted fetch domains, CPU profiling), billing export |

## Naming Convention

`scriptId = t_<tenantSlug>_<scriptName>` (lowercase, alphanum, hyphen/underscore allowed, sanitized). Stored consistently in D1.

## D1 Schema (Incremental)

Current (auto‑created in code):

```sql
CREATE TABLE IF NOT EXISTS tenant_invocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_id TEXT,
  tenant_id TEXT,
  ts TEXT,
  duration_ms INTEGER,
  status_code INTEGER,
  ok INTEGER
);
```

Planned:

```sql
CREATE TABLE tenant_scripts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  script_name TEXT NOT NULL,
  script_id TEXT NOT NULL UNIQUE,
  active_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  last_deployed_sha TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE tenant_script_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  deployed_at TEXT NOT NULL,
  bundle_size_bytes INTEGER NOT NULL,
  checksum TEXT NOT NULL
);
CREATE TABLE tenant_config (
  tenant_id TEXT PRIMARY KEY,
  max_scripts INTEGER NOT NULL DEFAULT 5,
  daily_request_quota INTEGER NOT NULL DEFAULT 5000
);
```

## Deployment Steps

1. (Auth) `npx wrangler login`
1. (Namespace – already created) `npx wrangler dispatch-namespace list`
1. (Deploy dispatcher) from `dispatch-worker/`:

```bash
npx wrangler deploy
```

1. (Create user Worker example) scaffold a minimal worker, then:

```bash
npx wrangler deploy --name t_demo_hello --dispatch-namespace ignite-dispatcher-namespace
```

1. (Test):

```bash
curl -H 'x-tenant-auth: omed' https://atlasit-dispatch.<subdomain>.workers.dev/ext/demo/hello
```

## Future Registration API (Design Sketch)

`POST /admin/tenant-scripts` body:

```json
{
  "tenantId": "acme",
  "scriptName": "enrich-okta",
  "repoSha": "<git sha>",
  "bundleUrl": "https://.../bundle.js"
}
```

Flow: validate -> store row -> CI job builds & deploys -> update status=active.

## Auth Evolution

| Stage | Mechanism                                 |
| ----- | ----------------------------------------- |
| Now   | Reversed tenant placeholder (dev only)    |
| Next  | Static per-tenant API key (hashed in D1)  |
| Later | Signed JWT with short TTL + rotating keys |

## Logging & Metrics

Logged per invocation: scriptId, tenantId, ts, ms, status_code, ok. Future aggregation exported to analytics dashboard or Cloudflare Analytics Engine (optional binding) for p95 latencies and error rates.

## Circuit Breaker (Planned)

- Sliding window of last N invocations (e.g. 50). If failure rate > 40% -> script status=quarantined (dispatcher returns 503 scripted error). Auto retry after cooldown.

## Security Considerations

- No dynamic eval outside worker bundle; rely on Cloudflare isolation.
- Add domain allowlist for fetch in future by wrap or compile-time transform.
- Enforce size limit (e.g. < 200 KB compiled) in CI pipeline before deploy.

## Multi-Environment Strategy

| Environment | Namespace                   | DB                  | Purpose                   |
| ----------- | --------------------------- | ------------------- | ------------------------- |
| staging     | ignite-dispatcher-staging   | same DB or separate | Pre-production validation |
| production  | ignite-dispatcher-namespace | atlasit-shared      | Live traffic              |

## Migration Notes

When adding schema tables, create SQL migration script and run once via `wrangler d1 execute` or an admin endpoint. Keep idempotent `CREATE TABLE IF NOT EXISTS` in early phases to simplify bootstrap.

## Quick Commands Reference

```bash
# Deploy dispatcher
cd dispatch-worker
npx wrangler deploy

# List dispatch namespaces
npx wrangler dispatch-namespace list

# Deploy new user script
npx wrangler deploy --name t_acme_enrich --dispatch-namespace ignite-dispatcher-namespace

# Tail logs
npx wrangler tail atlasit-dispatch
```

## Next Enhancements Checklist

- [ ] Introduce tenant_scripts + versions migrations
- [ ] Implement registration API (POST /admin/tenant-scripts)
- [ ] Add API key auth (D1 hashed) replacing placeholder header scheme
- [ ] Quota middleware (daily counters => D1 increment or KV atomic counters)
- [ ] Circuit breaker & error budget alerts
- [ ] Blue/green version selection logic
- [ ] Cache warm / LRU metadata store

---

This document will evolve as we move through Phases 2–5. PRs that add new capabilities should append sections rather than rewriting existing guidance.
