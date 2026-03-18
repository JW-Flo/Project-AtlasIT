import { Hono } from "hono";
import { requireRole } from "@atlasit/shared";
import type { AppEnv } from "../types";
import { replayDeadLetter } from "../lib/dead-letter";

export const deadLetterRoutes = new Hono<AppEnv>();

// GET /api/v1/dead-letter — list dead letter entries
deadLetterRoutes.get("/", async (c) => {
  const tenantId = c.req.query("tenantId");
  const agentId = c.req.query("agentId");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 100);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (tenantId) {
    conditions.push("tenant_id = ?");
    params.push(tenantId);
  }
  if (agentId) {
    conditions.push("agent_id = ?");
    params.push(agentId);
  }
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const results = await c.env.DB.prepare(
    `SELECT * FROM dead_letter_queue ${where} ORDER BY dead_lettered_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM dead_letter_queue ${where}`,
  )
    .bind(...params)
    .first<{ total: number }>();

  return c.json({
    status: "success",
    data: results.results,
    meta: { total: countResult?.total ?? 0, limit, offset },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/dead-letter/stats/summary — DLQ depth and stats
deadLetterRoutes.get("/stats/summary", async (c) => {
  const total = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM dead_letter_queue WHERE replay_status IS NULL",
  ).first<{ count: number }>();
  const byAgent = await c.env.DB.prepare(
    `SELECT agent_id, COUNT(*) as count FROM dead_letter_queue WHERE replay_status IS NULL GROUP BY agent_id`,
  ).all();
  const byType = await c.env.DB.prepare(
    `SELECT event_type, COUNT(*) as count FROM dead_letter_queue WHERE replay_status IS NULL GROUP BY event_type`,
  ).all();

  return c.json({
    status: "success",
    data: {
      depth: total?.count ?? 0,
      byAgent: byAgent.results,
      byEventType: byType.results,
    },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/dead-letter/:id — get single entry
deadLetterRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const entry = await c.env.DB.prepare(
    "SELECT * FROM dead_letter_queue WHERE id = ?",
  )
    .bind(id)
    .first();
  if (!entry) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Dead letter entry not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }
  return c.json({
    status: "success",
    data: entry,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/dead-letter/:id/replay — replay a dead letter entry
deadLetterRoutes.post("/:id/replay", requireRole("admin"), async (c) => {
  const { id } = c.req.param();
  const orchestratorUrl = c.req.url.split("/api/v1/dead-letter")[0]; // self-reference

  const result = await replayDeadLetter(c.env.DB, id, orchestratorUrl);

  if (!result.success) {
    return c.json(
      {
        status: "error",
        code: "REPLAY_FAILED",
        message: result.error ?? "Replay failed",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  return c.json({
    status: "success",
    data: { id, replayed: true },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/dead-letter/replay-all — replay all unreplayed entries
deadLetterRoutes.post("/replay-all", requireRole("admin"), async (c) => {
  const tenantId = c.req.query("tenantId");
  const conditions: string[] = ["replay_status IS NULL"];
  const params: unknown[] = [];
  if (tenantId) {
    conditions.push("tenant_id = ?");
    params.push(tenantId);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const entries = await c.env.DB.prepare(
    `SELECT id FROM dead_letter_queue ${where} LIMIT 100`,
  )
    .bind(...params)
    .all();

  const orchestratorUrl = c.req.url.split("/api/v1/dead-letter")[0];
  let replayed = 0;
  let failed = 0;

  for (const entry of entries.results) {
    const result = await replayDeadLetter(
      c.env.DB,
      entry.id as string,
      orchestratorUrl,
    );
    if (result.success) replayed++;
    else failed++;
  }

  return c.json({
    status: "success",
    data: { total: entries.results.length, replayed, failed },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
