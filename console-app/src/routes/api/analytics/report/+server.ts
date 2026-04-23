import type { RequestHandler } from "@sveltejs/kit";
import { getOrchestratorBase, getEnv, proxyFetch } from "../../_proxy-helpers";

/**
 * GET /api/analytics/report?format=csv
 * Generates a downloadable compliance/analytics report.
 */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
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
  const upstream = `${base}/api/v1/analytics/report${url.search}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId,
      },
    });

    // For CSV responses, pass through the raw response
    if (res.headers.get("Content-Type")?.includes("text/csv")) {
      const content = await res.text();
      return new Response(content, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "text/csv",
          "Content-Disposition": res.headers.get("Content-Disposition") || "attachment; filename=report.csv",
          "Cache-Control": "no-store",
        },
      });
    }

    // For JSON responses
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
