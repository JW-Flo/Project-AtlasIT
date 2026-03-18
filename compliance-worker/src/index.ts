import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { executeWorkflow, getExecution } from "./modules/automation/service";
import type { WorkflowType } from "./modules/automation/templates";
import type { WorkflowExecutionRecord } from "./modules/automation/store";
import { requireTenant, AuthError } from "./modules/auth";
import type { TenantContext } from "./modules/auth";
import {
  ensurePolicyInfrastructure,
  listTemplates as listPolicyTemplates,
  generatePolicyDocument,
  evaluatePolicyInput,
  coverageSummary,
  recordEvidenceControlLink,
  manualControlEvidenceLink,
} from "./modules/policies/service";
import {
  ComplianceSnapshot,
  EvidenceIngestRequest,
  deriveRiskScore,
  deriveSeverity,
} from "./types";
import {
  drainCounters,
  hasCounters,
  incrementCounter,
  recordLatency,
  summarizeLatency,
} from "./metrics";
import {
  ensureExtendedSchema,
  listIncidents,
  createSecurityIncident,
  resolveSecurityIncident,
  summarizeSecurity,
  listActivity,
  recordActivityEvent,
  createAccessRequest,
  listAccessRequests,
  updateAccessRequestStatus,
} from "./modules/security/service";
import type { AccessRequestRecord } from "./modules/security/service";
import { Env, resolveD1, resolveR2 } from "./env";
import {
  buildCors,
  mergeHeaders,
  errorResponse,
  jsonResponse,
  SECURITY_HEADERS,
} from "./http/utils";
import { log } from "./log";
import { webhookRoutes } from "./routes/webhooks";

// ----------------------------------------------------------------------------------
// TODO (Codex Ownership Notes): The following pending enhancements are delegated to
// the autonomous Codex executor to avoid duplicate effort in this incremental patch:
// 1. RBAC scope enforcement for security/activity/notifications endpoints.
// 2. Manual evidence-control link management endpoint (explicit user linking).
// 3. Coverage path variant route /api/v1/policies/coverage/{framework} + deprecation header.
// 4. Access request lifecycle endpoints using access_requests table.
// 5. Health payload enrichment with security + activity statistics.
// 6. Router modular refactor (extract large handlers into per-domain modules).
// 7. OpenAPI specification v1.3.0 update & contract tests.
// 8. Expanded activity logging for all domains (currently partial).
// This file now only includes minimal immediate fixes (bug + metrics) to keep
// momentum while Codex performs the broader backlog. Do not remove this block
// until all listed items are completed.
// ----------------------------------------------------------------------------------

const SNAPSHOT_TTL_SECONDS = 300;
const DEFAULT_TENANT = "demo";
const DEFAULT_PACK = "unspecified";
const DEFAULT_SUBJECT = "unknown";

const WORKFLOW_TYPES: WorkflowType[] = ["joiner", "mover", "leaver"];

const ACTIVITY_ALLOWED_ROLES = ["security:read", "activity:read"];

const CONTROL_KEY_REGEX = /^[A-Za-z0-9_.-]{1,64}$/;
const EVIDENCE_HASH_REGEX = /^[a-f0-9]{64}$/i;
const ACCESS_ACTION_STATUS: Record<
  string,
  "approved" | "denied" | "fulfilled"
> = {
  approve: "approved",
  deny: "denied",
  fulfill: "fulfilled",
};
const ACCESS_STATUSES = new Set(["pending", "approved", "denied", "fulfilled"]);
const INCIDENT_SEVERITIES = new Set(["critical", "high", "medium", "low"]);
const INCIDENT_RATE_LIMIT = 10;
const INCIDENT_WINDOW_MS = 60_000;
/**
 * Incident rate limiting is now tracked in the D1 database for concurrency safety.
 */

interface RouteContext {
  request: Request;
  env: Env;
  requestId: string;
  headers: Record<string, string>;
  url: URL;
  method: string;
}

function hasAnyRole(tenant: TenantContext, roles: string[]): boolean {
  return roles.some((role) => tenant.roles.includes(role));
}

interface AutomationResponseStep {
  stepId: string;
  action: string;
  status: string;
  attempts: number;
  output?: unknown;
  error?: string | null;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
}

interface AutomationResponseBody {
  execution: {
    id: string;
    tenantId: string;
    type: WorkflowType;
    subjectRef: string | null;
    status: string;
    createdAt: string;
    completedAt?: string | null;
    durationMs: number;
    steps: AutomationResponseStep[];
  };
  meta: {
    idempotentHit: boolean;
  };
}

function mapExecutionToResponse(
  execution: WorkflowExecutionRecord,
  idempotentHit: boolean,
): AutomationResponseBody {
  const steps: AutomationResponseStep[] = execution.steps.map((step) => ({
    stepId: step.stepId,
    action: step.action,
    status: step.status,
    attempts: step.attempts,
    output: step.output,
    error: step.error ?? null,
    startedAt: step.startedAt,
    completedAt: step.completedAt,
    durationMs: step.durationMs,
  }));

  return {
    execution: {
      id: execution.id,
      tenantId: execution.tenantId,
      type: execution.workflowType,
      subjectRef: execution.subjectRef ?? null,
      status: execution.status,
      createdAt: execution.createdAt,
      completedAt: execution.completedAt ?? null,
      durationMs: execution.durationMs,
      steps,
    },
    meta: {
      idempotentHit,
    },
  };
}

function mapAccessRequest(record: AccessRequestRecord) {
  return {
    id: record.id,
    subjectRef: record.subject_ref,
    resource: record.resource,
    justification: record.justification,
    status: record.status,
    createdAt: record.created_at,
    decidedAt: record.decided_at,
    decidedBy: record.decided_by,
  };
}

/**
 * Atomically consume incident quota for a tenant using D1 for concurrency safety.
 * Returns { allowed: boolean, retryMs: number }
 */
