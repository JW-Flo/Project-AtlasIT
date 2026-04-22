import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { l as listRules, c as createRule } from './automation-pg-BL11rGe-.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import { e as emitRuleComplianceEvidence } from './automation-evidence-CCVrLgoP.js';
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

const GET = async ({ locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const rules = await listRules(tenantId);
  return json({ rules });
};
const POST = async ({ request, locals }) => {
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
    actions
  });
  await emitRuleComplianceEvidence(tenantId, rule.id, name, actions, user.email);
  return json({ rule }, { status: 201 });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-CW5O-RH8.js.map
