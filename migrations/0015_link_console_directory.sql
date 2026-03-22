-- Link console users to directory users
-- Rebuild directory_users to add source + console_user_id columns idempotently.
-- Production may already have 'source' from out-of-band schema changes,
-- so ALTER TABLE ADD COLUMN would fail with "duplicate column name".

CREATE TABLE IF NOT EXISTS _directory_users_rebuild (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id       TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  email           TEXT NOT NULL,
  display_name    TEXT,
  department      TEXT,
  title           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  raw_attributes  TEXT,
  source          TEXT,
  console_user_id TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, external_id)
);

-- Copy existing data (base columns from 0004_directory_sync.sql)
INSERT OR IGNORE INTO _directory_users_rebuild
  (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, created_at, updated_at)
  SELECT id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, created_at, updated_at
  FROM directory_users;

DROP TABLE IF EXISTS directory_users;
ALTER TABLE _directory_users_rebuild RENAME TO directory_users;

-- Recreate indexes from 0004
CREATE INDEX IF NOT EXISTS idx_dir_users_tenant ON directory_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dir_users_email  ON directory_users(tenant_id, email);
-- New index for this migration
CREATE INDEX IF NOT EXISTS idx_directory_users_console_user_id ON directory_users(console_user_id);
