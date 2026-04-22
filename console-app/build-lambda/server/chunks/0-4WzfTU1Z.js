const load = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return { session: { authenticated: false } };
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  let orgName;
  let branding = {};
  if (db && user.tenantId) {
    try {
      const tenant = await db.prepare("SELECT name FROM tenants WHERE id = ?").bind(user.tenantId).first();
      orgName = tenant?.name;
    } catch {
    }
    try {
      const { results: rows } = await db.prepare(
        "SELECT key, value FROM tenant_preferences WHERE tenant_id = ? AND key IN ('logo_url', 'accent_color')"
      ).bind(user.tenantId).all();
      for (const row of rows ?? []) {
        if (row.key === "logo_url") branding.logoUrl = row.value;
        if (row.key === "accent_color") branding.accentColor = row.value;
      }
    } catch {
    }
  }
  return {
    session: {
      authenticated: true,
      email: user.email,
      roles: user.roles,
      superAdmin: user.superAdmin,
      tenantId: user.tenantId,
      displayName: user.displayName,
      impersonating: user.impersonating,
      impersonatedBy: user.impersonatedBy,
      orgName,
      branding
    }
  };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 0;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-DvqwG63H.js')).default;
const universal = {
  "load": null,
  "ssr": false,
  "csr": true,
  "prerender": false,
  "trailingSlash": "ignore"
};
const universal_id = "src/routes/+layout.ts";
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.DKMKcWxd.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/D_N7yGBI.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/DrIfTPVU.js","_app/immutable/chunks/CrCLcc6v.js","_app/immutable/chunks/BMeIYSur.js","_app/immutable/chunks/ClsUfVDQ.js","_app/immutable/chunks/nsdYOAOH.js","_app/immutable/chunks/ZSo0cKVk.js","_app/immutable/chunks/DhWqsumH2.js","_app/immutable/chunks/DDQN4uxV.js","_app/immutable/chunks/Ivb-FdQU.js","_app/immutable/chunks/Bnv5GG-D.js","_app/immutable/chunks/C39MHDvM.js","_app/immutable/chunks/DEfbl42g.js","_app/immutable/chunks/Brc9Lj5R.js","_app/immutable/chunks/PVo9aWGi.js","_app/immutable/chunks/D-rU2CBR.js","_app/immutable/chunks/C2v-JNmd.js","_app/immutable/chunks/DFvlQS2N.js","_app/immutable/chunks/DzRcqORN.js","_app/immutable/chunks/C9ZDKyD7.js","_app/immutable/chunks/C8KEfPX-.js","_app/immutable/chunks/DUz1OcyK.js","_app/immutable/chunks/D71e7Q_S2.js","_app/immutable/chunks/D4s80c7-2.js","_app/immutable/chunks/Dthfo4_u2.js","_app/immutable/chunks/BoNtx0N_2.js","_app/immutable/chunks/DLHZEpzF2.js","_app/immutable/chunks/DJRK6Xfs2.js","_app/immutable/chunks/DU3ptFL52.js","_app/immutable/chunks/DWLDpNe62.js","_app/immutable/chunks/CoRphIgE.js","_app/immutable/chunks/Bh5OcN9T.js","_app/immutable/chunks/Cv3-0z3g.js","_app/immutable/chunks/BJ3etHQ5.js","_app/immutable/chunks/DQ46EPfS.js","_app/immutable/chunks/d3KSaFOY.js","_app/immutable/chunks/MZhQ1O-m.js","_app/immutable/chunks/KndhhaTB.js","_app/immutable/chunks/nykvSIrd.js"];
const stylesheets = ["_app/immutable/assets/0.Ctxwe4C9.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, universal, universal_id };
//# sourceMappingURL=0-4WzfTU1Z.js.map