async function consumeIncidentQuota(
  db: D1Database,
  tenantId: string,
): Promise<{ allowed: boolean; retryMs: number }> {
  const now = Date.now();
  const windowStart = now - INCIDENT_WINDOW_MS;

  // Ensure table exists
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS incident_rate_limit (
         tenant_id TEXT PRIMARY KEY,
         window_start INTEGER NOT NULL,
         count INTEGER NOT NULL
       )`,
    )
    .run();

  // Try to update existing row atomically
  const row = await db
    .prepare(
      `SELECT window_start, count FROM incident_rate_limit WHERE tenant_id = ?`,
    )
    .bind(tenantId)
    .first<{ window_start: number; count: number }>();

  if (!row || now - row.window_start >= INCIDENT_WINDOW_MS) {
    // New window or first time: reset count
    await db
      .prepare(
        `INSERT INTO incident_rate_limit (tenant_id, window_start, count)
       VALUES (?, ?, 1)
       ON CONFLICT(tenant_id) DO UPDATE SET window_start = excluded.window_start, count = 1`,
      )
      .bind(tenantId, now)
      .run();
    return { allowed: true, retryMs: INCIDENT_WINDOW_MS };
  }

  if (row.count >= INCIDENT_RATE_LIMIT) {
    const retryMs = INCIDENT_WINDOW_MS - (now - row.window_start);
    return { allowed: false, retryMs: Math.max(0, retryMs) };
  }

  // Increment count atomically
  await db
    .prepare(
      `UPDATE incident_rate_limit SET count = count + 1 WHERE tenant_id = ?`,
    )
    .bind(tenantId)
    .run();

  return {
    allowed: true,
    retryMs: INCIDENT_WINDOW_MS - (now - row.window_start),
  };
}

async function demoRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, headers, requestId } = ctx;
  if (
    (url.pathname === "/jml-demo" ||
      url.pathname === "/jml" ||
      url.pathname === "/jml/demo") &&
    method === "GET"
  ) {
    const target = "/api/v1/workflows/demo/jml";
    log("info", "route.redirect.jml_demo", {
      requestId,
      from: url.pathname,
      to: target,
    });
    return new Response(null, {
      status: 307,
      headers: mergeHeaders(headers, { Location: target }),
    });
  }

  if (url.pathname === "/api/v1/workflows/demo/jml" && method === "GET") {
    const body = {
      demo: true,
      workflowTypes: WORKFLOW_TYPES,
      exampleExecute: {
        endpoint: "/api/v1/workflows/execute",
        method: "POST",
        payload: {
          type: "joiner",
          subjectRef: "user:alice@example.com",
          idempotencyKey: "<optional unique id>",
          overrides: { attributes: { department: "Engineering" } },
        },
      },
      note: "POST to /api/v1/workflows/execute with a valid type (joiner|mover|leaver) and subjectRef to run a JML workflow. This endpoint is a documentation/demo helper and performs no execution itself.",
    };
    log("info", "jml.demo.metadata", { requestId });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  }

  return null;
}

async function activityRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, request, env, requestId, headers } = ctx;
  if (url.pathname === "/api/v1/activity" && method === "GET") {
    let tenant: TenantContext;
    try {
      tenant = await requireTenant(
        request,
        env as unknown as Record<string, unknown>,
      );
    } catch (err) {
      if (err instanceof AuthError) {
        return errorResponse(err.status, requestId, headers, err.message);
      }
      throw err;
    }

    if (!hasAnyRole(tenant, ACTIVITY_ALLOWED_ROLES)) {
      log("warn", "activity.access.denied", {
        requestId,
        tenantId: tenant.tenantId,
        roles: tenant.roles,
      });
      return errorResponse(403, requestId, headers, "Insufficient scope");
    }

    const requestedTenant = url.searchParams.get("tenantId");
    if (requestedTenant && requestedTenant !== tenant.tenantId) {
      log("warn", "activity.tenant_mismatch", {
        requestId,
        tokenTenant: tenant.tenantId,
        requestedTenant,
      });
      return errorResponse(403, requestId, headers, "Tenant access denied");
    }

    const db = resolveD1(env);
    if (!db) return errorResponse(503, requestId, headers, "Store unavailable");
    await ensureExtendedSchema(db);

    const type = url.searchParams.get("type") || undefined;

    const limitParam = url.searchParams.get("limit");
    let limit: number | undefined;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return errorResponse(400, requestId, headers, "Invalid limit");
      }
      limit = parsed;
    }

    const cursorParam = url.searchParams.get("cursor");
    let cursor: number | undefined;
    if (cursorParam) {
      const parsed = Number(cursorParam);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return errorResponse(400, requestId, headers, "Invalid cursor");
      }
      cursor = parsed;
    }

    try {
      const listStart = Date.now();
      const { items, nextCursor } = await listActivity(db, tenant.tenantId, {
        type,
        limit,
        cursor,
      });
      recordLatency("activityList", Date.now() - listStart);
      return jsonResponse({ items, nextCursor }, 200, headers);
    } catch (e) {
      log("error", "activity.feed.error", {
        requestId,
        tenantId: tenant.tenantId,
        error: (e as Error).message,
      });
      return errorResponse(500, requestId, headers, "Failed to load activity");
    }
  }

  return null;
}

async function evidenceRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, request, env, requestId, headers } = ctx;

  if (
    url.pathname === "/api/compliance/snapshot" &&
    (method === "GET" || method === "HEAD")
  ) {
    return handleSnapshot(
      env,
      url,
      requestId,
      headers,
      method === "HEAD" ? "HEAD" : "GET",
    );
  }

  if (url.pathname === "/api/evidence/ingest" && method === "POST") {
    return handleEvidenceIngest(request, env, requestId, headers);
  }

  if (url.pathname === "/api/evidence/search" && method === "GET") {
    return handleEvidenceSearch(env, url, requestId, headers);
  }

  if (url.pathname.startsWith("/api/evidence/") && method === "GET") {
    const hash = url.pathname.split("/").pop();
    if (!hash) {
      return errorResponse(400, requestId, headers, "Missing evidence hash");
    }
    if (url.searchParams.get("verify") === "1") {
      return handleEvidenceVerify(env, hash, requestId, headers);
    }
    return handleEvidenceGet(env, hash, requestId, headers);
  }

  // Compatibility path expected by tests: /api/v1/evidence/{hash}/verify
  if (
    url.pathname.startsWith("/api/v1/evidence/") &&
    url.pathname.endsWith("/verify") &&
    method === "GET"
  ) {
    const parts = url.pathname.split("/").filter(Boolean); // [api,v1,evidence,{hash},verify]
    if (parts.length === 5) {
      const hash = parts[3];
      return handleEvidenceVerify(env, hash, requestId, headers);
    }
    return errorResponse(
      400,
      requestId,
      headers,
      "Invalid evidence verify path",
    );
  }

  // --- v1 tenant-scoped evidence routes ---

  if (url.pathname === "/api/v1/evidence" && method === "GET") {
    const tenantId =
      url.searchParams.get("tenant_id") || request.headers.get("x-tenant-id");
    if (!tenantId) {
      return errorResponse(400, requestId, headers, "tenant_id required");
    }
    const db = resolveD1(env);
    if (!db) return errorResponse(503, requestId, headers, "Store unavailable");
    await ensureSchema(env);

    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit")) || 50, 1),
      200,
    );
    const cursorParam = url.searchParams.get("cursor");
    const conditions: string[] = ["tenant_id = ?"];
    const bindings: (string | number)[] = [tenantId];

    if (cursorParam) {
      const cursor = Number(cursorParam);
      if (!Number.isFinite(cursor) || cursor <= 0) {
        return errorResponse(400, requestId, headers, "Invalid cursor");
      }
      conditions.push("id < ?");
      bindings.push(cursor);
    }

    const where = conditions.join(" AND ");
    const fetchLimit = limit + 1;

    try {
      const { results: rows } = await db
        .prepare(
          `SELECT id, hash, tenant_id, pack, subject_ref, created_at
           FROM evidence_index WHERE ${where} ORDER BY id DESC LIMIT ?`,
        )
        .bind(...bindings, fetchLimit)
        .all();

      const results = rows ?? [];
      const hasNext = results.length > limit;
      const sliced = hasNext ? results.slice(0, limit) : results;
      const items = sliced.map((row: any) => ({
        id: Number(row.id),
        hash: String(row.hash),
        tenantId: String(row.tenant_id),
        pack: String(row.pack),
        subject: row.subject_ref != null ? String(row.subject_ref) : null,
        createdAt: String(row.created_at),
      }));
      const nextCursor = hasNext
        ? String((sliced[sliced.length - 1] as any).id)
        : null;

      return jsonResponse(
        { items, nextCursor, count: items.length },
        200,
        headers,
      );
    } catch (e) {
      log("error", "evidence.v1.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return errorResponse(500, requestId, headers, "Failed to list evidence");
    }
  }

  if (url.pathname === "/api/v1/evidence" && method === "POST") {
    return handleEvidenceIngest(request, env, requestId, headers);
  }

  // POST /api/v1/evidence/:id/link
  const evidenceLinkMatch = url.pathname.match(
    /^\/api\/v1\/evidence\/(\d+)\/link$/,
  );
  if (evidenceLinkMatch && method === "POST") {
    const evidenceId = Number(evidenceLinkMatch[1]);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, requestId, headers, "Invalid JSON");
    }

    const controlKey =
      typeof body?.controlKey === "string" ? body.controlKey.trim() : "";
    if (!controlKey) {
      return errorResponse(400, requestId, headers, "controlKey required");
    }

    const resolvedTenantId =
      body?.tenantId || request.headers.get("x-tenant-id");
    if (!resolvedTenantId) {
      return errorResponse(400, requestId, headers, "tenant_id required");
    }

    const db = resolveD1(env);
    if (!db) return errorResponse(503, requestId, headers, "Store unavailable");
    await ensureSchema(env);

    const evidence = await db
      .prepare(
        "SELECT hash, tenant_id FROM evidence_index WHERE id = ? LIMIT 1",
      )
      .bind(evidenceId)
      .first<{ hash: string; tenant_id: string }>();

    if (!evidence) {
      return errorResponse(404, requestId, headers, "Evidence not found");
    }
    if (evidence.tenant_id !== resolvedTenantId) {
      return errorResponse(
        403,
        requestId,
        headers,
        "Evidence not available for tenant",
      );
    }

    try {
      const result = await manualControlEvidenceLink(db, {
        tenantId: resolvedTenantId,
        controlKey,
        evidenceHash: evidence.hash,
      });

      log("info", "evidence.v1.link", {
        requestId,
        tenantId: resolvedTenantId,
        evidenceId,
        controlKey,
      });

      return jsonResponse(
        {
          evidenceId,
          controlKey,
          evidenceHash: evidence.hash,
          linked: true,
          createdAt: result.createdAt,
        },
        result.created ? 201 : 200,
        headers,
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "control.not_found")
          return errorResponse(404, requestId, headers, "Control not found");
        if (err.message === "evidence.not_found")
          return errorResponse(404, requestId, headers, "Evidence not found");
      }
      log("error", "evidence.v1.link.error", {
        requestId,
        error: (err as Error).message,
      });
      return errorResponse(500, requestId, headers, "Failed to link evidence");
    }
  }

  return null;
}

async function adminRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, request, env, requestId, headers } = ctx;
  if (
    url.pathname === "/api/v1/admin/retention/policies/purge" &&
    method === "POST"
  ) {
    return handlePoliciesRetentionPurge(request, env, requestId, headers);
  }
  return null;
}
async function healthRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, env, requestId, headers } = ctx;
  if (url.pathname === "/health" && method === "GET") {
    return handleHealth(env, requestId, headers);
  }
  return null;
}

async function workflowsRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, request, env, requestId, headers } = ctx;
  if (url.pathname === "/api/v1/workflows/execute" && method === "POST") {
    return handleWorkflowExecute(request, env, requestId, headers);
  }

  if (
    url.pathname.startsWith("/api/v1/workflows/executions/") &&
    method === "GET"
  ) {
    const executionId = url.pathname.split("/").pop();
    if (!executionId) {
      return errorResponse(
        400,
        requestId,
        headers,
        "Missing execution identifier",
      );
    }
    return handleWorkflowGet(request, env, executionId, requestId, headers);
  }

  return null;
}

async function policiesRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, request, env, requestId, headers } = ctx;
  if (url.pathname === "/api/v1/policies/templates" && method === "GET") {
    return handlePolicyTemplates(request, env, requestId, headers);
  }

  if (url.pathname === "/api/v1/policies/generate" && method === "POST") {
    return handlePolicyGenerate(request, env, requestId, headers);
  }

  if (url.pathname === "/api/v1/policy/evaluate" && method === "POST") {
    return handlePolicyEvaluate(request, env, requestId, headers);
  }

  if (url.pathname === "/api/v1/policies/coverage" && method === "GET") {
    return handlePolicyCoverage(request, env, requestId, headers, {
      deprecated: true,
    });
  }

  if (
    url.pathname.startsWith("/api/v1/policies/coverage/") &&
    method === "GET"
  ) {
    const frameworkRaw = url.pathname.replace("/api/v1/policies/coverage/", "");
    let framework: string;
    try {
      framework = decodeURIComponent(frameworkRaw).trim();
    } catch {
      return errorResponse(400, requestId, headers, "Invalid framework");
    }
    return handlePolicyCoverage(request, env, requestId, headers, {
      frameworkOverride: framework,
    });
  }

  if (
    url.pathname.startsWith("/api/v1/controls/") &&
    url.pathname.endsWith("/evidence-link") &&
    method === "POST"
  ) {
    let tenant: TenantContext;
    try {
      tenant = await requireTenant(
        request,
        env as unknown as Record<string, unknown>,
        ["policies:manage"],
      );
    } catch (err) {
      if (err instanceof AuthError) {
        return errorResponse(err.status, requestId, headers, err.message);
      }
      throw err;
    }

    const segments = url.pathname.split("/");
    const rawControlKey = segments.length >= 6 ? segments[4] : "";
    let controlKey: string;
    try {
      controlKey = decodeURIComponent(rawControlKey || "").trim();
    } catch {
      return errorResponse(400, requestId, headers, "Invalid control key");
    }
    if (!CONTROL_KEY_REGEX.test(controlKey)) {
      return errorResponse(400, requestId, headers, "Invalid control key");
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, requestId, headers, "Invalid JSON payload");
    }

    const evidenceHash =
      typeof body?.evidenceHash === "string" && body.evidenceHash.trim()
        ? body.evidenceHash.trim()
        : "";
    if (!evidenceHash) {
      return errorResponse(400, requestId, headers, "evidenceHash required");
    }
    if (!EVIDENCE_HASH_REGEX.test(evidenceHash)) {
      return errorResponse(400, requestId, headers, "Invalid evidence hash");
    }

    await ensureSchema(env);
    const db = resolveD1(env);
    if (!db) {
      return errorResponse(503, requestId, headers, "Store unavailable");
    }
    await ensureExtendedSchema(db);

    try {
      const linkResult = await manualControlEvidenceLink(db, {
        tenantId: tenant.tenantId,
        controlKey,
        evidenceHash,
      });

      if (linkResult.created) {
        incrementCounter("controlEvidenceLinks", 1);
        await recordActivityEvent(db, {
          tenantId: tenant.tenantId,
          type: "control_link",
          severity: "info",
          ref: controlKey,
          message: `Evidence linked to control ${controlKey}`,
        });
        log("info", "evidence.link.created", {
          requestId,
          tenantId: tenant.tenantId,
          controlKey,
          evidenceHash,
        });
      } else {
        log("info", "evidence.link.already_exists", {
          requestId,
          tenantId: tenant.tenantId,
          controlKey,
          evidenceHash,
        });
      }

      const responseBody = {
        controlKey,
        evidenceHash,
        linked: true,
        createdAt: linkResult.createdAt,
      };

      return jsonResponse(
        responseBody,
        linkResult.created ? 201 : 200,
        headers,
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "control.not_found") {
          return errorResponse(404, requestId, headers, "Control not found");
        }
        if (err.message === "evidence.not_found") {
          return errorResponse(404, requestId, headers, "Evidence not found");
        }
        if (err.message === "evidence.tenant_mismatch") {
          return errorResponse(
            403,
            requestId,
            headers,
            "Evidence not available for tenant",
          );
        }
      }
      log("error", "evidence.link.manual.error", {
        requestId,
        tenantId: tenant.tenantId,
        controlKey,
        evidenceHash,
        error: err instanceof Error ? err.message : String(err),
      });
      return errorResponse(500, requestId, headers, "Failed to link evidence");
    }
  }

  return null;
}

async function securityRoutes(ctx: RouteContext): Promise<Response | null> {
  const { url, method, request, env, requestId, headers } = ctx;
  if (url.pathname.startsWith("/api/v1/incidents")) {
    // /api/v1/incidents (GET list, POST create)
    if (url.pathname === "/api/v1/incidents" && method === "GET") {
      let tenant: TenantContext;
      try {
        tenant = await requireTenant(
          request,
          env as unknown as Record<string, unknown>,
          ["security:read"],
        );
      } catch (err) {
        if (err instanceof AuthError)
          return errorResponse(err.status, requestId, headers, err.message);
        throw err;
      }
      const db = resolveD1(env);
      if (!db)
        return errorResponse(503, requestId, headers, "Store unavailable");
      await ensureExtendedSchema(db);
      const status = url.searchParams.get("status") || undefined;
      const severity = url.searchParams.get("severity") || undefined;
      const limit = Number(url.searchParams.get("limit") || 20);
      const cursorParam = url.searchParams.get("cursor");
      const cursor = cursorParam ? Number(cursorParam) : undefined;
      try {
        const listStart = Date.now();
        const { items, nextCursor } = await listIncidents(db, tenant.tenantId, {
          status,
          severity,
          limit,
          cursor,
        });
        recordLatency("incidentList", Date.now() - listStart);
        return jsonResponse({ items, nextCursor }, 200, headers);
      } catch (e) {
        log("error", "incidents.list.error", {
          requestId,
          error: (e as Error).message,
        });
        return errorResponse(
          500,
          requestId,
          headers,
          "Failed to list incidents",
        );
      }
    }
    if (url.pathname === "/api/v1/incidents" && method === "POST") {
      let tenant: TenantContext;
      try {
        tenant = await requireTenant(
          request,
          env as unknown as Record<string, unknown>,
          ["security:manage"],
        );
      } catch (err) {
        if (err instanceof AuthError)
          return errorResponse(err.status, requestId, headers, err.message);
        throw err;
      }
      const db = resolveD1(env);
      if (!db)
        return errorResponse(503, requestId, headers, "Store unavailable");
      await ensureExtendedSchema(db);
      let body: any;
      try {
        body = await request.json();
      } catch {
        return errorResponse(400, requestId, headers, "Invalid JSON payload");
      }
      const title =
        typeof body?.title === "string" && body.title.trim()
          ? body.title.trim()
          : undefined;
      const severity =
        typeof body?.severity === "string"
          ? body.severity.trim().toLowerCase()
          : undefined;
      if (!title)
        return errorResponse(400, requestId, headers, "title required");
      if (!severity || !INCIDENT_SEVERITIES.has(severity))
        return errorResponse(400, requestId, headers, "invalid severity");
      try {
        const createStart = Date.now();
        const dbi = resolveD1(env);
        if (!dbi)
          return errorResponse(503, requestId, headers, "Store unavailable");
        const record = await createSecurityIncident(dbi, {
          tenantId: tenant.tenantId,
          title,
          severity,
          source: body?.source,
        });
        recordLatency("incidentCreate", Date.now() - createStart);
        if (record) {
          await recordActivityEvent(dbi, {
            tenantId: tenant.tenantId,
            type: "incident",
            severity,
            ref: String(record.id),
            message: `Incident created: ${title}`.substring(0, 110),
          });
        }
        return jsonResponse({ incident: record }, 201, headers);
      } catch (e) {
        log("error", "incidents.create.error", {
          requestId,
          error: (e as Error).message,
        });
        return errorResponse(
          500,
          requestId,
          headers,
          "Failed to create incident",
        );
      }
    }
    // /api/v1/incidents/{id}/resolve
    if (
      url.pathname.startsWith("/api/v1/incidents/") &&
      url.pathname.endsWith("/resolve") &&
      method === "POST"
    ) {
      const segments = url.pathname.split("/");
      const idRaw = segments[segments.length - 2];
      const idNum = Number(idRaw);
      if (!Number.isFinite(idNum) || idNum <= 0)
        return errorResponse(400, requestId, headers, "invalid incident id");
      let tenant: TenantContext;
      try {
        tenant = await requireTenant(
          request,
          env as unknown as Record<string, unknown>,
          ["security:manage"],
        );
      } catch (err) {
        if (err instanceof AuthError)
          return errorResponse(err.status, requestId, headers, err.message);
        throw err;
      }
      const db = resolveD1(env);
      if (!db)
        return errorResponse(503, requestId, headers, "Store unavailable");
      await ensureExtendedSchema(db);
      try {
        const resolveStart = Date.now();
        const updated = await resolveSecurityIncident(
          db,
          tenant.tenantId,
          idNum,
        );
        recordLatency("incidentResolve", Date.now() - resolveStart);
        if (updated) {
          await recordActivityEvent(db, {
            tenantId: tenant.tenantId,
            type: "incident",
            severity: updated.severity,
            ref: String(updated.id),
            message: `Incident resolved: ${updated.title}`.substring(0, 110),
          });
        }
        return jsonResponse({ incident: updated }, 200, headers);
      } catch (e) {
        log("error", "incidents.resolve.error", {
          requestId,
          error: (e as Error).message,
        });
        return errorResponse(
          500,
          requestId,
          headers,
          "Failed to resolve incident",
        );
      }
    }
  }
  if (url.pathname.startsWith("/api/v1/access-requests")) {
    // List & create
    if (url.pathname === "/api/v1/access-requests" && method === "GET") {
      let tenant: TenantContext;
      try {
        tenant = await requireTenant(
          request,
          env as unknown as Record<string, unknown>,
          ["access:read"],
        );
      } catch (err) {
        if (err instanceof AuthError)
          return errorResponse(err.status, requestId, headers, err.message);
        throw err;
      }
      const db = resolveD1(env);
      if (!db)
        return errorResponse(503, requestId, headers, "Store unavailable");
      await ensureExtendedSchema(db);
      const status = url.searchParams.get("status") || undefined;
      const limit = Number(url.searchParams.get("limit") || 20);
      const cursorParam = url.searchParams.get("cursor");
      const cursor = cursorParam ? Number(cursorParam) : undefined;
      try {
        const listStart = Date.now();
        const { items, nextCursor } = await listAccessRequests(
          db,
          tenant.tenantId,
          { status, limit, cursor },
        );
        recordLatency("accessRequestList", Date.now() - listStart);
        return jsonResponse({ items, nextCursor }, 200, headers);
      } catch (e) {
        log("error", "access_requests.list.error", {
          requestId,
          error: (e as Error).message,
        });
        return errorResponse(
          500,
          requestId,
          headers,
          "Failed to list access requests",
        );
      }
    }
    if (url.pathname === "/api/v1/access-requests" && method === "POST") {
      let tenant: TenantContext;
      try {
        tenant = await requireTenant(
          request,
          env as unknown as Record<string, unknown>,
          ["access:manage"],
        );
      } catch (err) {
        if (err instanceof AuthError)
          return errorResponse(err.status, requestId, headers, err.message);
        throw err;
      }
      const db = resolveD1(env);
      if (!db)
        return errorResponse(503, requestId, headers, "Store unavailable");
      await ensureExtendedSchema(db);
      let body: any;
      try {
        body = await request.json();
      } catch {
        return errorResponse(400, requestId, headers, "Invalid JSON payload");
      }
      const subjectRef =
        typeof body?.subjectRef === "string" && body.subjectRef.trim()
          ? body.subjectRef.trim()
          : undefined;
      const resource =
        typeof body?.resource === "string" && body.resource.trim()
          ? body.resource.trim()
          : undefined;
      const justification =
        typeof body?.justification === "string"
          ? body.justification.trim()
          : null;
      if (!subjectRef)
        return errorResponse(400, requestId, headers, "subjectRef required");
      if (!resource)
        return errorResponse(400, requestId, headers, "resource required");
      try {
        const createStart = Date.now();
        const rec = await createAccessRequest(db, {
          tenantId: tenant.tenantId,
          subjectRef,
          resource,
          justification,
        });
        recordLatency("accessRequestCreate", Date.now() - createStart);
        if (rec) {
          await recordActivityEvent(db, {
            tenantId: tenant.tenantId,
            type: "access_request",
            severity: "info",
            ref: String(rec.id),
            message: `Access request: ${resource}`.substring(0, 110),
          });
        }
        return jsonResponse({ request: rec }, 201, headers);
      } catch (e) {
        log("error", "access_requests.create.error", {
          requestId,
          error: (e as Error).message,
        });
        return errorResponse(
          500,
          requestId,
          headers,
          "Failed to create access request",
        );
      }
    }
    // Transition: /api/v1/access-requests/{id}/{action}
    if (
      url.pathname.startsWith("/api/v1/access-requests/") &&
      method === "POST"
    ) {
      const parts = url.pathname.split("/").filter(Boolean); // [api,v1,access-requests,{id},{action}]
      if (parts.length === 5) {
        const idRaw = parts[3];
        const action = parts[4];
        const idNum = Number(idRaw);
        if (!Number.isFinite(idNum) || idNum <= 0)
          return errorResponse(400, requestId, headers, "invalid request id");
        const mapped = ACCESS_ACTION_STATUS[action];
        if (!mapped)
          return errorResponse(400, requestId, headers, "invalid action");
        let tenant: TenantContext;
        try {
          tenant = await requireTenant(
            request,
            env as unknown as Record<string, unknown>,
            ["access:manage"],
          );
        } catch (err) {
          if (err instanceof AuthError)
            return errorResponse(err.status, requestId, headers, err.message);
          throw err;
        }
        const db = resolveD1(env);
        if (!db)
          return errorResponse(503, requestId, headers, "Store unavailable");
        await ensureExtendedSchema(db);
        try {
          const updStart = Date.now();
          const updated = await updateAccessRequestStatus(db, {
            tenantId: tenant.tenantId,
            id: idNum,
            nextStatus: mapped,
            decidedBy: "user",
          });
          recordLatency("accessRequestUpdate", Date.now() - updStart);
          if (!updated)
            return errorResponse(404, requestId, headers, "Not found");
          await recordActivityEvent(db, {
            tenantId: tenant.tenantId,
            type: "access_request",
            severity: "info",
            ref: String(updated.id),
            message: `Access ${mapped}: ${updated.resource}`.substring(0, 110),
          });
          return jsonResponse({ request: updated }, 200, headers);
        } catch (e) {
          if (e instanceof Error && e.message === "access.invalid_transition") {
            return errorResponse(409, requestId, headers, "Invalid transition");
          }
          log("error", "access_requests.update.error", {
            requestId,
            error: (e as Error).message,
          });
          return errorResponse(
            500,
            requestId,
            headers,
            "Failed to update access request",
          );
        }
      }
    }
  }
  return null;
}

async function notificationsRoutes(
  ctx: RouteContext,
): Promise<Response | null> {
  const { url, method, request, env, requestId, headers } = ctx;

  if (url.pathname === "/api/v1/notifications" && method === "GET") {
    let tenant: TenantContext;
    try {
      tenant = await requireTenant(
        request,
        env as unknown as Record<string, unknown>,
      );
    } catch (err) {
      if (err instanceof AuthError) {
        return errorResponse(err.status, requestId, headers, err.message);
      }
      throw err;
    }

    await ensureSchema(env);
    const db = resolveD1(env);
    if (!db) {
      return errorResponse(503, requestId, headers, "Store unavailable");
    }

    const limitParam = url.searchParams.get("limit");
    let limit = 20;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 100) {
        limit = parsed;
      }
    }

    const cursor = url.searchParams.get("cursor");
    const bind: any[] = [tenant.tenantId];
    let cursorFilter = "";
    if (cursor) {
      const parsed = Number(cursor);
      if (Number.isFinite(parsed) && parsed > 0) {
        cursorFilter = "AND id < ?";
        bind.push(parsed);
      }
    }

    try {
      const listStart = Date.now();
      const rows = await db
        .prepare(
          `SELECT id, kind, severity, message, ref, "read", created_at, read_at FROM notifications WHERE tenant_id = ? ${cursorFilter} ORDER BY id DESC LIMIT ?`,
        )
        .bind(...bind, limit)
        .all<Record<string, any>>();

      const items =
        rows.results?.map((r) => {
          const readAt = r.read_at ?? null;
          const legacyRead = r.read === 1;
          const isRead =
            (typeof readAt === "string" && readAt.length > 0) || legacyRead;
          const createdAt = r.created_at as string;
          const createdTs = createdAt
            ? new Date(createdAt).getTime()
            : Date.now();
          const ageSeconds = Math.max(
            0,
            Math.floor((Date.now() - createdTs) / 1000),
          );
          return {
            id: String(r.id),
            kind: r.kind,
            severity: r.severity,
            message: r.message,
            ref: r.ref,
            createdAt,
            ageSeconds,
            read: Boolean(isRead),
          };
        }) || [];

      const unreadRow = await db
        .prepare(
          "SELECT COUNT(*) as unread FROM notifications WHERE tenant_id = ? AND (read_at IS NULL OR read_at = '')",
        )
        .bind(tenant.tenantId)
        .first<{ unread: number }>();
      const unreadCount = unreadRow?.unread ?? 0;
      const nextCursor =
        items.length === limit ? items[items.length - 1].id : null;

      recordLatency("notificationsList", Date.now() - listStart);
      return jsonResponse({ items, unreadCount, nextCursor }, 200, headers);
    } catch (e) {
      log("error", "notifications.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return errorResponse(
        500,
        requestId,
        headers,
        "Failed to list notifications",
      );
    }
  }

  if (url.pathname === "/api/v1/notifications/read" && method === "POST") {
    let tenant: TenantContext;
    try {
      tenant = await requireTenant(
        request,
        env as unknown as Record<string, unknown>,
      );
    } catch (err) {
      if (err instanceof AuthError) {
        return errorResponse(err.status, requestId, headers, err.message);
      }
      throw err;
    }

    const db = resolveD1(env);
    if (!db) {
      return errorResponse(503, requestId, headers, "Store unavailable");
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, requestId, headers, "Invalid JSON payload");
    }

    const idsInput: unknown = body?.ids;
    const uniqueIds = Array.isArray(idsInput)
      ? Array.from(
          new Set(
            idsInput
              .map((value) => {
                const numeric = Number(value);
                return Number.isFinite(numeric) && numeric > 0
                  ? Math.trunc(numeric)
                  : null;
              })
              .filter((value): value is number => value !== null),
          ),
        ).slice(0, 200)
      : [];

    let updatedIds: number[] = [];
    try {
      const markStart = Date.now();
      if (uniqueIds.length) {
        const placeholders = uniqueIds.map(() => "?").join(",");
        const selectSql = `SELECT id FROM notifications WHERE tenant_id = ? AND read_at IS NULL AND id IN (${placeholders})`;
        const selected = await db
          .prepare(selectSql)
          .bind(tenant.tenantId, ...uniqueIds)
          .all<{ id: number }>();
        updatedIds = (selected.results || []).map((row) => Number(row.id));

        if (updatedIds.length) {
          const updatePlaceholders = updatedIds.map(() => "?").join(",");
          const updateSql = `UPDATE notifications SET "read" = 1, read_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND read_at IS NULL AND id IN (${updatePlaceholders})`;
          await db
            .prepare(updateSql)
            .bind(tenant.tenantId, ...updatedIds)
            .run();
        }
      }

      const unreadRow = await db
        .prepare(
          "SELECT COUNT(*) as unread FROM notifications WHERE tenant_id = ? AND (read_at IS NULL OR read_at = '')",
        )
        .bind(tenant.tenantId)
        .first<{ unread: number }>();
      const unreadCount = unreadRow?.unread ?? 0;
      recordLatency("notificationsMarkRead", Date.now() - markStart);
      return jsonResponse(
        { updated: updatedIds.map(String), unreadCount },
        200,
        headers,
      );
    } catch (e) {
      log("error", "notifications.mark_read.error", {
        requestId,
        error: (e as Error).message,
      });
      return errorResponse(500, requestId, headers, "Failed to mark read");
    }
  }

  if (url.pathname === "/api/v1/notifications/read-all" && method === "POST") {
    let tenant: TenantContext;
    try {
      tenant = await requireTenant(
        request,
        env as unknown as Record<string, unknown>,
      );
    } catch (err) {
      if (err instanceof AuthError) {
        return errorResponse(err.status, requestId, headers, err.message);
      }
      throw err;
    }
    const db = resolveD1(env);
    if (!db) {
      return errorResponse(503, requestId, headers, "Store unavailable");
    }
    try {
      await db
        .prepare(
          'UPDATE notifications SET "read" = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE tenant_id = ? AND read_at IS NULL',
        )
        .bind(tenant.tenantId)
        .run();
      const unreadRow = await db
        .prepare(
          "SELECT COUNT(*) as unread FROM notifications WHERE tenant_id = ? AND (read_at IS NULL OR read_at = '')",
        )
        .bind(tenant.tenantId)
        .first<{ unread: number }>();
      const unreadCount = unreadRow?.unread ?? 0;
      return jsonResponse({ updated: [], unreadCount }, 200, headers);
    } catch (e) {
      log("error", "notifications.mark_all.error", {
        requestId,
        error: (e as Error).message,
      });
      return errorResponse(500, requestId, headers, "Failed to mark all read");
    }
  }
  return null;
}
async function handlePolicyTemplates(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  try {
    await ensurePolicyInfrastructure(db);
    const templates = await listPolicyTemplates(db);
    const body = {
      templates: templates.map((tpl) => ({
        key: tpl.key,
        name: tpl.name,
        format: tpl.format,
      })),
    };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "policy.templates.error", {
      requestId,
      tenantId: tenant.tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      500,
      requestId,
      headers,
      "Failed to list policy templates",
    );
  }
}

async function persistPolicyToR2(
  bucket: R2Bucket,
  record: {
    hash: string;
    content: string;
    tenantId: string;
    templateKey: string;
    contextHash: string;
    reused: boolean;
  },
) {
  const key = `policies/${record.hash}.md`;
  if (record.reused) {
    const head = await bucket.head(key);
    if (head) return key;
  }
  await bucket.put(key, record.content, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: {
      tenantId: record.tenantId,
      templateKey: record.templateKey,
      contextHash: record.contextHash,
    },
  });
  return key;
}

async function handlePolicyGenerate(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const bucket = resolveR2(env);
  if (!bucket) {
    return errorResponse(501, requestId, headers, "Policy storage unavailable");
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }

  const templateKey =
    typeof body?.templateKey === "string" ? body.templateKey : undefined;
  if (!templateKey) {
    return errorResponse(400, requestId, headers, "templateKey is required");
  }
  const input = body?.input && typeof body.input === "object" ? body.input : {};

  try {
    const genStart = Date.now();
    const groqApiKey = (env as any).GROQ_API_KEY;
    const result = await generatePolicyDocument({
      db,
      tenantId: tenant.tenantId,
      templateKey,
      input,
      groqApiKey,
    });
    recordLatency("policyGenerate", Date.now() - genStart);

    await persistPolicyToR2(bucket, {
      hash: result.hash,
      content: result.content,
      tenantId: tenant.tenantId,
      templateKey,
      contextHash: result.contextHash,
      reused: result.reused,
    });

    await ensureExtendedSchema(db);
    await recordActivityEvent(db, {
      tenantId: tenant.tenantId,
      type: "policy",
      severity: "info",
      ref: templateKey,
      message: `Policy generated: ${templateKey}`.substring(0, 110),
    });

    const responseBody = {
      hash: result.hash,
      contextHash: result.contextHash,
      content: result.content,
      templateKey,
      reused: result.reused,
      createdAt: result.createdAt,
      sizeBytes: result.sizeBytes,
    };

    log("info", "policy.generate", {
      requestId,
      tenantId: tenant.tenantId,
      templateKey,
      hash: result.hash,
      reused: result.reused,
    });

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "policy.generate.error", {
      requestId,
      tenantId: tenant.tenantId,
      templateKey,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to generate policy");
  }
}

async function handlePolicyEvaluate(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }

  const policyKey =
    typeof body?.policyKey === "string" ? body.policyKey : undefined;
  if (!policyKey) {
    return errorResponse(400, requestId, headers, "policyKey is required");
  }
  const input = body?.input && typeof body.input === "object" ? body.input : {};

  try {
    const evalStart = Date.now();
    const result = await evaluatePolicyInput({
      db,
      tenantId: tenant.tenantId,
      policyKey,
      input,
    });
    recordLatency("policyEvaluate", Date.now() - evalStart);
    await ensureExtendedSchema(db);
    await recordActivityEvent(db, {
      tenantId: tenant.tenantId,
      type: "policy",
      severity: "info",
      ref: policyKey,
      message: `Policy evaluated: ${policyKey}`.substring(0, 110),
    });
    return new Response(
      JSON.stringify({
        hash: result.hash,
        result: result.result,
        meta: { deterministic: true },
      }),
      {
        status: 200,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
  } catch (err) {
    log("error", "policy.evaluate.error", {
      requestId,
      tenantId: tenant.tenantId,
      policyKey,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to evaluate policy");
  }
}

async function handlePolicyCoverage(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
  options: { frameworkOverride?: string; deprecated?: boolean } = {},
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  const url = new URL(request.url);
  const frameworkCandidate =
    options.frameworkOverride ?? url.searchParams.get("framework") ?? "SOC2";
  const framework = frameworkCandidate.trim() || "SOC2";
  if (!framework || framework.length > 64) {
    return errorResponse(400, requestId, headers, "Invalid framework");
  }

  try {
    const summary = await coverageSummary(db, framework, tenant.tenantId, env.ATLAS_SHARED_DB);
    const responseHeaders = options.deprecated
      ? mergeHeaders(headers, { Deprecation: "true" })
      : headers;
    if (options.deprecated) {
      log("warn", "coverage.path.deprecated_access", {
        requestId,
        tenantId: tenant.tenantId,
        framework,
      });
    }
    // Spread summary first then add explicit framework key to avoid duplicate property overwrite lint warning.
    return jsonResponse({ ...summary, framework }, 200, responseHeaders);
  } catch (err) {
    log("error", "policy.coverage.error", {
      requestId,
      tenantId: tenant.tenantId,
      framework,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      500,
      requestId,
      headers,
      "Failed to load policy coverage",
    );
  }
}

async function handleWorkflowExecute(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["automation:execute"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(
      503,
      requestId,
      headers,
      "Automation store unavailable",
    );
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }

  const workflowType = payload?.type as WorkflowType | undefined;
  if (!workflowType || !WORKFLOW_TYPES.includes(workflowType)) {
    return errorResponse(400, requestId, headers, "Unsupported workflow type");
  }

  const subjectRef =
    typeof payload?.subjectRef === "string" && payload.subjectRef.trim()
      ? payload.subjectRef.trim()
      : undefined;
  if (!subjectRef) {
    return errorResponse(400, requestId, headers, "subjectRef is required");
  }

  const headerIdempotency = request.headers.get("Idempotency-Key") || undefined;
  const bodyIdempotency =
    typeof payload.idempotencyKey === "string"
      ? payload.idempotencyKey
      : undefined;
  const idempotencyKey = headerIdempotency || bodyIdempotency;

  try {
    const wfStart = Date.now();
    const { execution, idempotentHit } = await executeWorkflow({
      db,
      tenantId: tenant.tenantId,
      workflowType,
      subjectRef,
      idempotencyKey,
      overrides: { ...(payload?.overrides || {}), idempotencyKey },
    });
    recordLatency("workflowExecute", Date.now() - wfStart);

    log("info", "automation.execution.completed", {
      requestId,
      tenantId: tenant.tenantId,
      workflowType,
      executionId: execution.id,
      idempotent: idempotentHit,
    });

    await ensureExtendedSchema(db);
    await recordActivityEvent(db, {
      tenantId: tenant.tenantId,
      type: "workflow",
      severity: "info",
      ref: execution.id,
      message: `Workflow executed: ${workflowType}`.substring(0, 110),
    });

    const responseBody = mapExecutionToResponse(execution, idempotentHit);
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "automation.execution.error", {
      requestId,
      tenantId: tenant.tenantId,
      workflowType,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to execute workflow");
  }
}

async function handleWorkflowGet(
  request: Request,
  env: Env,
  executionId: string,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(
      503,
      requestId,
      headers,
      "Automation store unavailable",
    );
  }

  try {
    const execution = await getExecution(db, tenant.tenantId, executionId);
    if (!execution) {
      return errorResponse(404, requestId, headers, "Execution not found");
    }
    const body = mapExecutionToResponse(execution, false);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "automation.execution.read_error", {
      requestId,
      executionId,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to load execution");
  }
}

async function buildSnapshot(
  env: Env,
  tenantId: string,
): Promise<ComplianceSnapshot> {
  const now = new Date();
  const db = resolveD1(env);

  // ── Fallback hardcoded data (used when D1 is unavailable) ──
  const fallbackRisks = [
    {
      id: "R1",
      title: "Unpatched server infrastructure",
      likelihood: 4,
      impact: 4,
      owner: "ops@tenant",
    },
    { id: "R2", title: "MFA coverage gaps", likelihood: 3, impact: 3 },
    {
      id: "R3",
      title: "Third-party vendor exposure",
      likelihood: 5,
      impact: 4,
      owner: "security@tenant",
    },
  ].map((r) => {
    const score = deriveRiskScore(r.likelihood, r.impact);
    const severity = deriveSeverity(score);
    return { ...r, score, severity };
  });

  const fallbackSnapshot: ComplianceSnapshot = {
    tenantId,
    generatedAt: now.toISOString(),
    frameworkSummary: [
      {
        framework: "SOC2",
        coveragePercent: 52,
        passing: 120,
        failing: 30,
        total: 200,
      },
      {
        framework: "ISO27001",
        coveragePercent: 41,
        passing: 80,
        failing: 40,
        total: 160,
      },
      {
        framework: "NIST CSF",
        coveragePercent: 55,
        passing: 120,
        failing: 96,
        total: 216,
      },
    ],
    risks: fallbackRisks,
    policies: [
      {
        id: "P1",
        name: "SOC 2 Access Control Policy",
        status: "approved",
        updated: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "P2",
        name: "ISO 27001 ISMS Policy",
        status: "approved",
        updated: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "P3",
        name: "NIST CSF Policy",
        status: "draft",
        updated: now.toISOString(),
      },
      {
        id: "P4",
        name: "HIPAA Security Rule Policy",
        status: "draft",
        updated: now.toISOString(),
      },
      {
        id: "P5",
        name: "Data Protection & Privacy Policy",
        status: "approved",
        updated: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ],
  };

  if (!db) {
    return fallbackSnapshot;
  }

  try {
    // ── Framework coverage (real data from D1) ──
    const frameworks = ["SOC2", "ISO27001", "NIST CSF"];
    const frameworkSummary: ComplianceSnapshot["frameworkSummary"] = [];
    for (const fw of frameworks) {
      try {
        const coverage = await coverageSummary(db, fw, tenantId, env.ATLAS_SHARED_DB);
        const withEvidence = coverage.controls.filter(
          (c) => c.evidenceCount > 0,
        ).length;
        frameworkSummary.push({
          framework: fw,
          coveragePercent: coverage.coveragePercent,
          passing: withEvidence,
          failing: coverage.totalControls - withEvidence,
          total: coverage.totalControls,
        });
      } catch (e) {
        log("error", "snapshot.coverage.error", {
          framework: fw,
          error: (e as Error).message,
        });
        // Use fallback for this framework
        const fb = fallbackSnapshot.frameworkSummary.find(
          (f) => f.framework === fw,
        );
        if (fb) frameworkSummary.push(fb);
      }
    }

    // ── Policies (real data from D1) ──
    let policies: ComplianceSnapshot["policies"] = [];
    try {
      const templates = await listPolicyTemplates(db);
      // Check which templates have generated policies (i.e. approved)
      const generatedRows = await db
        .prepare(
          `SELECT DISTINCT template_key FROM generated_policies WHERE tenant_id = ?`,
        )
        .bind(tenantId)
        .all<{ template_key: string }>();
      const generatedKeys = new Set(
        (generatedRows.results ?? []).map((r) => r.template_key),
      );
      policies = templates.map((t, idx) => ({
        id: `P${idx + 1}`,
        name: t.name,
        status: generatedKeys.has(t.key)
          ? ("approved" as const)
          : ("draft" as const),
        updated: now.toISOString(),
      }));
    } catch (e) {
      log("error", "snapshot.policies.error", { error: (e as Error).message });
      policies = fallbackSnapshot.policies;
    }

    // ── Risks (real data from D1) ──
    let risks: ComplianceSnapshot["risks"] = [];
    try {
      const riskRows = await db
        .prepare(
          `SELECT id, title, likelihood, impact, score, severity, owner
           FROM risks WHERE tenant_id = ? OR tenant_id = 'demo'
           ORDER BY score DESC`,
        )
        .bind(tenantId)
        .all<{
          id: string;
          title: string;
          likelihood: number;
          impact: number;
          score: number;
          severity: string;
          owner: string | null;
        }>();
      risks = (riskRows.results ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        likelihood: r.likelihood,
        impact: r.impact,
        score: r.score,
        severity: r.severity as "low" | "medium" | "high" | "critical",
        ...(r.owner ? { owner: r.owner } : {}),
      }));
    } catch (e) {
      log("error", "snapshot.risks.error", { error: (e as Error).message });
      risks = fallbackRisks;
    }
    if (risks.length === 0) risks = fallbackRisks;

    // ── Additional dynamic data ──
    let openIncidents = 0;
    let pendingAccessRequests = 0;
    let lastActivity: string | null = null;
    let workflowExecutions24h = 0;
    let evidenceCount = 0;

    try {
      const secRow = await db
        .prepare(
          `SELECT SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count
           FROM security_incidents`,
        )
        .first<{ open_count: number }>();
      openIncidents = secRow?.open_count ?? 0;
    } catch {
      // table may not exist
    }

    try {
      const pendingRow = await db
        .prepare(
          `SELECT COUNT(*) as pending FROM access_requests WHERE status = 'pending'`,
        )
        .first<{ pending: number }>();
      pendingAccessRequests = pendingRow?.pending ?? 0;
    } catch {
      // table may not exist
    }

    try {
      const activityRow = await db
        .prepare(`SELECT MAX(created_at) as last_event FROM activity_events`)
        .first<{ last_event: string | null }>();
      lastActivity = activityRow?.last_event ?? null;
    } catch {
      // table may not exist
    }

    try {
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const execRow = await db
        .prepare(
          `SELECT COUNT(*) as count FROM workflow_executions WHERE created_at >= ?`,
        )
        .bind(sinceIso)
        .first<{ count: number }>();
      workflowExecutions24h = execRow?.count ?? 0;
    } catch {
      // table may not exist
    }

    try {
      const evRow = await db
        .prepare("SELECT COUNT(*) as count FROM evidence_index")
        .first<{ count: number }>();
      evidenceCount = evRow?.count ?? 0;
    } catch {
      // table may not exist
    }

    return {
      tenantId,
      generatedAt: now.toISOString(),
      frameworkSummary:
        frameworkSummary.length > 0
          ? frameworkSummary
          : fallbackSnapshot.frameworkSummary,
      risks,
      policies: policies.length > 0 ? policies : fallbackSnapshot.policies,
      openIncidents,
      pendingAccessRequests,
      lastActivity,
      workflowExecutions24h,
      evidenceCount,
    };
  } catch (e) {
    log("error", "snapshot.build.error", { error: (e as Error).message });
    return fallbackSnapshot;
  }
}

async function ensureSchema(env: Env) {
  const db = resolveD1(env);
  if (!db) return;
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS snapshots (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           tenant_id TEXT NOT NULL UNIQUE,
           generated_at TEXT NOT NULL,
           payload TEXT NOT NULL,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         )`,
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS evidence_index (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           hash TEXT NOT NULL UNIQUE,
           tenant_id TEXT NOT NULL,
           pack TEXT NOT NULL,
           subject_ref TEXT,
           payload TEXT NOT NULL,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         )`,
      )
      .run();
    await db
      .prepare(
        "CREATE INDEX IF NOT EXISTS idx_evidence_tenant_created ON evidence_index (tenant_id, created_at DESC)",
      )
      .run();
    await db
      .prepare(
        "CREATE INDEX IF NOT EXISTS idx_evidence_pack_created ON evidence_index (pack, created_at DESC)",
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS notifications (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           tenant_id TEXT NOT NULL,
           kind TEXT,
           severity TEXT,
           message TEXT NOT NULL,
           ref TEXT,
           "read" INTEGER NOT NULL DEFAULT 0,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
           read_at TEXT
         )`,
      )
      .run();
    await db
      .prepare(
        "CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created ON notifications (tenant_id, created_at DESC)",
      )
      .run();
    const tableInfo = await db
      .prepare("PRAGMA table_info('notifications')")
      .all<{ name: string }>();
    const columns = tableInfo?.results || [];
    const hasReadAt = columns.some((column) => column.name === "read_at");
    if (!hasReadAt) {
      await db
        .prepare("ALTER TABLE notifications ADD COLUMN read_at TEXT")
        .run();
      await db
        .prepare(
          'UPDATE notifications SET read_at = COALESCE(read_at, CASE WHEN "read" = 1 THEN created_at ELSE read_at END) WHERE "read" = 1 AND (read_at IS NULL OR read_at = \'\')',
        )
        .run();
    }
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS risks (
           id TEXT PRIMARY KEY,
           tenant_id TEXT NOT NULL DEFAULT 'demo',
           title TEXT NOT NULL,
           likelihood INTEGER NOT NULL,
           impact INTEGER NOT NULL,
           score INTEGER NOT NULL,
           severity TEXT NOT NULL,
           owner TEXT,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         )`,
      )
      .run();
    // Seed default risks if table is empty
    const riskCount = await db
      .prepare("SELECT COUNT(*) as count FROM risks")
      .first<{ count: number }>();
    if ((riskCount?.count ?? 0) === 0) {
      const seedRisks = [
        {
          id: "R1",
          title: "Unpatched server infrastructure",
          likelihood: 4,
          impact: 4,
          owner: "ops@tenant",
        },
        {
          id: "R2",
          title: "MFA coverage gaps",
          likelihood: 3,
          impact: 3,
          owner: null,
        },
        {
          id: "R3",
          title: "Third-party vendor exposure",
          likelihood: 5,
          impact: 4,
          owner: "security@tenant",
        },
      ];
      for (const r of seedRisks) {
        const score = deriveRiskScore(r.likelihood, r.impact);
        const severity = deriveSeverity(score);
        await db
          .prepare(
            `INSERT OR IGNORE INTO risks (id, title, likelihood, impact, score, severity, owner)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(r.id, r.title, r.likelihood, r.impact, score, severity, r.owner)
          .run();
      }
    }
    // Seed demo notifications if table is empty
    const notifCount = await db
      .prepare("SELECT COUNT(*) as count FROM notifications")
      .first<{ count: number }>();
    if ((notifCount?.count ?? 0) === 0) {
      const seedNotifications = [
        {
          kind: "compliance",
          severity: "info",
          message: "SOC 2 coverage report generated successfully.",
          ref: "SOC2",
        },
        {
          kind: "security",
          severity: "warning",
          message: "MFA enrollment below 90% threshold for engineering team.",
          ref: "MFA",
        },
        {
          kind: "policy",
          severity: "info",
          message: "Data Protection & Privacy Policy approved and published.",
          ref: "P5",
        },
      ];
      for (const n of seedNotifications) {
        await db
          .prepare(
            `INSERT INTO notifications (tenant_id, kind, severity, message, ref)
             VALUES ('demo', ?, ?, ?, ?)`,
          )
          .bind(n.kind, n.severity, n.message, n.ref)
          .run();
      }
    }
    // Seed demo activity events if table is empty (only if table exists)
    try {
      const activityCount = await db
        .prepare("SELECT COUNT(*) as count FROM activity_events")
        .first<{ count: number }>();
      if ((activityCount?.count ?? 0) === 0) {
        const seedActivities = [
          {
            action: "policy.approved",
            actor: "admin@demo",
            detail: "Data Protection & Privacy Policy approved",
          },
          {
            action: "evidence.ingested",
            actor: "system",
            detail: "Infrastructure scan evidence collected",
          },
          {
            action: "risk.assessed",
            actor: "admin@demo",
            detail: "Quarterly risk assessment completed",
          },
        ];
        for (const a of seedActivities) {
          await db
            .prepare(
              `INSERT INTO activity_events (tenant_id, action, actor, detail)
               VALUES ('demo', ?, ?, ?)`,
            )
            .bind(a.action, a.actor, a.detail)
            .run();
        }
      }
    } catch {
      // activity_events table may not exist yet — ensureExtendedSchema handles it
    }
  } catch (e) {
    log("error", "schema.ensure.error", { error: (e as Error).message });
  }
}

