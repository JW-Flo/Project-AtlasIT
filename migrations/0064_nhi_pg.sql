-- PostgreSQL version of NHI governance tables

-- Add identity_type to directory_users if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='directory_users' AND column_name='identity_type') THEN
    ALTER TABLE directory_users ADD COLUMN identity_type TEXT DEFAULT 'human';
  END IF;
END $$;

-- NHI credential metadata
CREATE TABLE IF NOT EXISTS nhi_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  directory_user_id TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  owner_email TEXT,
  scopes JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_rotated_at TIMESTAMPTZ,
  risk_score INTEGER DEFAULT 0,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_nhi_creds_tenant ON nhi_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nhi_creds_expires ON nhi_credentials(tenant_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_nhi_creds_status ON nhi_credentials(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_nhi_creds_dir_user ON nhi_credentials(directory_user_id);

-- NHI audit log
CREATE TABLE IF NOT EXISTS nhi_audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  credential_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nhi_audit_tenant ON nhi_audit_log(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_nhi_audit_cred ON nhi_audit_log(credential_id);
