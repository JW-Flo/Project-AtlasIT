-- Reconcile tenants table schema drift.
-- The live tenants table was created by the onboarding worker with columns
-- (owner_email, size) not in 0001, while 0001 defines columns (slug, tier,
-- config, updated_at) not in the live table.
--
-- Use ALTER TABLE ADD COLUMN instead of DROP+RENAME to avoid FK constraint
-- issues (users, audit_log, etc. reference tenants(id)).

ALTER TABLE tenants ADD COLUMN slug TEXT NOT NULL DEFAULT '';
ALTER TABLE tenants ADD COLUMN tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE tenants ADD COLUMN config TEXT;
ALTER TABLE tenants ADD COLUMN updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00';
UPDATE tenants SET updated_at = datetime('now');

-- Set slug to tenant id for uniqueness
UPDATE tenants SET slug = id WHERE slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
