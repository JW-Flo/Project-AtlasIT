import type { RequestHandler } from "@sveltejs/kit";
import { getCoreApiBase, getEnv, proxyFetch } from "../../_proxy-helpers";

/**
 * GET /api/tenant/sso — retrieve SSO configuration for the current tenant.
 */
export const GET: RequestHandler = async ({ platform, locals }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getCoreApiBase(platform);
  const env = getEnv(platform);
  const upstream = `${base}/api/v1/tenant/sso`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-tenant-id": user.tenantId,
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/tenant/sso — create or update SSO configuration.
 * Only owners and admins can configure SSO.
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getCoreApiBase(platform);
  const env = getEnv(platform);
  const body = await request.text();
  const upstream = `${base}/api/v1/tenant/sso`;

  try {
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-tenant-id": user.tenantId,
        "x-user-id": user.userId,
        "Content-Type": "application/json",
      },
      body,
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// PUT is an alias for POST — the UI calls PUT, the SPA interceptor forwards
// to Lambda's PUT, and the CF handler accepts either verb as upsert.
export const PUT: RequestHandler = (event) => POST(event);

/**
 * DELETE /api/tenant/sso — remove SSO configuration.
 */
export const DELETE: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getCoreApiBase(platform);
  const env = getEnv(platform);
  const upstream = `${base}/api/v1/tenant/sso${url.search}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      method: "DELETE",
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-tenant-id": user.tenantId,
        "x-user-id": user.userId,
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
