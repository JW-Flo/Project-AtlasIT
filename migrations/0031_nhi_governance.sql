-- Phase 11: Non-Human Identity Governance
-- Extends directory to track service accounts, API keys, bot users, and OAuth grants

-- Add identity_type to directory_users
ALTER TABLE directory_users ADD COLUMN identity_type TEXT DEFAULT 'human';
-- Values: human | service | bot | api_key | oauth_grant

-- NHI credential metadata (linked to directory_users for NHI entries)
CREATE TABLE IF NOT EXISTS nhi_credentials (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  directory_user_id TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  owner_email TEXT,
  scopes TEXT,
  permissions TEXT,
  expires_at TEXT,
  last_used_at TEXT,
  last_rotated_at TEXT,
  risk_score INTEGER DEFAULT 0,
  risk_factors TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_nhi_creds_tenant ON nhi_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nhi_creds_expires ON nhi_credentials(tenant_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_nhi_creds_status ON nhi_credentials(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_nhi_creds_dir_user ON nhi_credentials(directory_user_id);

-- NHI audit log for lifecycle events
CREATE TABLE IF NOT EXISTS nhi_audit_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  credential_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nhi_audit_tenant ON nhi_audit_log(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_nhi_audit_cred ON nhi_audit_log(credential_id);
