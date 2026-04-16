-- Migration 0062: Trust Center — NDA / access request workflow
-- Stores visitor requests for detailed evidence access.
-- Tenant admins approve or deny via console. Approved requests get a signed, time-limited URL.

CREATE TABLE IF NOT EXISTS trust_access_requests (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requester_name    TEXT NOT NULL,
  requester_email   TEXT NOT NULL,
  requester_company TEXT NOT NULL,
  reason            TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'denied')),
  -- Generated on approval: HMAC-signed token granting time-limited PDF access
  access_token      TEXT,
  expires_at        TIMESTAMPTZ,
  -- Admin action metadata
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_access_requests_tenant
  ON trust_access_requests (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trust_access_requests_token
  ON trust_access_requests (access_token)
  WHERE access_token IS NOT NULL;
