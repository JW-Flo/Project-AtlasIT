# AtlasIT – Master Requirements & Strategic Blueprint

This document consolidates **all required artifacts, risks, enhancements, and directives** into a single authoritative source. It is intended for integration into the AtlasIT repo as a guiding blueprint for agents, contributors, and compliance reviewers. Nothing here is optional.

---

## 1. Vision & Objectives

- Deliver a **unified, automation-first IT/DevSecOps platform** for SMB and mid-market.
- Bundle **Identity Lifecycle (JML)**, **Compliance Automation (CDT)**, **Security Orchestration** into one console.
- Provide **auditless compliance evidence** and **zero-touch lifecycle management**.
- Target **acquisition by ServiceNow, CrowdStrike, Okta** within 36–60 months.

---

## 2. Security & Compliance

### 2.1 Threat Modeling

- Document STRIDE analysis across all surfaces (API, Workers, DOs, R2, Webhooks).
- Maintain updated **attack trees**.
- Maintain **kill-chain diagrams** for lateral movement.

### 2.2 Policies & Enforcement

- OPA/Rego bundles for:
  - Baseline allow/deny
  - Segregation of Duties (SoD)
  - Industry-specific packs (Healthcare, Fintech, SaaS, Gov)

### 2.3 Vault & Secrets

- Policies: `policies.hcl`
- Roles, Auth flows, TTLs, and renewal policies
- Response-wrapping and ephemeral credentials

### 2.4 Data Governance

- **PII Classification**: User, Org, Evidence, Device.
- **Retention Matrix**: define per-field retention & purge SLAs.
- **Deletion workflows**: audit-tracked.
- Backup/restore procedures + key encryption lifecycle.

### 2.5 Legal/Privacy

- Data Processing Agreement (DPA)
- HIPAA BAA Readiness
- Breach notification playbook
- SOC2 data flow diagrams

---

## 3. Reliability & Operations

### 3.1 SLOs & Error Budgets

- API: p99 latency < 300ms
- Error budget <= 1%
- Burn-rate alerts: 2%/1h, 5%/6h

### 3.2 Runbooks

- Webhook backlog recovery
- Idempotency conflict handling
- Durable Object migration
- Region/edge failover

### 3.3 Disaster Recovery

- RPO/RTO targets by data class
- Backup & restore test cadence
- Periodic fire-drills documented

### 3.4 Rate Limits & Retry

- Define policies per SaaS adapter (Okta, GWS, AWS, ServiceNow)
- Retry jitter policies
- Circuit breakers for external API outages

### 3.5 Observability Contracts

- Structured logs with trace_id, tenant_id, subject_id
- Span naming convention
- Metric definitions with units & cardinality budgets
- Error budget dashboards

---

## 4. Engineering Quality

### 4.1 Conformance Tests

- Harness for all adapters: CRUD, delta, webhook, entitlement assign/remove.
- Golden outputs for comparison.

### 4.2 Reference Adapters

- Minimal stubs for:
  - Workday (mock)
  - BambooHR
  - Okta
  - Google Workspace

### 4.3 Tooling & Workflow

- Pre-commit hooks: secrets scan, license headers, JSON schema validation.
- CodeQL + Trivy scanning mandatory.
- Definition of Done per module (CDT, JML, Orchestration, API).
- Versioned migrations: schema semver, backwards compatibility tests.

---

## 5. Product & UX (SMB Focus)

### 5.1 Onboarding

- Guided wizard: HRIS connect → auto-map preview → confidence thresholds.
- Show drift remediation preview before commit.

### 5.2 Mapping UI

- Confidence scores visible.
- Audit trail of changes.
- Human-in-the-loop override required < 85% confidence.

### 5.3 RBAC Matrix

- Roles: Owner, Admin, Auditor, Helpdesk.
- SoD guardrails: no overlap of Admin+Auditor.

### 5.4 Pricing & Tenancy

- Define tier limits:
  - User count
  - App count
  - Webhook QPS
- Hard limits enforced, soft warnings configurable.

### 5.5 Admin Docs

- “90-Minute Launch” guide
- Rollback & disaster recovery plan for new tenants

---

## 6. Core Modules

- **CDT (Compliance Digital Twin)**: evidence-driven state machine.
- **JML (Joiner/Mover/Leaver)**: automated workflows, mapped to compliance.
- **Orchestration Graph**: action/gate/evidence/remediation model.
- **AI Policy Codex**: LLM-to-policy compiler with explainability.

---

## 7. Integrations & XaaS Protocol

- SCIM-aligned, SMB-first.
- OAuth2 + idempotency + signed webhooks.
- Endpoints: /capabilities, /schema/\*, /users, /groups, /entitlements, /assignments, /delta, /bulk.
- Mapping DSL (YAML) with human override.

---

## 8. Market & Strategy

- Competitors: Drata, Vanta, Secureframe, Tugboat, Okta, SailPoint, Lumos, Splunk SOAR, Cortex XSOAR, ServiceNow.
- Differentiation: unified CDT + JML + orchestration; SMB-first.
- TAM Models: conservative bottom-up (~$1–2B); aspirational top-down ($10B+).
- **Exit Focus**: acquisition by ServiceNow, CrowdStrike, Okta.

---

## 9. Documentation To Be Created

- `SECURITY/THREAT_MODEL.md`
- `POLICIES/OPA/*.rego`
- `VAULT/*` (policies, roles, flows)
- `DATA/RETENTION_MATRIX.md`
- `DATA/CLASSIFICATION.md`
- `SLO/SLO.md`, `SLO/alerts.yaml`
- `TESTS/xaas/` (fixtures, golden outputs)
- `INTEGRATIONS/reference/*.md`
- `OPS/DR_PLAN.md`
- `OPS/RUNBOOKS/*.md`
- `UX/ONBOARDING_WIZARD.md`
- `UX/MAPPING_UI.md`
- `.pre-commit-config.yaml`
- `MIGRATIONS/*.md`
- `RBAC/MATRIX.md`
- `LEGAL/DPA_TEMPLATE.md`, `LEGAL/BAA_READINESS.md`

---

## 10. Priority Order

1. Threat Model & OPA Bundles
2. Vault Policy Framework
3. SLOs + Alerting
4. Conformance Harness & Reference Adapters
5. DR Plan & Runbooks
6. Mapping UI & Onboarding Wizard

---

## 11. Strategic Roadmap (0–60 Months)

- **0–6 mo**: MVP (CDT + JML), 2 provisional patents, 3–5 design partners.
- **6–18 mo**: AI Policy Codex v1, patents filed, SMB tiers, $1M ARR.
- **18–36 mo**: Compliance Simulation Engine, MSSP federation, $5–10M ARR.
- **36–60 mo**: Auditless certification, behavioral agents, exit readiness.

---

## 12. Non-Negotiables

- Zero-touch, no static secrets.
- All code paths emit Evidence objects.
- No release without updated schemas & OPA tests.
- Security is a feature, not an afterthought.

---

**This document is the canonical blueprint. Agents should scaffold all listed files, workflows, and policies immediately, stubbing placeholders where implementation is pending.**
