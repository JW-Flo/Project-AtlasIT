-- Migration 0058 — Billing seat tracking + guarantee tenant_billing row per tenant
--
-- Adds seat_count to tenant_billing (capacity purchased via Stripe), distinct
-- from active_users (actual users in the tenant). Backfills a 'free' row for
-- every tenant that doesn't have one yet so GET /api/v1/billing doesn't NULL.

ALTER TABLE tenant_billing ADD COLUMN IF NOT EXISTS seat_count INTEGER NOT NULL DEFAULT 5;

-- Backfill tenant_billing rows for any tenant without one — uses tenants.tier
-- when set, otherwise defaults to 'free' plan. Safe to run repeatedly.
INSERT INTO tenant_billing (tenant_id, plan, status, billing_cycle, seat_count, created_at, updated_at)
SELECT
  t.id,
  COALESCE(NULLIF(t.tier, ''), 'free')::text as plan,
  'active' as status,
  'monthly' as billing_cycle,
  5 as seat_count,
  NOW() as created_at,
  NOW() as updated_at
FROM tenants t
LEFT JOIN tenant_billing tb ON tb.tenant_id = t.id
WHERE tb.tenant_id IS NULL;
