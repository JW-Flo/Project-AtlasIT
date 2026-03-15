import registry from "./adapters/registry.json";
import { traceFetch } from "./src/lib/trace.js";
import { buildBaseHealth, finalizeHealth } from "./shared/health-schema.ts";
import {
  summarizeIntegrations,
  listIntegrations,
} from "./shared/integrations/registry.js";
import { probeIntegrations } from "./shared/integrations/health.js";
import {
  buildLifecycleWorkflowsForApp,
  normalizeIdpSource,
  resolveLifecycleApps,
} from "./shared/integrations/lifecycle.js";
import log, { getRecentLogs, generateCorrelationId } from "./shared/log.js";

// ---------- Utilities -------------------------------------------------------
const adapterRegistry = Array.isArray(registry) ? registry : [];
const LIFECYCLE_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function isFeatureEnabled(env, flag) {
  if (!flag) return false;
  const raw = env?.[flag];
  if (typeof raw === "string")
    return raw === "1" || raw.toLowerCase() === "true";
  if (typeof raw === "number") return raw === 1;
  return !!raw;
}

function makeHeaders(correlationId, extra = {}) {
  return { "x-correlation-id": correlationId, ...extra };
}

async function handleDiagnostics(env) {
  if (env.__BINDING_DIAGNOSTICS_EMITTED) return;
  const expected = [
    "KV_SESSIONS",
    "KV_CACHE",
    "KV_FEATURE_FLAGS",
    "MCP_STORE",
    "ATLAS_CORE_DB",
    "ATLAS_AUDIT_DB",
    "ATLAS_COMPLIANCE_DB",
    "ATLAS_AUDIT_SHADOW",
    "atlas_policies",
    "atlas_evidence",
    "atlas_artifacts",
  ];
  const missing = expected.filter((k) => !(k in env));
  if (missing.length)
    console.warn("[bindings.missing]", JSON.stringify({ missing }));
  env.__BINDING_DIAGNOSTICS_EMITTED = true;
}

// ---------- Endpoint Handlers (return Response or null) --------------------
async function handleHealth(url, env, correlationId, baseHeaders) {
  if (url.pathname !== "/health") return null;
  const start = Date.now();
  const h = buildBaseHealth({
    version: "3.0.0",
    service: "AtlasIT Core Worker",
    startTime: start,
  });
  try {
    h.resources.d1_database = env.ATLAS_CORE_DB ? "configured" : "missing";
    if (!env.ATLAS_CORE_DB) {
      h.status = "degraded";
      h.warnings.push("ATLAS_CORE_DB missing");
    }
    if (env.KV_CACHE) h.resources.kv = "configured";
    if (env.atlas_evidence) h.resources.r2_storage = "configured";
    h.performance.responseTimeMs = Date.now() - start;
  } catch {
    /* degrade health silently */ h.warnings.push("Health probe error");
    if (h.status === "ok") h.status = "degraded";
  }
  const final = finalizeHealth(h);
  final.integrations = { summary: summarizeIntegrations() };
  log("info", "core.health", { status: final.status, correlationId });
  return new Response(JSON.stringify(final), {
    status: final.status === "unhealthy" ? 503 : 200,
    headers: { "Content-Type": "application/json", ...baseHeaders },
  });
}

function handleAdminLogs(url, request, env, correlationId, baseHeaders) {
  if (url.pathname !== "/api/v1/admin/logs/recent") return null;
  const adminToken = env.ADMIN_BEARER || env.ADMIN_TOKEN;
  if (adminToken) {
    const provided = request.headers.get("authorization") || "";
    const token = provided.startsWith("Bearer ") ? provided.slice(7) : provided;
    if (token !== adminToken) {
      return new Response(
        JSON.stringify({ error: "unauthorized", correlationId }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...baseHeaders },
        },
      );
    }
  }
  const limit = Math.min(
    200,
    parseInt(url.searchParams.get("limit") || "50", 10),
  );
  const level = url.searchParams.get("level") || undefined;
  return new Response(
    JSON.stringify({ logs: getRecentLogs(limit, level), limit, correlationId }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...baseHeaders },
    },
  );
}

// Apps sub-handlers to reduce complexity
function ensureAppsState(env) {
  if (!env.__APPS_STATE) {
    env.__APPS_STATE = { connected: new Set(), lastSync: new Map() };
  }
  return env.__APPS_STATE;
}

const appsJson = (baseHeaders, obj, status = 200) => {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...baseHeaders },
  });
};

