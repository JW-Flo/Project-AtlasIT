/**
 * scheduler Lambda jobs
 *
 * Handles EventBridge scheduled triggers (replaces Cloudflare cron triggers).
 * Ported from scheduler-worker/index.js scheduled handler.
 */

import type { ScheduledEvent } from "aws-lambda";
import { randomUUID } from "crypto";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-1" });

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
  "atlasit-compliance-packs-daily-dev": ["compliance_packs_evaluate"],
  "atlasit-discovery-sync": ["discovery_sync"],
  // Default: run all cron jobs (covers the legacy 15-min rule)
  default: ["daily_etl", "quarter_hour_monitor", "compliance_snapshot_refresh", "discovery_sync"],
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

  const internalKey = process.env.INTERNAL_API_KEY ?? "";

  const jobMap: Record<
    string,
    { url: string; method: string; body?: string; headers?: Record<string, string> }
  > = {
    daily_etl: { url: `${orchestratorBase}/internal/etl/run`, method: "POST" },
    quarter_hour_monitor: { url: `${orchestratorBase}/health`, method: "GET" },
    compliance_snapshot_refresh: {
      url: `${orchestratorBase}/internal/compliance/refresh`,
      method: "POST",
    },
    discovery_sync: {
      url: `${orchestratorBase}/api/v1/discovery/sync`,
      method: "POST",
      body: JSON.stringify({ provider: "all" }),
    },
  };

  // Lambda-direct invocations for jobs that call private VPC lambdas (no NAT available)
  if (name === "compliance_packs_evaluate") {
    const started = Date.now();
    try {
      const res = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: process.env.COMPLIANCE_API_LAMBDA ?? "atlasit-compliance-api-dev",
          InvocationType: "RequestResponse",
          Payload: Buffer.from(
            JSON.stringify({
              version: "2.0",
              rawPath: "/internal/compliance-packs/evaluate-all",
              requestContext: {
                http: { method: "POST", path: "/internal/compliance-packs/evaluate-all" },
              },
              headers: { "x-internal-api-key": internalKey, "content-type": "application/json" },
              body: "{}",
              isBase64Encoded: false,
            }),
          ),
        }),
      );
      const decoded = res.Payload ? JSON.parse(Buffer.from(res.Payload).toString("utf8")) : null;
      if (decoded?.statusCode && decoded.statusCode >= 400) {
        return {
          ok: false,
          error: `compliance-api returned ${decoded.statusCode}: ${decoded.body?.slice(0, 200)}`,
          ms: Date.now() - started,
        };
      }
      return { ok: true, ms: Date.now() - started };
    } catch (err) {
      return { ok: false, error: (err as Error).message, ms: Date.now() - started };
    }
  }

  const job = jobMap[name];
  if (!job) return { ok: false, error: `Unknown job: ${name}`, ms: 0 };

  const mergedHeaders = { ...headers, ...(job.headers ?? {}) };
  const started = Date.now();
  try {
    await fetchWithRetry(job.url, { method: job.method, headers: mergedHeaders, body: job.body });
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
