-- console_users — previously created inline via CREATE TABLE IF NOT EXISTS
-- in the login handler. Formalize as a proper migration.
-- NOTE: email is UNIQUE globally per the original schema. M-4 flags this as a
-- conflict with multi-tenant flows (invite/SSO scope by tenant_id). A follow-up
-- migration should add a UNIQUE(tenant_id, email) composite index instead.

CREATE TABLE IF NOT EXISTS console_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT,
  roles TEXT NOT NULL DEFAULT '["admin"]',
  tenant_id TEXT NOT NULL DEFAULT 'atlasit-prod',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

CREATE INDEX IF NOT EXISTS idx_console_users_email ON console_users(email);
CREATE INDEX IF NOT EXISTS idx_console_users_tenant ON console_users(tenant_id);
