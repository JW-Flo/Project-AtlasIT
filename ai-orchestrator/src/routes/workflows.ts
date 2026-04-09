import { Hono } from "hono";
import { z } from "zod";
import { requireRole } from "@atlasit/shared";
import type { AppEnv } from "../types";

type WorkflowBindings = AppEnv["Bindings"] & {
  WORKFLOW: DurableObjectNamespace;
  ATLAS_WORKFLOW?: Workflow;
};
type WorkflowEnv = {
  Bindings: WorkflowBindings;
  Variables: AppEnv["Variables"];
};

const StartWorkflowSchema = z.object({
  definitionId: z.string(),
  definitionName: z.string(),
  tenantId: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      handler: z.string(),
      timeoutMs: z.number().positive(),
      retryConfig: z.object({ maxRetries: z.number(), backoffMs: z.number() }).optional(),
      compensate: z.string().optional(),
    }),
  ),
  onFailure: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        handler: z.string(),
        timeoutMs: z.number().positive(),
      }),
    )
    .optional(),
  globalTimeoutMs: z.number().positive().default(300000),
  context: z.record(z.unknown()).optional(),
});

export const workflowRoutes = new Hono<WorkflowEnv>();

workflowRoutes.post("/", requireRole("member"), async (c) => {
  const body = await c.req.json();
  const parsed = StartWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Invalid workflow definition",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const workflowId = crypto.randomUUID();

  const definition = {
    id: parsed.data.definitionId,
    name: parsed.data.definitionName,
    steps: parsed.data.steps,
    onFailure: parsed.data.onFailure,
    globalTimeoutMs: parsed.data.globalTimeoutMs,
  };

  // Prefer Cloudflare Workflows when available, fall back to WorkflowDO
  if (c.env.ATLAS_WORKFLOW) {
    await c.env.ATLAS_WORKFLOW.create({
      id: workflowId,
      params: {
        definition,
        tenantId: parsed.data.tenantId,
        correlationId: workflowId,
        context: parsed.data.context ?? {},
      },
    });
    return c.json(
      {
        status: "success",
        data: { workflowId, status: "started", engine: "cloudflare-workflows" },
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      201,
    );
  }

  const doId = c.env.WORKFLOW.idFromName(workflowId);
  const stub = c.env.WORKFLOW.get(doId);

  const response = await stub.fetch(
    new Request("http://workflow/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        definition,
        tenantId: parsed.data.tenantId,
        correlationId: c.get("correlationId"),
        context: parsed.data.context,
      }),
    }),
  );

  const result = await response.json();
  return c.json(
    {
      status: "success",
      data: { workflowId, ...(result as Record<string, unknown>) },
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    response.status as 201,
  );
});

workflowRoutes.get("/:id", requireRole("member"), async (c) => {
  const { id } = c.req.param();

  // Try Cloudflare Workflows first
  if (c.env.ATLAS_WORKFLOW) {
    try {
      const instance = await c.env.ATLAS_WORKFLOW.get(id);
      const instanceStatus = await instance.status();
      return c.json({
        status: "success",
        data: {
          workflowId: id,
          engine: "cloudflare-workflows",
          ...instanceStatus,
        },
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Not found in CF Workflows — fall through to WorkflowDO
    }
  }

  const doId = c.env.WORKFLOW.idFromName(id);
  const stub = c.env.WORKFLOW.get(doId);

  const response = await stub.fetch(new Request("http://workflow/status", { method: "GET" }));
  const result = await response.json();

  if (response.status === 404) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Workflow not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  return c.json({
    status: "success",
    data: { workflowId: id, ...(result as Record<string, unknown>) },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

workflowRoutes.post("/:id/steps/:stepId/complete", requireRole("member"), async (c) => {
  const { id, stepId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const doId = c.env.WORKFLOW.idFromName(id);
  const stub = c.env.WORKFLOW.get(doId);

  const response = await stub.fetch(
    new Request(`http://workflow/step/${stepId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

  const result = await response.json();
  return c.json(
    {
      status: "success",
      data: result,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    response.status as 200,
  );
});

workflowRoutes.post("/:id/steps/:stepId/fail", requireRole("member"), async (c) => {
  const { id, stepId } = c.req.param();
  const body = (await c.req.json()) as { error: string };
  const doId = c.env.WORKFLOW.idFromName(id);
  const stub = c.env.WORKFLOW.get(doId);

  const response = await stub.fetch(
    new Request(`http://workflow/step/${stepId}/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

  const result = await response.json();
  return c.json(
    {
      status: "success",
      data: result,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    response.status as 200,
  );
});

workflowRoutes.post("/:id/cancel", requireRole("member"), async (c) => {
  const { id } = c.req.param();

  // Try Cloudflare Workflows first
  if (c.env.ATLAS_WORKFLOW) {
    try {
      const instance = await c.env.ATLAS_WORKFLOW.get(id);
      await instance.terminate();
      return c.json(
        {
          status: "success",
          data: { status: "cancelled", engine: "cloudflare-workflows" },
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch {
      // Not found in CF Workflows — fall through to WorkflowDO
    }
  }

  const doId = c.env.WORKFLOW.idFromName(id);
  const stub = c.env.WORKFLOW.get(doId);

  const response = await stub.fetch(new Request("http://workflow/cancel", { method: "POST" }));
  const result = await response.json();
  return c.json(
    {
      status: "success",
      data: result,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    response.status as 200,
  );
});
