import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../_proxy-helpers";

export const GET: RequestHandler = async ({ params, url, platform }) => {
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "slug is required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const upstream = `${base}/api/v1/trust/${slug}${url.search}`;
  try {
    const res = await proxyFetch(platform, upstream, {
      headers: { "x-api-key": env.COMPLIANCE_API_KEY },
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
