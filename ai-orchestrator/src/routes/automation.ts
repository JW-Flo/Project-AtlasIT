import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";
import { evaluateAutomationRules } from "../lib/automation-evaluator";

const EvaluateSchema = z.object({
  tenantId: z.string().min(1),
  type: z.string().min(1),
  source: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export const automationRoutes = new Hono<AppEnv>();

/**
 * POST /api/v1/automation/evaluate
 * Explicitly evaluate automation rules against an event.
 * Used by adapters and workers that want to trigger automation
 * without going through the event publication flow.
 */
automationRoutes.post("/evaluate", async (c) => {
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

  const { tenantId, type, source, payload } = parsed.data;

  const result = await evaluateAutomationRules(
    c.env.DB,
    tenantId,
    type,
    source,
    payload ?? {},
    c.env.AUTOMATION,
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
 * List automation rules for a tenant (read-only view from orchestrator).
 */
automationRoutes.get("/rules", async (c) => {
  const tenantId = c.req.query("tenantId") ?? c.get("tenantId");
  if (!tenantId) {
    return c.json(
      {
        status: "error",
        code: "MISSING_TENANT",
        message: "tenantId query parameter required",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const { results } = await c.env.DB.prepare(
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
 * GET /api/v1/automation/stats?tenantId=...
 * Get per-tenant automation execution stats from the Durable Object.
 */
automationRoutes.get("/stats", async (c) => {
  const tenantId = c.req.query("tenantId") ?? c.get("tenantId");
  if (!tenantId) {
    return c.json(
      {
        status: "error",
        code: "MISSING_TENANT",
        message: "tenantId query parameter required",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
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
