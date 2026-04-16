import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { getRule, createRule } from "$lib/server/automation-pg";
import { writeAudit } from "$lib/server/audit";

export const POST: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const original = await getRule(params.id!, tenantId);
  if (!original) return json({ error: "Rule not found" }, { status: 404 });

  const newRule = await createRule(tenantId, user.email, {
    name: `${original.name} (copy)`,
    description: original.description,
    triggerType: original.triggerType,
    triggerConfig: original.triggerConfig,
    conditions: original.conditions,
    actions: original.actions,
  });

  await writeAudit({
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
