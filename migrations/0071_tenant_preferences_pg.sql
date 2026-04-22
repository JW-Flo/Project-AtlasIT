-- Tenant preferences (PostgreSQL) — key-value store for tenant settings
-- Includes framework selection, branding, security policies, notification preferences

CREATE TABLE IF NOT EXISTS tenant_preferences (
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, key),
  CONSTRAINT fk_tenant_preferences_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_preferences_tenant ON tenant_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_preferences_key ON tenant_preferences(key);

-- Seed default framework preferences for existing tenant (if not already set)
INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
SELECT 'development', 'frameworks', '["SOC2","ISO27001","NIST_CSF"]', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_preferences WHERE tenant_id = 'development' AND key = 'frameworks'
);
