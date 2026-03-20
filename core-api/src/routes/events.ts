import { Hono } from "hono";
import { z } from "zod";
import { requireRole } from "@atlasit/shared";
import type { AppEnv } from "../types";

const CreateEventSchema = z.object({
  tenantId: z.string().uuid(),
  type: z.string().min(1),
  source: z.string().min(1),
  payload: z.unknown().optional(),
  idempotencyKey: z.string().optional(),
});

export const eventRoutes = new Hono<AppEnv>();

// POST /api/v1/events — publish event
eventRoutes.post("/", requireRole("member"), async (c) => {
  const body = await c.req.json();
  const parsed = CreateEventSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        status: "error" as const,
        code: "VALIDATION_FAILED",
        message: "Invalid event payload",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const { tenantId, type, source, payload, idempotencyKey } = parsed.data;

  // Idempotency check
  if (idempotencyKey) {
    const existing = await c.env.DB.prepare(
      "SELECT id, status FROM events WHERE idempotency_key = ?",
    )
      .bind(idempotencyKey)
      .first<{ id: string; status: string }>();

    if (existing) {
      return c.json({
        status: "success" as const,
        data: { id: existing.id, status: existing.status, deduplicated: true },
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      });
    }
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    "INSERT INTO events (id, tenant_id, type, source, payload, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      id,
      tenantId,
      type,
      source,
      payload ? JSON.stringify(payload) : null,
      "pending",
      idempotencyKey ?? null,
    )
    .run();

  return c.json(
    {
      status: "success" as const,
      data: { id, type, source, status: "pending" },
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// GET /api/v1/events — list events (with filtering)
eventRoutes.get("/", async (c) => {
  const tenantId = c.req.query("tenantId");
  const status = c.req.query("status");
  const type = c.req.query("type");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 100);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (tenantId) {
    conditions.push("tenant_id = ?");
    params.push(tenantId);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (type) {
    conditions.push("type = ?");
    params.push(type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const results = await c.env.DB.prepare(
    `SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    status: "success" as const,
    data: results.results,
    meta: { limit, offset },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/events/:id — get single event
eventRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();

  const event = await c.env.DB.prepare("SELECT * FROM events WHERE id = ?").bind(id).first();

  if (!event) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Event not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  return c.json({
    status: "success" as const,
    data: event,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
