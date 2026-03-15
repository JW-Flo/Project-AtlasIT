-- Directory sync tables
-- Tracks which IdP a tenant has connected, and stores the synced snapshot.

CREATE TABLE IF NOT EXISTS directory_connections (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  provider    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  error_msg   TEXT,
  last_sync_at TEXT,
  user_count   INTEGER NOT NULL DEFAULT 0,
  group_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_dir_connections_tenant ON directory_connections(tenant_id);

CREATE TABLE IF NOT EXISTS directory_users (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id       TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  email           TEXT NOT NULL,
  display_name    TEXT,
  department      TEXT,
  title           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  raw_attributes  TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_dir_users_tenant ON directory_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dir_users_email  ON directory_users(tenant_id, email);

CREATE TABLE IF NOT EXISTS directory_groups (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id    TEXT NOT NULL,
  external_id  TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_dir_groups_tenant ON directory_groups(tenant_id);

CREATE TABLE IF NOT EXISTS directory_memberships (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  group_id    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_dir_memberships_user  ON directory_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_dir_memberships_group ON directory_memberships(group_id);

CREATE TABLE IF NOT EXISTS group_app_mappings (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  group_id    TEXT NOT NULL,
  app_id      TEXT NOT NULL,
  role        TEXT,
  suggested   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, group_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_group_app_mappings_group ON group_app_mappings(group_id);
CREATE INDEX IF NOT EXISTS idx_group_app_mappings_app   ON group_app_mappings(app_id);
