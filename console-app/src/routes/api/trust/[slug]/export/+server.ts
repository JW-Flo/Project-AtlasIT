/**
 * Compliance evidence package export — generates a JSON/CSV/PDF auditor bundle
 * per framework with content hash for tamper detection.
 *
 * GET /api/trust/:slug/export?framework=SOC2&format=json|csv|pdf
 *
 * Accepts optional ?token= for NDA-gated access.
 * PUBLIC route — no auth required.
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../../_proxy-helpers";

export const GET: RequestHandler = async ({ params, url, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });

  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const upstream = `${base}/api/v1/trust/${slug}/export.pdf${url.search}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY,
      },
    });

    // Export returns PDF (or JSON/CSV depending on format param), pipe through raw response
    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
        ...Object.fromEntries(
          [...res.headers.entries()].filter(
            ([k]) =>
              k.toLowerCase() === "content-disposition" || k.toLowerCase() === "cache-control",
          ),
        ),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
