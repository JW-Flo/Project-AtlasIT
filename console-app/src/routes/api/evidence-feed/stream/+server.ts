import type { RequestHandler } from "@sveltejs/kit";

/**
 * GET /api/evidence-feed/stream?since=<ISO>
 *
 * SSE endpoint for real-time evidence updates. Polls D1 every request;
 * the browser auto-reconnects via `retry: 5000` directive.
 * Uses single-shot pattern (same as orchestrator /api/v1/stream/evidence).
 */
export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB ?? env.DB;
  if (!db) {
    return new Response("event: error\ndata: DB unavailable\n\n", {
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  }

  // Cursor: Last-Event-ID header > ?since param > 24h ago
  const defaultSince = new Date(Date.now() - 86400000).toISOString();
  const cursor = url.searchParams.get("since") ?? defaultSince;

  const { results } = await db
    .prepare(
      `SELECT id, framework, control_id, impact, event_type, source, actor, created_at
       FROM compliance_evidence
       WHERE tenant_id = ? AND created_at > ?
       ORDER BY created_at ASC
       LIMIT 50`,
    )
    .bind(user.tenantId, cursor)
    .all();

  const rows = (results ?? []) as any[];
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];

  // Retry directive: browser reconnects every 5s
  chunks.push(encoder.encode("retry: 5000\n\n"));

  if (rows.length === 0) {
    chunks.push(encoder.encode(`event: no-events\ndata: ${JSON.stringify({ cursor })}\n\n`));
  } else {
    for (const row of rows) {
      const payload = {
        id: row.id,
        framework: row.framework ?? "",
        controlId: row.control_id,
        impact: row.impact ?? "neutral",
        eventType: row.event_type ?? "",
        source: row.source ?? "",
        actor: row.actor ?? "",
        createdAt: row.created_at,
      };
      chunks.push(encoder.encode(`event: evidence\ndata: ${JSON.stringify(payload)}\n\n`));
    }
    const lastCreatedAt = rows[rows.length - 1].created_at;
    chunks.push(encoder.encode(`id: ${lastCreatedAt}\n\n`));
  }

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
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
