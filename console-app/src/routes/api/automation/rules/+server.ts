import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { listRules, createRule } from "$lib/server/automation";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ rules: [] });

  const rules = await listRules(db, tenantId);
  return json({ rules });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
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

  const { name, triggerType, triggerConfig, conditions, actions, description } =
    body;
  if (!name || !triggerType || !actions?.length) {
    return json(
      { error: "name, triggerType, and actions are required" },
      { status: 400 },
    );
  }

  const rule = await createRule(
    db,
    tenantId,
    {
      name,
      description,
      triggerType,
      triggerConfig: triggerConfig ?? {},
      conditions,
      actions,
    },
    user.email,
  );

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.create",
    targetType: "automation_rule",
    targetId: rule.id,
    detail: JSON.stringify({ name, triggerType }),
  });

  return json({ rule }, { status: 201 });
};
