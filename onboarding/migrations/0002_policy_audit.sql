-- Migration 0002: policy baselines & audit events + session enrichment
-- Adds tables: policy_baselines, audit_events
-- Alters onboarding_sessions with answers_json + policy_baseline_id (nullable fk)

PRAGMA foreign_keys=OFF; -- D1/SQLite: alter pattern via table copy if needed

-- Create policy_baselines table
CREATE TABLE IF NOT EXISTS policy_baselines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  controls_json TEXT NOT NULL, -- JSON string of baseline controls
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(tenant_id, version),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_policy_baselines_tenant ON policy_baselines(tenant_id);

-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  session_id INTEGER,
  actor TEXT NOT NULL, -- system | user | api key id
  event_type TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (session_id) REFERENCES onboarding_sessions(id)
);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant ON audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_session ON audit_events(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);

-- Enrich onboarding_sessions with answers_json + policy_baseline_id if columns missing
ALTER TABLE onboarding_sessions ADD COLUMN answers_json TEXT;
ALTER TABLE onboarding_sessions ADD COLUMN policy_baseline_id INTEGER REFERENCES policy_baselines(id);

PRAGMA foreign_keys=ON;
