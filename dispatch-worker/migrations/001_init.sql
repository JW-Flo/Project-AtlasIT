-- Initial schema for dispatch worker multi-tenant platform
-- Idempotent creation of core tables

CREATE TABLE IF NOT EXISTS tenant_api_keys (
  tenant_id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  daily_quota INTEGER NOT NULL DEFAULT 5000,
  remaining_today INTEGER NOT NULL DEFAULT 5000,
  last_reset_utc TEXT
);

CREATE TABLE IF NOT EXISTS tenant_scripts (
  script_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  script_name TEXT NOT NULL,
  created_ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- circuit breaker fields added in later migration
  CONSTRAINT fk_ts_tenant FOREIGN KEY (tenant_id) REFERENCES tenant_api_keys(tenant_id)
);

CREATE TABLE IF NOT EXISTS tenant_script_versions (
  script_id TEXT NOT NULL,
  version TEXT NOT NULL,
  deployed_ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (script_id, version),
  CONSTRAINT fk_tsv_script FOREIGN KEY (script_id) REFERENCES tenant_scripts(script_id)
);

CREATE TABLE IF NOT EXISTS tenant_invocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  duration_ms INTEGER,
  status_code INTEGER,
  ok INTEGER,
  CONSTRAINT fk_ti_script FOREIGN KEY (script_id) REFERENCES tenant_scripts(script_id)
);

-- Indexes for query patterns
CREATE INDEX IF NOT EXISTS idx_invocations_ts ON tenant_invocations (ts);
CREATE INDEX IF NOT EXISTS idx_invocations_script ON tenant_invocations (script_id);
CREATE INDEX IF NOT EXISTS idx_invocations_tenant ON tenant_invocations (tenant_id);
