-- Migration 0055 — Attestations
--
-- Formal records of tenant-signed statements about compliance controls.
-- Each attestation creates a compliance_evidence record (impact=positive),
-- and on revocation creates a corresponding negative-impact evidence record.
--
-- Example: "CEO attested that SOC 2 CC1.3 access-review Q1 2026 was completed
-- for all privileged users" — signed, timestamped, with evidence pointers.

CREATE TABLE IF NOT EXISTS attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  control_id TEXT NOT NULL,
  attestation_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  statement TEXT NOT NULL,
  attested_by_id TEXT NOT NULL,
  attested_by_email TEXT,
  attested_by_name TEXT,
  attested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  evidence_ref_ids TEXT[] NOT NULL DEFAULT '{}',
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attestations_tenant ON attestations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attestations_framework ON attestations(tenant_id, framework);
CREATE INDEX IF NOT EXISTS idx_attestations_status ON attestations(tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_key_unique
  ON attestations(tenant_id, attestation_key) WHERE status = 'active';
