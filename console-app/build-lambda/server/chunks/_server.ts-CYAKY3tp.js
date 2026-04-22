import { json } from '@sveltejs/kit';
import { l as listRules } from './automation-pg-BL11rGe-.js';
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

const GET = async ({ locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const rules = await listRules(tenantId);
  const frameworkControls = /* @__PURE__ */ new Map();
  for (const rule of rules) {
    for (const action of rule.actions ?? []) {
      const controls = ACTION_COMPLIANCE_MAP[action.type] ?? [];
      for (const control of controls) {
        if (!frameworkControls.has(control.framework)) {
          frameworkControls.set(control.framework, /* @__PURE__ */ new Set());
        }
        frameworkControls.get(control.framework).add(control.controlId);
      }
    }
  }
  const frameworks = Array.from(frameworkControls.entries()).map(([framework, controlIds]) => ({
    framework,
    controlCount: controlIds.size,
    controlIds: Array.from(controlIds)
  }));
  const totalControls = frameworks.reduce((sum, f) => sum + f.controlCount, 0);
  return json({
    tenantId,
    ruleCount: rules.length,
    summary: {
      totalControls,
      frameworks
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-CYAKY3tp.js.map
