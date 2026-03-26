-- Compliance evidence table: links automation actions and workflow events to
-- compliance framework controls, enabling zero-config coverage scoring.
--
-- Populated by:
--   1. automation-evaluator (after successful action execution)
--   2. compliance-worker webhook route (/api/v1/webhooks/evidence)
--   3. Future: WorkflowDO emit_evidence step

CREATE TABLE IF NOT EXISTS compliance_evidence (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  -- framework_id kept for backward compat with webhook route; new rows use framework
  framework_id  TEXT,
  framework     TEXT,
  control_id    TEXT NOT NULL,
  control_name  TEXT,
  evidence_type TEXT,
  -- source: 'automation' | 'workflow' | 'adapter' | 'manual' | 'webhook'
  source        TEXT NOT NULL DEFAULT 'manual',
  -- source_id: automation rule id, workflow run id, etc.
  source_id     TEXT,
  -- actor: user email or 'system'
  actor         TEXT,
  -- subject: affected user email or resource description
  subject       TEXT,
  -- data / metadata JSON blob (data kept for backward compat)
  data          TEXT,
  metadata      TEXT,
  collected_at  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_tenant
  ON compliance_evidence(tenant_id, control_id);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_framework
  ON compliance_evidence(tenant_id, framework, control_id);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_source
  ON compliance_evidence(tenant_id, source, created_at);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_created
  ON compliance_evidence(created_at);
