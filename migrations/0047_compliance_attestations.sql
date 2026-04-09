-- Manual attestation records for governance controls that can't be auto-detected.
-- Each attestation provides evidence for a specific CDT control payload field
-- and feeds into the CDT evaluation pipeline via the compliance_evidence table.

CREATE TABLE IF NOT EXISTS compliance_attestations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  control_id TEXT NOT NULL,
  attestation_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  attested_by TEXT NOT NULL,
  evidence_summary TEXT,
  metadata TEXT DEFAULT '{}',
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, control_id, attestation_key)
);

CREATE INDEX IF NOT EXISTS idx_attestations_tenant ON compliance_attestations(tenant_id, framework);
CREATE INDEX IF NOT EXISTS idx_attestations_expiry ON compliance_attestations(tenant_id, status, expires_at);
