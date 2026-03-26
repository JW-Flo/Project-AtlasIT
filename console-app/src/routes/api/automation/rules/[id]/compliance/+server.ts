import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getRule } from "$lib/server/automation";
import { ACTION_COMPLIANCE_MAP } from "@atlasit/shared";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const rule = await getRule(db, tenantId, params.id!);
  if (!rule) return json({ error: "Rule not found" }, { status: 404 });

  const actions = (rule.actions ?? []).map((action: any) => ({
    type: action.type,
    controls: ACTION_COMPLIANCE_MAP[action.type] ?? [],
  }));

  const seenControls = new Set<string>();
  const frameworks = new Set<string>();
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
      frameworks: Array.from(frameworks),
    },
  });
};
