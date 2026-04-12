#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const AWS = `"C:/Program Files/Amazon/AWSCLIV2/aws.exe"`;
const sql = readFileSync("migrations/0055_attestations.sql", "utf8");
const payload = JSON.stringify({ statements: [sql] });
writeFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0055-payload.json", payload);

console.log("Invoking atlasit-migration-runner...");
execSync(
  `${AWS} lambda invoke --function-name atlasit-migration-runner --region us-east-1 --cli-binary-format raw-in-base64-out --payload fileb://C:/Users/joewh/AppData/Local/Temp/migrate-0055-payload.json C:/Users/joewh/AppData/Local/Temp/migrate-0055-response.json`,
  { stdio: "inherit" },
);

const resp = JSON.parse(readFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0055-response.json", "utf8"));
const body = typeof resp.body === "string" ? JSON.parse(resp.body) : resp;
for (const r of body.results ?? []) {
  if (r.ok) console.log(`✓ rowCount=${r.rowCount ?? 0}`);
  else console.log(`✗ ${r.error}`);
}
process.exit((body.results ?? []).every((r) => r.ok) ? 0 : 1);
