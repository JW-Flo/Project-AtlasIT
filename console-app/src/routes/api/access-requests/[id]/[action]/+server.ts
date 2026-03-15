import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../../_proxy-helpers";

const ALLOWED_ACTIONS = new Set(["approve", "deny", "fulfill"]);

export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId || env.TENANT_ID || "atlasit-prod";
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
