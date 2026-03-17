import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
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
  const upstream = `${base}/api/v1/incidents${url.search}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return json(
        {
          error: "Upstream service error",
          status: res.status,
          detail: text.substring(0, 200),
        },
        { status: 502 },
      );
    }
    const data: any = await res.json();

    // Map snake_case D1 rows to camelCase for frontend types
    if (Array.isArray(data.items)) {
      data.items = data.items.map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id ?? row.tenantId,
        title: row.title,
        severity: row.severity,
        status: row.status,
        source: row.source ?? null,
        createdAt: row.created_at ?? row.createdAt,
        resolvedAt: row.resolved_at ?? row.resolvedAt ?? null,
        updatedAt: row.updated_at ?? row.updatedAt ?? null,
      }));
    }

    return json(data, { status: res.status });
  } catch {
    return json({ error: "Incidents service unavailable" }, { status: 503 });
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
    const parsed = await request.json();
    if (!parsed || typeof parsed.title !== "string" || !parsed.title.trim()) {
      return json({ error: "Missing required field: title" }, { status: 400 });
    }
    body = JSON.stringify(parsed);
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const upstream = `${base}/api/v1/incidents`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      return json(
        {
          error: "Upstream service error",
          status: res.status,
          detail: text.substring(0, 200),
        },
        { status: 502 },
      );
    }
    const data = await res.json();

    // Log audit event for successful incident creation
    const db = (platform?.env as any)?.ATLAS_SHARED_DB;
    if (db) {
      try {
        await writeAudit(db, {
          tenantId,
          actorUserId: user.userId ?? "unknown",
          actorEmail: user.email ?? "unknown",
          action: "incident.created",
          targetType: "incident",
          targetId: data?.id,
          detail: data?.title
            ? JSON.stringify({ title: data.title })
            : undefined,
        });
      } catch {
        // Non-blocking: audit write failure shouldn't break incident creation
      }
    }

    return json(data, { status: res.status });
  } catch {
    return json({ error: "Incidents service unavailable" }, { status: 503 });
  }
};
