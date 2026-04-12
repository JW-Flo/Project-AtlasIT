#!/usr/bin/env node
// Apply migration 0053 via atlasit-migration-runner Lambda
// Split into two statements so FK constraint can see the parent table.
import { writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const AWS = `"C:/Program Files/Amazon/AWSCLIV2/aws.exe"`;

const stmt1 = `
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  framework_refs TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_policies_tenant ON policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(tenant_id, status);
`.trim();

const stmt2 = `
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  policy_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  policy_version TEXT NOT NULL,
  UNIQUE (tenant_id, policy_id, user_id, policy_version)
);
CREATE INDEX IF NOT EXISTS idx_policy_acks_tenant ON policy_acknowledgements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_acks_policy ON policy_acknowledgements(policy_id);
`.trim();

const stmt3 = `
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'policy_acknowledgements_policy_id_fkey'
  ) THEN
    ALTER TABLE policy_acknowledgements
      ADD CONSTRAINT policy_acknowledgements_policy_id_fkey
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE;
  END IF;
END $$;
`.trim();

const payload = JSON.stringify({ statements: [stmt1, stmt2, stmt3] });
writeFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0053-payload.json", payload);

console.log(`Invoking atlasit-migration-runner (two-statement mode)...`);
execSync(
  `${AWS} lambda invoke --function-name atlasit-migration-runner --region us-east-1 --cli-binary-format raw-in-base64-out --payload fileb://C:/Users/joewh/AppData/Local/Temp/migrate-0053-payload.json C:/Users/joewh/AppData/Local/Temp/migrate-0053-response.json`,
  { stdio: "inherit" },
);

const raw = readFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0053-response.json", "utf8");
const resp = JSON.parse(raw);
const body = typeof resp.body === "string" ? JSON.parse(resp.body) : resp;
const results = body.results ?? [];
for (const r of results) {
  if (r.ok) console.log(`✓ rowCount=${r.rowCount ?? 0}`);
  else console.log(`✗ ${r.error}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
