import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { e as getRule, c as createRule } from './automation-pg-BL11rGe-.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
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

const POST = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const original = await getRule(params.id, tenantId);
  if (!original) return json({ error: "Rule not found" }, { status: 404 });
  const newRule = await createRule(tenantId, user.email, {
    name: `${original.name} (copy)`,
    description: original.description,
    triggerType: original.triggerType,
    triggerConfig: original.triggerConfig,
    conditions: original.conditions,
    actions: original.actions
  });
  await writeAudit({
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "automation_rule.duplicate",
    targetType: "automation_rule",
    targetId: newRule.id,
    detail: JSON.stringify({ originalId: params.id })
  });
  return json({ rule: newRule }, { status: 201 });
};

export { POST };
//# sourceMappingURL=_server.ts-DfDeYmeC.js.map
