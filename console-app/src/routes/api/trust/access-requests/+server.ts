/**
 * Trust Center access request management — requires auth.
 *
 * GET    — list pending/approved/denied requests for tenant
 * PATCH  — approve or deny a request (generates time-limited access token)
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

const ACCESS_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const status = url.searchParams.get("status") ?? "pending";

  const { results } = await db
    .prepare(
      `SELECT id, requester_name, requester_email, requester_company, reason, status, created_at, reviewed_at, expires_at
       FROM trust_access_requests
       WHERE tenant_id = ? AND status = ?
       ORDER BY created_at DESC
       LIMIT 50`,
    )
    .bind(tenantId, status)
    .all<{
      id: string;
      requester_name: string;
      requester_email: string;
      requester_company: string | null;
      reason: string | null;
      status: string;
      created_at: string;
      reviewed_at: string | null;
      expires_at: string | null;
    }>();

  return json({ requests: results ?? [] });
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!requestId || !["approve", "deny"].includes(action)) {
    return json({ error: "requestId and action (approve|deny) are required" }, { status: 400 });
  }

  // Verify request belongs to tenant
  const existing = await db
    .prepare(`SELECT id, status FROM trust_access_requests WHERE id = ? AND tenant_id = ? LIMIT 1`)
    .bind(requestId, tenantId)
    .first<{ id: string; status: string }>();

  if (!existing) return json({ error: "Request not found" }, { status: 404 });
  if (existing.status !== "pending") {
    return json({ error: "Request already processed" }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (action === "approve") {
    const accessToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString();

    await db
      .prepare(
        `UPDATE trust_access_requests
         SET status = 'approved', access_token = ?, expires_at = ?, reviewed_at = ?, reviewed_by = ?
         WHERE id = ?`,
      )
      .bind(accessToken, expiresAt, now, user.email ?? "unknown", requestId)
      .run();

    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "trust_access_request.approved",
      targetType: "trust_access_request",
      targetId: requestId,
      detail: JSON.stringify({ expiresAt }),
    });

    return json({ status: "approved", accessToken, expiresAt });
  } else {
    await db
      .prepare(
        `UPDATE trust_access_requests
         SET status = 'denied', reviewed_at = ?, reviewed_by = ?
         WHERE id = ?`,
      )
      .bind(now, user.email ?? "unknown", requestId)
      .run();

    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "trust_access_request.denied",
      targetType: "trust_access_request",
      targetId: requestId,
    });

    return json({ status: "denied" });
  }
};
