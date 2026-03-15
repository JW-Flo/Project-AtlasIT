-- Marketplace: app catalog and tenant installations

CREATE TABLE IF NOT EXISTS marketplace_apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'utility' CHECK(category IN ('identity', 'security', 'compliance', 'productivity', 'communication', 'utility', 'custom')),
  provider TEXT NOT NULL,
  logo_url TEXT,
  auth_model TEXT NOT NULL CHECK(auth_model IN ('oauth2', 'api_key', 'service_account', 'saml', 'none')),
  config_schema TEXT, -- JSON Schema for app configuration
  capabilities TEXT, -- JSON array
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'coming_soon')),
  documentation_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_apps(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_apps(status);

CREATE TABLE IF NOT EXISTS tenant_app_installs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'installed' CHECK(status IN ('installed', 'configuring', 'active', 'error', 'uninstalled')),
  config TEXT, -- JSON tenant-specific config
  installed_by TEXT, -- user ID
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  activated_at TEXT,
  uninstalled_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, app_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (app_id) REFERENCES marketplace_apps(id)
);

CREATE INDEX IF NOT EXISTS idx_installs_tenant ON tenant_app_installs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installs_app ON tenant_app_installs(app_id);
CREATE INDEX IF NOT EXISTS idx_installs_status ON tenant_app_installs(status);
