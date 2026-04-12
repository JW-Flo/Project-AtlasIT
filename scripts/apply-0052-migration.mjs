#!/usr/bin/env node
// Apply migration 0052 via atlasit-migration-runner Lambda
// Send as ONE statement — pg supports multiple semicolon-separated DDL/DML in a single query.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const AWS = `"C:/Program Files/Amazon/AWSCLIV2/aws.exe"`;
const sql = readFileSync("migrations/0052_compliance_packs_seed.sql", "utf8");

const payload = JSON.stringify({ statements: [sql] });
writeFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0052-payload.json", payload);

console.log(`Invoking atlasit-migration-runner (single-batch mode)...`);
execSync(
  `${AWS} lambda invoke --function-name atlasit-migration-runner --region us-east-1 --cli-binary-format raw-in-base64-out --payload fileb://C:/Users/joewh/AppData/Local/Temp/migrate-0052-payload.json C:/Users/joewh/AppData/Local/Temp/migrate-0052-response.json`,
  { stdio: "inherit" },
);

const raw = readFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0052-response.json", "utf8");
const resp = JSON.parse(raw);
const body = typeof resp.body === "string" ? JSON.parse(resp.body) : resp;
const results = body.results ?? [];
for (const r of results) {
  if (r.ok) console.log(`✓ rowCount=${r.rowCount ?? 0}`);
  else console.log(`✗ ${r.error}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
