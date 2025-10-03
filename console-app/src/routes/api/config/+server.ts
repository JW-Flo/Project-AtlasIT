import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

/**
 * Runtime configuration endpoint consumed by the console to discover backend service base URLs.
 * This allows deploying the static console bundle while pointing at different compliance API origins.
 *
 * Exposed shape is append-only; do not remove existing fields to avoid breaking clients.
 */
// Allowed subpaths relative to /api/config (root = "")
const ALLOWED_SUBPATHS = new Set(["", "features"]);

export const GET: RequestHandler = async ({ platform, url }) => {
  // Normalize subpath: everything after /api/config
  // Example: /api/config -> ""; /api/config/features -> "features"
  const parts = url.pathname.split("/api/config");
  const suffix = parts.length > 1 ? parts[1].replace(/^\//, "") : "";
  if (!ALLOWED_SUBPATHS.has(suffix)) {
    return new Response(JSON.stringify({ error: "not_found", path: suffix }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (suffix === "features") {
    // Placeholder future extension; keep lean to avoid breaking clients.
    return json({ features: [], version: 1 });
  }
  const env = (platform?.env as any) || {};
  // Fallback keeps local dev working if no env provided.
  const complianceBase: string = env.COMPLIANCE_BASE || "/api/mock/compliance";
  // Provide ordered fallback candidates so the client can attempt reachability:
  // 1. Explicit COMPLIANCE_BASE (if provided)
  // 2. Production primary route (if different)
  // 3. workers.dev compliance worker (heuristic based on known naming convention)
  // 4. Local mock path
  // Derive workers.dev pattern: static reference (does not leak secrets; public host) used for fallback resolution.
  const workersDevGuess =
    "https://atlasit-compliance-worker.kd8jc7v8cd.workers.dev/api/compliance";
  const fallbacks = [
    complianceBase,
    "https://atlasit.pro/api/compliance",
    workersDevGuess,
    "/api/mock/compliance",
  ];
  // Ensure uniqueness while preserving order
  const seen = new Set<string>();
  const fallbackBases = fallbacks.filter((b) => {
    if (!b) return false;
    if (seen.has(b)) return false;
    seen.add(b);
    return true;
  });
  return json({ complianceBase, fallbackBases });
};
