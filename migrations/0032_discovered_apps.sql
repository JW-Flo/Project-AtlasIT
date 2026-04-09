-- Phase 12: Shadow AI & SaaS Discovery
-- Tracks OAuth grants and unapproved apps discovered across connected adapters

CREATE TABLE IF NOT EXISTS discovered_apps (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_domain TEXT,
  provider TEXT NOT NULL,
  discovery_source TEXT NOT NULL,
  risk_tier TEXT DEFAULT 'unknown',
  category TEXT,
  first_seen_at TEXT DEFAULT (datetime('now')),
  last_seen_at TEXT DEFAULT (datetime('now')),
  user_count INTEGER DEFAULT 0,
  is_ai_tool INTEGER DEFAULT 0,
  marketplace_match TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, app_name, provider)
);

CREATE INDEX IF NOT EXISTS idx_discovered_apps_tenant ON discovered_apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discovered_apps_risk ON discovered_apps(tenant_id, risk_tier);
CREATE INDEX IF NOT EXISTS idx_discovered_apps_ai ON discovered_apps(tenant_id, is_ai_tool);

-- Individual OAuth grants discovered per user
CREATE TABLE IF NOT EXISTS discovered_oauth_grants (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  discovered_app_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  scopes TEXT,
  granted_at TEXT,
  last_used_at TEXT,
  client_id TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, discovered_app_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_discovered_grants_tenant ON discovered_oauth_grants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_app ON discovered_oauth_grants(discovered_app_id);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_user ON discovered_oauth_grants(tenant_id, user_email);

-- Governance playbook rules for discovered apps
CREATE TABLE IF NOT EXISTS discovery_playbooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  trigger_condition TEXT NOT NULL,
  actions TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_discovery_playbooks_tenant ON discovery_playbooks(tenant_id);
