import { Hono } from "hono";
import { resolveMcpEndpoint } from "./config.js";
import { logger as honoLogger } from "hono/logger";
import { cors } from "hono/cors";
import {
  validateEnv,
  commonEnvSpec,
  generateAI,
  resolveCfApiToken,
  executeAgentMesh,
  classifyTask,
} from "@atlasit/shared";
import log, { correlationMiddleware, logRequestMiddleware } from "../shared/log.js";
// Circuit breaker (shared)
import { getBreaker } from "../shared/circuit-breaker.ts";
import { listIntegrations } from "../shared/integrations/registry.js";
import { probeIntegrations } from "../shared/integrations/health.js";
import { recordBreakerTrip } from "../shared/breaker-metrics.js";

// Env references: AI_MAX_REQUESTS_PER_DAY, AI_MAX_PROMPT_CHARS, AI_ALLOWED_MODELS,
// AI_RATE_BURST, AI_RATE_WINDOW_SECONDS, AI_MAX_REQUESTS_PER_DAY, AI_TEST_MODE (tests), AI_QUOTA (KV binding)
const DEFAULT_AI_RATE_BURST = 10;
const DEFAULT_AI_RATE_WINDOW_SECONDS = 60;
const RATE_MEMORY_MAX_ENTRIES = 500;
const QUOTA_KV_PREFIX = "ai_quota:";
const QUOTA_TTL_SECONDS = 172800; // 48h to allow delayed reads

const app = new Hono();
let envValidated = false;
// In-memory rate limit tracker (per isolate, best-effort)
const rateLimits = new Map();
const aiIpRateBuckets = new Map();
let aiDaily = { day: null, count: 0 };
// Persisted quota cache (in-memory shim when KV unavailable)
let persistedQuotaMemory = { date: null, count: 0 };

function getTodayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClientIp(c) {
  const raw = c.req.raw;
  const headerIp =
    c.req.header("cf-connecting-ip") ||
    (c.req.header("x-forwarded-for") || "").split(",")[0].trim();
  return raw?.cf?.connectingIP || headerIp || "unknown";
}

function pruneRateBuckets(now) {
  if (aiIpRateBuckets.size <= RATE_MEMORY_MAX_ENTRIES) return;
  for (const [key, entry] of aiIpRateBuckets) {
    if (!entry || typeof entry.windowMs !== "number") continue;
    if (now - entry.lastAccess > entry.windowMs * 4) {
      aiIpRateBuckets.delete(key);
    }
  }
}

function memoryQuotaUpdate(today, limit) {
  if (aiDaily.day !== today) aiDaily = { day: today, count: 0 };
  if (limit > 0 && aiDaily.count >= limit) {
    return {
      allowed: false,
      date: today,
      used: aiDaily.count,
      remaining: 0,
      source: "memory",
    };
  }
  aiDaily.count += 1;
  return {
    allowed: true,
    date: today,
    used: aiDaily.count,
    remaining: limit > 0 ? Math.max(0, limit - aiDaily.count) : null,
    source: "memory",
  };
}

async function kvQuotaUpdate(kv, key, today, limit) {
  let lastCount = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let data = await kv.get(key, { type: "json" }).catch(() => null);
    if (!data || data.date !== today || typeof data.count !== "number")
      data = { date: today, count: 0 };
    if (limit > 0 && data.count >= limit) {
      aiDaily = { day: today, count: data.count };
      return {
        allowed: false,
        date: today,
        used: data.count,
        remaining: 0,
        source: "kv",
      };
    }
    const newCount = data.count + 1;
    lastCount = newCount;
    await kv.put(key, JSON.stringify({ date: today, count: newCount }), {
      expirationTtl: QUOTA_TTL_SECONDS,
    });
    const confirm = await kv.get(key, { type: "json" }).catch(() => null);
    if (confirm && confirm.date === today && typeof confirm.count === "number") {
      const used = confirm.count;
      aiDaily = { day: today, count: used };
      return {
        allowed: true,
        date: today,
        used,
        remaining: limit > 0 ? Math.max(0, limit - used) : null,
        source: "kv",
      };
    }
    await sleep(Math.floor(Math.random() * 25) + 5);
  }
  aiDaily = { day: today, count: lastCount };
  return {
    allowed: true,
    date: today,
    used: lastCount,
    remaining: limit > 0 ? Math.max(0, limit - lastCount) : null,
    source: "kv",
  };
}

