-- Tenant preferences — previously created ad-hoc via CREATE TABLE IF NOT EXISTS
-- in API route handlers. Formalize as a proper migration so all workers and
-- cron jobs can rely on the table existing.

CREATE TABLE IF NOT EXISTS tenant_preferences (
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id, key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_preferences_tenant ON tenant_preferences(tenant_id);
