import { json } from '@sveltejs/kit';

const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const { type } = body;
  if (!type) return json({ error: "type is required" }, { status: 400 });
  try {
    const existing = await db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'dismissed_review_suggestions'`
    ).bind(user.tenantId).first();
    let dismissed = [];
    try {
      if (existing?.value) dismissed = JSON.parse(existing.value);
    } catch {
    }
    if (!dismissed.includes(type)) {
      dismissed.push(type);
    }
    await db.batch([
      db.prepare("DELETE FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(user.tenantId, "dismissed_review_suggestions"),
      db.prepare("INSERT INTO tenant_preferences (tenant_id, key, value) VALUES (?, ?, ?)").bind(user.tenantId, "dismissed_review_suggestions", JSON.stringify(dismissed))
    ]);
    return json({ success: true });
  } catch (e) {
    console.error("Dismiss review suggestion error:", e);
    return json({ error: "Failed to dismiss suggestion" }, { status: 500 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-DnulMFLD.js.map
