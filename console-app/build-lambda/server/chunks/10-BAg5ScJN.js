import { redirect } from '@sveltejs/kit';

const load = async ({ locals }) => {
  if (!locals.user?.superAdmin) throw redirect(302, "/console");
  return {};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 10;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-LKSWDvyT.js')).default;
const server_id = "src/routes/console/admin/+page.server.ts";
const imports = ["_app/immutable/nodes/10.zNaKsDrF.js","_app/immutable/chunks/D_N7yGBI.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/DrIfTPVU.js","_app/immutable/chunks/zROyvukw.js","_app/immutable/chunks/BMeIYSur.js","_app/immutable/chunks/ClsUfVDQ.js","_app/immutable/chunks/nsdYOAOH.js","_app/immutable/chunks/XVbQrsuB.js","_app/immutable/chunks/BQ5kL6_u.js","_app/immutable/chunks/CrhUJCuf.js","_app/immutable/chunks/BZbdk0jY.js","_app/immutable/chunks/NyJ2ZRhe.js","_app/immutable/chunks/CCJ1bO5m.js","_app/immutable/chunks/BvXYZujz.js","_app/immutable/chunks/CeULrjrw.js","_app/immutable/chunks/KndhhaTB.js","_app/immutable/chunks/Ivb-FdQU.js","_app/immutable/chunks/c0xQu50j.js","_app/immutable/chunks/Dc5vVJIj.js","_app/immutable/chunks/BintBxEm2.js","_app/immutable/chunks/BnJVh3lT2.js","_app/immutable/chunks/DLHZEpzF2.js","_app/immutable/chunks/DQ46EPfS.js","_app/immutable/chunks/CSY8_dO1.js","_app/immutable/chunks/d3KSaFOY.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=10-BAg5ScJN.js.map
