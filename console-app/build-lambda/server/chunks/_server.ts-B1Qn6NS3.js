const GET = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB ?? env.DB;
  if (!db) {
    return new Response("event: error\ndata: DB unavailable\n\n", {
      headers: { "Content-Type": "text/event-stream; charset=utf-8" }
    });
  }
  const defaultSince = new Date(Date.now() - 864e5).toISOString();
  const cursor = url.searchParams.get("since") ?? defaultSince;
  const { results } = await db.prepare(
    `SELECT id, framework, control_id, impact, event_type, source, actor, created_at
       FROM compliance_evidence
       WHERE tenant_id = ? AND created_at > ?
       ORDER BY created_at ASC
       LIMIT 50`
  ).bind(user.tenantId, cursor).all();
  const rows = results ?? [];
  const encoder = new TextEncoder();
  const chunks = [];
  chunks.push(encoder.encode("retry: 5000\n\n"));
  if (rows.length === 0) {
    chunks.push(encoder.encode(`event: no-events
data: ${JSON.stringify({ cursor })}

`));
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
        createdAt: row.created_at
      };
      chunks.push(encoder.encode(`event: evidence
data: ${JSON.stringify(payload)}

`));
    }
    const lastCreatedAt = rows[rows.length - 1].created_at;
    chunks.push(encoder.encode(`id: ${lastCreatedAt}

`));
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
      "X-Accel-Buffering": "no"
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-B1Qn6NS3.js.map
