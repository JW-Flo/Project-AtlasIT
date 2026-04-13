-- Migration 0060 — tenants table hygiene
--
-- Current state (2026-04-13): 10 tenants with mixed id formats:
--   - 8 rows with slug-style IDs (atlasit, test, test-2, ...) from pre-signup era
--   - 2 rows with UUID IDs from the self-serve signup flow
-- FK integrity is clean (0 orphan tenant_id rows in child tables), so we do
-- NOT migrate existing IDs — breaking change risk is too high for a non-bug.
--
-- What this migration does fix:
--   1. test03 had empty-string slug (breaks /trust/:slug route-key lookups)
--   2. Add CHECK slug <> empty string
--   3. Add UNIQUE index on slug for fast trust-center + signup lookups
--   4. Signup flow already uses gen_random_uuid() — new tenants get UUIDs
--      (verified in lambdas/onboarding-api/src/routes.ts)

UPDATE tenants SET slug = 'test03', updated_at = NOW()
WHERE id = 'test03' AND (slug IS NULL OR slug = '');

-- Fill any other NULL/empty slugs from id as a safety backfill
UPDATE tenants SET slug = id, updated_at = NOW()
WHERE slug IS NULL OR slug = '';

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_slug_not_empty;
ALTER TABLE tenants
  ADD CONSTRAINT tenants_slug_not_empty CHECK (slug IS NOT NULL AND slug <> '');

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
