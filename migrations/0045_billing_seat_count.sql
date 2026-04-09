-- Add seat_count to tenant_billing for per-seat subscription tracking
ALTER TABLE tenant_billing ADD COLUMN seat_count INTEGER DEFAULT 5;
