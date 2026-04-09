-- Extend pre-existing roles table with hierarchy and lifecycle fields
ALTER TABLE roles ADD COLUMN parent_id TEXT;
ALTER TABLE roles ADD COLUMN level TEXT NOT NULL DEFAULT 'team';
ALTER TABLE roles ADD COLUMN metadata TEXT;
ALTER TABLE roles ADD COLUMN updated_at TEXT DEFAULT '';

-- Create role_app_entitlements and role_assignments tables
CREATE TABLE IF NOT EXISTS role_app_entitlements (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  role_id     TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  app_id      TEXT NOT NULL,
  app_role    TEXT NOT NULL DEFAULT 'member',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, role_id, app_id)
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  role_id     TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, role_id, target_type, target_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_parent ON roles(parent_id);
CREATE INDEX IF NOT EXISTS idx_role_entitlements_role ON role_app_entitlements(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_entitlements_app ON role_app_entitlements(tenant_id, app_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_target ON role_assignments(tenant_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON role_assignments(tenant_id, role_id);
