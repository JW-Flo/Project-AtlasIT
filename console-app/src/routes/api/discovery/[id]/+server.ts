import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { toCamel } from "$lib/utils/dto";
import { queryPg, queryPgOne } from "$lib/server/pg";

const VALID_RISK_TIERS = ["approved", "under_review", "blocked", "unknown"] as const;
type RiskTier = (typeof VALID_RISK_TIERS)[number];

/** GET /api/discovery/:id — app detail with OAuth grants per user */
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  try {
    const app = await queryPgOne<any>(
      `SELECT id, tenant_id, app_name, category, provider, user_count, risk_tier,
              is_ai_tool, marketplace_match, first_seen_at, last_seen_at, status, metadata,
              created_at, updated_at
       FROM discovered_apps
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    if (!app) return json({ error: "app not found" }, { status: 404 });

    // Fetch OAuth grants for this app
    const grants = await queryPg<any>(
      `SELECT id, user_email, scopes, granted_at, last_used_at, client_id, status, metadata, created_at
       FROM discovered_oauth_grants
       WHERE discovered_app_id = $1 AND tenant_id = $2
       ORDER BY granted_at DESC`,
      [id, tenantId],
    );

    const grantsMapped = grants.map((g: any) => {
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

    return json({ app: toCamel([appMapped])[0], grants: toCamel(grantsMapped) });
  } catch (err: any) {
    console.error("Discovery app detail error:", err);
    return json({ error: "Failed to load app details" }, { status: 500 });
  }
};

/** PATCH /api/discovery/:id — update risk tier */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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

  const result = await queryPg(
    `UPDATE discovered_apps
     SET risk_tier = $1, updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3`,
    [riskTier, id, tenantId],
  );

  if (result.length === 0) {
    return json({ error: "app not found" }, { status: 404 });
  }

  return json({ ok: true, id, riskTier });
};

/** POST /api/discovery/:id — governance playbook actions */
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const action = body.action as string;
  const VALID_ACTIONS = ["approve", "block", "review"] as const;

  if (!action || !VALID_ACTIONS.includes(action as any)) {
    return json({ error: "action must be one of: approve, block, review" }, { status: 400 });
  }

  const app = await queryPgOne<any>(
    "SELECT * FROM discovered_apps WHERE id = $1 AND tenant_id = $2",
    [id, tenantId],
  );

  if (!app) return json({ error: "app not found" }, { status: 404 });

  switch (action) {
    case "approve": {
      // Approve: set risk_tier to approved
      await queryPg(
        `UPDATE discovered_apps SET risk_tier = 'approved', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );

      // Write audit log
      await queryPg(
        `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
         VALUES ($1, $2, 'discovery.app_approved', 'console', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({ appId: id, appName: app.app_name }),
        ],
      );

      return json({ ok: true, action: "approve", riskTier: "approved" });
    }

    case "block": {
      // Block: set risk_tier to blocked, revoke all active grants
      await queryPg(
        `UPDATE discovered_apps SET risk_tier = 'blocked', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );

      const revokedGrants = await queryPg(
        `UPDATE discovered_oauth_grants SET status = 'revoked'
         WHERE discovered_app_id = $1 AND tenant_id = $2 AND status = 'active'
         RETURNING id`,
        [id, tenantId],
      );
      const grantsRevoked = revokedGrants.length;

      // Create incident for blocked app
      const incidentId = crypto.randomUUID();
      await queryPg(
        `INSERT INTO incidents (id, tenant_id, title, severity, status, source, source_id, description, created_at)
         VALUES ($1, $2, $3, 'high', 'open', 'discovery', $4, $5, NOW())`,
        [
          incidentId,
          tenantId,
          `Blocked shadow app: ${app.app_name}`,
          id,
          `The discovered app "${app.app_name}" has been blocked. ${grantsRevoked} OAuth grant(s) revoked.`,
        ],
      );

      await queryPg(
        `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
         VALUES ($1, $2, 'discovery.app_blocked', 'console', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({ appId: id, appName: app.app_name, grantsRevoked }),
        ],
      );

      return json({
        ok: true,
        action: "block",
        riskTier: "blocked",
        grantsRevoked,
        incidentId,
      });
    }

    case "review": {
      // Review: set to under_review, create an access review campaign
      await queryPg(
        `UPDATE discovered_apps SET risk_tier = 'under_review', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );

      const campaignId = crypto.randomUUID();
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      try {
        await queryPg(
          `INSERT INTO access_review_campaigns (id, tenant_id, name, scope, status, due_date, created_at)
           VALUES ($1, $2, $3, $4, 'active', $5, NOW())`,
          [
            campaignId,
            tenantId,
            `Review: ${app.app_name} OAuth grants`,
            JSON.stringify({
              type: "discovery",
              discoveredAppId: id,
              appName: app.app_name,
            }),
            dueDate,
          ],
        );
      } catch {
        // Continue without campaign if table doesn't exist
      }

      await queryPg(
        `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
         VALUES ($1, $2, 'discovery.app_review_started', 'console', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({ appId: id, appName: app.app_name, campaignId }),
        ],
      );

      return json({
        ok: true,
        action: "review",
        riskTier: "under_review",
        campaignId,
      });
    }

    default:
      // Unreachable — validated above, but satisfies exhaustiveness
      return json({ error: "invalid action" }, { status: 400 });
  }
};
