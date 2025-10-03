#!/usr/bin/env node
import { spawnSync } from "node:child_process";

// Allowlist unresolved upstream advisories (no fix published yet)
const ALLOW = new Set([
  "GHSA-hc55-p739-j48w", // server-filesystem path prefix
  "GHSA-q66q-fx2p-7w4m", // server-filesystem symlink handling
]);

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
} catch {
  console.error("[audit-ci] unable to parse audit json");
  process.exit(2);
}

const vulns = data.vulnerabilities || {};
let blocked = [];
for (const [name, info] of Object.entries(vulns)) {
  if (!info || typeof info.severity !== "string") continue;
  if (info.severity === "high" || info.severity === "critical") {
    // gather advisory ids from via objects
    const viaObjs = (info.via || []).filter((v) => typeof v === "object");
    const advisoryIds = viaObjs
      .map((o) => o.url?.split("/").pop())
      .filter(Boolean);
    const allAllowed =
      advisoryIds.length && advisoryIds.every((id) => ALLOW.has(id));
    if (!allAllowed)
      blocked.push({ name, severity: info.severity, advisoryIds });
  }
}

if (blocked.length) {
  console.error(
    "[audit-ci] Blocking build due to disallowed high/critical vulnerabilities:"
  );
  for (const b of blocked)
    console.error(
      ` - ${b.name} (${b.severity}) advisories: ${b.advisoryIds.join(", ")}`
    );
  process.exit(1);
}

console.log("[audit-ci] PASS: no disallowed high/critical vulnerabilities");
