/**
 * Server-Sent Events (SSE) endpoint for real-time automation activity.
 *
 * GET /api/v1/stream?tenantId=<id>
 *
 * Streams events from the activity_stream table as they are inserted.
 * Uses polling with a cursor (last seen ID) — Cloudflare Workers don't
 * support long-lived connections natively, so we use a ReadableStream
 * with periodic flushes.
 */

import { Hono } from "hono";
import type { AppEnv } from "../types";

export const streamRoutes = new Hono<AppEnv>();

interface ActivityRow {
  id: number;
  tenant_id: string;
  event_type: string;
  title: string;
  detail: string | null;
  severity: string;
  entity_type: string | null;
  entity_id: string | null;
  actor: string | null;
  metadata: string | null;
  created_at: string;
}

/**
 * SSE endpoint. Streams activity_stream rows for a tenant.
 *
 * Query params:
 *   tenantId  — required
 *   cursor    — last seen activity ID (for resumption)
 *   types     — comma-separated event_type filter (optional)
 */
streamRoutes.get("/", async (c) => {
  const tenantId = c.req.query("tenantId") ?? c.get("tenantId");
  if (!tenantId) {
    return c.json({ error: "tenantId required" }, 400);
  }

  const cursor = parseInt(c.req.query("cursor") ?? "0", 10) || 0;
  const types = c.req.query("types")?.split(",").filter(Boolean);
  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;

  let lastId = cursor;
  let alive = true;
  const pollIntervalMs = 1000;
  const maxDurationMs = 55_000; // Stay under CF's 60s limit
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      // Send initial keepalive
      send("connected", {
        tenantId,
        cursor: lastId,
        timestamp: new Date().toISOString(),
      });

      while (alive && Date.now() - startTime < maxDurationMs) {
        try {
          const rows = await pollActivity(db, tenantId, lastId, types);

          for (const row of rows) {
            send("activity", {
              id: row.id,
              eventType: row.event_type,
              title: row.title,
              detail: row.detail,
              severity: row.severity,
              entityType: row.entity_type,
              entityId: row.entity_id,
              actor: row.actor,
              metadata: safeJsonParse(row.metadata),
              createdAt: row.created_at,
            });
            lastId = row.id;
          }

          // Keepalive every poll
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          // DB error — send error event and continue
          send("error", { message: "Poll failed, retrying" });
        }

        // Wait before next poll
        await sleep(pollIntervalMs);
      }

      // Clean close
      send("timeout", { lastId, message: "Reconnect with cursor=" + lastId });
      controller.close();
    },
    cancel() {
      alive = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});

/**
 * GET /api/v1/stream/recent — fetch latest activity (non-SSE, for initial page load)
 */
streamRoutes.get("/recent", async (c) => {
  const tenantId = c.req.query("tenantId") ?? c.get("tenantId");
  if (!tenantId) return c.json({ error: "tenantId required" }, 400);

  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;

  const { results } = await db
    .prepare(
      `SELECT * FROM activity_stream
       WHERE tenant_id = ?
       ORDER BY id DESC
       LIMIT ?`,
    )
    .bind(tenantId, limit)
    .all<ActivityRow>();

  return c.json({
    status: "success",
    data: (results ?? []).map((row) => ({
      id: row.id,
      eventType: row.event_type,
      title: row.title,
      detail: row.detail,
      severity: row.severity,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actor: row.actor,
      metadata: safeJsonParse(row.metadata),
      createdAt: row.created_at,
    })),
    correlationId: c.get("correlationId"),
  });
});

/**
 * GET /api/v1/stream/workflow/:id — live workflow step status
 */
streamRoutes.get("/workflow/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const doId = c.env.WORKFLOW.idFromName(id);
    const stub = c.env.WORKFLOW.get(doId);
    const res = await stub.fetch(new Request("http://workflow/status"));

    if (!res.ok) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    const state = await res.json();

    // Also fetch run record from D1
    const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;
    const run = await db
      .prepare("SELECT * FROM workflow_runs WHERE id = ?")
      .bind(id)
      .first();

    return c.json({
      status: "success",
      data: {
        ...(state as Record<string, unknown>),
        run: run ?? null,
      },
      correlationId: c.get("correlationId"),
    });
  } catch {
    return c.json({ error: "Failed to fetch workflow status" }, 500);
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────

async function pollActivity(
  db: D1Database,
  tenantId: string,
  afterId: number,
  types?: string[],
): Promise<ActivityRow[]> {
  let query = `SELECT * FROM activity_stream WHERE tenant_id = ? AND id > ?`;
  const params: unknown[] = [tenantId, afterId];

  if (types && types.length > 0) {
    const placeholders = types.map(() => "?").join(",");
    query += ` AND event_type IN (${placeholders})`;
    params.push(...types);
  }

  query += " ORDER BY id ASC LIMIT 50";

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all<ActivityRow>();
  return results ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonParse(val: string | null | undefined): unknown {
  if (!val) return {};
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
}
