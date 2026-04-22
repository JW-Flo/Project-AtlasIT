const load = async ({ fetch, parent }) => {
  const { session } = await parent();
  if (!session?.authenticated || !session.tenantId) {
    return { prefetched: null };
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
  const [tenant, scores, reviews, incidents, runs, evidence] = await Promise.all([
    fetch("/api/tenant/dashboard").then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch("/api/tenant-compliance/scores").then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch("/api/access-reviews").then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch("/api/incidents").then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch("/api/automation/executions?limit=5").then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`/api/evidence-feed?limit=8&since=${encodeURIComponent(since)}`).then((r) => r.ok ? r.json() : null).catch(() => null)
  ]);
  return {
    prefetched: { tenant, scores, reviews, incidents, runs, evidence }
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 6;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BPCawPIC.js')).default;
const server_id = "src/routes/console/+page.server.ts";
const imports = ["_app/immutable/nodes/6.D7RZiJ5P.js","_app/immutable/chunks/DlDijCA82.js","_app/immutable/chunks/DEfbl42g.js","_app/immutable/chunks/Brc9Lj5R.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/DrIfTPVU.js","_app/immutable/chunks/zROyvukw.js","_app/immutable/chunks/BMeIYSur.js","_app/immutable/chunks/ClsUfVDQ.js","_app/immutable/chunks/nsdYOAOH.js","_app/immutable/chunks/CrCLcc6v.js","_app/immutable/chunks/XVbQrsuB.js","_app/immutable/chunks/BQ5kL6_u.js","_app/immutable/chunks/CrhUJCuf.js","_app/immutable/chunks/BZbdk0jY.js","_app/immutable/chunks/NyJ2ZRhe.js","_app/immutable/chunks/CCJ1bO5m.js","_app/immutable/chunks/BvXYZujz.js","_app/immutable/chunks/CeULrjrw.js","_app/immutable/chunks/KndhhaTB.js","_app/immutable/chunks/Ivb-FdQU.js","_app/immutable/chunks/DoStNnW7.js","_app/immutable/chunks/DMn8QJj4.js","_app/immutable/chunks/DdddOicB.js","_app/immutable/chunks/ZSo0cKVk.js","_app/immutable/chunks/c0xQu50j.js","_app/immutable/chunks/9q5uTajz.js","_app/immutable/chunks/DEXIvvNG.js","_app/immutable/chunks/C39MHDvM.js","_app/immutable/chunks/CvKf0WeD.js","_app/immutable/chunks/BYWZHFls.js","_app/immutable/chunks/d3KSaFOY.js","_app/immutable/chunks/D_N7yGBI.js","_app/immutable/chunks/DSykGcKT.js","_app/immutable/chunks/PVo9aWGi.js","_app/immutable/chunks/D-rU2CBR.js","_app/immutable/chunks/DFvlQS2N.js","_app/immutable/chunks/B7vTfXVU.js","_app/immutable/chunks/DUz1OcyK.js","_app/immutable/chunks/C4bLFP-d2.js","_app/immutable/chunks/Dthfo4_u2.js","_app/immutable/chunks/DEd7UKZ12.js","_app/immutable/chunks/BJ3etHQ5.js","_app/immutable/chunks/MZhQ1O-m.js","_app/immutable/chunks/nykvSIrd.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=6-CD6bxX99.js.map
