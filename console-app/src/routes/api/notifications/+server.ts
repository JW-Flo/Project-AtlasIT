import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../_proxy-helpers";

export const GET: RequestHandler = async ({ url, platform }) => {
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const upstream = `${base}/api/v1/notifications${url.search}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": env.TENANT_ID || "atlasit-prod",
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Notifications service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
};