async function enforceDailyQuota(c, limit) {
  const today = getTodayUtc();
  const kv = c.env?.AI_QUOTA;
  if (!kv || typeof kv.get !== "function" || typeof kv.put !== "function") {
    return memoryQuotaUpdate(today, limit);
  }
  const key = `${QUOTA_KV_PREFIX}${today}`;
  return kvQuotaUpdate(kv, key, today, limit);
}

async function readQuotaSnapshot(env, limit) {
  const today = getTodayUtc();
  const kv = env?.AI_QUOTA;
  if (kv && typeof kv.get === "function") {
    try {
      const data = await kv.get(`${QUOTA_KV_PREFIX}${today}`, { type: "json" });
      if (data && data.date === today && typeof data.count === "number") {
        return {
          date: today,
          used: data.count,
          limit,
          remaining: limit > 0 ? Math.max(0, limit - data.count) : null,
        };
      }
    } catch (e) {
      // Replaced undefined sharedLogger usage with shared log helper
      log("warn", "ai.quota_snapshot_error", { error: String(e) });
    }
  }

  if (aiDaily.day === today) {
    return {
      date: today,
      used: aiDaily.count,
      limit,
      remaining: limit > 0 ? Math.max(0, limit - aiDaily.count) : null,
    };
  }

  return {
    date: today,
    used: 0,
    limit,
    remaining: limit > 0 ? limit : null,
  };
}

// Added: simple persisted quota reader used by /health (previously missing)
export async function readPersistedQuota(env) {
  const today = getTodayUtc();
  const kv = env?.AI_QUOTA;
  if (kv && typeof kv.get === "function") {
    try {
      const data = await kv.get(`${QUOTA_KV_PREFIX}${today}`, { type: "json" });
      if (data && data.date === today && typeof data.count === "number") {
        return { date: today, count: data.count, source: "kv" };
      }
    } catch (e) {
      log("warn", "ai.quota_persist_read_error", { error: String(e) });
    }
  }
  // Fallback to in-memory daily counter
  if (aiDaily.day === today) {
    return { date: today, count: aiDaily.count, source: "memory" };
  }
  return { date: today, count: 0, source: "memory" };
}

// Middleware
app.use("*", honoLogger());
app.use("*", correlationMiddleware());
app.use("*", logRequestMiddleware());
app.use("*", cors());

// Correlation ID middleware
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  await next();
  c.res.headers.set("x-request-id", requestId);
});

// API Key authentication (hardening)
app.use("*", async (c, next) => {
  const env = c.env || {};
  const raw = env.API_ALLOWED_KEYS || "";
  // Allow unauthenticated access to basic health endpoints
  const path = c.req.path;
  if (path === "/health" || path === "/healthz") {
    return next();
  }
  if (raw) {
    const allowed = raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (allowed.length) {
      const provided = c.req.header("x-api-key");
      if (!provided || !allowed.includes(provided)) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      c.set("actor", provided);
    }
  }
  await next();
});

// Rate limiting (after auth so we have actor)
app.use("*", async (c, next) => {
  const env = c.env || {};
  const path = c.req.path;
  if (path === "/health" || path === "/healthz") return next();
  const actor = c.get("actor");
  if (!actor) return next();
  const max = parseInt(env.RATE_LIMIT_MAX_REQUESTS || "0", 10) || 0;
  const windowSec = parseInt(env.RATE_LIMIT_WINDOW_SECONDS || "0", 10) || 0;
  if (!(max > 0 && windowSec > 0)) return next();
  const now = Date.now();
  let entry = rateLimits.get(actor);
  if (!entry) {
    entry = { windowStart: now, count: 0 };
  } else if (now - entry.windowStart >= windowSec * 1000) {
    entry.windowStart = now;
    entry.count = 0;
  }
  entry.count += 1;
  rateLimits.set(actor, entry);
  if (entry.count > max) {
    const resetIn = windowSec - Math.floor((now - entry.windowStart) / 1000);
    return c.json(
      {
        error: "Rate limit exceeded",
        limit: max,
        remaining: 0,
        reset: resetIn,
        requestId: c.get("requestId"),
        actor,
      },
      429,
      {
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetIn),
      },
    );
  }
  await next();
  // Attach headers post-response
  const now2 = Date.now();
  const resetIn = windowSec - Math.floor((now2 - entry.windowStart) / 1000);
  c.res.headers.set("X-RateLimit-Limit", String(max));
  c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
  c.res.headers.set("X-RateLimit-Reset", String(resetIn));
});

