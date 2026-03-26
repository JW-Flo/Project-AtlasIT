import type { RequestHandler } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { getWorkerBase, getEnv, proxyFetch } from "../../../_proxy-helpers";
import { writeAudit } from "$lib/server/audit";

const ALLOWED_ACTIONS = new Set(["approve", "deny", "fulfill"]);

export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { id, action } = params;

  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return new Response(
      JSON.stringify({ error: `Invalid action: ${action}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const upstream = `${base}/api/v1/access-requests/${id}/${action}`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
    });
    const data = await res.json();

    // Log audit event for successful access request action
    if (res.ok) {
      const db = (platform?.env as any)?.ATLAS_SHARED_DB;
      if (db) {
        try {
          const auditAction =
            action === "approve"
              ? "access_request.approved"
              : action === "deny"
                ? "access_request.denied"
                : `access_request.${action}`;

          await writeAudit(db, {
            tenantId,
            actorUserId: user.userId ?? "unknown",
            actorEmail: user.email ?? "unknown",
            action: auditAction,
            targetType: "access_request",
            targetId: id,
          });
        } catch {
          // Non-blocking: audit write failure shouldn't break access request action
        }
      }
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Access requests service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
};