async function appsList(env, state, correlationId, baseHeaders) {
  const health = await probeIntegrations(env);
  const hmap = new Map(health.map((h) => [h.id, h]));
  const applications = listIntegrations().map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    status: i.status,
    connected: state.connected.has(i.id),
    lastSync: state.lastSync.get(i.id) || null,
    health: hmap.get(i.id) || { status: "unknown" },
  }));
  log("info", "apps.list", { count: applications.length, correlationId });
  return appsJson(baseHeaders, {
    applications,
    count: applications.length,
    correlationId,
  });
}

async function appsConnect(request, state, correlationId, baseHeaders) {
  const id = (await request.json().catch(() => ({}))).id;
  if (!id)
    return appsJson(baseHeaders, { error: "id required", correlationId }, 400);
  state.connected.add(id);
  log("info", "apps.connect", { id, correlationId });
  return appsJson(baseHeaders, { connected: true, id, correlationId });
}

async function appsDisconnect(request, state, correlationId, baseHeaders) {
  const id = (await request.json().catch(() => ({}))).id;
  if (!id)
    return appsJson(baseHeaders, { error: "id required", correlationId }, 400);
  state.connected.delete(id);
  log("info", "apps.disconnect", { id, correlationId });
  return appsJson(baseHeaders, { connected: false, id, correlationId });
}

function appsStatus(state, correlationId, baseHeaders) {
  const applications = listIntegrations().map((i) => ({
    id: i.id,
    connected: state.connected.has(i.id),
    lastSync: state.lastSync.get(i.id) || null,
  }));
  return appsJson(baseHeaders, { applications, correlationId });
}

async function appsSync(request, state, correlationId, baseHeaders) {
  const id = (await request.json().catch(() => ({}))).id;
  if (!id)
    return appsJson(baseHeaders, { error: "id required", correlationId }, 400);
  if (!state.connected.has(id))
    return appsJson(
      baseHeaders,
      { error: "not connected", id, correlationId },
      400,
    );
  const syncId = "sync-" + Date.now();
  state.lastSync.set(id, new Date().toISOString());
  log("info", "apps.sync", { id, syncId, correlationId });
  return appsJson(baseHeaders, { syncId, id, correlationId }, 202);
}

async function appsLifecycleMovement(
  request,
  state,
  correlationId,
  baseHeaders,
) {
  const payload = await request.json().catch(() => ({}));
  if (!payload || typeof payload !== "object") {
    return appsJson(
      baseHeaders,
      { error: "json payload required", correlationId },
      400,
    );
  }

  const type =
    typeof payload.type === "string" ? payload.type.toLowerCase().trim() : "";
  const email =
    typeof payload?.user?.email === "string"
      ? payload.user.email.trim().toLowerCase()
      : "";

  if (!["joiner", "mover", "leaver"].includes(type)) {
    return appsJson(
      baseHeaders,
      { error: "invalid lifecycle type", correlationId },
      400,
    );
  }
  if (!LIFECYCLE_EMAIL_RE.test(email)) {
    return appsJson(
      baseHeaders,
      { error: "valid user.email required", correlationId },
      400,
    );
  }

  const idpSource = normalizeIdpSource(payload.idpSource || "okta");
  if (!idpSource) {
    return appsJson(
      baseHeaders,
      { error: "unsupported idpSource", correlationId },
      400,
    );
  }

  const catalog = new Map(listIntegrations().map((app) => [app.id, app]));
  const requested = resolveLifecycleApps(payload, state).filter(
    (id, idx, arr) => arr.indexOf(id) === idx,
  );
  if (requested.length === 0) {
    return appsJson(
      baseHeaders,
      { error: "no lifecycle targets resolved", correlationId },
      400,
    );
  }

  const unknownTargets = requested.filter((id) => !catalog.has(id));
  if (unknownTargets.length > 0) {
    return appsJson(
      baseHeaders,
      {
        error: "unknown apps requested",
        unknownApps: unknownTargets,
        correlationId,
      },
      400,
    );
  }

  const plans = requested.map((id) => {
    const app = catalog.get(id);
    const workflows = buildLifecycleWorkflowsForApp(app, idpSource);
    return {
      appId: app.id,
      category: app.category,
      idpSource,
      movement: type,
      connected: state.connected.has(app.id),
      connector: workflows.connector,
      steps: workflows[type],
      workflows: {
        joiner: workflows.joiner,
        mover: workflows.mover,
        leaver: workflows.leaver,
      },
    };
  });

  const scope = payload.scope === "connected" ? "connected" : "all";
  const movementId = `move-${Date.now()}`;
  log("info", "apps.lifecycle.movement", {
    movementId,
    type,
    applications: plans.length,
    scope,
    idpSource,
    correlationId,
  });
  return appsJson(
    baseHeaders,
    {
      movementId,
      type,
      scope,
      user: { email },
      idpSource,
      applications: plans,
      correlationId,
    },
    202,
  );
}