// MCP Integration (resolved dynamically; cached after first access)
let MCP_ENDPOINT_CACHE = null;
function getMcpEndpoint(env) {
  if (!MCP_ENDPOINT_CACHE) {
    MCP_ENDPOINT_CACHE = resolveMcpEndpoint(env || {});
  }
  return MCP_ENDPOINT_CACHE;
}

// State tracking
let lastCheck = new Date();
let pendingTasks = new Set();
let activeDeployments = new Set();
let terminalCommands = new Map(); // Track terminal commands and their status
// In-memory workflow storage (MVP) keyed by workflow id
const workflows = new Map();
// Simple in-memory ETL lock & last run metadata (non-persistent)
let etlLock = {
  running: false,
  startedAt: null,
  lastSuccess: null,
  lastError: null,
  lastId: null,
};

// Task priorities
const PRIORITIES = {
  CRITICAL: 0, // Immediate attention needed
  HIGH: 1, // Important but not urgent
  NORMAL: 2, // Regular tasks
  LOW: 3, // Background tasks
};

// Task types that need AI assistance
const AI_TASKS = {
  DEPLOYMENT: "deployment",
  DOCUMENTATION: "documentation",
  CODE_REVIEW: "code_review",
  BUG_FIX: "bug_fix",
  FEATURE: "feature",
  OPTIMIZATION: "optimization",
  TERMINAL: "terminal_command", // New type for terminal commands
};

// Unified AI invocation using shared abstraction with fallback & deterministic options
async function callAI(prompt, env, opts = {}) {
  const messages = [{ role: "user", content: prompt }];
  return generateAI(messages, env, {
    provider: opts.provider,
    model: opts.model,
    deterministic: env.AI_DETERMINISTIC === "1",
  });
}

function createCommandRunnerError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function resolveCommandRunner(env) {
  const serviceBinding = env?.COMMAND_RUNNER;
  if (serviceBinding && typeof serviceBinding.fetch === "function") {
    return {
      execute: (command) =>
        serviceBinding.fetch("https://command-runner.internal/run-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        }),
    };
  }

  const configuredUrl = env?.COMMAND_RUNNER_URL;
  if (typeof configuredUrl === "string" && configuredUrl.trim()) {
    let parsed;
    try {
      parsed = new URL(configuredUrl);
    } catch {
      throw createCommandRunnerError(
        503,
        "COMMAND_RUNNER_URL_INVALID",
        "COMMAND_RUNNER_URL is invalid",
      );
    }

    if (!(parsed.protocol === "https:" || parsed.protocol === "http:")) {
      throw createCommandRunnerError(
        503,
        "COMMAND_RUNNER_URL_INVALID",
        "COMMAND_RUNNER_URL must use http or https",
      );
    }

    return {
      execute: (command) =>
        fetch(parsed.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        }),
    };
  }

  throw createCommandRunnerError(
    503,
    "COMMAND_RUNNER_UNCONFIGURED",
    "No command runner configured",
  );
}

async function runCommand(command, env) {
  const runner = resolveCommandRunner(env);
  const response = await runner.execute(command);
  if (!response.ok) {
    throw createCommandRunnerError(
      502,
      "COMMAND_RUNNER_EXECUTION_FAILED",
      `Command runner returned status ${response.status}`,
    );
  }
  const data = await response.json().catch(() => ({}));
  return {
    output: typeof data.output === "string" ? data.output : "",
    exitCode: Number.isInteger(data.exitCode) ? data.exitCode : 0,
  };
}

// Stub: check active deployments (simulate)
async function checkActiveDeployments() {
  // In production, query deployment state from MCP or agent
  return [];
}

// Stub: check pending tasks (simulate)
async function checkPendingTasks() {
  // In production, query task queue from MCP or agent
  return [];
}

// Stub: handle non-terminal actions (simulate)
async function handleAction(action) {
  // In production, route to correct agent (e.g., documentation, infra)
  console.log("Handling action:", action);
  return { handled: true };
}

