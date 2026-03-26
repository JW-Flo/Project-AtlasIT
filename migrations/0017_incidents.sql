CREATE TABLE IF NOT EXISTS incidents (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'medium'
    CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK(status IN ('open', 'investigating', 'resolved')),
  source      TEXT,       -- 'automation', 'compliance', 'manual'
  source_id   TEXT,       -- rule_id or compliance control
  description TEXT,
  auto_resolve INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_incidents_tenant  ON incidents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);
