import { redirect } from '@sveltejs/kit';

const load = async () => {
  throw redirect(307, "/console");
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 3;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BDzydDIA.js')).default;
const server_id = "src/routes/+page.server.ts";
const imports = ["_app/immutable/nodes/3.CP1nsDD-.js","_app/immutable/chunks/DEfbl42g.js","_app/immutable/chunks/Brc9Lj5R.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/DrIfTPVU.js","_app/immutable/chunks/DEXIvvNG.js","_app/immutable/chunks/ClsUfVDQ.js","_app/immutable/chunks/nsdYOAOH.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=3-BULSHoXC.js.map
