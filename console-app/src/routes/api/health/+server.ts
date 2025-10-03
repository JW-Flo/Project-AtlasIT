import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  coreFetch,
  dispatchFetch,
  complianceFetch,
  orchestratorFetch,
} from "$lib/api";
import type { PlatformHealthResponse } from "$lib/types/platform";

async function checkService(
  fetchFn: (path: string) => Promise<Response>,
  path: string,
): Promise<{ ok: boolean; latencyMs: number | null; status: number | null }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetchFn(path).then((r) => {
      clearTimeout(timeoutId);
      return r;
    });
    const latency = Date.now() - start;
    return { ok: resp.ok, latencyMs: latency, status: resp.status };
  } catch (e) {
    console.error("Service check failed:", e);
    return { ok: false, latencyMs: null, status: null };
  }
}

export const GET: RequestHandler = async ({ platform }) => {
  const env = (platform?.env as any) || {};

  const [core, dispatch, compliance, orchestrator] = await Promise.all([
    checkService((p) => coreFetch(env, p), "/health"),
    checkService((p) => dispatchFetch(env, p), "/__health"),
    checkService((p) => complianceFetch(env, p), "/health"),
    checkService((p) => orchestratorFetch(env, p), "/health"),
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
      recentInvocations: 0, // Will be merged from usage endpoint
      breakerOpenScripts: 0,
    },
  };

  return json(response);
};
