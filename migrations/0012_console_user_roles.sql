-- Migration 0012: Console user roles for D1-backed RBAC
-- Replaces hardcoded super-admin role assignment in CloudflareAccessProvider

CREATE TABLE IF NOT EXISTS console_user_roles (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email      TEXT NOT NULL,
  tenant_id  TEXT NOT NULL,
  roles      TEXT NOT NULL DEFAULT '["viewer"]',  -- JSON array of role strings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Fast lookup by email (most common query path)
CREATE UNIQUE INDEX IF NOT EXISTS idx_console_user_roles_email
  ON console_user_roles (email);

-- Tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_console_user_roles_tenant
  ON console_user_roles (tenant_id);
