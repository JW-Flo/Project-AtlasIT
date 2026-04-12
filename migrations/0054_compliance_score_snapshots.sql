-- 0054: compliance score snapshots table for trend data
CREATE TABLE IF NOT EXISTS compliance_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  pass_count INTEGER NOT NULL,
  fail_count INTEGER NOT NULL,
  unknown_count INTEGER NOT NULL,
  total_controls INTEGER NOT NULL,
  score_pct NUMERIC(5,2) NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'evaluation' -- 'evaluation','cron','manual'
);
CREATE INDEX IF NOT EXISTS idx_score_snap_tenant_pack_time ON compliance_score_snapshots(tenant_id, pack_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_snap_tenant_time ON compliance_score_snapshots(tenant_id, snapshot_at DESC);

-- Backfill one snapshot per currently-evaluated pack installation
INSERT INTO compliance_score_snapshots (tenant_id, pack_id, pass_count, fail_count, unknown_count, total_controls, score_pct, snapshot_at, source)
SELECT
  tcp.tenant_id,
  tcp.pack_id,
  COALESCE(tcp.pass_count, 0),
  COALESCE(tcp.fail_count, 0),
  COALESCE(tcp.unknown_count, 0),
  COALESCE(tcp.pass_count, 0) + COALESCE(tcp.fail_count, 0) + COALESCE(tcp.unknown_count, 0),
  CASE
    WHEN (COALESCE(tcp.pass_count, 0) + COALESCE(tcp.fail_count, 0) + COALESCE(tcp.unknown_count, 0)) > 0
    THEN ROUND((COALESCE(tcp.pass_count, 0) * 100.0) / (COALESCE(tcp.pass_count, 0) + COALESCE(tcp.fail_count, 0) + COALESCE(tcp.unknown_count, 0)), 2)
    ELSE 0
  END,
  COALESCE(tcp.last_evaluated_at, NOW()),
  'evaluation'
FROM tenant_compliance_packs tcp
WHERE tcp.last_evaluated_at IS NOT NULL;