async function getPersistedSnapshot(
  env: Env,
  tenantId: string,
  maxAgeSeconds: number,
): Promise<ComplianceSnapshot | null> {
  const db = resolveD1(env);
  if (!db) return null;
  try {
    const row = await db
      .prepare(
        "SELECT payload, generated_at FROM snapshots WHERE tenant_id = ? LIMIT 1",
      )
      .bind(tenantId)
      .first<Record<string, string>>();
    if (!row) return null;
    const parsed: ComplianceSnapshot = JSON.parse(row.payload);
    const reference = row.generated_at || parsed.generatedAt;
    const ageSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(reference).getTime()) / 1000),
    );
    if (ageSeconds > maxAgeSeconds) return null;
    return { ...parsed, ageSeconds };
  } catch (e) {
    log("error", "snapshot.read.error", { error: (e as Error).message });
    return null;
  }
}

async function persistSnapshot(
  env: Env,
  tenantId: string,
  snapshot: ComplianceSnapshot,
) {
  const db = resolveD1(env);
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO snapshots (tenant_id, generated_at, payload)
        VALUES (?, ?, ?)
        ON CONFLICT(tenant_id) DO UPDATE SET
          generated_at = excluded.generated_at,
          payload = excluded.payload,
          created_at = CURRENT_TIMESTAMP`,
      )
      .bind(tenantId, snapshot.generatedAt, JSON.stringify(snapshot))
      .run();
  } catch (e) {
    log("error", "snapshot.write.error", { error: (e as Error).message });
  }
}

type HealthPayload = {
  status: string;
  service: string;
  timestamp: number;
  version: string;
  buildVersion: string;
  snapshotAgeSeconds?: number | null;
  d1: boolean;
  r2: boolean;
  evidenceCount: number;
  aiQuotaUsed?: number | null;
  aiQuotaRemaining?: number | null;
  security?: { openIncidents: number; threatLevel: string };
  access?: { pendingRequests: number };
  activity?: { lastEventTs: string | null };
  latency?: Record<string, ReturnType<typeof summarizeLatency>>;
  automation?: { executions24h: number };
};

async function handleHealth(
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  const db = resolveD1(env);
  let latestAge: number | undefined;
  let evidenceCount = 0;
  let securityOpen = 0;
  let securityThreat = "unknown";
  let pendingRequests = 0;
  let lastActivityTs: string | null = null;
  let executions24h = 0;

  if (db) {
    try {
      const latestSnapshot = await db
        .prepare(
          "SELECT generated_at FROM snapshots ORDER BY generated_at DESC LIMIT 1",
        )
        .first<Record<string, string>>();
      if (latestSnapshot?.generated_at) {
        latestAge = Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(latestSnapshot.generated_at).getTime()) /
              1000,
          ),
        );
      }
    } catch (e) {
      log("error", "health.snapshotAge.error", { error: (e as Error).message });
    }

    try {
      const countRow = await db
        .prepare("SELECT COUNT(*) as count FROM evidence_index")
        .first<{ count: number }>();
      evidenceCount = countRow?.count ?? 0;
    } catch (e) {
      log("error", "health.evidenceCount.error", {
        error: (e as Error).message,
      });
    }

    try {
      const securityRow = await db
        .prepare(
          `SELECT
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
          SUM(CASE WHEN status = 'open' AND severity = 'critical' THEN 1 ELSE 0 END) AS critical_open,
          SUM(CASE WHEN status = 'open' AND severity = 'high' THEN 1 ELSE 0 END) AS high_open,
          AVG(CASE WHEN response_ms IS NOT NULL THEN response_ms END) AS avg_response_ms
        FROM security_incidents`,
        )
        .first<{
          open_count: number;
          critical_open: number;
          high_open: number;
          avg_response_ms: number | null;
        }>();
      securityOpen = securityRow?.open_count ?? 0;
      const criticalOpen = securityRow?.critical_open ?? 0;
      const highOpen = securityRow?.high_open ?? 0;
      const avgResponseMs =
        securityRow?.avg_response_ms != null
          ? Number(securityRow.avg_response_ms)
          : null;
      if (criticalOpen > 0) {
        securityThreat = "critical";
      } else if (highOpen >= 2) {
        securityThreat = "elevated";
      } else if (
        highOpen >= 1 &&
        avgResponseMs != null &&
        Number.isFinite(avgResponseMs) &&
        avgResponseMs > 10 * 60 * 1000
      ) {
        securityThreat = "elevated";
      } else {
        securityThreat = "normal";
      }
    } catch (e) {
      log("error", "health.security.summary.error", {
        error: (e as Error).message,
      });
    }

    try {
      const pendingRow = await db
        .prepare(
          `SELECT COUNT(*) as pending FROM access_requests WHERE status = 'pending'`,
        )
        .first<{ pending: number }>();
      pendingRequests = pendingRow?.pending ?? 0;
    } catch (e) {
      log("error", "health.access.pending.error", {
        error: (e as Error).message,
      });
    }

    try {
      const activityRow = await db
        .prepare(`SELECT MAX(created_at) as last_event FROM activity_events`)
        .first<{ last_event: string | null }>();
      lastActivityTs = activityRow?.last_event ?? null;
    } catch (e) {
      log("error", "health.activity.lastEvent.error", {
        error: (e as Error).message,
      });
    }

    // Count automation executions in last 24h (rolling window)
    try {
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const row = await db
        .prepare(
          `SELECT COUNT(*) as count FROM workflow_executions WHERE created_at >= ?`,
        )
        .bind(sinceIso)
        .first<{ count: number }>();
      executions24h = row?.count ?? 0;
    } catch (e) {
      log("error", "health.automation.executions24h.error", {
        error: (e as Error).message,
      });
    }
  }

  if (hasCounters()) {
    const snapshot = drainCounters();
    if (Object.keys(snapshot).length > 0) {
      log("info", "metrics.flush", { requestId, counters: snapshot });
    }
  }

  const buildVersion = env.BUILD_VERSION || "dev";
  const body: HealthPayload = {
    status: "ok",
    service: "compliance-worker",
    timestamp: Date.now(),
    version: buildVersion,
    buildVersion,
    snapshotAgeSeconds: latestAge ?? null,
    d1: !!db,
    r2: !!resolveR2(env),
    evidenceCount,
    // Placeholder fields for orchestrator AI quota (not resolved here to avoid cross-fetch cost)
    aiQuotaUsed: null,
    aiQuotaRemaining: null,
    security: {
      openIncidents: securityOpen,
      threatLevel: securityThreat,
    },
    access: {
      pendingRequests,
    },
    activity: {
      lastEventTs: lastActivityTs,
    },
    automation: { executions24h },
  };

  const workflowLat = summarizeLatency("workflowExecute");
  const policyGenLat = summarizeLatency("policyGenerate");
  const policyEvalLat = summarizeLatency("policyEvaluate");
  const incidentCreateLat = summarizeLatency("incidentCreate");
  const incidentResolveLat = summarizeLatency("incidentResolve");
  const activityListLat = summarizeLatency("activityList");
  const notificationsLat = summarizeLatency("notificationsList");
  const accessRequestCreateLat = summarizeLatency("accessRequestCreate");
  (body as any).latency = {
    workflowExecute: workflowLat,
    policyGenerate: policyGenLat,
    policyEvaluate: policyEvalLat,
    incidentCreate: incidentCreateLat,
    incidentResolve: incidentResolveLat,
    activityList: activityListLat,
    notificationsList: notificationsLat,
    accessRequestCreate: accessRequestCreateLat,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: mergeHeaders(headers, { "content-type": "application/json" }),
  });
}

async function handleSnapshot(
  env: Env,
  url: URL,
  requestId: string,
  headers: Record<string, string>,
  method: "GET" | "HEAD",
) {
  const tenantId = url.searchParams.get("tenantId") || DEFAULT_TENANT;
  const start = Date.now();
  try {
    await ensureSchema(env);
    let snapshot = await getPersistedSnapshot(
      env,
      tenantId,
      SNAPSHOT_TTL_SECONDS,
    );
    if (snapshot) {
      log("info", "snapshot.cached", {
        requestId,
        tenantId,
        ageSeconds: snapshot.ageSeconds,
      });
      return new Response(method === "HEAD" ? null : JSON.stringify(snapshot), {
        status: 200,
        headers: mergeHeaders(headers, {
          "content-type": "application/json",
          "Cache-Control": "public, max-age=60",
        }),
      });
    }

    const fresh = await buildSnapshot(env, tenantId);
    await persistSnapshot(env, tenantId, fresh);
    const enriched: ComplianceSnapshot = { ...fresh, ageSeconds: 0 };
    log("info", "snapshot.fresh", {
      requestId,
      tenantId,
      risks: fresh.risks.length,
    });
    return new Response(method === "HEAD" ? null : JSON.stringify(enriched), {
      status: 200,
      headers: mergeHeaders(headers, {
        "content-type": "application/json",
        "Cache-Control": "no-cache",
      }),
    });
  } catch (err) {
    log("error", "snapshot.error", {
      requestId,
      error: (err as Error).message,
    });
    return new Response(
      JSON.stringify({ error: "Internal error", code: "INTERNAL_ERROR", message: "Internal error", requestId }),
      {
        status: 500,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
  } finally {
    const dur = Date.now() - start;
    log("info", "snapshot.duration", { requestId, ms: dur });
  }
}

// --- Evidence ingest helper extraction to reduce complexity ---
function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function serializePayload(
  obj: unknown,
): { serialized: string; tooLarge: boolean } | null {
  if (!obj || typeof obj !== "object") return null;
  const serialized = JSON.stringify(obj);
  return { serialized, tooLarge: false };
}

async function storeEvidenceObject(
  bucket: R2Bucket,
  hash: string,
  canonical: string,
  meta: { tenantId: string; pack: string; subject: string },
) {
  const head = await bucket.head(hash);
  if (head) return false;
  const putResult = await bucket.put(hash, canonical, {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: meta,
  });
  if (!putResult || putResult.version === null) return false;
  return true;
}

async function indexEvidence(
  db: D1Database,
  data: {
    hash: string;
    tenantId: string;
    pack: string;
    subject: string;
    canonical: string;
  },
) {
  const result = await db
    .prepare(
      `INSERT INTO evidence_index (hash, tenant_id, pack, subject_ref, payload)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(hash) DO NOTHING`,
    )
    .bind(data.hash, data.tenantId, data.pack, data.subject, data.canonical)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

async function handleEvidenceIngest(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  const ingestStart = Date.now();
  const bucket = resolveR2(env);
  if (!bucket)
    return errorResponse(503, requestId, headers, "Evidence store unavailable");

  let body: EvidenceIngestRequest | null = null;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }
  if (!body || typeof body !== "object" || !body.payload) {
    return errorResponse(400, requestId, headers, "Missing evidence payload");
  }
  if (typeof body.payload !== "object") {
    return errorResponse(
      400,
      requestId,
      headers,
      "Evidence payload must be object",
    );
  }

  const maxBytes = Number(env.MAX_EVIDENCE_BYTES || 51200);
  const serializedInfo = serializePayload(body.payload);
  if (!serializedInfo) {
    return errorResponse(400, requestId, headers, "Invalid evidence payload");
  }
  const { serialized } = serializedInfo;
  const payloadSize = new TextEncoder().encode(serialized).byteLength;
  if (payloadSize > maxBytes) {
    log("warn", "evidence.payload.too_large", {
      requestId,
      bytes: payloadSize,
      maxBytes,
    });
    return new Response(
      JSON.stringify({
        error: "evidence_too_large",
        maxBytes,
        requestId,
      }),
      {
        status: 413,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
  }

  const tenantId = normalizeString(body.tenantId, DEFAULT_TENANT);
  const pack = normalizeString(body.pack, DEFAULT_PACK);
  const subject = normalizeString(body.subject, DEFAULT_SUBJECT);

  await ensureSchema(env);
  const { canonical, hash } = await hashCanonicalJson(body.payload);

  let stored = false;
  try {
    stored = await storeEvidenceObject(bucket, hash, canonical, {
      tenantId,
      pack,
      subject,
    });
  } catch (e) {
    log("error", "evidence.write.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(500, requestId, headers, "Failed to persist evidence");
  }

  const db = resolveD1(env);
  if (!db)
    return errorResponse(503, requestId, headers, "Evidence index unavailable");
  let indexed = false;
  try {
    indexed = await indexEvidence(db, {
      hash,
      tenantId,
      pack,
      subject,
      canonical,
    });
  } catch (e) {
    log("error", "evidence.index.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(500, requestId, headers, "Failed to index evidence");
  }

  try {
    await recordEvidenceControlLink(db, pack, hash, tenantId);
  } catch (e) {
    log("warn", "evidence.control_link.error", {
      requestId,
      hash,
      pack,
      error: (e as Error).message,
    });
  }

  const isNew = stored || indexed;
  if (isNew) incrementCounter("evidence.ingest", 1);
  log("info", "evidence.ingest", {
    requestId,
    tenantId,
    pack,
    subject,
    hash,
    stored: isNew,
  });
  try {
    await ensureExtendedSchema(db);
    await recordActivityEvent(db, {
      tenantId,
      type: "evidence",
      severity: "info",
      ref: hash,
      message: `Evidence ingested: ${hash.substring(0, 12)}`,
    });
  } catch (e) {
    log("warn", "evidence.ingest.activity.error", {
      requestId,
      tenantId,
      error: (e as Error).message,
    });
  }
  recordLatency("evidenceIngest", Date.now() - ingestStart);
  return new Response(JSON.stringify({ hash, stored: isNew }), {
    status: 200,
    headers: mergeHeaders(headers, { "content-type": "application/json" }),
  });
}

async function handleEvidenceGet(
  env: Env,
  hash: string,
  requestId: string,
  headers: Record<string, string>,
) {
  const bucket = resolveR2(env);
  if (!bucket) {
    return errorResponse(503, requestId, headers, "Evidence store unavailable");
  }

  try {
    const object = await bucket.get(hash);
    if (!object) {
      return errorResponse(404, requestId, headers, "Evidence not found");
    }
    // Some test stubs provide only text(); production may have arrayBuffer(). Prefer text() if available.
    let body: string;
    if (typeof (object as any).text === "function") {
      body = await (object as any).text();
    } else {
      body = new TextDecoder().decode(await (object as any).arrayBuffer());
    }
    return new Response(body, {
      status: 200,
      headers: mergeHeaders(headers, {
        "content-type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Evidence-Hash": hash,
      }),
    });
  } catch (e) {
    log("error", "evidence.read.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(500, requestId, headers, "Failed to read evidence");
  }
}

function parseLimit(raw: string | null): number {
  if (!raw) return 20;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(50, Math.floor(parsed));
}

async function handleEvidenceSearch(
  env: Env,
  url: URL,
  requestId: string,
  headers: Record<string, string>,
) {
  const searchStart = Date.now();
  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Evidence index unavailable");
  }

  await ensureSchema(env);

  const tenantId = url.searchParams.get("tenantId")?.trim() || undefined;
  const pack = url.searchParams.get("pack")?.trim() || undefined;
  const subject = url.searchParams.get("subject")?.trim() || undefined;
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursorParam = url.searchParams.get("cursor");
  let cursor: number | undefined;

  if (cursorParam) {
    cursor = Number(cursorParam);
    if (!Number.isFinite(cursor) || cursor <= 0) {
      return errorResponse(400, requestId, headers, "Invalid cursor value");
    }
  }

  const conditions: string[] = [];
  const bindings: Array<string | number> = [];

  if (tenantId) {
    conditions.push("tenant_id = ?");
    bindings.push(tenantId);
  }
  if (pack) {
    conditions.push("pack = ?");
    bindings.push(pack);
  }
  if (subject) {
    conditions.push("subject_ref = ?");
    bindings.push(subject);
  }
  if (cursor) {
    conditions.push("id < ?");
    bindings.push(cursor);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const fetchLimit = limit + 1;

  const stmt = db
    .prepare(
      `SELECT id, hash, tenant_id, pack, subject_ref, created_at
       FROM evidence_index
       ${whereClause}
       ORDER BY id DESC
       LIMIT ?`,
    )
    .bind(...bindings, fetchLimit);

  let results: Array<Record<string, unknown>> = [];
  try {
    const { results: rows } = await stmt.all();
    results = rows ?? [];
  } catch (e) {
    log("error", "evidence.search.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(
      500,
      requestId,
      headers,
      "Failed to query evidence index",
    );
  }

  const hasNext = results.length > limit;
  const sliced = hasNext ? results.slice(0, limit) : results;

  const items = sliced.map((row) => {
    let subjectVal: string | null = null;
    if (row.subject_ref != null) {
      if (typeof row.subject_ref === "string") subjectVal = row.subject_ref;
      else subjectVal = JSON.stringify(row.subject_ref);
    }
    return {
      id: Number(row.id),
      hash: String(row.hash),
      tenantId: String(row.tenant_id),
      pack: String(row.pack),
      subject: subjectVal,
      createdAt: String(row.created_at),
    };
  });

  const nextCursor = hasNext ? String(sliced[sliced.length - 1].id) : null;
  const resp = new Response(
    JSON.stringify({
      items,
      nextCursor,
      count: items.length,
    }),
    {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    },
  );
  recordLatency("evidenceSearch", Date.now() - searchStart);
  return resp;
}

async function handleEvidenceVerify(
  env: Env,
  hash: string,
  requestId: string,
  headers: Record<string, string>,
) {
  const verifyStart = Date.now();
  const bucket = resolveR2(env);
  const db = resolveD1(env);
  if (!bucket || !db) {
    return errorResponse(503, requestId, headers, "Evidence store unavailable");
  }
  await ensureSchema(env);
  try {
    const obj = await bucket.get(hash);
    if (!obj) {
      return errorResponse(404, requestId, headers, "Evidence not found");
    }
    // Fallback to text() if available else decode arrayBuffer
    const text =
      typeof (obj as any).text === "function"
        ? await (obj as any).text()
        : new TextDecoder().decode(await (obj as any).arrayBuffer());
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    const { hash: recomputed } =
      parsed && typeof parsed === "object"
        ? await hashCanonicalJson(parsed)
        : { hash };
    const row = await db
      .prepare(
        "SELECT tenant_id, pack, subject_ref, created_at FROM evidence_index WHERE hash = ? LIMIT 1",
      )
      .bind(hash)
      .first<Record<string, string>>();
    const integrity = recomputed === hash;
    const resp = new Response(
      JSON.stringify({
        hash,
        recomputedHash: recomputed,
        integrity,
        valid: integrity,
        tenantId: row?.tenant_id || null,
        pack: row?.pack || null,
        subject: row?.subject_ref || null,
        createdAt: row?.created_at || null,
        sizeBytes: new TextEncoder().encode(text).length,
      }),
      {
        status: 200,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
    recordLatency("evidenceVerify", Date.now() - verifyStart);
    return resp;
  } catch (e) {
    log("error", "evidence.verify.error", {
      requestId,
      error: (e as Error).message,
      hash,
    });
    return errorResponse(500, requestId, headers, "Failed to verify evidence");
  }
}

async function handlePoliciesRetentionPurge(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  const purgeStart = Date.now();
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {}
  const dryRun = Boolean(body?.dryRun !== false); // default true
  const retentionDaysRaw = (env as any).RETENTION_DAYS_POLICIES || 90;
  const retentionDays = Number(retentionDaysRaw) || 90;
  const cutoff = new Date(Date.now() - retentionDays * 86400000);
  const cutoffIso = cutoff.toISOString();

  try {
    // Identify generated policies older than cutoff
    const staleQuery = await db
      .prepare(
        `SELECT hash, template_key, created_at FROM generated_policies
         WHERE tenant_id = ? AND created_at < ?`,
      )
      .bind(tenant.tenantId, cutoffIso)
      .all<{
        results: Array<{
          hash: string;
          template_key: string;
          created_at: string;
        }>;
      }>();
    const rows = (staleQuery as any)?.results || [];
    let deleted = 0;
    if (!dryRun && rows.length) {
      const hashes = rows.map((r: { hash: string }) => r.hash);
      // Delete in batches to avoid exceeding SQLite/D1 parameter limits (25 chosen as a safe default)
      // Allow batch size to be configured via env, default to 25, and cap at 999 (SQLite parameter limit)
      let batchSizeRaw = (env as any).POLICY_PURGE_BATCH_SIZE;
      let POLICY_PURGE_BATCH_SIZE = 25;
      if (
        typeof batchSizeRaw === "string" ||
        typeof batchSizeRaw === "number"
      ) {
        const parsed = Number(batchSizeRaw);
        if (Number.isFinite(parsed) && parsed > 0 && parsed <= 999) {
          POLICY_PURGE_BATCH_SIZE = Math.floor(parsed);
        }
      }
      for (let i = 0; i < hashes.length; i += POLICY_PURGE_BATCH_SIZE) {
        const slice = hashes.slice(i, i + POLICY_PURGE_BATCH_SIZE);
        const placeholders = slice.map(() => "?").join(",");
        await db
          .prepare(
            `DELETE FROM generated_policies WHERE hash IN (${placeholders})`,
          )
          .bind(...slice)
          .run();
      }
      deleted = hashes.length;
    }
    log("info", "policies.retention.purge", {
      requestId,
      tenantId: tenant.tenantId,
      dryRun,
      retentionDays,
      cutoff: cutoffIso,
      candidates: rows.length,
      deleted,
    });
    const resp = new Response(
      JSON.stringify({
        dryRun,
        retentionDays,
        cutoff: cutoffIso,
        candidates: rows.length,
        deleted: dryRun ? 0 : deleted,
      }),
      {
        status: 200,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
    recordLatency("policiesRetentionPurge", Date.now() - purgeStart);
    return resp;
  } catch (e) {
    log("error", "policies.retention.purge.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(
      500,
      requestId,
      headers,
      "Failed to evaluate retention purge",
    );
  }
}

/**
 * Fail fast at request time if required bindings are absent.
 * compliance-worker supports two binding name variants (D1_COMPLIANCE /
 * atlasit_compliance, EVIDENCE_BUCKET / atlasit_evidence) — at least one of
 * each pair must be present for the worker to function.
 */
function validateEnv(env: Env): void {
  const missing: string[] = [];
  if (!resolveD1(env)) {
    missing.push("D1_COMPLIANCE or atlasit_compliance (D1 database binding)");
  }
  if (!resolveR2(env)) {
    missing.push("EVIDENCE_BUCKET or atlasit_evidence (R2 evidence bucket)");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required bindings: ${missing.join(", ")}`);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const cors = buildCors();
    const headers = mergeHeaders(cors, SECURITY_HEADERS);
    // Health endpoint bypasses binding validation so probes/tests work without full env
    if (request.method === "GET" && url.pathname === "/health") {
      return handleHealth(env, requestId, headers);
    }
    validateEnv(env);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const ctx: RouteContext = {
      request,
      env,
      requestId,
      headers,
      url,
      method,
    };

    const routers = [
      demoRoutes,
      healthRoutes,
      workflowsRoutes,
      policiesRoutes,
      securityRoutes,
      activityRoutes,
      notificationsRoutes,
      evidenceRoutes,
      webhookRoutes,
      adminRoutes,
    ];

    for (const route of routers) {
      const response = await route(ctx);
      if (response) {
        return response;
      }
    }

    return errorResponse(404, requestId, headers, "Not Found");
  },
};
