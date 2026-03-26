-- App credentials storage for tenant integrations
-- Credentials are encrypted before storage; the encryption key is a Wrangler secret (CRED_ENCRYPTION_KEY)

CREATE TABLE IF NOT EXISTS app_credentials (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'atlasit-prod',
  app_id TEXT NOT NULL,
  credentials TEXT NOT NULL,  -- JSON blob (encrypted at rest via application-level AES-GCM)
  connected_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_test_at TEXT,
  healthy INTEGER NOT NULL DEFAULT 1,
  UNIQUE(tenant_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_app_credentials_tenant ON app_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_credentials_app ON app_credentials(app_id);

-- OAuth tokens stored separately so they can be refreshed independently
CREATE TABLE IF NOT EXISTS app_oauth_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'atlasit-prod',
  app_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TEXT,
  scope TEXT,
  raw_response TEXT,  -- full token response JSON for provider-specific fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, app_id)
);
