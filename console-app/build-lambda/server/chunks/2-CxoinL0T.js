const load = async ({ fetch, parent }) => {
  const { session } = await parent();
  if (!session?.authenticated || !session.tenantId) {
    return { complianceScores: null };
  }
  const scores = await fetch("/api/tenant-compliance/scores").then((r) => r.ok ? r.json() : null).catch(() => null);
  return { complianceScores: scores };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 2;
let component_cache;
const component = async () => component_cache ??= (await import('./layout.svelte-UxsTmhKc.js')).default;
const server_id = "src/routes/console/+layout.server.ts";
const imports = ["_app/immutable/nodes/2.CdfmqRIQ.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/ClsUfVDQ.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=2-CxoinL0T.js.map
