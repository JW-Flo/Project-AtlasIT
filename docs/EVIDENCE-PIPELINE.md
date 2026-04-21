# Evidence Collection Pipeline

## Overview

The AtlasIT evidence pipeline collects compliance evidence from multiple sources and feeds it into the compliance scoring engine. All evidence flows into the `compliance_evidence` PostgreSQL table, which the compliance-api Lambda reads to calculate control scores.

## Evidence Sources

### 1. **IdP Adapters** (Okta, Azure AD, Google Workspace)

**Location**: `lambdas/adapter-okta/src/routes.ts`, `lambdas/adapter-github/src/routes.ts`

**How it works**:

- Adapters sync users/groups from IdP on schedule (5-minute cron or on-demand via `/api/v1/sync`)
- For each synced user/group, adapter generates evidence rows via `evidenceForUser()` and `evidenceForGroup()` functions
- Evidence maps IdP activity to compliance controls:
  - User provisioning → `PR.AC-1` (NIST CSF), `CC6.1` (SOC2), `A.9.2.2` (ISO27001), `164.312.a1` (HIPAA)
  - MFA enforcement → `PR.AC-7`, `CC6.2`, `A.9.4.2`, `164.312.a2`
  - Group-based access → `PR.AC-4`, `A.9.2.6`
- Bulk INSERT via `writeEvidence()` function:
  ```sql
  INSERT INTO compliance_evidence
    (id, tenant_id, framework, control_id, evidence_type, source, source_id, actor, metadata, created_at)
  VALUES ...
  ON CONFLICT DO NOTHING
  ```

**Evidence schema**:

```typescript
{
  controlId: "CC6.1",           // Short control ref
  framework: "SOC2",            // Framework name
  eventType: "okta.user.active",// Event identifier
  impact: "positive",           // positive/neutral/negative
  reasoning: "Okta enforces...",// Human-readable rationale
  actor: "user@example.com",    // Who/what triggered
  source: "okta"                // Source adapter
}
```

### 2. **Platform State Probes**

**Location**: `packages/shared/src/evidence/platform-state-collector.ts`

**How it works**:

- Scheduled cron (orchestrator Lambda) runs `collectPlatformStateEvidence()` every 5 minutes
- Executes 12 structural probes against PostgreSQL:
  - Audit logging active (`audit_log` table has recent entries)
  - RBAC groups configured (`directory_groups` table has rows)
  - Password policies enforced (`tenant_preferences.password_policy` set)
  - Encryption at rest (`tenant_preferences.encryption_enabled`)
  - Session timeout configured (`tenant_preferences.session_timeout_minutes`)
  - MFA enforced (`tenant_preferences.mfa_required`)
- Each passing probe writes evidence to `compliance_evidence` with `source='platform_state'`

**Evidence schema**:

```sql
INSERT INTO compliance_evidence
  (id, tenant_id, framework, control_id, evidence_type, source, source_id, metadata, created_at)
VALUES
  ('state-<tenant>-<probe>-<control>', tenant_id, 'SOC2', 'CC6.1', 'configuration', 'platform_state', 'state:audit_enabled:SOC2-CC6.1', '{"probeId":"audit_enabled","decision":"pass"}', NOW())
```

### 3. **Application Integrations** (Jira, GitHub, Stripe, AWS)

**Location**: `adapters/jira/src/index.ts`, `adapters/aws/src/index.ts`, etc.

**How it works**:

- Similar to IdP adapters, but collect app-specific evidence:
  - Jira: Issue tracking workflows, project security settings
  - GitHub: Branch protection, code review enforcement, security scanning
  - Stripe: PCI compliance settings, payment method security
  - AWS: IAM policies, encryption settings, VPC security groups
- Evidence written via same `compliance_evidence` INSERT pattern

### 4. **Audit Trail Evidence**

**Location**: `console-app/src/lib/server/audit.ts`

**How it works**:

- Platform actions trigger `writeAuditPg()` which dual-writes:
  1. `audit_log` table (raw audit trail)
  2. `compliance_evidence` table (when action maps to a control)
- Mapping via `lookupAuditEvidence()` from `@atlasit/shared`:
  - `access_review.campaign_created` → `A.9.2.5` (ISO27001)
  - `user.mfa_enabled` → `PR.AC-7` (NIST CSF)
  - `policy.published` → `CC1.2` (SOC2)

## Compliance Scoring Engine

**Location**: `lambdas/compliance-api/src/routes.ts`

**How it works**:

1. **Evidence Aggregation** (lines 4448-4466):

   ```sql
   SELECT framework, control_id, COUNT(*) as evidence_count
   FROM compliance_evidence
   WHERE tenant_id = $1
   GROUP BY framework, control_id
   ```

2. **Status Calculation**:
   - `evidence_count = 0` → `not_started`
   - `evidence_count >= 1` → `implemented`
   - `evidence_count >= 3` → `verified` (requires manual attestation OR 3+ evidence items)

