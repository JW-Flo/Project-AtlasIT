/**
 * Server-Sent Events (SSE) endpoints for real-time platform data.
 *
 * GET /api/v1/stream                  — activity_stream polling SSE
 * GET /api/v1/stream/evidence         — compliance_evidence polling SSE
 * GET /api/v1/stream/recent           — latest activity (non-SSE)
 * GET /api/v1/stream/workflow/:id     — workflow step status (non-SSE)
 *
 * The evidence endpoint uses a single-shot polling-to-SSE bridge:
 * the client connects, receives all events since the cursor, and the
 * connection closes. The `retry` directive tells the browser to
 * reconnect automatically every 5 s, passing the last event ID as
 * a cursor via the Last-Event-ID header.
 */

import { Hono } from "hono";
import type { AppEnv } from "../types";

export const streamRoutes = new Hono<AppEnv>();

// ── Evidence SSE types ───────────────────────────────────────────────────────

interface EvidenceRow {
  id: string;
  tenant_id: string;
  framework_id: string | null;
  framework: string | null;
  control_id: string;
  control_name: string | null;
  evidence_type: string | null;
  source: string;
  source_id: string | null;
  actor: string | null;
  subject: string | null;
  data: string | null;
  metadata: string | null;
  collected_at: string | null;
  created_at: string;
}

/**
 * GET /api/v1/stream/evidence
 *
 * Single-shot polling-to-SSE bridge for compliance evidence events.
 * Queries compliance_evidence WHERE tenant_id = ? AND created_at > ?
 * ordered ASC, emits each row as an `evidence` SSE event, then closes.
 *
 * Query params:
 *   since — ISO timestamp cursor (optional; overridden by Last-Event-ID header)
 *
 * Headers:
 *   Last-Event-ID — browser sends this automatically on reconnect
 *
 * The `retry: 5000` field instructs the browser to reconnect every 5 s.
 * The `id:` field on the last event is used as Last-Event-ID on reconnect.
 */
streamRoutes.get("/evidence", async (c) => {
  const tenantId = c.get("tenantId") ?? c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "tenantId required" }, 400);
  }

  // Cursor precedence: Last-Event-ID header > ?since param > epoch
  const EPOCH = "1970-01-01T00:00:00.000Z";
  const cursor =
    c.req.header("Last-Event-ID") ??
    c.req.query("since") ??
    EPOCH;

  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;

  const { results } = await db
    .prepare(
      `SELECT * FROM compliance_evidence
       WHERE tenant_id = ? AND created_at > ?
       ORDER BY created_at ASC
       LIMIT 50`,
    )
    .bind(tenantId, cursor)
    .all<EvidenceRow>();

  const rows = results ?? [];

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];

  // retry directive — browser reconnects every 5 s
  chunks.push(encoder.encode("retry: 5000\n\n"));

  if (rows.length === 0) {
    chunks.push(
      encoder.encode(
        `event: no-events\ndata: ${JSON.stringify({ cursor, tenantId })}\n\n`,
      ),
    );
  } else {
    for (const row of rows) {
      const payload = {
        id: row.id,
        tenantId: row.tenant_id,
        framework: row.framework ?? row.framework_id ?? null,
        controlId: row.control_id,
        controlName: row.control_name,
        evidenceType: row.evidence_type,
        source: row.source,
        sourceId: row.source_id,
        actor: row.actor,
        subject: row.subject,
        metadata: safeJsonParse(row.metadata ?? row.data),
        collectedAt: row.collected_at,
        createdAt: row.created_at,
      };
      chunks.push(
        encoder.encode(
          `event: evidence\ndata: ${JSON.stringify(payload)}\n\n`,
        ),
      );
    }

    // Set Last-Event-ID to the last row's created_at so browsers replay correctly
    const lastCreatedAt = rows[rows.length - 1].created_at;
    chunks.push(encoder.encode(`id: ${lastCreatedAt}\n\n`));
  }

  // Concatenate all chunks into a single Uint8Array
  const totalLength = chunks.reduce((n, c) => n + c.length, 0);
  const body = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "X-Accel-Buffering": "no",
      // CORS — allow the console app and local dev
      "Access-Control-Allow-Origin": "https://console.atlasit.pro",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-API-Key, X-Tenant-ID, Last-Event-ID",
    },
  });
});

// ── Activity stream types ────────────────────────────────────────────────────

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
