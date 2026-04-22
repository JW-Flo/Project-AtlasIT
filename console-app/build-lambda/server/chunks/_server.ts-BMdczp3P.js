import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { t as toCamel } from './dto-qzAL3BiV.js';
import { queryPgOne, queryPg } from './pg-BHX2Ay11.js';
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

const VALID_RISK_TIERS = ["approved", "under_review", "blocked", "unknown"];
const GET = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });
  try {
    const app = await queryPgOne(
      `SELECT id, tenant_id, app_name, category, provider, user_count, risk_tier,
              is_ai_tool, marketplace_match, first_seen_at, last_seen_at, status, metadata,
              created_at, updated_at
       FROM discovered_apps
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (!app) return json({ error: "app not found" }, { status: 404 });
    const grants = await queryPg(
      `SELECT id, user_email, scopes, granted_at, last_used_at, client_id, status, metadata, created_at
       FROM discovered_oauth_grants
       WHERE discovered_app_id = $1 AND tenant_id = $2
       ORDER BY granted_at DESC`,
      [id, tenantId]
    );
    const grantsMapped = grants.map((g) => {
      const mapped = { ...g };
      if (typeof mapped.metadata === "string") {
        try {
          mapped.metadata = JSON.parse(mapped.metadata);
        } catch {
        }
      }
      if (typeof mapped.scopes === "string") {
        try {
          mapped.scopesList = JSON.parse(mapped.scopes);
        } catch {
          mapped.scopesList = mapped.scopes.split(",").map((s) => s.trim());
        }
      }
      return mapped;
    });
    const appMapped = { ...app };
    if (typeof appMapped.metadata === "string") {
      try {
        appMapped.metadata = JSON.parse(appMapped.metadata);
      } catch {
      }
    }
    return json({ app: toCamel([appMapped])[0], grants: toCamel(grantsMapped) });
  } catch (err) {
    console.error("Discovery app detail error:", err);
    return json({ error: "Failed to load app details" }, { status: 500 });
  }
};
const PATCH = async ({ params, request, locals }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const riskTier = body.riskTier;
  if (!riskTier || !VALID_RISK_TIERS.includes(riskTier)) {
    return json(
      { error: `riskTier must be one of: ${VALID_RISK_TIERS.join(", ")}` },
      { status: 400 }
    );
  }
  const result = await queryPg(
    `UPDATE discovered_apps
     SET risk_tier = $1, updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3`,
    [riskTier, id, tenantId]
  );
  if (result.length === 0) {
    return json({ error: "app not found" }, { status: 404 });
  }
  return json({ ok: true, id, riskTier });
};
const POST = async ({ params, request, locals }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const id = params.id;
  if (!id) return json({ error: "missing id" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const action = body.action;
  const VALID_ACTIONS = ["approve", "block", "review"];
  if (!action || !VALID_ACTIONS.includes(action)) {
    return json({ error: "action must be one of: approve, block, review" }, { status: 400 });
  }
  const app = await queryPgOne(
    "SELECT * FROM discovered_apps WHERE id = $1 AND tenant_id = $2",
    [id, tenantId]
  );
  if (!app) return json({ error: "app not found" }, { status: 404 });
  switch (action) {
    case "approve": {
      await queryPg(
        `UPDATE discovered_apps SET risk_tier = 'approved', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      await queryPg(
        `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
         VALUES ($1, $2, 'discovery.app_approved', 'console', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({ appId: id, appName: app.app_name })
        ]
      );
      return json({ ok: true, action: "approve", riskTier: "approved" });
    }
    case "block": {
      await queryPg(
        `UPDATE discovered_apps SET risk_tier = 'blocked', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      const revokedGrants = await queryPg(
        `UPDATE discovered_oauth_grants SET status = 'revoked'
         WHERE discovered_app_id = $1 AND tenant_id = $2 AND status = 'active'
         RETURNING id`,
        [id, tenantId]
      );
      const grantsRevoked = revokedGrants.length;
      const incidentId = crypto.randomUUID();
      await queryPg(
        `INSERT INTO incidents (id, tenant_id, title, severity, status, source, source_id, description, created_at)
         VALUES ($1, $2, $3, 'high', 'open', 'discovery', $4, $5, NOW())`,
        [
          incidentId,
          tenantId,
          `Blocked shadow app: ${app.app_name}`,
          id,
          `The discovered app "${app.app_name}" has been blocked. ${grantsRevoked} OAuth grant(s) revoked.`
        ]
      );
      await queryPg(
        `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
         VALUES ($1, $2, 'discovery.app_blocked', 'console', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({ appId: id, appName: app.app_name, grantsRevoked })
        ]
      );
      return json({
        ok: true,
        action: "block",
        riskTier: "blocked",
        grantsRevoked,
        incidentId
      });
    }
    case "review": {
      await queryPg(
        `UPDATE discovered_apps SET risk_tier = 'under_review', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      const campaignId = crypto.randomUUID();
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString();
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
              appName: app.app_name
            }),
            dueDate
          ]
        );
      } catch {
      }
      await queryPg(
        `INSERT INTO audit_log (id, tenant_id, event_type, source, actor_email, metadata, created_at)
         VALUES ($1, $2, 'discovery.app_review_started', 'console', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          user.email ?? "unknown",
          JSON.stringify({ appId: id, appName: app.app_name, campaignId })
        ]
      );
      return json({
        ok: true,
        action: "review",
        riskTier: "under_review",
        campaignId
      });
    }
    default:
      return json({ error: "invalid action" }, { status: 400 });
  }
};

export { GET, PATCH, POST };
//# sourceMappingURL=_server.ts-BMdczp3P.js.map
