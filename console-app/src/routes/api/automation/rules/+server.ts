import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { listRules, createRule } from "$lib/server/automation-pg";
import { writeAudit } from "$lib/server/audit";
import { emitRuleComplianceEvidence } from "$lib/server/automation-evidence";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const rules = await listRules(tenantId);
  return json({ rules });
};

export const POST: RequestHandler = async ({ request, locals }) => {
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

  const { name, triggerType, triggerConfig, conditions, actions, description } = body;
  if (!name || !triggerType || !actions?.length) {
    return json({ error: "name, triggerType, and actions are required" }, { status: 400 });
  }

  const rule = await createRule(tenantId, user.email, {
    name,
    description,
    triggerType,
    triggerConfig: triggerConfig ?? {},
    conditions,
    actions,
  });

  // Emit compliance evidence for each action type in the new rule
  await emitRuleComplianceEvidence(tenantId, rule.id, name, actions, user.email);

  return json({ rule }, { status: 201 });
};
