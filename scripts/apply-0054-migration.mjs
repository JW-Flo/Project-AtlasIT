#!/usr/bin/env node
// Apply migration 0054 via atlasit-migration-runner Lambda
import { writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const AWS = `"C:/Program Files/Amazon/AWSCLIV2/aws.exe"`;

const stmt1 = `
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
  source TEXT NOT NULL DEFAULT 'evaluation'
);
CREATE INDEX IF NOT EXISTS idx_score_snap_tenant_pack_time ON compliance_score_snapshots(tenant_id, pack_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_snap_tenant_time ON compliance_score_snapshots(tenant_id, snapshot_at DESC);
`.trim();

const stmt2 = `
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
WHERE tcp.last_evaluated_at IS NOT NULL
ON CONFLICT DO NOTHING;
`.trim();

const payload = JSON.stringify({ statements: [stmt1, stmt2] });
writeFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0054-payload.json", payload);

console.log(`Invoking atlasit-migration-runner (0054: compliance_score_snapshots)...`);
execSync(
  `${AWS} lambda invoke --function-name atlasit-migration-runner --region us-east-1 --cli-binary-format raw-in-base64-out --payload fileb://C:/Users/joewh/AppData/Local/Temp/migrate-0054-payload.json C:/Users/joewh/AppData/Local/Temp/migrate-0054-response.json`,
  { stdio: "inherit" },
);

const raw = readFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0054-response.json", "utf8");
const resp = JSON.parse(raw);
const body = typeof resp.body === "string" ? JSON.parse(resp.body) : resp;
const results = body.results ?? [];
for (const r of results) {
  if (r.ok) console.log(`✓ rowCount=${r.rowCount ?? 0}`);
  else console.log(`✗ ${r.error}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
