-- Add disabled_at column for tenant lifecycle management
ALTER TABLE tenants ADD COLUMN disabled_at TEXT;
