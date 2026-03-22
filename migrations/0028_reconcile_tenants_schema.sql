-- Reconcile tenants table schema drift.
-- The live tenants table was created by the onboarding worker with columns
-- (owner_email, size) not in 0001, while 0001 defines columns (slug, tier,
-- config, updated_at) not in the live table. Rebuild to include ALL columns.

-- Defer FK checks to end of transaction so we can drop+rename the tenants table.
-- PRAGMA foreign_keys = OFF cannot be set inside a transaction (SQLite limitation),
-- but defer_foreign_keys works inside transactions and defers checks to COMMIT.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _tenants_rebuild (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  owner_email TEXT DEFAULT '',
  industry TEXT,
  size TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  tier TEXT NOT NULL DEFAULT 'free',
  config TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data using columns present in the live schema.
-- Use tenant id as slug placeholder to satisfy UNIQUE constraint.
INSERT OR IGNORE INTO _tenants_rebuild (id, name, slug, owner_email, industry, size, status, created_at)
  SELECT id, name, id, owner_email, industry, size, status, created_at FROM tenants;

DROP TABLE IF EXISTS tenants;
ALTER TABLE _tenants_rebuild RENAME TO tenants;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- defer_foreign_keys resets automatically at end of transaction
