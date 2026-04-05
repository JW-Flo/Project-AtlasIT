-- MFA TOTP secrets and recovery codes
CREATE TABLE IF NOT EXISTS mfa_totp_secrets (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  enabled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_user ON mfa_recovery_codes(user_id);

-- Partial auth tokens (short-lived, stored in D1 to avoid KV latency for MFA challenge)
CREATE TABLE IF NOT EXISTS mfa_challenges (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_data TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires ON mfa_challenges(expires_at);
