import { json } from '@sveltejs/kit';
import { e as getRule } from './automation-pg-BL11rGe-.js';
import { A as ACTION_COMPLIANCE_MAP } from './gap-analyzer-CVZTZ0l9.js';
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

const GET = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const rule = await getRule(params.id, tenantId);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });
  const actions = (rule.actions ?? []).map((action) => ({
    type: action.type,
    controls: ACTION_COMPLIANCE_MAP[action.type] ?? []
  }));
  const seenControls = /* @__PURE__ */ new Set();
  const frameworks = /* @__PURE__ */ new Set();
  let totalControls = 0;
  for (const action of actions) {
    for (const control of action.controls) {
      const key = `${control.framework}:${control.controlId}`;
      if (!seenControls.has(key)) {
        seenControls.add(key);
        totalControls++;
        frameworks.add(control.framework);
      }
    }
  }
  return json({
    ruleName: rule.name,
    actions,
    summary: {
      totalControls,
      frameworks: Array.from(frameworks)
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-CAR5zt_u.js.map
