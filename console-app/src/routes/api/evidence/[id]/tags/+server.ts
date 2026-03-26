import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface Tag {
  id: string;
  tenant_id: string;
  evidence_id: string;
  tag: string;
  tag_type: string;
  color: string | null;
  created_by: string;
  created_at: string;
}

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const evidenceId = params.id!;

  const result = await db
    .prepare(
      `SELECT * FROM evidence_tags WHERE tenant_id = ? AND evidence_id = ? ORDER BY created_at DESC`,
    )
    .bind(tenantId, evidenceId)
    .all();

  return json({ tags: result.results ?? [] });
};

export const POST: RequestHandler = async ({
  params,
  request,
  locals,
  platform,
}) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tag, tagType = "label", color } = body ?? {};
  if (!tag || typeof tag !== "string" || tag.trim() === "") {
    return json({ error: "tag is required" }, { status: 400 });
  }

  const evidenceId = params.id!;
  const id = crypto.randomUUID();
  const createdBy = user.email ?? user.userId ?? "unknown";
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  try {
    await db
      .prepare(
        `INSERT INTO evidence_tags (id, tenant_id, evidence_id, tag, tag_type, color, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        tenantId,
        evidenceId,
        tag.trim(),
        tagType,
        color ?? null,
        createdBy,
        now,
      )
      .run();
  } catch (err: any) {
    if (err?.message?.includes("UNIQUE constraint failed")) {
      return json(
        { error: "Tag already exists on this evidence item" },
        { status: 409 },
      );
    }
    throw err;
  }

  const created: Tag = {
    id,
    tenant_id: tenantId,
    evidence_id: evidenceId,
    tag: tag.trim(),
    tag_type: tagType,
    color: color ?? null,
    created_by: createdBy,
    created_at: now,
  };

  return json({ tag: created }, { status: 201 });
};

export const DELETE: RequestHandler = async ({
  params,
  request,
  locals,
  platform,
}) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tagId } = body ?? {};
  if (!tagId || typeof tagId !== "string") {
    return json({ error: "tagId is required" }, { status: 400 });
  }

  const evidenceId = params.id!;

  const result = await db
    .prepare(
      `DELETE FROM evidence_tags WHERE id = ? AND tenant_id = ? AND evidence_id = ?`,
    )
    .bind(tagId, tenantId, evidenceId)
    .run();

  if (result.meta?.changes === 0) {
    return json({ error: "Tag not found" }, { status: 404 });
  }

  return json({ ok: true });
};
