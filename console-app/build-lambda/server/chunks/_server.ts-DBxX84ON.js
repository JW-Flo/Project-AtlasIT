import { json } from '@sveltejs/kit';

const GET = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const evidenceId = params.id;
  const result = await db.prepare(
    `SELECT * FROM evidence_tags WHERE tenant_id = ? AND evidence_id = ? ORDER BY created_at DESC`
  ).bind(tenantId, evidenceId).all();
  return json({ tags: result.results ?? [] });
};
const POST = async ({
  params,
  request,
  locals,
  platform
}) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { tag, tagType = "label", color } = body ?? {};
  if (!tag || typeof tag !== "string" || tag.trim() === "") {
    return json({ error: "tag is required" }, { status: 400 });
  }
  const evidenceId = params.id;
  const id = crypto.randomUUID();
  const createdBy = user.email ?? user.userId ?? "unknown";
  const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
  try {
    await db.prepare(
      `INSERT INTO evidence_tags (id, tenant_id, evidence_id, tag, tag_type, color, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      tenantId,
      evidenceId,
      tag.trim(),
      tagType,
      color ?? null,
      createdBy,
      now
    ).run();
  } catch (err) {
    if (err?.message?.includes("UNIQUE constraint failed")) {
      return json(
        { error: "Tag already exists on this evidence item" },
        { status: 409 }
      );
    }
    throw err;
  }
  const created = {
    id,
    tenant_id: tenantId,
    evidence_id: evidenceId,
    tag: tag.trim(),
    tag_type: tagType,
    color: color ?? null,
    created_by: createdBy,
    created_at: now
  };
  return json({ tag: created }, { status: 201 });
};
const DELETE = async ({
  params,
  request,
  locals,
  platform
}) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { tagId } = body ?? {};
  if (!tagId || typeof tagId !== "string") {
    return json({ error: "tagId is required" }, { status: 400 });
  }
  const evidenceId = params.id;
  const result = await db.prepare(
    `DELETE FROM evidence_tags WHERE id = ? AND tenant_id = ? AND evidence_id = ?`
  ).bind(tagId, tenantId, evidenceId).run();
  if (result.meta?.changes === 0) {
    return json({ error: "Tag not found" }, { status: 404 });
  }
  return json({ ok: true });
};

export { DELETE, GET, POST };
//# sourceMappingURL=_server.ts-DBxX84ON.js.map
