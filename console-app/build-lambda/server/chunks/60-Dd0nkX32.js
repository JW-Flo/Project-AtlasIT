import { redirect } from '@sveltejs/kit';

function load() {
  throw redirect(301, "/console/platform-status");
}

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 60;
const server_id = "src/routes/console/status/+page.server.ts";
const imports = [];
const stylesheets = [];
const fonts = [];

export { fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=60-Dd0nkX32.js.map
