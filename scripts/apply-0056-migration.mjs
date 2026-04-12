#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const AWS = `"C:/Program Files/Amazon/AWSCLIV2/aws.exe"`;
const sql = readFileSync("migrations/0056_invitation_tokens.sql", "utf8");
writeFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0056-payload.json", JSON.stringify({ statements: [sql] }));
execSync(`${AWS} lambda invoke --function-name atlasit-migration-runner --region us-east-1 --cli-binary-format raw-in-base64-out --payload fileb://C:/Users/joewh/AppData/Local/Temp/migrate-0056-payload.json C:/Users/joewh/AppData/Local/Temp/migrate-0056-response.json`, { stdio: "inherit" });
const resp = JSON.parse(readFileSync("C:/Users/joewh/AppData/Local/Temp/migrate-0056-response.json", "utf8"));
const body = typeof resp.body === "string" ? JSON.parse(resp.body) : resp;
for (const r of body.results ?? []) {
  console.log(r.ok ? `✓ rowCount=${r.rowCount ?? 0}` : `✗ ${r.error}`);
}
process.exit((body.results ?? []).every((r) => r.ok) ? 0 : 1);
