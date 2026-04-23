import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { analyzeComplianceGaps } from "@atlasit/shared";
import { queryPg, queryPgOne } from "$lib/server/pg";

/**
 * GET /api/compliance-intelligence/gaps
 * Returns compliance gap analysis for the authenticated tenant.
 * Query params:
 *   - framework: filter by framework (e.g., "SOC2")
 *   - gapType: filter by gap type ("missing", "stale", "failing")
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  // Get tenant's selected frameworks
  const prefRow = await queryPgOne<{ value: string }>(
    "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = $2",
    [tenantId, "frameworks"],
  );

  let frameworks: string[];
  try {
    frameworks = prefRow?.value ? JSON.parse(prefRow.value) : ["SOC2"];
  } catch {
    frameworks = ["SOC2"];
  }

  // Apply framework filter if provided
  const frameworkFilter = url.searchParams.get("framework");
  if (frameworkFilter) {
    frameworks = frameworks.filter((f) => f === frameworkFilter);
  }

  // analyzeComplianceGaps needs a DB-like object, create adapter
  const dbAdapter = {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        first: async () => {
          const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
          return await queryPgOne(pgSql, params);
        },
        all: async () => {
          const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
          const results = await queryPg(pgSql, params);
          return { results };
        },
      }),
    }),
  } as any;

  const result = await analyzeComplianceGaps(dbAdapter, tenantId, frameworks);

  // Apply gapType filter if provided
  const gapTypeFilter = url.searchParams.get("gapType");
  if (gapTypeFilter) {
    result.gaps = result.gaps.filter((g) => g.gapType === gapTypeFilter);
  }

  return json(result);
};
