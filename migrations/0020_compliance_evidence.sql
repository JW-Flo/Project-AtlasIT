-- Migration: compliance_evidence
-- Stores automation-emitted compliance evidence rows in ATLAS_SHARED_DB.
-- Each successful automation action inserts one row per mapped compliance control.
-- Used by compliance-worker to surface automation-verified coverage alongside
-- manually linked evidence from control_evidence_links.

CREATE TABLE IF NOT EXISTS compliance_evidence (
  id          TEXT    NOT NULL PRIMARY KEY,
  tenant_id   TEXT    NOT NULL,
  framework   TEXT    NOT NULL,   -- 'SOC2' | 'ISO27001' | 'NIST_CSF' | 'HIPAA' | 'GDPR'
  control_id  TEXT    NOT NULL,   -- e.g. 'CC6.1', 'A.9.2.2', 'PR.AC-1'
  evidence_type TEXT  NOT NULL,   -- 'access_grant' | 'access_revoke' | 'offboarding' | etc.
  action_type TEXT    NOT NULL,   -- e.g. 'provision_app_access', 'revoke_app_access'
  execution_id TEXT,              -- automation_executions.id that produced this evidence
  source      TEXT    NOT NULL DEFAULT 'automation',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_tenant_ts
  ON compliance_evidence (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_control
  ON compliance_evidence (tenant_id, framework, control_id);
