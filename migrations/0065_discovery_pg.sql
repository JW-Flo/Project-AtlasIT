-- PostgreSQL version of shadow AI/SaaS discovery tables

CREATE TABLE IF NOT EXISTS discovered_apps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_domain TEXT,
  provider TEXT NOT NULL,
  discovery_source TEXT NOT NULL,
  risk_tier TEXT DEFAULT 'unknown',
  category TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_count INTEGER DEFAULT 0,
  is_ai_tool BOOLEAN DEFAULT FALSE,
  marketplace_match TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, app_name, provider)
);

CREATE INDEX IF NOT EXISTS idx_discovered_apps_tenant ON discovered_apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discovered_apps_risk ON discovered_apps(tenant_id, risk_tier);
CREATE INDEX IF NOT EXISTS idx_discovered_apps_ai ON discovered_apps(tenant_id, is_ai_tool);

-- Individual OAuth grants
CREATE TABLE IF NOT EXISTS discovered_oauth_grants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  discovered_app_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  scopes JSONB DEFAULT '[]'::jsonb,
  granted_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  client_id TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, discovered_app_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_discovered_grants_tenant ON discovered_oauth_grants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_app ON discovered_oauth_grants(discovered_app_id);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_user ON discovered_oauth_grants(tenant_id, user_email);

-- Discovery playbooks
CREATE TABLE IF NOT EXISTS discovery_playbooks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  trigger_condition JSONB NOT NULL,
  actions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_discovery_playbooks_tenant ON discovery_playbooks(tenant_id);
