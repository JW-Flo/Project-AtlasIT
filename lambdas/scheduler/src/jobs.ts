/**
 * scheduler Lambda jobs
 *
 * Handles EventBridge scheduled triggers (replaces Cloudflare cron triggers).
 * Ported from scheduler-worker/index.js scheduled handler.
 */

import type { ScheduledEvent } from "aws-lambda";
import { randomUUID } from "crypto";

function log(level: string, event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, ...data }));
}

async function fetchWithRetry(
  url: string,
  opts: RequestInit = {},
  attempts = 3,
  backoffMs = 250,
): Promise<Response> {
  let lastErr: Error | undefined;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`Non-2xx (${res.status})`);
      return res;
    } catch (err) {
      lastErr = err as Error;
      if (i < attempts) await new Promise((r) => setTimeout(r, backoffMs * i));
    }
  }
  throw lastErr!;
}

// Map EventBridge rule names (or detail-type) to job names
const RULE_TO_JOB: Record<string, string[]> = {
  "atlasit-daily-etl": ["daily_etl"],
  "atlasit-quarter-hour": ["quarter_hour_monitor"],
  "atlasit-compliance-refresh": ["compliance_snapshot_refresh"],
  "atlasit-discovery-sync": ["discovery_sync"],
  // Default: run all cron jobs
  "default": ["daily_etl", "quarter_hour_monitor", "compliance_snapshot_refresh", "discovery_sync"],
};

/** Extract the EventBridge rule name from the event resource ARN. */
function ruleNameFromEvent(event: ScheduledEvent): string {
  // EventBridge scheduled events include a resources array with the rule ARN.
  // The rule name is the last segment of the ARN: arn:aws:events:…:rule/<name>
  const resources = (event as unknown as { resources?: string[] }).resources;
  const arn = Array.isArray(resources) ? resources[0] : undefined;
  return arn?.split("/").pop() ?? "default";
}

function resolveJobsForEvent(event: ScheduledEvent): string[] {
  const ruleName = ruleNameFromEvent(event);
  return RULE_TO_JOB[ruleName] ?? RULE_TO_JOB["default"];
}

async function executeJob(name: string): Promise<{ ok: boolean; error?: string; ms: number }> {
  const orchestratorBase = (process.env.ORCHESTRATOR_URL ?? "").replace(/\/$/, "");
  const headers: Record<string, string> = {
    "x-scheduler": "atlasit",
    "x-api-key": process.env.ORCHESTRATOR_API_KEY ?? "",
    "Content-Type": "application/json",
  };

  const jobMap: Record<string, { url: string; method: string; body?: string }> = {
    daily_etl: { url: `${orchestratorBase}/internal/etl/run`, method: "POST" },
    quarter_hour_monitor: { url: `${orchestratorBase}/health`, method: "GET" },
    compliance_snapshot_refresh: { url: `${orchestratorBase}/internal/compliance/refresh`, method: "POST" },
    discovery_sync: {
      url: `${orchestratorBase}/api/v1/discovery/sync`,
      method: "POST",
      body: JSON.stringify({ provider: "all" }),
    },
  };

  const job = jobMap[name];
  if (!job) return { ok: false, error: `Unknown job: ${name}`, ms: 0 };

  const started = Date.now();
  try {
    await fetchWithRetry(job.url, { method: job.method, headers, body: job.body });
    return { ok: true, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, error: (err as Error).message, ms: Date.now() - started };
  }
}

export async function runScheduledJobs(event: ScheduledEvent): Promise<void> {
  const runId = randomUUID().slice(0, 8);
  const jobNames = resolveJobsForEvent(event);

  log("info", "cron.start", { runId, jobs: jobNames, time: event.time });

  const results = await Promise.allSettled(
    jobNames.map(async (name) => {
      const result = await executeJob(name);
      if (result.ok) {
        log("info", "job.success", { runId, job: name, ms: result.ms });
      } else {
        log("error", "job.failure", { runId, job: name, error: result.error, ms: result.ms });
      }
      return { name, ...result };
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  log("info", "cron.done", { runId, total: jobNames.length, succeeded, failed });

  if (failed > 0) {
    throw new Error(`${failed}/${jobNames.length} scheduled jobs failed`);
  }
}
