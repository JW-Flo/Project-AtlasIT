import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { getRule, updateRule, deleteRule } from "$lib/server/automation";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const rule = await getRule(db, tenantId, params.id!);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });

  return json({ rule });
};

export const PATCH: RequestHandler = async ({
  params,
  request,
  locals,
  platform,
}) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rule = await updateRule(db, tenantId, params.id!, body);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.update",
    targetType: "automation_rule",
    targetId: params.id!,
    detail: JSON.stringify(body),
  });

  return json({ rule });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const deleted = await deleteRule(db, tenantId, params.id!);
  if (!deleted) return json({ error: "Rule not found" }, { status: 404 });

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.delete",
    targetType: "automation_rule",
    targetId: params.id!,
  });

  return json({ ok: true });
};
