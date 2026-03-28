-- The compliance_evidence table from 0005 may not exist in this D1 database
-- because it has a FOREIGN KEY referencing tenants(id) which doesn't exist here.
-- Recreate the table without the FK constraint, then add the dedup index.

CREATE TABLE IF NOT EXISTS compliance_evidence (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  framework_id  TEXT,
  framework     TEXT,
  control_id    TEXT NOT NULL,
  control_name  TEXT,
  evidence_type TEXT,
  source        TEXT NOT NULL DEFAULT 'manual',
  source_id     TEXT,
  actor         TEXT,
  subject       TEXT,
  data          TEXT,
  metadata      TEXT,
  collected_at  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_tenant
  ON compliance_evidence(tenant_id, control_id);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_framework
  ON compliance_evidence(tenant_id, framework, control_id);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_source
  ON compliance_evidence(tenant_id, source, created_at);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_created
  ON compliance_evidence(created_at);

-- Deduplicate existing rows before adding unique constraint
DELETE FROM compliance_evidence
WHERE rowid NOT IN (
  SELECT MAX(rowid)
  FROM compliance_evidence
  GROUP BY tenant_id, COALESCE(source_id, id), control_id, COALESCE(framework, framework_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_evidence_dedup
  ON compliance_evidence(tenant_id, source_id, control_id, framework);
