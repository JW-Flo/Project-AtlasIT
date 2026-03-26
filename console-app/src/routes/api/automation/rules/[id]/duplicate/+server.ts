import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { getRule, createRule } from "$lib/server/automation";
import { writeAudit } from "$lib/server/audit";

export const POST: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const original = await getRule(db, tenantId, params.id!);
  if (!original) return json({ error: "Rule not found" }, { status: 404 });

  const newRule = await createRule(
    db,
    tenantId,
    {
      name: `${original.name} (copy)`,
      description: original.description,
      triggerType: original.triggerType,
      triggerConfig: original.triggerConfig,
      conditions: original.conditions,
      actions: original.actions,
    },
    user.email,
  );

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.duplicate",
    targetType: "automation_rule",
    targetId: newRule.id,
    detail: JSON.stringify({ originalId: params.id }),
  });

  return json({ rule: newRule }, { status: 201 });
};
