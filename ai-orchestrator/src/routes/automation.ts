import { Hono } from "hono";
import { z } from "zod";
import { requireRole } from "@atlasit/shared";
import type { AppEnv } from "../types";
import {
  evaluateAutomationRules,
  type ActionContext,
} from "../lib/automation-evaluator";

const EvaluateSchema = z.object({
  tenantId: z.string().min(1),
  type: z.string().min(1),
  source: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export const automationRoutes = new Hono<AppEnv>();

/**
 * Resolve and validate tenantId from authenticated context.
 * The authenticated tenantId (set by auth middleware) takes precedence;
 * query param is only used as a fallback when no auth context exists.
 * If both exist, they must match to prevent cross-tenant access.
 */
function resolvetenantId(
  authTenantId: string | undefined,
  queryTenantId: string | undefined,
): { tenantId: string | null; error?: string } {
  if (authTenantId && queryTenantId && authTenantId !== queryTenantId) {
    return {
      tenantId: null,
      error:
        "Tenant mismatch: query tenantId does not match authenticated tenant",
    };
  }
  const tenantId = authTenantId ?? queryTenantId;
  return tenantId
    ? { tenantId }
    : { tenantId: null, error: "Tenant context required" };
}

/**
 * POST /api/v1/automation/evaluate
 * Explicitly evaluate automation rules against an event.
 * Used by adapters and workers that want to trigger automation
 * without going through the event publication flow.
 */
automationRoutes.post("/evaluate", requireRole("member"), async (c) => {
  const body = await c.req.json();
  const parsed = EvaluateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Invalid evaluation request",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  // Enforce tenant isolation: authenticated tenant must match request
  const authTenantId = c.get("tenantId");
  const { tenantId, error } = resolvetenantId(
    authTenantId,
    parsed.data.tenantId,
  );
  if (!tenantId) {
    return c.json(
      {
        status: "error",
        code: "FORBIDDEN",
        message: error,
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      403,
    );
  }

  const { type, source, payload } = parsed.data;

  // Use ATLAS_SHARED_DB so rules and execution records are in the same DB as
  // the console-app. Fall back to DB only if the shared binding is absent
  // (e.g. local dev without the binding configured).
  const sharedDb = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const adapterUrls = (() => {
    try {
      return JSON.parse(c.env.ADAPTER_URLS ?? "{}") as Record<string, string>;
    } catch {
      return {};
    }
  })();
  const actionContext: ActionContext = {
    workflow: c.env.WORKFLOW,
    selfUrl: c.env.SELF_URL,
    adapterUrls,
    sharedDb,
  };

  const result = await evaluateAutomationRules(
    sharedDb,
    tenantId,
    type,
    source,
    payload ?? {},
    c.env.AUTOMATION,
    actionContext,
  );

  return c.json({
    status: "success",
    data: result,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/automation/rules
 * List automation rules for the authenticated tenant.
 */
automationRoutes.get("/rules", async (c) => {
  const authTenantId = c.get("tenantId");
  const { tenantId, error } = resolvetenantId(
    authTenantId,
    c.req.query("tenantId"),
  );
  if (!tenantId) {
    return c.json(
      {
        status: "error",
        code: authTenantId ? "FORBIDDEN" : "MISSING_TENANT",
        message: error,
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      authTenantId ? 403 : 400,
    );
  }

  const sharedDb = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const { results } = await sharedDb
    .prepare(
      "SELECT id, name, trigger_type, enabled, run_count, error_count, last_run_at, last_status FROM automation_rules WHERE tenant_id = ? ORDER BY created_at DESC",
    )
    .bind(tenantId)
    .all();

  return c.json({
    status: "success",
    data: results || [],
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/automation/stats
 * Get per-tenant automation execution stats from the Durable Object.
 */
automationRoutes.get("/stats", async (c) => {
  const authTenantId = c.get("tenantId");
  const { tenantId, error } = resolvetenantId(
    authTenantId,
    c.req.query("tenantId"),
  );
  if (!tenantId) {
    return c.json(
      {
        status: "error",
        code: authTenantId ? "FORBIDDEN" : "MISSING_TENANT",
        message: error,
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      authTenantId ? 403 : 400,
    );
  }

  const doId = c.env.AUTOMATION.idFromName(tenantId);
  const stub = c.env.AUTOMATION.get(doId);
  const res = await stub.fetch(
    new Request("http://automation/stats", { method: "GET" }),
  );
  const stats = await res.json();

  return c.json({
    status: "success",
    data: stats,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
