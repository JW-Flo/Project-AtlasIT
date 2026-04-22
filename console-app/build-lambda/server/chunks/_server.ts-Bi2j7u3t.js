import { json } from '@sveltejs/kit';

function getDb(platform) {
  const env = platform?.env || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}
const GET = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const { id } = params;
  try {
    const { results } = await db.prepare(
      "SELECT * FROM incident_timeline WHERE incident_id = ? AND tenant_id = ? ORDER BY created_at ASC"
    ).bind(id, tenantId).all();
    const items = (results ?? []).map((row) => ({
      id: row.id,
      entryType: row.entry_type,
      actorEmail: row.actor_email ?? null,
      content: row.content ?? null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at
    }));
    return json({ items });
  } catch (e) {
    if (e?.message?.includes("no such table")) {
      return json({ items: [] });
    }
    return json({ error: "Failed to load timeline" }, { status: 500 });
  }
};
const POST = async ({ params, request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const { id } = params;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const content = body?.content;
  if (!content || typeof content !== "string" || !content.trim()) {
    return json({ error: "Missing required field: content" }, { status: 400 });
  }
  const incident = await db.prepare("SELECT id FROM incidents WHERE id = ? AND tenant_id = ?").bind(id, tenantId).first();
  if (!incident) {
    return json({ error: "Incident not found" }, { status: 404 });
  }
  const timelineId = crypto.randomUUID().replace(/-/g, "");
  await db.prepare(
    `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
       VALUES (?, ?, ?, 'comment', ?, ?)`
  ).bind(timelineId, id, tenantId, user.email ?? "unknown", content.trim()).run();
  return json(
    {
      id: timelineId,
      entryType: "comment",
      actorEmail: user.email ?? "unknown",
      content: content.trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    { status: 201 }
  );
};

export { GET, POST };
//# sourceMappingURL=_server.ts-Bi2j7u3t.js.map
