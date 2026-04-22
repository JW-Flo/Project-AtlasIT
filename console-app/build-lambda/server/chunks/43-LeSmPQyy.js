async function fetchPlatformStatus() {
  const [healthRes, usageRes] = await Promise.allSettled([
    fetch("/api/health"),
    fetch("/api/platform/usage")
  ]);
  const health = healthRes.status === "fulfilled" && healthRes.value.ok ? await healthRes.value.json() : null;
  const usage = usageRes.status === "fulfilled" && usageRes.value.ok ? await usageRes.value.json() : null;
  if (health && usage) {
    health.usage.recentInvocations = usage.total || 0;
    health.usage.breakerOpenScripts = usage.breakerOpenScripts || 0;
  }
  return { health, usage };
}
const load = async ({ fetch: fetch2 }) => {
  try {
    const data = await fetchPlatformStatus();
    return {
      health: data.health,
      usage: data.usage,
      generated: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (e) {
    console.error("Server load failed:", e);
    return { health: null, usage: null, generated: (/* @__PURE__ */ new Date()).toISOString() };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 43;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CPEpEVp3.js')).default;
const server_id = "src/routes/console/platform-status/+page.server.ts";
const imports = ["_app/immutable/nodes/43.LHmslENd.js","_app/immutable/chunks/zROyvukw.js","_app/immutable/chunks/BMeIYSur.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/ClsUfVDQ.js","_app/immutable/chunks/nsdYOAOH.js","_app/immutable/chunks/XVbQrsuB.js","_app/immutable/chunks/BQ5kL6_u.js","_app/immutable/chunks/CrhUJCuf.js","_app/immutable/chunks/BZbdk0jY.js","_app/immutable/chunks/NyJ2ZRhe.js","_app/immutable/chunks/PVo9aWGi.js","_app/immutable/chunks/Ivb-FdQU.js","_app/immutable/chunks/Di-SSqQC.js","_app/immutable/chunks/naY8Zx7c.js","_app/immutable/chunks/d3KSaFOY.js","_app/immutable/chunks/MZhQ1O-m.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=43-LeSmPQyy.js.map
