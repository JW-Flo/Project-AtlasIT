import type { RequestHandler } from "@sveltejs/kit";
import { getOrchestratorBase, getEnv, proxyFetch } from "../../_proxy-helpers";

/**
 * GET /api/platform/journey-metrics
 * Measures completion rate of the core user journey:
 *   login → dashboard → connect app → create workflow/rule → see evidence
 *
 * Returns per-tenant progress through the key activation funnel.
 */
export const GET: RequestHandler = async ({ platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getOrchestratorBase(platform);
  const env = getEnv(platform);
  const upstream = `${base}/api/v1/platform/journey-metrics`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
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
