import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { getRule, updateRule, deleteRule } from "$lib/server/automation-pg";
import { writeAudit } from "$lib/server/audit";
import { emitRuleComplianceEvidence } from "$lib/server/automation-evidence";

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const rule = await getRule(params.id!, tenantId);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });

  return json({ rule });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rule = await updateRule(params.id!, tenantId, body);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });

  await writeAudit({
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.update",
    targetType: "automation_rule",
    targetId: params.id!,
    detail: JSON.stringify(body),
  });

  // When a rule is enabled or actions are updated, emit compliance evidence
  const isEnabling = body.enabled === true || body.enabled === 1;
  const hasActions = body.actions?.length > 0;
  if (isEnabling || hasActions) {
    const ruleActions = body.actions ?? (rule as any).actions ?? [];
    const parsedActions = typeof ruleActions === "string" ? JSON.parse(ruleActions) : ruleActions;
    if (parsedActions.length > 0) {
      await emitRuleComplianceEvidence(
        tenantId,
        params.id!,
        (rule as any).name ?? "",
        parsedActions,
        user.email,
      );
    }
  }

  return json({ rule });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const deleted = await deleteRule(params.id!, tenantId);
  if (!deleted) return json({ error: "Rule not found" }, { status: 404 });

  await writeAudit({
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.delete",
    targetType: "automation_rule",
    targetId: params.id!,
  });

  return json({ ok: true });
};
