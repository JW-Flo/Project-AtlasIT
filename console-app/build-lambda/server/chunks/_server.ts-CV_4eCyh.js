import { json } from '@sveltejs/kit';
import { c as coreFetch, d as dispatchFetch, o as orchestratorFetch } from './api-IZoNGiDX.js';
import { g as getWorkerBase, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';

async function checkService(fn) {
  const start = Date.now();
  try {
    const resp = await fn();
    const latency = Date.now() - start;
    return { ok: resp.ok, latencyMs: latency, status: resp.status };
  } catch {
    return { ok: false, latencyMs: null, status: null };
  }
}
const GET = async ({ platform }) => {
  const env = platform?.env || {};
  const complianceBase = getWorkerBase(platform);
  const [core, dispatch, compliance, orchestrator] = await Promise.all([
    checkService(() => coreFetch(env, "/health")),
    checkService(() => dispatchFetch(env, "/__health")),
    checkService(() => proxyFetch(platform, `${complianceBase}/health`)),
    checkService(() => orchestratorFetch(env, "/health"))
  ]);
  const services = { core, dispatch, compliance, orchestrator };
  const ok = Object.values(services).every((s) => s.ok);
  const response = {
    ok,
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    services: {
      core: { ...core, lastChecked: (/* @__PURE__ */ new Date()).toISOString() },
      dispatch: { ...dispatch, lastChecked: (/* @__PURE__ */ new Date()).toISOString() },
      compliance: { ...compliance, lastChecked: (/* @__PURE__ */ new Date()).toISOString() },
      orchestrator: { ...orchestrator, lastChecked: (/* @__PURE__ */ new Date()).toISOString() }
    },
    usage: {
      recentInvocations: 0,
      breakerOpenScripts: 0
    }
  };
  return json(response);
};

export { GET };
//# sourceMappingURL=_server.ts-CV_4eCyh.js.map
