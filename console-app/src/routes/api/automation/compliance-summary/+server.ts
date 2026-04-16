import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listRules } from "$lib/server/automation-pg";
import { ACTION_COMPLIANCE_MAP } from "@atlasit/shared";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const rules = await listRules(tenantId);

  // Aggregate unique controls per framework across all rules
  const frameworkControls = new Map<string, Set<string>>();

  for (const rule of rules) {
    for (const action of rule.actions ?? []) {
      const controls = ACTION_COMPLIANCE_MAP[action.type] ?? [];
      for (const control of controls) {
        if (!frameworkControls.has(control.framework)) {
          frameworkControls.set(control.framework, new Set());
        }
        frameworkControls.get(control.framework)!.add(control.controlId);
      }
    }
  }

  const frameworks = Array.from(frameworkControls.entries()).map(([framework, controlIds]) => ({
    framework,
    controlCount: controlIds.size,
    controlIds: Array.from(controlIds),
  }));

  const totalControls = frameworks.reduce((sum, f) => sum + f.controlCount, 0);

  return json({
    tenantId,
    ruleCount: rules.length,
    summary: {
      totalControls,
      frameworks,
    },
  });
};
