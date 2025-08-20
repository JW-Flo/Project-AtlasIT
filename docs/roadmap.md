# AtlasIT Roadmap

## Quarterly View (Existing)

- Q1: Core & provisioning MVP
- Q2: All MCP modules + reporting
- Q3: Local self-host option + IdP
- Q4: Advanced analytics & AI suggestions

## Phase 1 (Aug 2025) Onboarding Enhancements

| Epic         | Item                        | Description                                                                                                 | Target |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| ONB-QUEST    | Onboarding Questions API    | Expose dynamic questions at `/api/onboarding/questions?industry=...&requirements=...`                       | Week 1 |
| ONB-STATUS   | Status/Idempotency          | Add `/api/onboarding/:tenantId/status`; duplicate POST returns existing config (200)                        | Week 1 |
| ONB-AIREFINE | AI Config Keyword Expansion | Map additional requirement keywords (monitoring, logging, audit, sso, gdpr) to integrations/security tweaks | Week 2 |
| ONB-PERSIST  | Persistence Hardening       | Audit event insert + optional JSON index/migration for tenants config                                       | Week 2 |
| ONB-ERRORS   | Error Taxonomy              | Introduce structured codes (ONB-001..n) and docs                                                            | Week 2 |

Exit Criteria: All new endpoints tested (unit + Miniflare), idempotent behavior verified, expanded AI config deterministic, docs updated (Development Guide Appendix + API reference).
