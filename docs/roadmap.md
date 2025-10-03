# AtlasIT Roadmap

## Near Term (0–30 days)

| Item                                                            | Status  | Notes                                                                               |
| --------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Durable workflow persistence (Durable Object or KV)             | planned | Persist orchestrator state beyond in-memory maps.                                   |
| Baseline metrics & tracing (latency distribution, error counts) | planned | Instrument onboarding/orchestrator with Workers Analytics Engine or custom logging. |
| Coverage uplift & threshold enforcement                         | planned | Raise Vitest coverage minimums after persistence lands.                             |
| Automated post-deploy smoke tests                               | planned | Script curl-based checks for each worker after `wrangler deploy`.                   |
| Secrets rotation playbook                                       | planned | Document rotation cadence referencing `ops/DEPLOYMENT_SECRETS_CHECKLIST.md`.        |

## Mid Term (30–90 days)

| Item                            | Status  | Notes                                                                 |
| ------------------------------- | ------- | --------------------------------------------------------------------- |
| Authentication service scaffold | planned | Introduce OIDC/SAML/SCIM worker aligned with onboarding flows.        |
| Marketplace catalog schema      | planned | Define data model & APIs for integration marketplace (no deploy yet). |
| API gateway consolidation       | planned | Evaluate routing layer to unify public endpoints and auth.            |

## Long Term (90+ days)

| Item                                   | Status  | Notes                                                             |
| -------------------------------------- | ------- | ----------------------------------------------------------------- |
| Advanced AI orchestration              | planned | Multi-provider strategy selection, richer approval workflows.     |
| Multi-tenant billing & usage reporting | planned | Usage metering, billing exports, and tenant dashboards.           |
| Compliance automation & evidence packs | planned | Generate SOC2-ready evidence bundles from orchestrated workflows. |

Legacy initiatives are archived in [`LEGACY.md`](../LEGACY.md) and no longer tracked on the active roadmap.

---

## Platform Foundation Phases (Added 2025-09-30)

The following phased plan augments (does not replace) the above time-bucketed roadmap. It provides execution clarity for the compliance + policy subsystem and supporting observability. Each phase has explicit exit criteria to avoid scope drift.

| Phase                        | Focus                                   | Key Deliverables                                                                                                                                       | Exit Criteria                                                                                                      |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 1. Foundation Hardening      | Multi‑tenant scaffolding & contracts    | `tenantId` field added to all compliance types, OpenAPI spec (`docs/api/openapi.yaml`), contract gate workflow, baseline SLO doc, risk scoring formula | All new responses include `tenantId`; OpenAPI verify passes in CI; latency baseline captured (<150ms p95 snapshot) |
| 2. Compliance Snapshot v1    | Persisted snapshot + risk normalization | D1 schema draft, risk `score=likelihood*impact`, snapshot persistence, ageSeconds metric design                                                        | `/api/compliance/snapshot` returns deterministic persisted snapshot incl. `ageSeconds`, risk score validated       |
| 3. Evidence Layer Skeleton   | Evidence envelope write path            | R2 envelope write (immutable), D1 evidence index, hash verification test, retention matrix                                                             | 100% writes produce retrievable envelope; hash verify test green                                                   |
| 4. Policy Evaluation MVP     | Deterministic evaluation                | `POST /api/policy/evaluate`, evaluation engine stub, triple-run determinism test                                                                       | p95 evaluation <90ms; identical hashes across 3 sequential runs                                                    |
| 5. Observability & Retention | Metrics + health enrichment             | Health endpoint extended (latency, snapshot age, evidence counts), SLO doc ratified, perf budget pipeline                                              | Health JSON includes new metrics; perf budget gate enforces thresholds                                             |
| 6. Hardening & Rollout       | Performance + governance                | Changelog enforcement on contract changes, bundle size guard, risk matrix documentation, incident playbooks draft                                      | No contract change merges without CHANGELOG; build fails on perf / bundle regression                               |

### Guiding Principles

1. Append-only schema evolution (add fields, avoid removal for 2 major versions).
2. Deterministic hashing of evidence before scale-out.
3. Tenant isolation baked in _before_ first external consumer.
4. Observability precedes load or feature expansion.
5. Contract-first workflow: OpenAPI -> types -> implementation -> tests -> docs.

### Immediate Actions (Week 1)

| Item                  | Description                                              | Owner    | Status  |
| --------------------- | -------------------------------------------------------- | -------- | ------- |
| OpenAPI baseline      | Introduce `docs/api/openapi.yaml`                        | Platform | planned |
| Risk scoring          | Add derived `score` and validation rules                 | Platform | planned |
| Contract gate         | CI workflow blocking spec drift without CHANGELOG update | DevEx    | planned |
| Data retention matrix | Codify retention/TTL per artifact                        | Platform | planned |
| SLO baseline capture  | Script latency sampling for snapshot endpoint            | DevEx    | planned |

### Change Log Note

This section was appended (non-breaking) to clarify execution ordering for compliance & evidence capabilities; original time-bucket roadmap remains authoritative for unrelated initiatives.
