-- Migration 0006: Remove FK constraint on compliance_evidence and add dedup index.
--
-- The compliance_evidence table (from 0005) has FOREIGN KEY (tenant_id) REFERENCES tenants(id),
-- but the tenants table does not exist in this D1 database. Any DML (DELETE, UPDATE)
-- triggers SQLite FK validation and fails with "no such table: main.tenants".
--
-- Fix: rebuild the table without the FK using SQLite's ALTER TABLE approach.

-- 1. Create replacement table WITHOUT the FK constraint
CREATE TABLE IF NOT EXISTS compliance_evidence_rebuild (
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

-- 2. Copy all existing data
INSERT OR IGNORE INTO compliance_evidence_rebuild
  SELECT id, tenant_id, framework_id, framework, control_id, control_name,
         evidence_type, source, source_id, actor, subject, data, metadata,
         collected_at, created_at
  FROM compliance_evidence;

-- 3. Drop the old table (with the broken FK)
DROP TABLE IF EXISTS compliance_evidence;

-- 4. Rename the new table
ALTER TABLE compliance_evidence_rebuild RENAME TO compliance_evidence;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_tenant
  ON compliance_evidence(tenant_id, control_id);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_framework
  ON compliance_evidence(tenant_id, framework, control_id);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_source
  ON compliance_evidence(tenant_id, source, created_at);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_created
  ON compliance_evidence(created_at);

-- 6. Deduplicate existing rows
DELETE FROM compliance_evidence
WHERE rowid NOT IN (
  SELECT MAX(rowid)
  FROM compliance_evidence
  GROUP BY tenant_id, COALESCE(source_id, id), control_id, COALESCE(framework, framework_id)
);

-- 7. Add unique dedup index
CREATE UNIQUE INDEX IF NOT EXISTS uq_evidence_dedup
  ON compliance_evidence(tenant_id, source_id, control_id, framework);
