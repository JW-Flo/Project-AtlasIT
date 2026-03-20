-- Replace dispatch namespace with direct HTTP routing.
-- Each tenant script now has a worker_url for direct fetch().
ALTER TABLE tenant_scripts ADD COLUMN worker_url TEXT;
