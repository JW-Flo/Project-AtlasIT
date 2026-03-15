import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";

const RegisterAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  webhookUrl: z.string().url(),
  capabilities: z.array(z.string()).optional(),
  healthCheckUrl: z.string().url().optional(),
  eventTypes: z.array(z.string()).min(1),
});

const UpdateAgentSchema = z.object({
  description: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  capabilities: z.array(z.string()).optional(),
  healthCheckUrl: z.string().url().optional(),
});

export const agentRoutes = new Hono<AppEnv>();

// POST /api/v1/agents — register a new agent
agentRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = RegisterAgentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Invalid agent registration",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const {
    name,
    description,
    webhookUrl,
    capabilities,
    healthCheckUrl,
    eventTypes,
  } = parsed.data;
  const id = crypto.randomUUID();

  // SECURITY: secret stored plaintext for HMAC signing. Consider envelope encryption.
  const secretBytes = crypto.getRandomValues(new Uint8Array(32));
  const secret = Array.from(secretBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  try {
    await c.env.DB.prepare(
      "INSERT INTO agent_registry (id, name, description, webhook_url, secret, capabilities, health_check_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        name,
        description ?? null,
        webhookUrl,
        secret,
        capabilities ? JSON.stringify(capabilities) : null,
        healthCheckUrl ?? null,
      )
      .run();
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json(
        {
          status: "error",
          code: "CONFLICT",
          message: "An agent with this name already exists",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        409,
      );
    }
    throw e;
  }

  // Create event subscriptions
  for (const eventType of eventTypes) {
    const subId = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO event_subscriptions (id, agent_id, event_type) VALUES (?, ?, ?)",
    )
      .bind(subId, id, eventType)
      .run();
  }

  return c.json(
    {
      status: "success",
      data: { id, name, webhookUrl, secret, eventTypes, status: "active" },
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// GET /api/v1/agents — list all agents
agentRoutes.get("/", async (c) => {
  const status = c.req.query("status");
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const agents = await c.env.DB.prepare(
    `SELECT id, name, description, webhook_url, status, capabilities, health_check_url, last_health_check_at, last_health_status, created_at, updated_at FROM agent_registry ${where} ORDER BY created_at DESC`,
  )
    .bind(...params)
    .all();

  // Enrich with subscription counts
  const enriched = await Promise.all(
    (agents.results as Record<string, unknown>[]).map(async (agent) => {
      const subs = await c.env.DB.prepare(
        "SELECT event_type FROM event_subscriptions WHERE agent_id = ?",
      )
        .bind(agent.id as string)
        .all();
      return {
        ...agent,
        eventTypes: subs.results.map(
          (s: Record<string, unknown>) => s.event_type,
        ),
      };
    }),
  );

  return c.json({
    status: "success",
    data: enriched,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/agents/:id — get agent details
agentRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const agent = await c.env.DB.prepare(
    "SELECT id, name, description, webhook_url, status, capabilities, health_check_url, last_health_check_at, last_health_status, created_at, updated_at FROM agent_registry WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!agent) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Agent not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const subs = await c.env.DB.prepare(
    "SELECT event_type FROM event_subscriptions WHERE agent_id = ?",
  )
    .bind(id)
    .all();

  const deliveries = await c.env.DB.prepare(
    "SELECT status, COUNT(*) as count FROM event_deliveries WHERE agent_id = ? GROUP BY status",
  )
    .bind(id)
    .all();

  return c.json({
    status: "success",
    data: {
      ...agent,
      eventTypes: subs.results.map(
        (s: Record<string, unknown>) => s.event_type,
      ),
      deliveryStats: deliveries.results,
    },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// PATCH /api/v1/agents/:id — update agent
agentRoutes.patch("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = UpdateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Invalid update",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM agent_registry WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Agent not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const updates = parsed.data;
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.description !== undefined) {
    setClauses.push("description = ?");
    values.push(updates.description);
  }
  if (updates.webhookUrl !== undefined) {
    setClauses.push("webhook_url = ?");
    values.push(updates.webhookUrl);
  }
  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }
  if (updates.capabilities !== undefined) {
    setClauses.push("capabilities = ?");
    values.push(JSON.stringify(updates.capabilities));
  }
  if (updates.healthCheckUrl !== undefined) {
    setClauses.push("health_check_url = ?");
    values.push(updates.healthCheckUrl);
  }

  if (setClauses.length > 0) {
    setClauses.push("updated_at = datetime('now')");
    values.push(id);
    await c.env.DB.prepare(
      `UPDATE agent_registry SET ${setClauses.join(", ")} WHERE id = ?`,
    )
      .bind(...values)
      .run();
  }

  const updated = await c.env.DB.prepare(
    "SELECT id, name, description, webhook_url, status, capabilities, health_check_url, last_health_check_at, last_health_status, created_at, updated_at FROM agent_registry WHERE id = ?",
  )
    .bind(id)
    .first();

  return c.json({
    status: "success",
    data: updated,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/v1/agents/:id — deregister agent
agentRoutes.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const existing = await c.env.DB.prepare(
    "SELECT id FROM agent_registry WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Agent not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  // Delete subscriptions first (cascade), then agent
  await c.env.DB.prepare("DELETE FROM event_subscriptions WHERE agent_id = ?")
    .bind(id)
    .run();

  await c.env.DB.prepare("DELETE FROM agent_registry WHERE id = ?")
    .bind(id)
    .run();

  return c.json({
    status: "success",
    data: { id, deleted: true },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/agents/:id/subscriptions — add event subscription
agentRoutes.post("/:id/subscriptions", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const schema = z.object({
    eventType: z.string().min(1),
    filterExpression: z.string().optional(),
  });
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Invalid subscription",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const agent = await c.env.DB.prepare(
    "SELECT id FROM agent_registry WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!agent) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Agent not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const subId = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      "INSERT INTO event_subscriptions (id, agent_id, event_type, filter_expression) VALUES (?, ?, ?, ?)",
    )
      .bind(
        subId,
        id,
        parsed.data.eventType,
        parsed.data.filterExpression ?? null,
      )
      .run();
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json(
        {
          status: "error",
          code: "CONFLICT",
          message: "Already subscribed to this event type",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        409,
      );
    }
    throw e;
  }

  return c.json(
    {
      status: "success",
      data: { id: subId, agentId: id, eventType: parsed.data.eventType },
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// POST /api/v1/agents/:id/health — report health check result
agentRoutes.post("/:id/health", async (c) => {
  const { id } = c.req.param();
  const agent = await c.env.DB.prepare(
    "SELECT id, health_check_url FROM agent_registry WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!agent) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Agent not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  let healthStatus = "unhealthy";
  const healthUrl = agent.health_check_url as string | null;

  if (healthUrl) {
    try {
      const res = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      healthStatus = res.ok ? "healthy" : "unhealthy";
    } catch {
      healthStatus = "unhealthy";
    }
  }

  await c.env.DB.prepare(
    "UPDATE agent_registry SET last_health_check_at = datetime('now'), last_health_status = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(
      healthStatus,
      healthStatus === "unhealthy" ? "unhealthy" : "active",
      id,
    )
    .run();

  return c.json({
    status: "success",
    data: { id, healthStatus },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