async function appsLifecycleWorkflows(
  request,
  state,
  correlationId,
  baseHeaders,
) {
  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return appsJson(
      baseHeaders,
      { error: "invalid JSON payload", correlationId },
      400,
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return appsJson(
      baseHeaders,
      { error: "payload must be a JSON object", correlationId },
      400,
    );
  }

  const hasExplicitTargets =
    (Array.isArray(payload.apps) && payload.apps.length > 0) ||
    typeof payload.scope === "string";

  if (!hasExplicitTargets) {
    return appsJson(
      baseHeaders,
      { error: "no explicit lifecycle scope provided", correlationId },
      400,
    );
  }

  const idpSource = normalizeIdpSource(payload.idpSource || "okta");
  if (!idpSource) {
    return appsJson(
      baseHeaders,
      { error: "unsupported idpSource", correlationId },
      400,
    );
  }

  const catalog = new Map(listIntegrations().map((app) => [app.id, app]));
  const requested = resolveLifecycleApps(payload, state).filter(
    (id, idx, arr) => arr.indexOf(id) === idx,
  );
  if (requested.length === 0) {
    return appsJson(
      baseHeaders,
      { error: "no lifecycle targets resolved", correlationId },
      400,
    );
  }
  const unknownTargets = requested.filter((id) => !catalog.has(id));
  if (unknownTargets.length > 0) {
    return appsJson(
      baseHeaders,
      {
        error: "unknown apps requested",
        unknownApps: unknownTargets,
        correlationId,
      },
      400,
    );
  }

  const applications = requested.map((id) => {
    const app = catalog.get(id);
    return {
      ...buildLifecycleWorkflowsForApp(app, idpSource),
      connected: state.connected.has(app.id),
    };
  });
  return appsJson(
    baseHeaders,
    {
      idpSource,
      scope: payload.scope === "connected" ? "connected" : "all",
      count: applications.length,
      applications,
      correlationId,
    },
    200,
  );
}
async function handleApps(url, request, env, correlationId, baseHeaders) {
  if (!url.pathname.startsWith("/api/v1/apps")) {
    return null;
  }
  const state = ensureAppsState(env);
  const m = request.method;
  if (url.pathname === "/api/v1/apps" && m === "GET")
    return appsList(env, state, correlationId, baseHeaders);
  if (url.pathname === "/api/v1/apps/connect" && m === "POST")
    return appsConnect(request, state, correlationId, baseHeaders);
  if (url.pathname === "/api/v1/apps/disconnect" && m === "POST")
    return appsDisconnect(request, state, correlationId, baseHeaders);
  if (url.pathname === "/api/v1/apps/status" && m === "GET")
    return appsStatus(state, correlationId, baseHeaders);
  if (url.pathname === "/api/v1/apps/sync" && m === "POST")
    return appsSync(request, state, correlationId, baseHeaders);
  if (url.pathname === "/api/v1/apps/lifecycle/movement" && m === "POST")
    return appsLifecycleMovement(request, state, correlationId, baseHeaders);
  if (url.pathname === "/api/v1/apps/lifecycle/workflows" && m === "POST")
    return appsLifecycleWorkflows(request, state, correlationId, baseHeaders);
  return null;
}

