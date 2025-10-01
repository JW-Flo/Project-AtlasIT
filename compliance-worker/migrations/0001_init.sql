-- D1 initial schema for compliance snapshot & evidence index
-- Idempotent: IF NOT EXISTS guards

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL UNIQUE,
  generated_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  pack TEXT NOT NULL,
  subject_ref TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_tenant_created ON evidence_index (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_pack_created ON evidence_index (pack, created_at DESC);
