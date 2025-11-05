# AtlasIT Roadmap

**Status**: Baseline  
**Owner**: Product Team  
**Last Updated**: 2025-11-05

## Current Phase: PR0-PR6 (Baseline & Foundation)

### PR0: Bootstrap & Baseline ✅ (Current)

**Goal**: Establish agent conventions, docs skeleton, and minimal JML stub with evidence.

**Deliverables**:

- `/atlasit` docs structure (ARCHITECTURE, ROADMAP, SECURITY)
- Minimal Joiner stub with mock adapters
- Evidence helper script (SHA-256 hashing)
- CI workflow with lint/test/CodeQL/Trivy placeholders
- `ops/hand-off.md` with command plan
- Evidence artifacts: `EV-joiner-stub.json`, `EV-local-test.json`

**Status**: In Progress

---

### PR3: Core JML Workflows

**Goal**: Implement full Joiner/Mover/Leaver workflows with real adapter integration.

**Scope**:

- Complete JML Engine with Durable Objects
- Okta + Google Workspace adapters (non-mock)
- Retry logic, compensation, DLQ
- Evidence generation per workflow step

**Dependencies**: PR0 baseline

**Target**: Q1 2026

---

### PR4: Policy Engine & Compliance

**Goal**: Production-ready policy evaluation and compliance snapshot generation.

**Scope**:

- Policy pack versioning and storage
- CEL evaluation engine
- SOC2 control mapping
- Nightly compliance snapshots
- Evidence linking to controls

**Dependencies**: PR3 workflows

**Target**: Q1 2026

---

### PR5: Vault Integration & Secrets Management

**Goal**: Replace all static secrets with dynamic credentials from HashiCorp Vault.

**Scope**:

- Vault connection via OIDC
- Dynamic Okta credentials
- API key rotation automation
- Secrets audit trail

**Dependencies**: PR0, PR3

**Target**: Q2 2026

---

### PR6: Observability & Monitoring

**Goal**: Production-grade observability for all workflows and adapters.

**Scope**:

- OpenTelemetry instrumentation
- Analytics Engine metrics
- Alerting via PagerDuty/Slack
- SLA tracking dashboards

**Dependencies**: PR3, PR4

**Target**: Q2 2026

---

## Long-Term Vision (H2 2026+)

### Multi-Tenant Platform

- Tenant onboarding UI
- Self-service policy authoring
- Marketplace for adapters
- White-label deployment options

### AI-Driven Automation

- Policy recommendation engine
- Anomaly detection in JML workflows
- Natural language policy queries
- Automated remediation suggestions

### Enterprise Features

- Multi-region deployment
- Advanced RBAC with custom roles
- Audit log export (SIEM integration)
- Enterprise SSO (SAML, OIDC)

### Compliance Certifications

- SOC2 Type II audit completion
- ISO 27001 certification
- GDPR compliance validation
- HIPAA BAA support

---

## Success Metrics

- **Joiner workflow**: <5min end-to-end (P95)
- **Evidence generation**: 100% of actions
- **Policy evaluation**: <500ms (P99)
- **Uptime**: 99.9% SLA
- **Compliance coverage**: 95% of SOC2 controls

---

## References

- [Architecture](ARCHITECTURE.md)
- [Security Model](SECURITY.md)
- [Product Roadmap](../docs/product-roadmap.md)
