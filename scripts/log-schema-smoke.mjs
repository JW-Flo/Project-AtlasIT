#!/usr/bin/env node
import { validateLog, normalizeLog } from "../shared/log-schema.ts";
import log, { getRecentLogs } from "../shared/log.js";

const samples = [
  { event: "startup", level: "info", service: "core" },
  {
    event: "ai.infer",
    level: "info",
    durationMs: 120,
    service: "ai-orchestrator",
  },
  {
    event: "error.example",
    level: "error",
    message: "Boom",
    meta: { code: 500 },
  },
];

let failures = 0;
for (const s of samples) {
  const n = normalizeLog(s);
  const res = validateLog(n);
  if (!res.ok) {
    console.error("Validation failed", n, res.issues);
    failures++;
  } else {
    console.log("OK", n.event);
  }
}

if (failures) {
  console.error(`${failures} validation failures`);
  process.exit(1);
}
console.log("All sample logs valid");

// Live mode: emit a real log entry and verify it appears in recent logs
if (process.argv.includes("--live")) {
  const marker = "smoke.live." + Date.now();
  await log("info", "smoke.live_test", { marker });
  const recent = getRecentLogs(20).filter(
    (l) =>
      l.event === "smoke.live_test" &&
      (l.meta?.marker === marker || l.payload?.marker === marker)
  );
  if (recent.length === 0) {
    console.error("Live log test FAILED: marker not found");
    process.exit(2);
  } else {
    console.log("Live log test OK", marker);
  }
}