3. **Weighted Scoring**:
   - `not_started` = 0 points
   - `in_progress` = 0.25 points
   - `implemented` = 0.75 points
   - `verified` = 1.0 point
   - Framework score = `(sum of control scores) / (total controls)`

4. **Hybrid CDT Evaluation** (lines 481-520):
   - For each control, check `compliance_evidence.metadata.impact`:
     - `impact='positive'` → pass
     - `impact='negative'` → fail
     - `impact='neutral'` → rely on CDT rule decision
   - CDT rules (64 total) in `shared/services/cdt/` provide structured evaluation

## Evidence Collection Triggers

### Scheduled (Cron)

- **Every 5 minutes**: IdP sync (Okta, Azure AD, Google Workspace)
- **Every 5 minutes**: Platform state probes
- **Daily at 02:00 UTC**: Full compliance re-evaluation

### On-Demand

- **POST `/api/v1/directory/sync`**: Trigger immediate IdP sync
- **POST `/api/v1/evidence/collect`**: Force evidence collection
- **POST `/api/v1/integrations/:id/sync`**: Sync specific integration

### Real-Time

- **Platform actions**: Audit log events create evidence immediately
- **User actions**: Access reviews, policy changes, MFA setup

## Verification Checklist

To verify evidence pipeline is working end-to-end:

1. **Check adapters are syncing**:

   ```sql
   SELECT source, COUNT(*) as count, MAX(created_at) as last_evidence
   FROM compliance_evidence
   WHERE tenant_id = 'development'
   GROUP BY source;
   ```

2. **Check platform probes are running**:

   ```sql
   SELECT *
   FROM compliance_evidence
   WHERE tenant_id = 'development'
     AND source = 'platform_state'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Check compliance scores reflect evidence**:

   ```sql
   SELECT framework, score, grade, evaluated_at
   FROM compliance_scores
   WHERE tenant_id = 'development'
   ORDER BY evaluated_at DESC
   LIMIT 5;
   ```

4. **Check audit trail creates evidence**:
   ```sql
   SELECT a.action, e.control_id, e.framework
   FROM audit_log a
   LEFT JOIN compliance_evidence e
     ON e.source_id = CONCAT('audit:', a.id)
   WHERE a.tenant_id = 'development'
   ORDER BY a.created_at DESC
   LIMIT 10;
   ```

## Troubleshooting

### No evidence from adapters

- Check integration status: `SELECT * FROM integrations WHERE tenant_id = 'development' AND status = 'active'`
- Check adapter Lambda logs for sync errors
- Verify adapter API credentials in `integrations.config` column

### Platform probes not running

- Check orchestrator Lambda cron schedule in `infra/aws/scheduler.tf`
- Verify `automation_rules` table has probe definitions
- Check orchestrator Lambda logs for execution errors

### Compliance scores not updating

- Evidence may exist but evaluation hasn't run
- Trigger manual evaluation: `POST /api/v1/compliance/evaluate`
- Check `compliance_score_snapshots` table for last evaluation timestamp

## Data Flow Diagram

```
┌─────────────────┐
│  IdP Adapters   │  (Okta, Azure AD)
│  (5-min cron)   │
└────────┬────────┘
         │ writeEvidence()
         ▼
┌─────────────────┐
│ Platform Probes │  (audit_log, RBAC checks)
│  (5-min cron)   │
└────────┬────────┘
         │ collectPlatformStateEvidence()
         ▼
┌─────────────────────────────┐
│  compliance_evidence table  │  ← Single source of truth
└────────┬────────────────────┘
         │ SELECT ... GROUP BY control_id
         ▼
┌─────────────────────────────┐
│  compliance-api Lambda      │  (scoring engine)
│  Hybrid CDT evaluator       │
└────────┬────────────────────┘
         │ INSERT compliance_scores
         ▼
┌─────────────────────────────┐
│  compliance_scores table    │  → Dashboard display
└─────────────────────────────┘
```

## Summary

✅ **IdP adapters** collect identity/access evidence from Okta, Azure AD, Google Workspace
✅ **Platform probes** collect structural configuration evidence (audit logs, RBAC, encryption)
✅ **Application integrations** collect app-specific evidence (GitHub, Jira, AWS, Stripe)
✅ **Audit trail** emits evidence for platform actions (access reviews, policy changes)
✅ **All evidence** flows into `compliance_evidence` PostgreSQL table
✅ **Compliance engine** reads evidence, calculates control scores, updates `compliance_scores`
✅ **Dashboard** displays framework scores, control status, evidence counts

The evidence pipeline is **PostgreSQL-native**, **adapter-agnostic**, and **framework-independent**. All evidence sources write to the same table schema, and the scoring engine treats all evidence equally regardless of source.
