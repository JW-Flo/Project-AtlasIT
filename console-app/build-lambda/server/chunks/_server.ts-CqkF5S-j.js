import { json } from '@sveltejs/kit';
import { g as getWorkerBase, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';

const GET = async ({ platform }) => {
  const env = platform?.env || {};
  const orchestratorUrl = env.ORCHESTRATOR_URL ?? "https://orchestrator.atlasit.pro";
  const complianceBase = getWorkerBase(platform);
  const results = [];
  const cfAccessId = env.CF_ACCESS_CLIENT_ID;
  const cfAccessSecret = env.CF_ACCESS_CLIENT_SECRET;
  const accessHeaders = {};
  if (cfAccessId && cfAccessSecret) {
    accessHeaders["CF-Access-Client-Id"] = cfAccessId;
    accessHeaders["CF-Access-Client-Secret"] = cfAccessSecret;
  }
  await Promise.allSettled([
    // Orchestrator — direct fetch (not behind CF Access)
    (async () => {
      const start = Date.now();
      try {
        const res = await fetch(`${orchestratorUrl}/health`, {
          headers: accessHeaders,
          signal: AbortSignal.timeout(5e3)
        });
        const latencyMs = Date.now() - start;
        const data = await res.json();
        const functionalChecks = {};
        if (data.checks) {
          for (const [key, val] of Object.entries(data.checks)) {
            const check = val;
            functionalChecks[key] = check?.status === "pass" ? "pass" : "fail";
          }
        }
        results.push({
          name: "orchestrator",
          reachable: res.ok,
          latencyMs,
          functionalChecks,
          version: data.version
        });
      } catch {
        results.push({
          name: "orchestrator",
          reachable: false,
          latencyMs: Date.now() - start,
          functionalChecks: {}
        });
      }
    })(),
    // Compliance — use proxyFetch (service binding) to bypass CF Access
    (async () => {
      const start = Date.now();
      try {
        const res = await proxyFetch(platform, `${complianceBase}/health`);
        const latencyMs = Date.now() - start;
        const data = await res.json();
        const functionalChecks = {};
        if (data.checks) {
          for (const [key, val] of Object.entries(data.checks)) {
            const check = val;
            functionalChecks[key] = check?.status === "pass" ? "pass" : "fail";
          }
        }
        if (data.d1 !== void 0) functionalChecks.d1 = data.d1 ? "pass" : "fail";
        if (data.r2 !== void 0) functionalChecks.r2 = data.r2 ? "pass" : "fail";
        results.push({
          name: "compliance",
          reachable: res.ok,
          latencyMs,
          functionalChecks,
          version: data.version
        });
      } catch {
        results.push({
          name: "compliance",
          reachable: false,
          latencyMs: Date.now() - start,
          functionalChecks: {}
        });
      }
    })()
  ]);
  const db = env.ATLAS_SHARED_DB;
  const selfChecks = {};
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
    functionalChecks: selfChecks
  });
  const allHealthy = results.every(
    (r) => r.reachable && Object.values(r.functionalChecks).every((v) => v === "pass")
  );
  const totalChecks = results.reduce((sum, r) => sum + Object.keys(r.functionalChecks).length, 0);
  const passingChecks = results.reduce(
    (sum, r) => sum + Object.values(r.functionalChecks).filter((v) => v === "pass").length,
    0
  );
  return json({
    healthy: allHealthy,
    sloMet: passingChecks === totalChecks,
    totalChecks,
    passingChecks,
    services: results,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
};

export { GET };
//# sourceMappingURL=_server.ts-CqkF5S-j.js.map
