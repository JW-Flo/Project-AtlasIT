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
