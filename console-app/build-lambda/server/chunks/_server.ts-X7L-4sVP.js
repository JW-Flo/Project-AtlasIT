import { json } from '@sveltejs/kit';
import { a as analyzeComplianceGaps } from './gap-analyzer-CVZTZ0l9.js';

const GET = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const prefRow = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'").bind(tenantId).first();
  let frameworks;
  try {
    frameworks = prefRow?.value ? JSON.parse(prefRow.value) : ["SOC2"];
  } catch {
    frameworks = ["SOC2"];
  }
  const frameworkFilter = url.searchParams.get("framework");
  if (frameworkFilter) {
    frameworks = frameworks.filter((f) => f === frameworkFilter);
  }
  const result = await analyzeComplianceGaps(db, tenantId, frameworks);
  const gapTypeFilter = url.searchParams.get("gapType");
  if (gapTypeFilter) {
    result.gaps = result.gaps.filter((g) => g.gapType === gapTypeFilter);
  }
  return json(result);
};

export { GET };
//# sourceMappingURL=_server.ts-X7L-4sVP.js.map
