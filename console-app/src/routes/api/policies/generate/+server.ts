import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../_proxy-helpers";

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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const templateKey = body?.templateKey;
  if (!templateKey || typeof templateKey !== "string") {
    return new Response(JSON.stringify({ error: "templateKey required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = `${base}/api/v1/policies/generate`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        templateKey,
        input: body.input || {},
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const db = (platform?.env as any)?.ATLAS_SHARED_DB;
      if (db) {
        try {
          // Read existing generated_policies list and append templateKey
          const existing = await db
            .prepare(
              "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'",
            )
            .bind(tenantId)
            .first<{ value: string }>();
          const current: string[] = existing?.value ? JSON.parse(existing.value) : [];
          if (!current.includes(templateKey)) current.push(templateKey);
          const newValue = JSON.stringify(current);
          await db
            .prepare(
              `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
               VALUES (?, 'generated_policies', ?, datetime('now'))
               ON CONFLICT(tenant_id, key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
            )
            .bind(tenantId, newValue, newValue)
            .run();
        } catch {
          // Non-fatal: don't fail the response if preference write fails
        }
      }
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Policy generation service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
};
