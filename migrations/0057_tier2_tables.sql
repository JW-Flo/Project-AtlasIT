-- Migration 0057 — Tier 2 tables (MFA, SSO, directory mappings, support, DSAR)
--
-- Backs the endpoints previously stubbed in the SPA fetch interceptor:
--   /api/auth/mfa/*, /api/tenant/sso, /api/directory/mappings,
--   /api/support, /api/privacy
--
-- All tables are tenant-scoped. Every query in routes.ts MUST filter by
-- tenant_id (enforced by auth middleware extracting tenantId from JWT).

-- ── MFA enrollment per user ──────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS mfa_enrollments (
  user_id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  secret_hash TEXT NOT NULL,              -- SHA-256 of the TOTP secret, never the raw secret
  recovery_codes TEXT[] NOT NULL DEFAULT '{}',  -- hashed recovery codes
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mfa_enrollments_tenant ON mfa_enrollments(tenant_id);

-- ── SSO configuration per tenant ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sso_configs (
  tenant_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('saml', 'oidc')),
  entity_id TEXT,                         -- SP/IdP entity ID
  metadata_url TEXT,                      -- IdP metadata endpoint
  metadata_xml TEXT,                      -- cached parsed metadata
  sso_url TEXT,                           -- IdP SSO endpoint
  sso_certificate TEXT,                   -- IdP signing cert (PEM)
  attribute_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Directory → app group mappings ───────────────────────────────────────
-- Maps a directory group (from a connected IdP) to an application role/group.
CREATE TABLE IF NOT EXISTS directory_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  directory_group_id TEXT NOT NULL,       -- from directory_groups.external_id
  directory_group_name TEXT,
  app_provider TEXT NOT NULL,             -- e.g. "slack", "github"
  app_role TEXT NOT NULL,                 -- target role in the app
  auto_provision BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, directory_group_id, app_provider)
);
CREATE INDEX IF NOT EXISTS idx_directory_mappings_tenant ON directory_mappings(tenant_id);

-- ── Support tickets ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  submitted_by_id UUID,
  submitted_by_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_status ON support_tickets(tenant_id, status);

-- ── DSAR (GDPR/CCPA data subject access requests) ────────────────────────
CREATE TABLE IF NOT EXISTS dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'deletion', 'portability', 'correction')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'verifying', 'in_progress', 'fulfilled', 'rejected')),
  verification_token TEXT,                -- sent via email to confirm requester identity
  verified_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  artifacts_ref TEXT,                     -- S3 key for export artifacts (access/portability)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_tenant_status ON dsar_requests(tenant_id, status);
