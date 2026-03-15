import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  coreFetch,
  dispatchFetch,
  orchestratorFetch,
} from "$lib/api";
import { getWorkerBase, proxyFetch } from "../_proxy-helpers";
import type { PlatformHealthResponse } from "$lib/types/platform";

async function checkService(
  fn: () => Promise<Response>,
): Promise<{ ok: boolean; latencyMs: number | null; status: number | null }> {
  const start = Date.now();
  try {
    const resp = await fn();
    const latency = Date.now() - start;
    return { ok: resp.ok, latencyMs: latency, status: resp.status };
  } catch {
    return { ok: false, latencyMs: null, status: null };
  }
}

export const GET: RequestHandler = async ({ platform }) => {
  const env = (platform?.env as any) || {};

  // Compliance worker health is at /health (root), not under /api/compliance
  const complianceBase = getWorkerBase(platform);

  const [core, dispatch, compliance, orchestrator] = await Promise.all([
    checkService(() => coreFetch(env, "/health")),
    checkService(() => dispatchFetch(env, "/__health")),
    checkService(() => proxyFetch(platform, `${complianceBase}/health`)),
    checkService(() => orchestratorFetch(env, "/health")),
  ]);

  const services = { core, dispatch, compliance, orchestrator };
  const ok = Object.values(services).every((s) => s.ok);

  const response: PlatformHealthResponse = {
    ok,
    ts: new Date().toISOString(),
    services: {
      core: { ...core, lastChecked: new Date().toISOString() },
      dispatch: { ...dispatch, lastChecked: new Date().toISOString() },
      compliance: { ...compliance, lastChecked: new Date().toISOString() },
      orchestrator: { ...orchestrator, lastChecked: new Date().toISOString() },
    },
    usage: {
      recentInvocations: 0,
      breakerOpenScripts: 0,
    },
  };

  return json(response);
};
