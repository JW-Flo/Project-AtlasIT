import { redirect } from '@sveltejs/kit';

function load() {
  throw redirect(301, "/console/automation/runs");
}

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 48;
const server_id = "src/routes/console/runs/+page.server.ts";
const imports = [];
const stylesheets = [];
const fonts = [];

export { fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=48-D_zkIBze.js.map