// Check with MCP before any action
async function checkWithMCP(action, context) {
  // Test bypass: allow unit tests to skip outbound network approval calls
  if ((globalThis || {}).TEST_MCP_APPROVE_ALL === true) return true;
  if (typeof context === "object" && context && context.env && context.env.MCP_APPROVE_ALL === "1")
    return true;
  if (typeof action === "string" && globalThis.MCP_APPROVE_ALL === "1") return true;
  const endpoint = getMcpEndpoint(context?.env);
  try {
    const response = await fetch(`${endpoint}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, context }),
    });

    const result = await response.json();
    return result.approved;
  } catch (error) {
    const debugMcpLogs =
      context?.env?.DEBUG_MCP_LOGS === "true" ||
      (typeof process !== "undefined" && process?.env?.DEBUG_MCP_LOGS === "true");
    if (debugMcpLogs) {
      // Consolidated logging; sharedLogger undefined before
      log("error", "mcp.approval_failed", { error: String(error) });
    }
    return false;
  }
}

// Monitor project state
async function monitorProjectState() {
  // Get MCP approval for monitoring
  const approved = await checkWithMCP("monitor", { timestamp: new Date() });
  if (!approved) return;

  // Check for active deployments
  const deployments = await checkActiveDeployments();
  activeDeployments = new Set(deployments);

  // Check for pending tasks
  const tasks = await checkPendingTasks();
  pendingTasks = new Set(tasks);

  // Update last check time
  lastCheck = new Date();
}

// Execute terminal command with MCP approval
async function executeTerminalCommand(command, context, env) {
  const commandId = Date.now().toString();
  terminalCommands.set(commandId, { command, status: "pending", context });

  // Get MCP approval
  const approved = await checkWithMCP("terminal", { command, context });
  if (!approved) {
    terminalCommands.set(commandId, { command, status: "rejected", context });
    return { success: false, reason: "MCP rejected command" };
  }

  try {
    // Execute command (implement actual execution logic)
    const result = await runCommand(command, env);
    terminalCommands.set(commandId, {
      command,
      status: "completed",
      context,
      result,
    });
    return { success: true, result };
  } catch (error) {
    terminalCommands.set(commandId, {
      command,
      status: "failed",
      context,
      error,
    });
    return {
      success: false,
      error: {
        code: error?.code || "COMMAND_RUNNER_ERROR",
        message: error?.message || "Command execution failed",
      },
      status: Number.isInteger(error?.status) ? error.status : 500,
    };
  }
}

// Determine if AI assistance is needed
async function needsAIAssistance() {
  // Get MCP approval for AI assistance check
  const approved = await checkWithMCP("ai_assistance_check", {
    timestamp: new Date(),
  });
  if (!approved) return { needed: false, reason: "MCP rejected AI assistance check" };

  // Check for critical tasks
  const criticalTasks = Array.from(pendingTasks).filter(
    (task) => task.priority === PRIORITIES.CRITICAL,
  );

  if (criticalTasks.length > 0) {
    return {
      needed: true,
      tasks: criticalTasks,
      reason: "Critical tasks pending",
    };
  }

  // Check for deployment issues
  if (activeDeployments.size > 0) {
    return {
      needed: true,
      tasks: Array.from(activeDeployments),
      reason: "Active deployment needs monitoring",
    };
  }

  // Check for documentation updates
  const docTasks = Array.from(pendingTasks).filter((task) => task.type === AI_TASKS.DOCUMENTATION);

  if (docTasks.length > 0) {
    return {
      needed: true,
      tasks: docTasks,
      reason: "Documentation updates needed",
    };
  }

  return { needed: false };
}

// Request AI assistance
async function requestAIAssistance(tasks, env) {
  // Get MCP approval for AI assistance
  const approved = await checkWithMCP("ai_assistance", { tasks });
  if (!approved) return { success: false, reason: "MCP rejected AI assistance" };

  const prompt = generatePrompt(tasks);

  try {
    // Call AI API with MCP context
    const response = await callAI(prompt, env || {}, { mcpContext: true });

    // Process AI response with MCP approval
    const processApproved = await checkWithMCP("process_ai_response", {
      response,
    });
    if (!processApproved) return { success: false, reason: "MCP rejected AI response processing" };

    await processAIResponse(response);

    return { success: true, response };
  } catch (error) {
    log("error", "ai.assistance_request_failed", { error: String(error) });
    return { success: false, error };
  }
}

// Generate appropriate prompt for AI
function generatePrompt(tasks) {
  const taskDescriptions = tasks
    .map((task) => {
      return `Task: ${task.type}\nPriority: ${task.priority}\nDescription: ${task.description}`;
    })
    .join("\n\n");

  return `Please assist with the following tasks:\n\n${taskDescriptions}`;
}

// Process AI response
async function processAIResponse(response) {
  // Get MCP approval for each action in the response
  for (const action of response.actions) {
    const approved = await checkWithMCP("process_action", { action });
    if (!approved) continue;

    // Execute approved action
    if (action.type === AI_TASKS.TERMINAL) {
      await executeTerminalCommand(action.command, action.context);
    } else {
      // Handle other action types
      await handleAction(action);
    }
  }
}

// API Endpoints
app.get("/integrations", async (c) => {
  const q = c.req.query();
  const filter = { category: q.category, tier: q.tier, status: q.status };
  const items = listIntegrations(filter);
  const health = await probeIntegrations(c.env || {});
  // Map health statuses to returned subset
  const healthMap = new Map(health.map((h) => [h.id, h]));
  const enriched = items.map((i) => ({
    ...i,
    health: healthMap.get(i.id) || { status: "unknown" },
  }));
  return c.json({
    integrations: enriched,
    count: enriched.length,
    requestId: c.get("requestId"),
  });
});
app.get("/status", async (c) => {
  const approved = await checkWithMCP("status_check", {
    timestamp: new Date(),
    env: c.env,
  });
  if (!approved) return c.json({ error: "MCP rejected status check" }, 403);

  return c.json({
    lastCheck,
    pendingTasks: Array.from(pendingTasks),
    activeDeployments: Array.from(activeDeployments),
    terminalCommands: Array.from(terminalCommands.entries()),
    etl: {
      running: etlLock.running,
      startedAt: etlLock.startedAt,
      lastSuccess: etlLock.lastSuccess,
      lastError: etlLock.lastError,
      lastId: etlLock.lastId,
    },
    requestId: c.get("requestId"),
    actor: c.get("actor"),
  });
});

// Internal ETL trigger (invoked by scheduler daily)
app.post("/internal/etl/run", async (c) => {
  // Require API key (middleware already enforced except health) so just double-check actor presence
  if (!c.get("actor")) return c.json({ error: "Unauthorized" }, 401);
  const body = (await c.req.json().catch(() => ({}))) || {};
  const requestedId = body.runId || crypto.randomUUID();
  if (etlLock.running) {
    return c.json(
      {
        status: "already_running",
        runId: etlLock.lastId,
        startedAt: etlLock.startedAt,
      },
      409,
    );
  }
  // Basic idempotency: if same runId executed successfully in last hour, short-circuit
  if (
    etlLock.lastId === requestedId &&
    etlLock.lastSuccess &&
    Date.now() - new Date(etlLock.lastSuccess).getTime() < 60 * 60 * 1000
  ) {
    return c.json({ status: "duplicate_ignored", runId: requestedId }, 200);
  }
  etlLock.running = true;
  etlLock.startedAt = new Date().toISOString();
  etlLock.lastId = requestedId;
  // Simulate asynchronous ETL steps
  c.executionCtx.waitUntil(
    (async () => {
      try {
        // Placeholder: replace with real ETL logic (e.g., aggregate metrics, cleanup, rollups)
        await new Promise((r) => setTimeout(r, 50));
        etlLock.lastSuccess = new Date().toISOString();
        etlLock.lastError = null;
      } catch (e) {
        etlLock.lastError = String(e);
      } finally {
        etlLock.running = false;
      }
    })(),
  );
  return c.json(
    {
      status: "accepted",
      runId: requestedId,
      startedAt: etlLock.startedAt,
      message: "ETL run accepted",
    },
    202,
  );
});

app.post("/task", async (c) => {
  const task = await c.req.json();

  // Get MCP approval for task
  const approved = await checkWithMCP("add_task", { task });
  if (!approved) return c.json({ error: "MCP rejected task" }, 403);

  pendingTasks.add(task);

  // Check if AI assistance is needed
  const { needed, tasks } = await needsAIAssistance();
  if (needed) {
    await requestAIAssistance(tasks, c.env);
  }

  return c.json({
    success: true,
    task,
    requestId: c.get("requestId"),
    actor: c.get("actor"),
  });
});

// Terminal command endpoint
app.post("/terminal", async (c) => {
  const { command, context } = await c.req.json();
  if (typeof command !== "string" || !command.trim()) {
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_COMMAND",
          message: "command must be a non-empty string",
        },
        requestId: c.get("requestId"),
        actor: c.get("actor"),
      },
      400,
    );
  }

  const result = await executeTerminalCommand(command, context, c.env || {});
  const status = result.success ? 200 : result.status || 500;
  return c.json(
    {
      ...result,
      requestId: c.get("requestId"),
      actor: c.get("actor"),
    },
    status,
  );
});

// Simple AI inference endpoint (POST /ai/infer) { prompt, model? }
// --- AI Inference Helpers -------------------------------------------------
function validatePrompt(c, body) {
  const prompt = body.prompt;
  if (!prompt || typeof prompt !== "string")
    return { error: c.json({ error: "Missing prompt" }, 400) };
  const maxPrompt = parseInt(c.env.AI_MAX_PROMPT_CHARS || "8000", 10);
  if (prompt.length > maxPrompt)
    return {
      error: c.json({ error: "Prompt too large", max: maxPrompt }, 413),
    };
  return { prompt };
}

function applyRateLimit(c) {
  const windowSeconds =
    parseInt(c.env.AI_RATE_WINDOW_SECONDS || "", 10) || DEFAULT_AI_RATE_WINDOW_SECONDS;
  const burst = parseInt(c.env.AI_RATE_BURST || "", 10) || DEFAULT_AI_RATE_BURST;
  if (!(burst > 0 && windowSeconds > 0)) return { ok: true };
  const ip = getClientIp(c);
  const bucketKey = `${ip}:infer`;
  const now = Date.now();
  pruneRateBuckets(now);
  const windowMs = windowSeconds * 1000;
  let bucket = aiIpRateBuckets.get(bucketKey);
  if (!bucket || now - bucket.windowStart >= windowMs)
    bucket = { windowStart: now, count: 0, windowMs, lastAccess: now };
  bucket.count += 1;
  bucket.lastAccess = now;
  aiIpRateBuckets.set(bucketKey, bucket);
  if (bucket.count > burst) {
    const retryAfter = Math.max(
      1,
      Math.ceil((bucket.windowMs - (now - bucket.windowStart)) / 1000),
    );
    log("warn", "ai.rate_limit", {
      ip,
      used: bucket.count,
      windowSeconds,
      requestId: c.get("requestId"),
    });
    return {
      ok: false,
      error: c.json(
        {
          error: "rate_limited",
          retryAfterSeconds: retryAfter,
          requestId: c.get("requestId"),
        },
        429,
        { "Retry-After": String(retryAfter) },
      ),
    };
  }
  return { ok: true };
}

async function applyQuota(c) {
  const limit = parseInt(c.env.AI_MAX_REQUESTS_PER_DAY || "0", 10) || 0;
  const quotaResult = await enforceDailyQuota(c, limit);
  const quotaInfo = {
    date: quotaResult.date,
    used: quotaResult.used,
    limit,
    remaining: quotaResult.remaining,
  };
  if (!quotaResult.allowed) {
    log("info", "ai.quota_exceeded", {
      date: quotaResult.date,
      used: quotaResult.used,
      limit,
      requestId: c.get("requestId"),
    });
    return {
      ok: false,
      quotaInfo,
      error: c.json(
        {
          error: "Daily AI request quota reached",
          quota: quotaInfo,
          requestId: c.get("requestId"),
        },
        429,
      ),
    };
  }
  return { ok: true, quotaInfo };
}

function selectModel(c, body) {
  const allow = (
    c.env.AI_ALLOWED_MODELS || "@cf/meta/llama-3.1-8b-instruct,@cf/meta/llama-3.3-70b-instruct"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const model = body.model || allow[0];
  if (!allow.includes(model))
    return {
      error: c.json({ error: "Unsupported model", model, allowed: allow }, 400),
    };
  return { model };
}

async function runInference(c, prompt, model, quotaInfo) {
  try {
    if (c.env.AI_TEST_MODE === "1") {
      return {
        response: c.json({
          success: true,
          model,
          durationMs: 0,
          output: { text: c.env.AI_TEST_RESPONSE || "test-output" },
          quota: quotaInfo,
          requestId: c.get("requestId"),
          actor: c.get("actor"),
        }),
      };
    }
    const started = Date.now();
    const breaker = getBreaker("ai-primary", {
      failureThreshold: 3,
      resetTimeoutMs: 20000,
    });
    try {
      let usedFallback = false;
      const outputText = await breaker.exec(
        () => callAI(prompt, c.env || {}, { model }),
        async () => {
          usedFallback = true;
          return "[fallback-response] " + (prompt.slice(0, 120) || "");
        },
      );
      if (usedFallback) await recordBreakerTrip(c.env || {}, "ai-primary");
      const durationMs = Date.now() - started;
      return {
        response: c.json({
          success: true,
          model,
          durationMs,
          output: { text: outputText },
          quota: quotaInfo,
          requestId: c.get("requestId"),
          actor: c.get("actor"),
        }),
      };
    } catch (err) {
      await recordBreakerTrip(c.env || {}, "ai-primary");
      log("error", "ai.breaker.failure", { error: String(err) });
      return {
        response: c.json(
          {
            error: "AI service unavailable",
            quota: quotaInfo,
            breaker: { state: breaker.status() },
            requestId: c.get("requestId"),
          },
          503,
        ),
      };
    }
  } catch (e) {
    log("error", "ai.infer.error", { error: String(e) });
    return {
      response: c.json(
        {
          error: "AI inference failed",
          quota: quotaInfo,
          requestId: c.get("requestId"),
        },
        500,
      ),
    };
  }
}

// Simple AI inference endpoint (POST /ai/infer) { prompt, model? }
app.post("/ai/infer", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const v = validatePrompt(c, body);
  if (v.error) return v.error;
  const prompt = v.prompt;
  const rl = applyRateLimit(c);
  if (!rl.ok) return rl.error;
  const quota = await applyQuota(c);
  if (!quota.ok) return quota.error;
  const quotaInfo = quota.quotaInfo;
  const m = selectModel(c, body);
  if (m.error) return m.error;
  const model = m.model;
  const { response } = await runInference(c, prompt, model, quotaInfo);
  return response;
});

// ─── Agent Mesh Endpoint ────────────────────────────────────────────────────
// POST /ai/agent-mesh { input, systemPrompt?, guardEnabled? }
// Routes through the AtlasIT Agent Mesh: Guard -> Classify -> Route to model
app.post("/ai/agent-mesh", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (!input) {
    return c.json({ error: "input required", requestId: c.get("requestId") }, 400);
  }

  const rl = applyRateLimit(c);
  if (!rl.ok) return rl.error;
  const quota = await applyQuota(c);
  if (!quota.ok) return quota.error;

  const groqApiKey = c.env?.GROQ_API_KEY;
  if (!groqApiKey) {
    return c.json(
      {
        error: "GROQ_API_KEY not configured",
        requestId: c.get("requestId"),
      },
      503,
    );
  }

  try {
    const config = {
      groqApiKey,
      guardEnabled: body.guardEnabled !== false,
      modelOverrides: body.modelOverrides || undefined,
    };

    const result = await executeAgentMesh(input, config, body.systemPrompt || undefined);

    if (result.classification.blocked) {
      return c.json(
        {
          blocked: true,
          reason: result.classification.blockReason,
          requestId: c.get("requestId"),
        },
        403,
      );
    }

    return c.json({
      response: result.response,
      model: result.model,
      role: result.classification.role,
      confidence: result.classification.confidence,
      durationMs: result.durationMs,
      guardResult: result.guardResult,
      requestId: c.get("requestId"),
    });
  } catch (err) {
    log("error", "agent_mesh.error", {
      requestId: c.get("requestId"),
      error: String(err),
    });
    return c.json(
      {
        error: "Agent mesh inference failed",
        detail: err instanceof Error ? err.message : String(err),
        requestId: c.get("requestId"),
      },
      502,
    );
  }
});

// POST /ai/classify { input } — classify a task without executing
app.post("/ai/classify", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) || {};
  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (!input) {
    return c.json({ error: "input required", requestId: c.get("requestId") }, 400);
  }

  try {
    const classification = classifyTask(input);
    return c.json({
      ...classification,
      requestId: c.get("requestId"),
    });
  } catch (err) {
    return c.json(
      {
        error: "Classification failed",
        detail: err instanceof Error ? err.message : String(err),
        requestId: c.get("requestId"),
      },
      500,
    );
  }
});

// Health check
app.get("/healthz", (c) => c.text("OK"));
// Lightweight in-memory cache for R2 metrics (per isolate)
let r2MetricsCache = { ts: 0, data: null };
async function collectR2Metrics(env) {
  const now = Date.now();
  if (r2MetricsCache.data && now - r2MetricsCache.ts < 30_000) {
    return r2MetricsCache.data;
  }
  const buckets = [
    { key: "atlas_policies", ref: env?.atlas_policies },
    { key: "atlas_evidence", ref: env?.atlas_evidence },
    { key: "atlas_artifacts", ref: env?.atlas_artifacts },
  ];
  const result = {};
  await Promise.all(
    buckets.map(async (b) => {
      if (!b.ref) {
        result[b.key] = { bound: false };
        return;
      }
      try {
        // Limit listing to small sample to avoid heavy scans; indicates bucket accessibility.
        const listing = await b.ref.list({ limit: 10 });
        result[b.key] = {
          bound: true,
          listed: listing.objects?.length || 0,
          truncated: Boolean(listing.truncated),
          sampleKeys: (listing.objects || []).map((o) => o.key).slice(0, 3),
          // Approximate indicator (cannot know total cheaply without full iteration)
          objectsApprox:
            listing.objects?.length === 10 ? ">=10" : String(listing.objects?.length || 0),
        };
      } catch (e) {
        result[b.key] = { bound: true, error: String(e) };
      }
    }),
  );
  r2MetricsCache = { ts: now, data: result };
  return result;
}

app.get("/health", async (c) => {
  const r2 = await collectR2Metrics(c.env || {});
  const quotaLimit = parseInt(c.env.AI_MAX_REQUESTS_PER_DAY || "500", 10);
  const persisted = await readPersistedQuota(c.env || {});
  const remaining = quotaLimit > 0 ? Math.max(0, quotaLimit - persisted.count) : null;
  return c.json({
    status: "healthy",
    service: "ai-orchestrator",
    timestamp: new Date().toISOString(),
    requestId: c.get("requestId"),
    actor: c.get("actor") || null,
    quota: {
      date: persisted.date,
      used: persisted.count,
      limit: quotaLimit,
      remaining,
    },
    rateLimit: {
      windowSeconds: parseInt(c.env.AI_RATE_WINDOW_SECONDS || "60", 10),
      burst: parseInt(c.env.AI_RATE_BURST || c.env.AI_RATE_LIMIT_BURST || "10", 10),
    },
    r2,
  });
});

// Create workflow (POST /workflow)
app.post("/workflow", async (c) => {
  const actor = c.get("actor");
  const body = await c.req.json().catch(() => ({}));
  const id = body.id || crypto.randomUUID();
  const steps = Array.isArray(body.steps) ? body.steps : [];
  const wf = {
    id,
    name: body.name || `workflow-${id.substring(0, 6)}`,
    steps,
    status: "pending",
    createdAt: new Date().toISOString(),
    actor,
    requestId: c.get("requestId"),
  };
  workflows.set(id, wf);
  return c.json({ workflow: wf, requestId: c.get("requestId"), actor }, 201);
});

// Get workflow (GET /workflow/:id)
app.get("/workflow/:id", (c) => {
  const id = c.req.param("id");
  if (!workflows.has(id)) {
    return c.json(
      {
        error: "Workflow not found",
        id,
        requestId: c.get("requestId"),
        actor: c.get("actor"),
      },
      404,
    );
  }
  const wf = workflows.get(id);
  return c.json({
    workflow: wf,
    requestId: c.get("requestId"),
    actor: c.get("actor"),
  });
});

// Cloudflare scheduled trigger will call monitorProjectState every 5 minutes

export async function handleRequest(req, env, ctx) {
  resolveCfApiToken(env);
  if (!envValidated) {
    try {
      validateEnv(commonEnvSpec, env);
    } catch (e) {
      log("warn", "orchestrator.env_validation_warning", { error: String(e) });
    } finally {
      envValidated = true;
    }
  }
  return app.fetch(req, env, ctx);
}

export default {
  fetch: handleRequest,
  scheduled: async (event, env, ctx) => {
    resolveCfApiToken(env);
    ctx.waitUntil(monitorProjectState());
  },
};

// Test-only state reset helper (exported for orchestrator tests)
export function __resetAiStateForTests() {
  aiDaily = { day: null, count: 0 };
  persistedQuotaMemory = { date: null, count: 0 };
  rateLimits.clear();
  aiIpRateBuckets.clear();
  MCP_ENDPOINT_CACHE = null;
  pendingTasks.clear();
  activeDeployments.clear();
  terminalCommands.clear();
  workflows.clear();
  etlLock = {
    running: false,
    startedAt: null,
    lastSuccess: null,
    lastError: null,
    lastId: null,
  };
}
