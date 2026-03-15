-- App group assignments: which groups/teams have access to each connected app
CREATE TABLE IF NOT EXISTS app_group_assignments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, app_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_app_groups_tenant_app ON app_group_assignments(tenant_id, app_id);

-- App role mappings: map source roles to target roles per app
CREATE TABLE IF NOT EXISTS app_role_mappings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  source_role TEXT NOT NULL,
  target_role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, app_id, source_role)
);

CREATE INDEX IF NOT EXISTS idx_app_roles_tenant_app ON app_role_mappings(tenant_id, app_id);
