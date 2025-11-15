# NIST Automation

## Overview

AtlasIT's autonomous framework implements NIST 800-53 controls through automated evidence collection, validation, and compliance reporting. This document maps our autonomous operations to NIST control families and describes verification mechanisms.

## Control Family Mapping

### AU - Audit and Accountability

**AU-2: Audit Events**

- **Implementation**: All agent actions emit evidence to `.evidence/` directory
- **Automation**: `scripts/emit-evidence.ts` generates structured audit records
- **Verification**: `scripts/nist-verify.ts` validates evidence completeness

**AU-3: Content of Audit Records**

- **Implementation**: Evidence schema includes trace_id, timestamp, agent, action, result
- **Format**: JSON conforming to `EVIDENCE_SCHEMA.json`
- **Fields**: trace_id (UUID), control_id, timestamp (ISO8601), tenant_id, subject_id

**AU-6: Audit Review, Analysis, and Reporting**

- **Implementation**: CI workflow validates evidence on every PR
- **Automation**: Merge orchestrator blocks PRs with missing/invalid evidence
- **Reporting**: Automated compliance snapshot generation

**AU-12: Audit Generation**

- **Implementation**: Evidence generated at the point of action
- **Coverage**: Router decisions, drift fixes, deployments, approvals
- **Retention**: Permanent storage in repository history

### AC - Access Control

**AC-2: Account Management**

- **Implementation**: GitHub OIDC for agent identity
- **Automation**: Token rotation via GitHub Actions secrets
- **Audit**: All agent actions tied to service account identity

**AC-3: Access Enforcement**

- **Implementation**: Severity-based approval requirements
- **Automation**: Merge orchestrator enforces approval policies
- **Evidence**: Approval decisions logged with trace_id

**AC-6: Least Privilege**

- **Implementation**: Agents scoped to minimum required permissions
- **Worker Bindings**: KV read-only for routing rules
- **GitHub Tokens**: Scoped to repository operations only

### CM - Configuration Management

**CM-2: Baseline Configuration**

- **Implementation**: Drift detection against canonical structure
- **Automation**: Weekly scans with auto-fix PR generation
- **Evidence**: Drift detection results stored in `.evidence/`

**CM-3: Configuration Change Control**

- **Implementation**: All changes via PR with routing and approval
- **Automation**: Router assigns reviewers based on severity
- **Validation**: OPA policies enforce schema compliance

**CM-6: Configuration Settings**

- **Implementation**: Wrangler.toml for worker configuration
- **Versioning**: All config in git with commit history
- **Validation**: Type-safe configuration via TypeScript

### RA - Risk Assessment

**RA-5: Vulnerability Scanning**

- **Implementation**: CodeQL on all TypeScript changes
- **Automation**: Security workflow runs on PR
- **Blocking**: High/critical vulnerabilities block merge

**RA-3: Risk Assessment**

- **Implementation**: Severity computation in router worker
- **Criteria**: File patterns, keywords, change scope
- **Evidence**: Routing decisions with severity justification

### SI - System and Information Integrity

**SI-3: Malicious Code Protection**

- **Implementation**: Secret scanning, prohibited pattern detection
- **Automation**: Pre-commit hooks and CI validation
- **Blocking**: Prohibited patterns prevent merge

**SI-7: Software, Firmware, and Information Integrity**

- **Implementation**: Evidence hash validation
- **Automation**: Merge orchestrator verifies evidence chain
- **Tampering Detection**: Hashes prevent evidence modification

## Evidence Validation

### NIST Verify Script

`scripts/nist-verify.ts` performs automated compliance validation:

```typescript
export interface NISTVerificationResult {
  control_family: string;
  control_id: string;
  status: "compliant" | "non_compliant" | "not_applicable";
  evidence_count: number;
  evidence_refs: string[];
  verification_timestamp: string;
}

export async function verifyNISTCompliance(
  controlFamily: string
): Promise<NISTVerificationResult[]> {
  // Load evidence artifacts from .evidence/
  // Match evidence to control requirements
  // Validate evidence completeness and format
  // Return verification results
}
```

### Verification Criteria

| Control | Required Evidence  | Validation                        |
| ------- | ------------------ | --------------------------------- |
| AU-2    | Agent action logs  | trace_id present, timestamp valid |
| AU-3    | Structured records | Schema validation passes          |
| AC-3    | Approval records   | Severity matched to approver role |
| CM-2    | Drift scans        | Weekly execution, results stored  |
| CM-3    | PR routing         | All PRs have routing decision     |
| RA-5    | Security scans     | CodeQL results for code changes   |
| SI-3    | Secret scans       | No secrets detected               |

## Automation Workflows

### CI Workflow (`.github/workflows/ci.yml`)

NIST controls enforced:

- **AU-2**: Evidence emission on build/test
- **SI-3**: Secret and prohibited pattern scanning
- **CM-6**: Configuration validation

### Merge Orchestrator (`.github/workflows/merge-orchestrator.yml`)

NIST controls enforced:

- **AC-3**: Approval enforcement
- **CM-3**: Change control validation
- **SI-7**: Evidence integrity verification
- **CM-2**: Drift PR blocking

### Agent Events (`.github/workflows/agent-events.yml`)

NIST controls enforced:

- **AU-12**: Routing decision evidence
- **RA-3**: Risk assessment execution

## Compliance Reporting

### Automated Snapshot Generation

```bash
npm run render:compliance
```

Produces markdown report with:

- Control family compliance status
- Evidence count by control
- Gaps and remediation actions
- Compliance trend over time

### Evidence Query

```typescript
// Query evidence by control family
const auditEvidence = await queryEvidence({ control_family: "AU" });

// Query evidence by date range
const recentEvidence = await queryEvidence({
  start_date: "2025-01-01",
  end_date: "2025-01-31",
});

// Query evidence by agent
const routerEvidence = await queryEvidence({ agent: "router-worker" });
```

## Compliance Gaps and Remediation

### Current State

- ✅ AU-2, AU-3: Evidence generation framework in place
- ✅ AC-6: Least privilege via scoped tokens
- ✅ CM-6: Version-controlled configuration
- ⚠️ AU-6: Manual audit review (automating in Phase 1)
- ⚠️ CM-2: Drift detection spec defined (implementing in Phase 1)
- ❌ SI-7: Evidence integrity hashing (planned for Phase 2)

### Remediation Plan

**Phase 1 (Q1 2025)**:

- Implement drift detection automation
- Deploy evidence hash validation
- Enable automated audit review

**Phase 2 (Q2 2025)**:

- Integrate with SIEM for real-time alerting
- Implement evidence retention policies
- Automate compliance report generation

## Testing

### NIST Verification Test

```bash
npm run test:nist-verify
```

Expected output:

```json
{
  "control_families_tested": ["AU", "AC", "CM", "RA", "SI"],
  "total_controls": 12,
  "compliant": 8,
  "non_compliant": 2,
  "not_applicable": 2,
  "evidence_artifacts": 45
}
```

### Evidence Schema Validation

All evidence must pass JSON schema validation against `EVIDENCE_SCHEMA.json`.

## References

- NIST SP 800-53 Rev. 5: [https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- AtlasIT Evidence Schema: `EVIDENCE_SCHEMA.json`
- Compliance Snapshot: `docs/COMPLIANCE_SNAPSHOT.md`
