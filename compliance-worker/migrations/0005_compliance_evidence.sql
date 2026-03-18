-- Mirror of migrations/0020_compliance_evidence.sql for D1_COMPLIANCE fallback path.
-- When ATLAS_SHARED_DB is unavailable, compliance-worker can query this local copy.

CREATE TABLE IF NOT EXISTS compliance_evidence (
  id          TEXT    NOT NULL PRIMARY KEY,
  tenant_id   TEXT    NOT NULL,
  framework   TEXT    NOT NULL,
  control_id  TEXT    NOT NULL,
  evidence_type TEXT  NOT NULL,
  action_type TEXT    NOT NULL,
  execution_id TEXT,
  source      TEXT    NOT NULL DEFAULT 'automation',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_tenant_ts
  ON compliance_evidence (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_control
  ON compliance_evidence (tenant_id, framework, control_id);
