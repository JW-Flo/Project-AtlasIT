import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";

const VALID_RISK_TIERS = ["approved", "under_review", "blocked", "unknown"] as const;
type RiskTier = typeof VALID_RISK_TIERS[number];

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const riskTier = body.riskTier as RiskTier | undefined;

  if (!riskTier || !VALID_RISK_TIERS.includes(riskTier)) {
    return json(
      { error: `riskTier must be one of: ${VALID_RISK_TIERS.join(", ")}` },
      { status: 400 },
    );
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database not available" }, { status: 503 });

  const result = await db
    .prepare(
      `UPDATE discovered_apps
       SET risk_tier = ?, updated_at = datetime('now')
       WHERE id = ? AND tenant_id = ?`,
    )
    .bind(riskTier, id, tenantId)
    .run();

  if (!result.meta?.changes || result.meta.changes === 0) {
    return json({ error: "app not found" }, { status: 404 });
  }

  return json({ ok: true, id, riskTier });
};
