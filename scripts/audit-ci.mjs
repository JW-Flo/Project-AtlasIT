#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const run = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
  encoding: "utf-8",
});
if (run.error) {
  console.error("[audit-ci] failed to run npm audit", run.error);
  process.exit(2);
}
let data;
try {
  data = JSON.parse(run.stdout);
} catch (e) {
  console.error("[audit-ci] unable to parse audit json");
  process.exit(2);
}
// npm v10 places advisories under vulnerabilities key
const vulns = data.vulnerabilities || {};
let high = 0,
  critical = 0;
for (const [, info] of Object.entries(vulns)) {
  if (!info || typeof info.severity !== "string") continue;
  if (info.severity === "high") high += 1;
  if (info.severity === "critical") critical += 1;
}
if (high || critical) {
  console.error(`[audit-ci] Blocking build: high=${high} critical=${critical}`);
  process.exit(1);
}
console.log("[audit-ci] PASS: no high/critical vulnerabilities");
