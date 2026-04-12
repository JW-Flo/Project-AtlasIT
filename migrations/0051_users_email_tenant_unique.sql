-- Enforce uniqueness of (email, tenant_id) for proper tenant isolation on login
-- Users may share emails across tenants but must be unique within a tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_tenant
  ON users(lower(email), tenant_id);
