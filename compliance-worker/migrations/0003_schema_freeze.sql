-- Schema freeze marker migration
-- No new tables in this revision. All required tables were established in 0001_init.sql and 0002_automation_policies.sql.
-- This migration documents the transition to managed migrations for schema evolution.
-- Runtime ensure*() helpers remain idempotent for backward compatibility when deploying to fresh environments,
-- but new structural changes MUST be added via numbered migration files going forward.

-- Optionally future indexes could be added here (none needed at this time).
