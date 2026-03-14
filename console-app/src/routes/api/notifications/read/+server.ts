import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../_proxy-helpers";

export const POST: RequestHandler = async ({ request, platform }) => {
  const base = getWorkerBase(platform);
  const env = getEnv(platform);

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
    const upstream = `${base}/api/v1/notifications/read`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY || "demo",
        "x-tenant-id": env.TENANT_ID || "atlasit-prod",
      },
      body,
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
