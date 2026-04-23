import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../../_proxy-helpers";

export const POST: RequestHandler = async ({ params, request, url, platform }) => {
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "slug is required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const body = await request.text();
  const upstream = `${base}/api/v1/trust/${slug}/access-request`;
  try {
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.COMPLIANCE_API_KEY },
      body,
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status, headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
};
