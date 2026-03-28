-- Phase 14 prep: Roles as first-class entity for identity-grounded lifecycle management
-- Roles bundle app entitlements and can be assigned to individual users or groups.
-- Supports hierarchy (org → department → team) via parent_id self-reference.

CREATE TABLE IF NOT EXISTS roles (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  parent_id   TEXT,
  level       TEXT NOT NULL DEFAULT 'team',
  metadata    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS role_app_entitlements (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  role_id     TEXT NOT NULL,
  app_id      TEXT NOT NULL,
  app_role    TEXT NOT NULL DEFAULT 'member',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, role_id, app_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  role_id     TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, role_id, target_type, target_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_parent ON roles(parent_id);
CREATE INDEX IF NOT EXISTS idx_role_entitlements_role ON role_app_entitlements(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_entitlements_app ON role_app_entitlements(tenant_id, app_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_target ON role_assignments(tenant_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON role_assignments(tenant_id, role_id);
