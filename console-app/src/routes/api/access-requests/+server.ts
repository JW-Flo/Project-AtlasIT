import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../_proxy-helpers";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const upstream = `${base}/api/v1/access-requests${url.search}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
    });
    const data: any = await res.json();

    // Map snake_case D1 rows to camelCase for frontend types
    if (Array.isArray(data.items)) {
      data.items = data.items.map((row: any) => ({
        id: row.id,
        subject: row.subject_ref ?? row.subject,
        resource: row.resource,
        status: row.status,
        reason: row.reason ?? row.justification,
        createdAt: row.created_at ?? row.createdAt,
        decidedAt: row.decided_at ?? row.decidedAt ?? null,
        approver: row.approved_by ?? row.approver ?? null,
      }));
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

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: string;
  try {
    const json = await request.json();
    body = JSON.stringify(json);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = `${base}/api/v1/access-requests`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
      body,
    });
    const data = await res.json();

    // Log audit event for successful access request creation
    if (res.ok) {
      const db = (platform?.env as any)?.ATLAS_SHARED_DB;
      if (db) {
        try {
          await writeAudit(db, {
            tenantId,
            actorUserId: user.userId ?? "unknown",
            actorEmail: user.email ?? "unknown",
            action: "access_request.created",
            targetType: "access_request",
            targetId: data?.id,
            detail: data?.resource
              ? JSON.stringify({ resource: data.resource })
              : undefined,
          });
        } catch {
          // Non-blocking: audit write failure shouldn't break access request creation
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
