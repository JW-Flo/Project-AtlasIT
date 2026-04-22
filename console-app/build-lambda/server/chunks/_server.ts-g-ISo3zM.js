import { json } from '@sveltejs/kit';

const ALLOWED_SUBPATHS = /* @__PURE__ */ new Set(["", "features"]);
const GET = async ({ platform, url }) => {
  const parts = url.pathname.split("/api/config");
  const suffix = parts.length > 1 ? parts[1].replace(/^\//, "") : "";
  if (!ALLOWED_SUBPATHS.has(suffix)) {
    return new Response(JSON.stringify({ error: "not_found", path: suffix }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (suffix === "features") {
    return json({ features: [], version: 1 });
  }
  const env = platform?.env || {};
  const complianceBase = env.COMPLIANCE_BASE || "/api/mock/compliance";
  let reachable = false;
  if (env.COMPLIANCE_WORKER) {
    try {
      const r = await env.COMPLIANCE_WORKER.fetch(
        new Request("https://internal/health")
      );
      reachable = r.ok;
    } catch {
    }
  }
  const resolvedBase = reachable ? complianceBase : "/api/mock/compliance";
  return json({ complianceBase, resolvedBase });
};

export { GET };
//# sourceMappingURL=_server.ts-g-ISo3zM.js.map
