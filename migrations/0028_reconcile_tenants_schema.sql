-- Reconcile tenants table schema drift.
-- The live tenants table was created by the onboarding worker with columns
-- (owner_email, size) not in 0001, while 0001 defines columns (slug, tier,
-- config, updated_at) not in the live table. Rebuild to include ALL columns.

-- Temporarily disable FK checks so we can drop+rename the tenants table
-- (other tables reference tenants(id) and 0023 enabled foreign_keys).
PRAGMA foreign_keys = OFF;

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

-- Copy data using columns present in the live schema
INSERT OR IGNORE INTO _tenants_rebuild (id, name, owner_email, industry, size, status, created_at)
  SELECT id, name, owner_email, industry, size, status, created_at FROM tenants;

DROP TABLE IF EXISTS tenants;
ALTER TABLE _tenants_rebuild RENAME TO tenants;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Re-enable FK enforcement
PRAGMA foreign_keys = ON;
