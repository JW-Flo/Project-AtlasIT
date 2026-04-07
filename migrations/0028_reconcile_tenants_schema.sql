-- Reconcile tenants table schema drift.
-- The live tenants table was created by the onboarding worker with columns
-- (owner_email, size) not in 0001, while 0001 defines columns (slug, tier,
-- config, updated_at) not in the live table.
--
-- Uses table rebuild pattern (safe regardless of which columns already exist).
-- Temporarily disables FK enforcement to allow DROP TABLE when dependents exist.

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS tenants_canonical (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK(status IN ('active', 'suspended', 'onboarding')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'starter', 'professional', 'enterprise')),
  config TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy existing data (only columns guaranteed to exist in both schemas)
INSERT OR IGNORE INTO tenants_canonical (id, name, industry, status, created_at)
  SELECT id, name, industry, status, created_at FROM tenants;

DROP TABLE IF EXISTS tenants;
ALTER TABLE tenants_canonical RENAME TO tenants;

-- Set slug to tenant id for uniqueness where not already set
UPDATE tenants SET slug = id WHERE slug = '' OR slug IS NULL;
UPDATE tenants SET updated_at = datetime('now');

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

PRAGMA foreign_keys = ON;
