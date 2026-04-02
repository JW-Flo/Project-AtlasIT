import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { toCamel } from "$lib/utils/dto";

const VALID_RISK_TIERS = ["approved", "under_review", "blocked", "unknown"] as const;
type RiskTier = (typeof VALID_RISK_TIERS)[number];

/** GET /api/discovery/:id — app detail with OAuth grants per user */
export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database not available" }, { status: 503 });

  const app = await db
    .prepare(
      `SELECT id, tenant_id, app_name, category, provider, user_count, risk_tier,
              is_ai_tool, marketplace_match, first_seen_at, last_seen_at, status, metadata,
              created_at, updated_at
       FROM discovered_apps
       WHERE id = ? AND tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  if (!app) return json({ error: "app not found" }, { status: 404 });

  // Fetch OAuth grants for this app
  const grantsResult = await db
    .prepare(
      `SELECT id, user_email, scopes, granted_at, last_used_at, client_id, status, metadata, created_at
       FROM discovered_oauth_grants
       WHERE discovered_app_id = ? AND tenant_id = ?
       ORDER BY granted_at DESC`,
    )
    .bind(id, tenantId)
    .all();

  const grants = (grantsResult.results || []).map((g: any) => {
    const mapped = { ...g };
    if (typeof mapped.metadata === "string") {
      try {
        mapped.metadata = JSON.parse(mapped.metadata);
      } catch {
        /* keep as string */
      }
    }
    if (typeof mapped.scopes === "string") {
      try {
        mapped.scopesList = JSON.parse(mapped.scopes);
      } catch {
        mapped.scopesList = mapped.scopes.split(",").map((s: string) => s.trim());
      }
    }
    return mapped;
  });

  const appMapped = { ...app } as any;
  if (typeof appMapped.metadata === "string") {
    try {
      appMapped.metadata = JSON.parse(appMapped.metadata);
    } catch {
      /* keep */
    }
  }

  return json({ app: toCamel([appMapped])[0], grants: toCamel(grants) });
};

/** PATCH /api/discovery/:id — update risk tier */
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

/** POST /api/discovery/:id — governance playbook actions */
export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database not available" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const action = body.action as string;

  const app = await db
    .prepare("SELECT * FROM discovered_apps WHERE id = ? AND tenant_id = ?")
    .bind(id, tenantId)
    .first();

  if (!app) return json({ error: "app not found" }, { status: 404 });

  switch (action) {
    case "approve": {
      // Approve: set risk_tier to approved, optionally link to marketplace
      await db
        .prepare(
          `UPDATE discovered_apps SET risk_tier = 'approved', updated_at = datetime('now')
           WHERE id = ? AND tenant_id = ?`,
        )
        .bind(id, tenantId)
        .run();

      // Write audit log
      await db
        .prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
           VALUES (?, ?, 'discovery.app_approved', 'console', ?, ?, datetime('now'))`,
        )
        .bind(
          crypto.randomUUID().replace(/-/g, ""),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({ appId: id, appName: (app as any).app_name }),
        )
        .run();

      return json({ ok: true, action: "approve", riskTier: "approved" });
    }

    case "block": {
      // Block: set risk_tier to blocked, revoke all active grants
      await db
        .prepare(
          `UPDATE discovered_apps SET risk_tier = 'blocked', updated_at = datetime('now')
           WHERE id = ? AND tenant_id = ?`,
        )
        .bind(id, tenantId)
        .run();

      const revokeResult = await db
        .prepare(
          `UPDATE discovered_oauth_grants SET status = 'revoked'
           WHERE discovered_app_id = ? AND tenant_id = ? AND status = 'active'`,
        )
        .bind(id, tenantId)
        .run();

      // Create incident for blocked app
      const incidentId = crypto.randomUUID().replace(/-/g, "");
      await db
        .prepare(
          `INSERT INTO incidents (id, tenant_id, title, severity, status, source, source_id, description, created_at)
           VALUES (?, ?, ?, 'high', 'open', 'discovery', ?, ?, datetime('now'))`,
        )
        .bind(
          incidentId,
          tenantId,
          `Blocked shadow app: ${(app as any).app_name}`,
          id,
          `The discovered app "${(app as any).app_name}" has been blocked. ${revokeResult.meta?.changes ?? 0} OAuth grant(s) revoked.`,
        )
        .run();

      await db
        .prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
           VALUES (?, ?, 'discovery.app_blocked', 'console', ?, ?, datetime('now'))`,
        )
        .bind(
          crypto.randomUUID().replace(/-/g, ""),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({
            appId: id,
            appName: (app as any).app_name,
            grantsRevoked: revokeResult.meta?.changes ?? 0,
          }),
        )
        .run();

      return json({
        ok: true,
        action: "block",
        riskTier: "blocked",
        grantsRevoked: revokeResult.meta?.changes ?? 0,
        incidentId,
      });
    }

    case "review": {
      // Review: set to under_review, create an access review campaign
      await db
        .prepare(
          `UPDATE discovered_apps SET risk_tier = 'under_review', updated_at = datetime('now')
           WHERE id = ? AND tenant_id = ?`,
        )
        .bind(id, tenantId)
        .run();

      const campaignId = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      try {
        await db
          .prepare(
            `INSERT INTO access_review_campaigns (id, tenant_id, name, scope, status, expires_at, created_at)
             VALUES (?, ?, ?, ?, 'active', ?, datetime('now'))`,
          )
          .bind(
            campaignId,
            tenantId,
            `Review: ${(app as any).app_name} OAuth grants`,
            JSON.stringify({
              type: "discovery",
              discoveredAppId: id,
              appName: (app as any).app_name,
            }),
            expiresAt,
          )
          .run();
      } catch {
        // access_review_campaigns table may not exist — continue without campaign
      }

      await db
        .prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
           VALUES (?, ?, 'discovery.app_review_started', 'console', ?, ?, datetime('now'))`,
        )
        .bind(
          crypto.randomUUID().replace(/-/g, ""),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({
            appId: id,
            appName: (app as any).app_name,
            campaignId,
          }),
        )
        .run();

      return json({
        ok: true,
        action: "review",
        riskTier: "under_review",
        campaignId,
      });
    }

    default:
      return json(
        { error: `Unknown action: ${action}. Expected: approve, block, review` },
        { status: 400 },
      );
  }
};
