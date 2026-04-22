import { redirect } from '@sveltejs/kit';

function load() {
  throw redirect(301, "/access-requests");
}

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 7;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CC6uvpda.js')).default;
const server_id = "src/routes/console/access-requests/+page.server.ts";
const imports = ["_app/immutable/nodes/7.QFx1zEkx.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/ClsUfVDQ.js","_app/immutable/chunks/nsdYOAOH.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-Bd3jFmyN.js.map
