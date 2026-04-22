import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { d as deleteRule, e as getRule, u as updateRule } from './automation-pg-BL11rGe-.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { e as emitRuleComplianceEvidence } from './automation-evidence-CCVrLgoP.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';
import './gap-analyzer-CVZTZ0l9.js';

const GET = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const rule = await getRule(params.id, tenantId);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });
  return json({ rule });
};
const PATCH = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rule = await updateRule(params.id, tenantId, body);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });
  await writeAudit({
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.update",
    targetType: "automation_rule",
    targetId: params.id,
    detail: JSON.stringify(body)
  });
  const isEnabling = body.enabled === true || body.enabled === 1;
  const hasActions = body.actions?.length > 0;
  if (isEnabling || hasActions) {
    const ruleActions = body.actions ?? rule.actions ?? [];
    const parsedActions = typeof ruleActions === "string" ? JSON.parse(ruleActions) : ruleActions;
    if (parsedActions.length > 0) {
      await emitRuleComplianceEvidence(
        tenantId,
        params.id,
        rule.name ?? "",
        parsedActions,
        user.email
      );
    }
  }
  return json({ rule });
};
const DELETE = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const deleted = await deleteRule(params.id, tenantId);
  if (!deleted) return json({ error: "Rule not found" }, { status: 404 });
  await writeAudit({
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.delete",
    targetType: "automation_rule",
    targetId: params.id
  });
  return json({ ok: true });
};

export { DELETE, GET, PATCH };
//# sourceMappingURL=_server.ts-CAZaxG4T.js.map
