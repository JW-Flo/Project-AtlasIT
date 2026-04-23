import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { proxyFetch, getWorkerBase } from "../../_proxy-helpers";
import { queryPg, queryPgOne } from "$lib/server/pg";

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
  const orchestratorUrl = env.ORCHESTRATOR_URL ?? "https://orchestrator.atlasit.pro";
  const complianceBase = getWorkerBase(platform);

  const results: ServiceDeepCheck[] = [];

  // CF Access credentials for worker-to-worker calls behind Access
  const cfAccessId = env.CF_ACCESS_CLIENT_ID as string | undefined;
  const cfAccessSecret = env.CF_ACCESS_CLIENT_SECRET as string | undefined;

  const accessHeaders: Record<string, string> = {};
  if (cfAccessId && cfAccessSecret) {
    accessHeaders["CF-Access-Client-Id"] = cfAccessId;
    accessHeaders["CF-Access-Client-Secret"] = cfAccessSecret;
  }

  // Probe services in parallel
  await Promise.allSettled([
    // Orchestrator — direct fetch (not behind CF Access)
    (async () => {
      const start = Date.now();
      try {
        const res = await fetch(`${orchestratorUrl}/health`, {
          headers: accessHeaders,
          signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - start;
        const data = (await res.json()) as any;
        const functionalChecks: Record<string, "pass" | "fail" | "unknown"> = {};
        if (data.checks) {
          for (const [key, val] of Object.entries(data.checks)) {
            const check = val as any;
            functionalChecks[key] = check?.status === "pass" ? "pass" : "fail";
          }
        }
        results.push({
          name: "orchestrator",
          reachable: res.ok,
          latencyMs,
          functionalChecks,
          version: data.version,
        });
      } catch {
        results.push({
          name: "orchestrator",
          reachable: false,
          latencyMs: Date.now() - start,
          functionalChecks: {},
        });
      }
    })(),

    // Compliance — use proxyFetch (service binding) to bypass CF Access
    (async () => {
      const start = Date.now();
      try {
        const res = await proxyFetch(platform, `${complianceBase}/health`);
        const latencyMs = Date.now() - start;
        const data = (await res.json()) as any;
        const functionalChecks: Record<string, "pass" | "fail" | "unknown"> = {};
        if (data.checks) {
          for (const [key, val] of Object.entries(data.checks)) {
            const check = val as any;
            functionalChecks[key] = check?.status === "pass" ? "pass" : "fail";
          }
        }
        if (data.d1 !== undefined) functionalChecks.d1 = data.d1 ? "pass" : "fail";
        if (data.r2 !== undefined) functionalChecks.r2 = data.r2 ? "pass" : "fail";
        results.push({
          name: "compliance",
          reachable: res.ok,
          latencyMs,
          functionalChecks,
          version: data.version,
        });
      } catch {
        results.push({
          name: "compliance",
          reachable: false,
          latencyMs: Date.now() - start,
          functionalChecks: {},
        });
      }
    })(),
  ]);

  // Console-app self-check: PostgreSQL
  const selfChecks: Record<string, "pass" | "fail" | "unknown"> = {};
  try {
    await queryPgOne("SELECT 1 AS ok", []);
    selfChecks.pg = "pass";
  } catch {
    selfChecks.pg = "fail";
  }

  results.unshift({
    name: "console",
    reachable: true,
    latencyMs: 0,
    functionalChecks: selfChecks,
  });

  const allHealthy = results.every(
    (r) => r.reachable && Object.values(r.functionalChecks).every((v) => v === "pass"),
  );

  const totalChecks = results.reduce((sum, r) => sum + Object.keys(r.functionalChecks).length, 0);
  const passingChecks = results.reduce(
    (sum, r) => sum + Object.values(r.functionalChecks).filter((v) => v === "pass").length,
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
