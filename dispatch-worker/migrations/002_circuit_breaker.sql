-- Add circuit breaker columns (SQLite D1 compatible). Using separate ALTERs.
ALTER TABLE tenant_scripts ADD COLUMN failure_count_window INTEGER DEFAULT 0;
ALTER TABLE tenant_scripts ADD COLUMN window_start_utc TEXT;
ALTER TABLE tenant_scripts ADD COLUMN breaker_open_until_utc TEXT;
