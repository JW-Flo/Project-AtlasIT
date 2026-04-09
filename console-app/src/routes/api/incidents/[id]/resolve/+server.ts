import type { RequestHandler } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { getWorkerBase, getEnv, proxyFetch } from "../../../_proxy-helpers";
import { writeAudit } from "$lib/server/audit";

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
  const { id } = params;

  try {
    const upstream = `${base}/api/v1/incidents/${id}/resolve`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
    });
    const data = await res.json();

    // Log audit event for successful incident resolution
    if (res.ok) {
      const db = (platform?.env as any)?.ATLAS_SHARED_DB;
      if (db) {
        try {
          await writeAudit(db, {
            tenantId,
            actorUserId: user.userId ?? "unknown",
            actorEmail: user.email ?? "unknown",
            action: "incident.resolved",
            targetType: "incident",
            targetId: id,
          });
        } catch {
          // Non-blocking
        }
        try {
          const { notify } = await import("$lib/server/notifications");
          await notify(db, platform, {
            tenantId,
            type: "incident_resolved",
            title: `Incident resolved`,
            body: `Incident ${id} was resolved by ${user.email}`,
            severity: "info",
            sourceType: "incident",
            sourceId: id!,
            actionUrl: `/console/incidents`,
          });
        } catch {
          // Non-blocking
        }
      }
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Incidents service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
