-- Migration 0014: Track dismissed automation suggestions per tenant
-- Prevents dismissed suggestions from reappearing on page reload

CREATE TABLE IF NOT EXISTS dismissed_suggestions (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  template_id TEXT NOT NULL,
  dismissed_by TEXT,
  dismissed_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(tenant_id, template_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_dismissed_suggestions_tenant ON dismissed_suggestions(tenant_id);
