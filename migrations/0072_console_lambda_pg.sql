-- PG-native tables for console-app Lambda (replaces D1 + KV_SESSIONS)

-- Sessions table (replaces Cloudflare KV_SESSIONS)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- console_users with PG types (IF NOT EXISTS — safe if 0048 already ran on PG)
CREATE TABLE IF NOT EXISTS console_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT,
  roles JSONB NOT NULL DEFAULT '["admin"]',
  tenant_id TEXT NOT NULL DEFAULT 'atlasit-prod',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_console_users_email ON console_users(email);
CREATE INDEX IF NOT EXISTS idx_console_users_tenant ON console_users(tenant_id);

-- MFA TOTP secrets with PG types
CREATE TABLE IF NOT EXISTS mfa_totp_secrets (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MFA recovery codes
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_user ON mfa_recovery_codes(user_id);

-- MFA challenges (short-lived)
CREATE TABLE IF NOT EXISTS mfa_challenges (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires ON mfa_challenges(expires_at);

-- Cleanup function for expired sessions (run via scheduler)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  DELETE FROM mfa_challenges WHERE expires_at < NOW();
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
