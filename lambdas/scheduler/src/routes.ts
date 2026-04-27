/**
 * scheduler Lambda routes
 *
 * Ported from scheduler-worker/index.js (Cloudflare Worker).
 * Handles HTTP requests: health check and guarded manual trigger.
 *
 * Key translations:
 *   env.ORCHESTRATOR_URL      → process.env.ORCHESTRATOR_URL
 *   env.ORCHESTRATOR_API_KEY  → process.env.ORCHESTRATOR_API_KEY
 *   env.SCHEDULER_DEBUG_KEY   → process.env.SCHEDULER_DEBUG_KEY
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function fail(status: number, message: string, code = "ERROR"): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: message, code }),
  };
}

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

// Job definitions — ported from scheduler-worker/index.js
function buildJobs(): Record<string, () => Promise<Response>> {
  const orchestratorBase = (process.env.ORCHESTRATOR_URL ?? "").replace(/\/$/, "");
  const headers: Record<string, string> = {
    "x-scheduler": "atlasit",
    "x-api-key": process.env.ORCHESTRATOR_API_KEY ?? "",
  };

  const consoleBase = (process.env.CONSOLE_API_URL ?? "").replace(/\/$/, "");
  const internalKey = process.env.INTERNAL_API_KEY ?? "";

  return {
    daily_etl: async () => {
      const url = `${orchestratorBase}/internal/etl/run`;
      return fetchWithRetry(url, { method: "POST", headers });
    },
    quarter_hour_monitor: async () => {
      const url = `${orchestratorBase}/health`;
      return fetchWithRetry(url, { method: "GET", headers });
    },
    compliance_snapshot_refresh: async () => {
      const url = `${orchestratorBase}/internal/compliance/refresh`;
      return fetchWithRetry(url, { method: "POST", headers });
    },
    discovery_sync: async () => {
      const url = `${orchestratorBase}/api/v1/discovery/sync`;
      return fetchWithRetry(url, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "all" }),
      });
    },
    evidence_collection: async () => {
      const url = `${consoleBase}/api/cron/evidence`;
      return fetchWithRetry(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${internalKey}`, "Content-Type": "application/json" },
      });
    },
  };
}

interface JobResult {
  job: string;
  ok: boolean;
  status?: number;
  error?: string;
  ms: number;
}

async function runJobs(jobNames: string[]): Promise<JobResult[]> {
  const jobs = buildJobs();
  const results: JobResult[] = [];

  for (const name of jobNames) {
    const started = Date.now();
    try {
      const res = await jobs[name]();
      results.push({ job: name, ok: true, status: res.status, ms: Date.now() - started });
      log("info", "job.success", { job: name, status: res.status, ms: Date.now() - started });
    } catch (err) {
      results.push({
        job: name,
        ok: false,
        error: (err as Error).message,
        ms: Date.now() - started,
      });
      log("error", "job.failure", {
        job: name,
        error: (err as Error).message,
        ms: Date.now() - started,
      });
    }
  }

  return results;
}

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath;
  const method = event.requestContext.http.method.toUpperCase();
  const qs = event.queryStringParameters ?? {};

  // ── Health ────────────────────────────────────────────────────────────────
  if (path === "/health" && method === "GET") {
    return ok({ status: "ok", service: "scheduler", timestamp: Date.now() });
  }

  // ── Manual trigger (guarded) ───────────────────────────────────────────────
  if (path === "/internal/run" && method === "POST") {
    const debugKey = process.env.SCHEDULER_DEBUG_KEY;
    const provided = event.headers?.["x-debug-key"];
    if (!debugKey || provided !== debugKey) {
      return fail(401, "unauthorized", "UNAUTHORIZED");
    }

    const jobsParam = qs.jobs ?? "";
    const jobNames = jobsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const availableJobs = Object.keys(buildJobs());
    const invalid = jobNames.filter((j) => !availableJobs.includes(j));
    if (invalid.length > 0) {
      return fail(400, `invalid_jobs: ${invalid.join(", ")}`, "INVALID_JOBS");
    }
    if (jobNames.length === 0) {
      return fail(400, "No jobs specified. Available: " + availableJobs.join(", "), "MISSING_JOBS");
    }

    log("info", "manual.trigger", { jobs: jobNames });
    const results = await runJobs(jobNames);

    return ok({ triggered: jobNames, results });
  }

  return fail(404, "Not Found", "NOT_FOUND");
}
