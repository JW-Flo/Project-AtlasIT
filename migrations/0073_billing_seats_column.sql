-- Add seats column to tenant_billing for per-seat Stripe subscriptions
ALTER TABLE tenant_billing ADD COLUMN IF NOT EXISTS seats INT NOT NULL DEFAULT 1;
