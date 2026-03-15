import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const ALLOWED_SUBPATHS = new Set(["", "features"]);

export const GET: RequestHandler = async ({ platform, url }) => {
  const parts = url.pathname.split("/api/config");
  const suffix = parts.length > 1 ? parts[1].replace(/^\//, "") : "";
  if (!ALLOWED_SUBPATHS.has(suffix)) {
    return new Response(JSON.stringify({ error: "not_found", path: suffix }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (suffix === "features") {
    return json({ features: [], version: 1 });
  }

  const env = (platform?.env as any) || {};
  const complianceBase: string = env.COMPLIANCE_BASE || "/api/mock/compliance";

  // Check reachability server-side via service binding (fast, no network hop)
  let reachable = false;
  if (env.COMPLIANCE_WORKER) {
    try {
      const r = await env.COMPLIANCE_WORKER.fetch(
        new Request("https://internal/health", { method: "HEAD" }),
      );
      reachable = r.ok;
    } catch {
      // service binding unavailable
    }
  }

  const resolvedBase = reachable ? complianceBase : "/api/mock/compliance";

  return json({ complianceBase, resolvedBase });
};