function handleConnectors(url, env, correlationId) {
  if (url.pathname !== "/api/connectors") return null;
  const enabled = adapterRegistry
    .filter((e) => isFeatureEnabled(env, e.featureFlag))
    .map((e) => ({ name: e.name, slug: e.slug, featureFlag: e.featureFlag }));
  log("info", "core.adapters", { count: enabled.length, correlationId });
  return new Response(JSON.stringify({ adapters: enabled, correlationId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function handleTasks(url, correlationId) {
  if (url.pathname !== "/tasks") return null;
  const tasks = [
    {
      id: "task-1",
      name: "Sync Okta Users",
      status: "running",
      owner: "agent-1",
      startedAt: "2025-05-19T18:00:00Z",
    },
    {
      id: "task-2",
      name: "License Audit",
      status: "pending",
      owner: "agent-2",
      startedAt: "2025-05-19T18:05:00Z",
    },
    {
      id: "task-3",
      name: "Ramp ETL",
      status: "success",
      owner: "agent-3",
      startedAt: "2025-05-19T18:10:00Z",
    },
  ];
  log("info", "core.tasks", { count: tasks.length, correlationId });
  return new Response(JSON.stringify({ tasks, correlationId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function handleSimpleEndpoints(url, request, env, correlationId, baseHeaders) {
  if (url.pathname === "/cicd") {
    log("info", "core.cicd", { correlationId });
    return new Response("pause", { status: 200, headers: baseHeaders });
  }
  if (url.pathname === "/api/pause" && request.method === "POST") {
    log("info", "core.pause", { correlationId });
    return new Response(JSON.stringify({ status: "paused", correlationId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.pathname === "/api/resume" && request.method === "POST") {
    log("info", "core.resume", { correlationId });
    return new Response(JSON.stringify({ status: "resumed", correlationId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.pathname === "/api/last-slack-status") {
    const slackUrl = env.SLACK_WEBHOOK_URL || "dummy";
    return new Response(JSON.stringify({ slack: slackUrl, correlationId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

async function handleDispatch(
  url,
  request,
  env,
  ctx,
  correlationId,
  baseHeaders,
) {
  const pathParts = url.pathname.split("/").filter(Boolean);
  const subWorkerName = pathParts[0] || "customer-worker-1";
  if (!env.dispatcher) {
    return new Response(
      JSON.stringify({
        error: "DISPATCHER_BINDING_MISSING",
        message:
          "Dispatcher namespace not configured (env.dispatcher undefined).",
        remediation: {
          docs: "https://developers.cloudflare.com/workers/platform/dispatch/",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const subWorker = await env.dispatcher.get(subWorkerName);
  if (!subWorker) {
    return new Response(
      JSON.stringify({
        error: "SUBWORKER_NOT_FOUND",
        subWorker: subWorkerName,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
  const trace = ctx?.trace;
  trace?.log("dispatch.forward", { subWorkerName });
  const response = await subWorker.fetch(request);
  trace?.log("dispatch.return", { status: response.status });
  return new Response(response.body, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), ...baseHeaders },
  });
}

// ---------- Main Fetch -----------------------------------------------------
async function handleFetch(request, env, ctx) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const url = new URL(request.url);
  const host = url.host;
  const isLegacyHost =
    host.includes("project-ignite.workers.dev") ||
    host.includes("project-ignite.");
  const deprecationHeaders = isLegacyHost
    ? {
        Deprecation: "true",
        Link: '</health>; rel="successor-version"',
        Sunset: new Date(Date.now() + 30 * 24 * 3600 * 1000).toUTCString(),
      }
    : {};
  const baseHeaders = makeHeaders(correlationId, deprecationHeaders);
  await handleDiagnostics(env);
  const chain = [
    () => handleHealth(url, env, correlationId, baseHeaders),
    () => handleAdminLogs(url, request, env, correlationId, baseHeaders),
    () => handleApps(url, request, env, correlationId, baseHeaders),
    () => handleConnectors(url, env, correlationId),
    () => handleTasks(url, correlationId),
    () => handleSimpleEndpoints(url, request, env, correlationId, baseHeaders),
  ];
  for (const fn of chain) {
    const res = await fn();
    if (res) return res;
  }
  try {
    return await handleDispatch(
      url,
      request,
      env,
      ctx,
      correlationId,
      baseHeaders,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx?.trace?.log("dispatch.error", { message, correlationId });
    log("error", "core.dispatch_error", { message, correlationId });
    return new Response("Bad Gateway", { status: 502, headers: baseHeaders });
  }
}

export default { fetch: traceFetch(handleFetch) };

// --- Compatibility Shim ----------------------------------------------------
// Some ancillary modules (e.g., compliance-worker executor) import { JMLEngine }
// from the root index. The refactor removed the previous class; we provide a
// minimal backward-compatible shim implementing the subset of behavior relied upon
// (handleEnqueue returning a Response containing a runId and runState skeleton).
export class JMLEngine {
  constructor(state = {}, env = {}) {
    this.state = state;
    this.env = env;
  }
  async handleEnqueue(context = {}) {
    const runId = crypto.randomUUID();
    const now = new Date().toISOString();
    const runState = {
      id: runId,
      type: context.type || "unknown",
      status: "queued",
      tenantId: context.tenantId || "unknown",
      userId: context.user?.id || context.subjectRef || "user-unknown",
      createdAt: now,
      steps: [],
      history: [],
      context,
    };
    return new Response(JSON.stringify({ runId, runState }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
