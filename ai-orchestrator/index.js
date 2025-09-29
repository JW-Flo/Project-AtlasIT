import { Hono } from "hono";
import { resolveMcpEndpoint } from "./config.js";
import { logger as honoLogger } from "hono/logger";
import { cors } from "hono/cors";
import {
  logger as sharedLogger,
  validateEnv,
  commonEnvSpec,
  generateAI,
  resolveCfApiToken,
} from "@atlasit/shared";

const app = new Hono();
let envValidated = false;
// In-memory rate limit tracker (per isolate, best-effort)
const rateLimits = new Map();

// Middleware
app.use("*", honoLogger());
app.use("*", cors());

// Correlation ID middleware
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  // Provide in response header after downstream handlers
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
  c.res.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, max - entry.count)),
  );
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

// Stub: run terminal command (simulate for now)
async function runCommand(command) {
  try {
    // In production, this would dispatch to a secure runner or agent
    const result = await fetch("/run-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    if (!result.ok)
      throw new Error("Command execution error: " + result.status);
    const data = await result.json();
    return { output: data.output };
  } catch (error) {
    console.error("Failed to execute command:", error);
    throw error;
  }
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
  if (
    typeof context === "object" &&
    context &&
    context.env &&
    context.env.MCP_APPROVE_ALL === "1"
  )
    return true;
  if (typeof action === "string" && globalThis.MCP_APPROVE_ALL === "1")
    return true;
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
      (typeof process !== "undefined" &&
        process?.env?.DEBUG_MCP_LOGS === "true");
    if (debugMcpLogs) {
      sharedLogger.error("MCP approval check failed", { error: String(error) });
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
async function executeTerminalCommand(command, context) {
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
    const result = await runCommand(command);
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
    return { success: false, error };
  }
}

// Determine if AI assistance is needed
async function needsAIAssistance() {
  // Get MCP approval for AI assistance check
  const approved = await checkWithMCP("ai_assistance_check", {
    timestamp: new Date(),
  });
  if (!approved)
    return { needed: false, reason: "MCP rejected AI assistance check" };

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
  const docTasks = Array.from(pendingTasks).filter(
    (task) => task.type === AI_TASKS.DOCUMENTATION,
  );

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
async function requestAIAssistance(tasks) {
  // Get MCP approval for AI assistance
  const approved = await checkWithMCP("ai_assistance", { tasks });
  if (!approved)
    return { success: false, reason: "MCP rejected AI assistance" };

  const prompt = generatePrompt(tasks);

  try {
    // Call AI API with MCP context
    const response = await callAI(prompt, c.env || {}, { mcpContext: true });

    // Process AI response with MCP approval
    const processApproved = await checkWithMCP("process_ai_response", {
      response,
    });
    if (!processApproved)
      return { success: false, reason: "MCP rejected AI response processing" };

    await processAIResponse(response);

    return { success: true, response };
  } catch (error) {
    sharedLogger.error("AI assistance request failed", {
      error: String(error),
    });
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
app.get("/status", async (c) => {
  const approved = await checkWithMCP("status_check", {
    timestamp: new Date(),
  });
  if (!approved) return c.json({ error: "MCP rejected status check" }, 403);

  return c.json({
    lastCheck,
    pendingTasks: Array.from(pendingTasks),
    activeDeployments: Array.from(activeDeployments),
    terminalCommands: Array.from(terminalCommands.entries()),
    requestId: c.get("requestId"),
    actor: c.get("actor"),
  });
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
    await requestAIAssistance(tasks);
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

  const result = await executeTerminalCommand(command, context);
  return c.json({
    ...result,
    requestId: c.get("requestId"),
    actor: c.get("actor"),
  });
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
            listing.objects?.length === 10
              ? ">=10"
              : String(listing.objects?.length || 0),
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
  return c.json({
    status: "healthy",
    service: "orchestrator",
    timestamp: new Date().toISOString(),
    requestId: c.get("requestId"),
    actor: c.get("actor"),
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
      sharedLogger.warn("Orchestrator env validation warning", {
        error: String(e),
      });
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
