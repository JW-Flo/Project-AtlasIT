/**
 * Public Trust Center evidence provenance API — no auth required.
 * Returns per-control evidence items showing what operation generated
 * each piece of evidence, when, and whether it's still fresh.
 *
 * GET /api/trust/:slug/evidence?control=CC6.1&framework=SOC2
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../../_proxy-helpers";

export const GET: RequestHandler = async ({ params, url, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });

  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const upstream = `${base}/api/v1/trust/${slug}/evidence${url.search}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY,
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
