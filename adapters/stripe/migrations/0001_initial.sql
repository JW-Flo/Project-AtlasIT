-- Adapter runtime tables
CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  connector_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant_connector
  ON sync_jobs(tenant_id, connector_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS connector_tokens (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  connector_slug TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
