/**
 * AtlasIT Scheduler Worker
 * Responsibilities:
 *  - Own cron triggers (centralized)
 *  - Fan out lightweight HTTP calls to orchestrator / core workers
 *  - Provide minimal observability (structured JSON logs)
 *  - Offer a guarded manual trigger endpoint for emergency runs
 */

const JSON_HEADERS = { "content-type": "application/json" };

// Lightweight logger for consistent shape
function log(level, event, data = {}) {
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), level, event, ...data }),
  );
}

async function fetchWithRetry(url, opts = {}, attempts = 3, backoffMs = 250) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`Non-2xx (${res.status})`);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise((r) => setTimeout(r, backoffMs * i));
    }
  }
  throw lastErr;
}

// Job definitions map a symbolic job name to an execution function.
function buildJobs(env) {
  const orchestratorBase =
    env.ORCHESTRATOR_URL?.replace(/\/$/, "") ||
    "https://atlasit-orchestrator.kd8jc7v8cd.workers.dev"; // fallback
  const headers = {
    "x-scheduler": "atlasit",
    "x-api-key": env.ORCHESTRATOR_API_KEY || "",
  };

  return {
    daily_etl: async () => {
      // Example endpoint - adjust to actual ETL route when implemented
      const url = `${orchestratorBase}/internal/etl/run`;
      return fetchWithRetry(url, { method: "POST", headers });
    },
    quarter_hour_monitor: async () => {
      const url = `${orchestratorBase}/status`; // lightweight status endpoint
      return fetchWithRetry(url, { method: "GET", headers });
    },
  };
}

function cronToJobs(cronExpression) {
  // Map specific cron strings to job arrays. Keep simple pattern match.
  switch (cronExpression) {
    case "0 2 * * *":
      return ["daily_etl"];
    case "15 * * * *":
      return ["quarter_hour_monitor"];
    default:
      return [];
  }
}

async function runJobs(jobNames, jobs) {
  const results = [];
  for (const name of jobNames) {
    const started = Date.now();
    try {
      const res = await jobs[name]();
      results.push({
        job: name,
        ok: true,
        status: res.status,
        ms: Date.now() - started,
      });
      log("info", "job.success", {
        job: name,
        status: res.status,
        ms: Date.now() - started,
      });
    } catch (err) {
      results.push({
        job: name,
        ok: false,
        error: err.message,
        ms: Date.now() - started,
      });
      log("error", "job.failure", {
        job: name,
        error: err.message,
        ms: Date.now() - started,
      });
    }
  }
  return results;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "scheduler",
          timestamp: Date.now(),
        }),
        { status: 200, headers: JSON_HEADERS },
      );
    }

    if (url.pathname === "/internal/run") {
      // Guard with simple shared secret header for now
      const provided = request.headers.get("x-debug-key");
      if (!env.SCHEDULER_DEBUG_KEY || provided !== env.SCHEDULER_DEBUG_KEY) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: JSON_HEADERS,
        });
      }
      const params = url.searchParams.get("jobs");
      const jobNames = params
        ? params
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const jobs = buildJobs(env);
      const invalid = jobNames.filter((j) => !jobs[j]);
      if (invalid.length) {
        return new Response(
          JSON.stringify({ error: "invalid_jobs", invalid }),
          { status: 400, headers: JSON_HEADERS },
        );
      }
      log("info", "manual.trigger", { jobs: jobNames });
      const results = await runJobs(jobNames, jobs);
      return new Response(JSON.stringify({ triggered: jobNames, results }), {
        status: 200,
        headers: JSON_HEADERS,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    const cron = event.cron;
    const jobs = buildJobs(env);
    const jobNames = cronToJobs(cron).filter((j) => jobs[j]);
    if (!jobNames.length) {
      log("debug", "cron.noop", { cron });
      return;
    }
    log("info", "cron.start", { cron, jobs: jobNames });
    ctx.waitUntil(
      (async () => {
        await runJobs(jobNames, jobs);
        log("info", "cron.end", { cron, jobs: jobNames });
      })(),
    );
  },
};
