import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface ServiceDeepCheck {
  name: string;
  reachable: boolean;
  latencyMs: number;
  functionalChecks: Record<string, "pass" | "fail" | "unknown">;
  version?: string;
}

/**
 * GET /api/platform/health-deep
 * Aggregates functional health checks from all upstream workers.
 * Goes beyond reachability — verifies D1, KV, R2 bindings actually work.
 */
export const GET: RequestHandler = async ({ platform }) => {
  const env = (platform?.env as any) || {};

  const services: Record<string, string> = {
    orchestrator: env.ORCHESTRATOR_URL ?? "https://orchestrator.atlasit.pro",
    compliance: env.COMPLIANCE_BASE ?? "https://compliance.atlasit.pro",
  };

  const results: ServiceDeepCheck[] = [];

  await Promise.allSettled(
    Object.entries(services).map(async ([name, baseUrl]) => {
      const start = Date.now();
      try {
        const res = await fetch(`${baseUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - start;
        const data = await res.json() as any;

        const functionalChecks: Record<string, "pass" | "fail" | "unknown"> = {};

        // Parse functional checks from the health response
        if (data.checks) {
          for (const [key, val] of Object.entries(data.checks)) {
            const check = val as any;
            functionalChecks[key] = check?.status === "pass" ? "pass" : "fail";
          }
        }

        // Compliance worker has different structure
        if (data.d1 !== undefined) functionalChecks.d1 = data.d1 ? "pass" : "fail";
        if (data.r2 !== undefined) functionalChecks.r2 = data.r2 ? "pass" : "fail";

        results.push({
          name,
          reachable: res.ok,
          latencyMs,
          functionalChecks,
          version: data.version,
        });
      } catch {
        results.push({
          name,
          reachable: false,
          latencyMs: Date.now() - start,
          functionalChecks: {},
        });
      }
    }),
  );

  // Console-app self-check: D1
  const db = env.ATLAS_SHARED_DB;
  const selfChecks: Record<string, "pass" | "fail" | "unknown"> = {};
  if (db) {
    try {
      await db.prepare("SELECT 1").first();
      selfChecks.d1 = "pass";
    } catch {
      selfChecks.d1 = "fail";
    }
  } else {
    selfChecks.d1 = "unknown";
  }

  results.unshift({
    name: "console",
    reachable: true,
    latencyMs: 0,
    functionalChecks: selfChecks,
  });

  const allHealthy = results.every(
    (r) =>
      r.reachable &&
      Object.values(r.functionalChecks).every((v) => v === "pass"),
  );

  const totalChecks = results.reduce(
    (sum, r) => sum + Object.keys(r.functionalChecks).length,
    0,
  );
  const passingChecks = results.reduce(
    (sum, r) =>
      sum + Object.values(r.functionalChecks).filter((v) => v === "pass").length,
    0,
  );

  return json({
    healthy: allHealthy,
    sloMet: passingChecks === totalChecks,
    totalChecks,
    passingChecks,
    services: results,
    checkedAt: new Date().toISOString(),
  });
};
