-- Compliance scoring tables for per-tenant, per-framework score tracking and history

CREATE TABLE IF NOT EXISTS compliance_scores (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 100,
  grade TEXT NOT NULL DEFAULT 'F',
  controls_total INTEGER NOT NULL DEFAULT 0,
  controls_implemented INTEGER NOT NULL DEFAULT 0,
  controls_verified INTEGER NOT NULL DEFAULT 0,
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, framework)
);

CREATE INDEX IF NOT EXISTS idx_compliance_scores_tenant ON compliance_scores(tenant_id);

CREATE TABLE IF NOT EXISTS compliance_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  score REAL NOT NULL,
  grade TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_history_tenant ON compliance_history(tenant_id, framework, recorded_at);
