import {
  $ as e,
  A as t,
  F as n,
  H as r,
  I as i,
  L as a,
  N as o,
  P as s,
  Q as c,
  R as l,
  Tt as u,
  U as d,
  V as f,
  W as p,
  Z as m,
  _ as h,
  a as g,
  at as _,
  b as v,
  bt as y,
  ct as b,
  ft as x,
  j as S,
  l as C,
  mt as w,
  ot as T,
  pt as E,
  q as D,
  r as O,
  s as k,
  st as A,
  ut as j,
  v as M,
  w as ee,
  wt as N,
  xt as te,
  y as ne,
  z as P,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as F } from "../chunks/D4lFFHu4.js";
import { t as re } from "../chunks/_6xtu--D.js";
import { t as ie } from "../chunks/Bbgqa3ML.js";
import { t as ae } from "../chunks/VtRqrqjA.js";
import { t as oe } from "../chunks/CMgwAYwY.js";
import { t as se } from "../chunks/Cdj3j7qG.js";
import { t as ce } from "../chunks/B8cBQjgm.js";
import { t as le } from "../chunks/BdOUJI0P.js";
import { t as ue } from "../chunks/DXjbeGQ-.js";
import { t as de } from "../chunks/CMGwYO6i2.js";
import { t as fe } from "../chunks/Cq3i_Tgy2.js";
import { t as pe } from "../chunks/BXmH0DjJ2.js";
import { n as I, t as L } from "../chunks/BEJa09Kq2.js";
import { t as me } from "../chunks/Da7GIpgR2.js";
import { t as he } from "../chunks/B2LjsFjQ2.js";
import { t as R } from "../chunks/Cue2Cs472.js";
import { t as ge } from "../chunks/DmQt9wwK2.js";
import { t as z } from "../chunks/C8W1vu9i2.js";
import { t as B } from "../chunks/ejJaicvO2.js";
import { t as _e } from "../chunks/oRaErrij2.js";
import { t as ve } from "../chunks/CohZSUWO.js";
import { t as ye } from "../chunks/Bsj77roc.js";
import { n as be, r as xe, t as Se } from "../chunks/2hGTnjdH.js";
import { n as Ce, r as we } from "../chunks/CiPWnwLM.js";
function Te(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [[`path`, { d: `M5 12h14` }]];
  re(
    e,
    k({ name: `minus` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = l();
        (S(T(r), t, `default`, {}, null), a(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function Ee(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [
        `path`,
        { d: `M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z` },
      ],
    ];
  re(
    e,
    k({ name: `play` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = l();
        (S(T(r), t, `default`, {}, null), a(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function De(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2` }],
      [`circle`, { cx: `9`, cy: `7`, r: `4` }],
      [`line`, { x1: `22`, x2: `16`, y1: `11`, y2: `11` }],
    ];
  re(
    e,
    k({ name: `user-minus` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = l();
        (S(T(r), t, `default`, {}, null), a(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var Oe = P(`<option> </option>`),
  ke = P(`<div class="grid grid-cols-1 md:grid-cols-4 gap-4"></div> <!>`, 1),
  Ae = P(
    `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><!></div> <div><div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">New Joiners (30d)</div></div></div>`,
  ),
  je = P(
    `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><!></div> <div><div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Active Users</div></div></div>`,
  ),
  Me = P(
    `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><!></div> <div><div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Deactivated</div></div></div>`,
  ),
  Ne = P(
    `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><!></div> <div><div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Workflow Runs</div></div></div>`,
  ),
  Pe = P(
    `<!> <div><!> <div> </div> <div class="text-xs text-muted-foreground mt-0.5"> </div></div>`,
    1,
  ),
  Fe = P(
    `<div class="flex items-center justify-center gap-2 md:gap-4"></div> <p class="text-[11px] text-muted-foreground text-center mt-3 mb-1"> </p>`,
    1,
  ),
  Ie = P(`<!> <!> <!>`, 1),
  Le = P(`<!> Create Role`, 1),
  Re = P(
    `<!> <p class="text-lg font-medium">No lifecycle policies configured</p> <p class="text-sm mt-1">Create your first role to define which apps each team gets.</p> <p class="text-xs mt-2 text-amber-600 dark:text-amber-400">JML automation (auto-provisioning on hire/transfer/offboard) requires at least one role with app entitlements.</p> <!>`,
    1,
  ),
  ze = P(`<span class="text-sm text-muted-foreground ml-2"> </span>`),
  Be = P(
    `<div class="p-3 rounded bg-amber-500/10 border border-amber-500/20"><p class="text-sm text-amber-700 dark:text-amber-400">No app entitlements configured. Users assigned to this role won't receive automatic provisioning.</p> <!></div>`,
  ),
  Ve = P(
    `<div class="flex items-center gap-2 p-2 rounded bg-muted/50"><span class="text-sm font-medium"> </span> <!></div>`,
  ),
  He = P(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"></div>`),
  Ue = P(`<!> <div class="flex gap-2 mt-2"><!></div>`, 1),
  We = P(`<div class="mt-4 pt-3 border-t space-y-2"><!></div>`),
  Ge = P(
    `<div class="flex items-center justify-between"><div class="flex items-center gap-3"><!> <div><span class="font-medium"> </span> <!></div></div> <div class="flex items-center gap-3 text-sm text-muted-foreground"><span> </span> <span class="text-xs">|</span> <span> </span></div></div> <!>`,
    1,
  ),
  Ke = P(`<div class="space-y-2"></div>`),
  qe = P(
    `<div><button type="button" class="flex items-center gap-2 mb-2 hover:text-foreground transition-colors"><!> <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"> </h3></button> <!></div>`,
  ),
  Je = P(
    `<div class="space-y-4"><div class="flex items-center justify-between"><p class="text-sm text-muted-foreground">Define which apps each role gets. When users join or leave, access is provisioned automatically.</p> <!></div> <!></div>`,
  ),
  Ye = P(`<!> `, 1),
  Xe = P(
    `<div class="flex items-center gap-2"><!> <select class="h-9 rounded-md border border-input bg-background px-2 text-xs"><option>Joiner</option><option>Mover</option><option>Leaver</option></select> <!></div>`,
  ),
  Ze = P(
    `<!> <p class="text-lg font-semibold mb-1">Failed to load users</p> <p class="text-sm text-muted-foreground mb-5">Could not fetch directory users. Check your connection and try again.</p> <!>`,
    1,
  ),
  Qe = P(
    `<!> <p class="text-lg font-semibold mb-1">No directory users</p> <p class="text-sm text-muted-foreground mb-5">Sync your directory to see users in the lifecycle pipeline.</p> <a href="/console/directory"><!></a>`,
    1,
  ),
  $e = P(`<div class="text-xs text-muted-foreground"> </div>`),
  et = P(
    `<tr><td class="px-4 py-3"><input type="checkbox" class="rounded"/></td><td class="px-4 py-3"><div><div class="font-medium"> </div> <!></div></td><td class="px-4 py-3 text-muted-foreground hidden md:table-cell"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell"> </td><td class="px-4 py-3 text-right"><div class="flex items-center justify-end gap-1"><button type="button" class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors bg-green-500/10 text-green-500 hover:bg-green-500/20" title="Run joiner workflow"><!> J</button> <button type="button" class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20" title="Run mover workflow"><!> M</button> <button type="button" class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20" title="Run leaver workflow"><!> L</button></div></td></tr>`,
  ),
  tt = P(`<div class="px-4 py-3 text-xs text-muted-foreground border-t text-center"> </div>`),
  nt = P(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-2.5 font-medium w-8"><input type="checkbox" class="rounded"/></th><th class="px-4 py-2.5 font-medium">User</th><th class="px-4 py-2.5 font-medium hidden md:table-cell">Department</th><th class="px-4 py-2.5 font-medium">Status</th><th class="px-4 py-2.5 font-medium hidden lg:table-cell">Added</th><th class="px-4 py-2.5 font-medium text-right">Actions</th></tr></thead><tbody></tbody></table></div> <!>`,
    1,
  ),
  rt = P(
    `<div class="space-y-4"><div class="flex flex-wrap items-end gap-3"><div class="flex-1 max-w-sm"><!></div> <select class="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>All statuses</option><option>Active</option><option>Inactive</option><option>Suspended</option></select> <!></div> <!></div>`,
  ),
  it = P(
    `<!> <p class="text-lg font-semibold mb-1">No connected apps</p> <p class="text-sm text-muted-foreground mb-5">Connect applications from the Marketplace to enable JML workflows.</p> <a href="/console/marketplace"><!></a>`,
    1,
  ),
  at = P(`<!> Run`, 1),
  ot = P(
    `<div class="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50"><div class="flex items-center gap-2"><span> </span> <!></div> <!></div>`,
  ),
  st = P(
    `<div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg></div> <div><div class="font-semibold"> </div> <div class="text-xs text-muted-foreground capitalize"> </div></div></div> <div class="space-y-2"></div>`,
    1,
  ),
  ct = P(`<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"></div>`),
  lt = P(`<div class="space-y-4"><!> <!></div>`),
  ut = P(`<p class="text-sm text-muted-foreground text-center py-6">No workflow runs yet</p>`),
  dt = P(
    `<tr class="bg-muted/20 border-l-4 border-l-primary/40"><td colspan="5" class="px-4 py-4"><div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs"><div><span class="font-semibold text-muted-foreground">Run ID</span> <div class="font-mono mt-0.5 break-all"> </div></div> <div><span class="font-semibold text-muted-foreground">Started</span> <div class="mt-0.5"> </div></div> <div><span class="font-semibold text-muted-foreground">Completed</span> <div class="mt-0.5"> </div></div></div></td></tr>`,
  ),
  ft = P(
    `<tr><td class="px-4 py-3"><!></td><td class="px-4 py-3"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground hidden md:table-cell"> </td><td class="px-4 py-3 text-right"><span class="text-muted-foreground"> </span></td></tr> <!>`,
    1,
  ),
  pt = P(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Type</th><th class="px-4 py-3 font-medium">User</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium hidden md:table-cell">Steps</th><th class="px-4 py-3 font-medium text-right">When</th></tr></thead><tbody></tbody></table></div>`,
  ),
  mt = P(`<!> <!>`, 1),
  ht = P(
    `<p class="text-sm text-muted-foreground text-center py-6">No directory changes recorded</p>`,
  ),
  gt = P(
    `<div class="flex items-center gap-3 px-3 py-2.5 rounded-md bg-muted/50"><!> <div class="flex-1 min-w-0"><div class="text-xs font-medium truncate"> </div> <div class="text-[11px] text-muted-foreground"> </div></div></div>`,
  ),
  _t = P(`<div class="space-y-2"></div>`),
  vt = P(`<!> <!>`, 1),
  yt = P(`<div class="space-y-6"><!> <!></div>`),
  bt = P(`<div class="grid grid-cols-2 md:grid-cols-4 gap-4"><!> <!> <!> <!></div> <!> <!> <!>`, 1),
  xt = P(`<button type="button"> </button>`),
  St = P(`<option> </option>`),
  Ct = P(
    `<div class="space-y-3 rounded-md border border-border p-3"><p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role & Group Changes</p> <div class="grid grid-cols-2 gap-3"><div class="space-y-1"><!> <!></div> <div class="space-y-1"><!> <!></div> <div class="col-span-2 space-y-1"><!> <!></div></div> <div class="grid grid-cols-2 gap-3"><div class="space-y-1"><!> <!></div> <div class="space-y-1"><!> <!></div></div> <div class="grid grid-cols-2 gap-3"><div class="space-y-1"><!> <!></div> <div class="space-y-1"><!> <!></div></div></div>`,
  ),
  wt = P(
    `<div class="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-muted"><span class="font-mono text-[10px] text-muted-foreground shrink-0"></span> </div>`,
  ),
  Tt = P(
    `<div><p class="text-xs text-muted-foreground mb-2"> </p> <div class="space-y-1"></div></div>`,
  ),
  Et = P(
    `<div class="space-y-4"><div class="space-y-1.5"><!> <div class="flex gap-2"></div></div> <div class="space-y-1.5"><!> <select class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"></select></div> <div class="space-y-1.5"><!> <!></div> <!> <!> <!></div>`,
  ),
  Dt = P(`<!> <span class="text-sm font-medium text-green-500">Workflow completed</span>`, 1),
  Ot = P(`<!> <span class="text-sm font-medium text-destructive">Workflow failed</span>`, 1),
  kt = P(`<p class="text-xs text-muted-foreground"> </p>`),
  At = P(
    `<div class="flex items-center gap-2 px-3 py-2 rounded bg-muted"><!> <span class="text-xs"> </span></div>`,
  ),
  jt = P(
    `<div class="space-y-3"><div class="flex items-center gap-2 mb-2"><!></div> <!> <!> <!></div>`,
  ),
  Mt = P(`<!> <!>`, 1),
  Nt = P(
    `<div class="space-y-4"><h3 class="text-lg font-semibold text-destructive">Confirm Leaver Workflow</h3> <p class="text-sm text-muted-foreground"> </p> <!></div>`,
  ),
  Pt = P(`<option> </option>`),
  Ft = P(
    `<div><!> <select class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option>None</option><!></select></div>`,
  ),
  It = P(`<!> <!>`, 1),
  Lt = P(
    `<div class="space-y-4"><h3 class="text-lg font-semibold">Create Lifecycle Role</h3> <p class="text-sm text-muted-foreground">Roles define which apps users get when they join, move, or leave.</p> <div class="space-y-3"><div><!> <!></div> <div><!> <!></div> <div><!> <select class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Org-wide (applies to all employees)</option><option>Department</option><option>Team</option></select></div> <!></div> <!></div>`,
  ),
  Rt = P(
    `<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Lifecycle Workflows</h1> <p class="text-sm text-muted-foreground">Joiner / Mover / Leaver pipeline across your connected applications</p></div> <div class="flex items-center gap-2"><select class="h-9 rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"></select></div></div> <!></div> <!> <!> <!>`,
    1,
  );
function zt(g, S) {
  te(S, !1);
  let k = b(),
    P = b(),
    re = b(),
    zt = b(),
    Bt = b(),
    V = b(),
    Vt = b(),
    H = b(),
    Ht = b(),
    Ut = b(),
    Wt = b();
  function Gt(e) {
    return e.replace(/[-_]/g, ` `).replace(/\b\w/g, (e) => e.toUpperCase());
  }
  function Kt(e) {
    return e.map((e) => ({ name: Gt(e), description: e }));
  }
  function qt(e) {
    let t = Date.now() - new Date(e).getTime(),
      n = Math.floor(t / 6e4);
    if (n < 1) return `just now`;
    if (n < 60) return `${n}m ago`;
    let r = Math.floor(n / 60);
    return r < 24 ? `${r}h ago` : `${Math.floor(r / 24)}d ago`;
  }
  function Jt(e) {
    return we.find((t) => t.id === e)?.name || Gt(e);
  }
  let Yt = b(!0),
    U = b(`policies`),
    Xt = b(`okta`),
    Zt = b(``),
    W = b(new Set());
  function Qt(e) {
    (p(W).has(e) ? p(W).delete(e) : p(W).add(e), j(W, p(W)));
  }
  let G = b([]),
    $t = b(null),
    en = b(null),
    tn = b(!1),
    nn = b(!1),
    rn = b(``),
    an = b(``),
    on = b(`team`),
    sn = b(``),
    cn = b(!1),
    ln = b([]),
    K = b([]),
    q = b([]),
    un = b([]),
    dn = b(!1),
    J = b(null),
    Y = b(`joiner`),
    X = b(``),
    Z = b(!1),
    Q = b(null),
    fn = b(``),
    pn = b(``),
    mn = b(``),
    hn = b(``),
    gn = b(``),
    _n = b(``),
    vn = b(``),
    $ = b(new Set()),
    yn = b(`joiner`),
    bn = b(0),
    xn = b(0),
    Sn = b(!1),
    Cn = b(null),
    wn = b(``),
    Tn = b(!1),
    En = b(``),
    Dn = b(`all`),
    On = {
      joiner: `bg-green-500/10 text-green-500 border-green-500/20`,
      mover: `bg-primary/10 text-primary border-primary/20`,
      leaver: `bg-destructive/10 text-destructive border-destructive/20`,
    },
    kn = [
      { id: `okta`, label: `Okta` },
      { id: `google_workspace`, label: `Google Workspace` },
      { id: `active_directory`, label: `Active Directory` },
      { id: `entra_id`, label: `Entra ID` },
    ];
  async function An() {
    (j(Yt, !0), await Promise.all([jn(), Pn(), In(), Ln(), Rn(), zn()]), j(Yt, !1));
  }
  async function jn() {
    try {
      let e = await fetch(`/api/roles`);
      e.ok && j(G, (await e.json()).roles || []);
    } catch {
      j(G, []);
    }
  }
  async function Mn(e) {
    if (p($t) === e) {
      (j($t, null), j(en, null));
      return;
    }
    (j($t, e), j(tn, !0));
    try {
      let t = await fetch(`/api/roles/${e}`);
      t.ok && j(en, (await t.json()).role);
    } catch {
      j(en, null);
    }
    j(tn, !1);
  }
  async function Nn() {
    if (p(rn).trim()) {
      j(cn, !0);
      try {
        let e = await fetch(`/api/roles`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({
            name: p(rn).trim(),
            description: p(an).trim() || null,
            level: p(on),
            parentId: p(sn) || null,
          }),
        });
        e.ok
          ? (F({ variant: `success`, message: `Role "${p(rn)}" created` }),
            j(nn, !1),
            j(rn, ``),
            j(an, ``),
            j(on, `team`),
            j(sn, ``),
            await jn())
          : F({ variant: `error`, message: (await e.json()).error || `Failed to create role` });
      } catch {
        F({ variant: `error`, message: `Failed to create role` });
      }
      j(cn, !1);
    }
  }
  async function Pn() {
    try {
      let e = await fetch(`/api/apps/status`),
        t = e.ok ? await e.json() : { applications: [] },
        n = {};
      for (let e of t.applications || []) e.connected && (n[e.id] = !0);
      let r = await fetch(`/api/apps/lifecycle/workflows`, {
        method: `POST`,
        headers: { "content-type": `application/json` },
        body: JSON.stringify({ scope: `all`, idpSource: p(Xt) }),
      });
      if (r.ok) {
        let e = await r.json(),
          t = e.applications || e.workflows || [];
        Array.isArray(t) && t.length > 0
          ? j(
              ln,
              t.map((e) => ({
                appId: e.appId,
                appName: we.find((t) => t.id === e.appId)?.name || Gt(e.appId),
                category: e.category || `productivity`,
                connected: !!n[e.appId] || !!e.connected,
                joiner: Array.isArray(e.joiner) ? Kt(e.joiner) : [],
                mover: Array.isArray(e.mover) ? Kt(e.mover) : [],
                leaver: Array.isArray(e.leaver) ? Kt(e.leaver) : [],
              })),
            )
          : Fn(n);
      } else Fn(n);
    } catch {
      Fn({});
    }
  }
  function Fn(e) {
    j(
      ln,
      we.map((t) => ({
        appId: t.id,
        appName: t.name,
        category: t.category,
        connected: !!e[t.id],
        joiner: [
          { name: `Provision account`, description: `Create ${t.name} account` },
          { name: `Assign license`, description: `Assign ${t.name} license` },
          { name: `Set permissions`, description: `Configure ${t.name} permissions` },
        ],
        mover: [
          { name: `Review access`, description: `Audit ${t.name} access` },
          { name: `Update permissions`, description: `Adjust ${t.name} permissions` },
          { name: `Transfer ownership`, description: `Transfer ${t.name} resources` },
        ],
        leaver: [
          { name: `Revoke access`, description: `Disable ${t.name} account` },
          { name: `Backup data`, description: `Archive ${t.name} data` },
          { name: `Remove license`, description: `Deallocate ${t.name} license` },
        ],
      })),
    );
  }
  async function In() {
    j(Tn, !1);
    try {
      let e = await fetch(`/api/directory/users?limit=500`);
      e.ok ? j(K, (await e.json()).users || []) : (j(Tn, !0), j(K, []));
    } catch {
      (j(Tn, !0), j(K, []));
    }
  }
  async function Ln() {
    try {
      let e = await fetch(`/api/jml/runs?limit=50`);
      e.ok && j(q, (await e.json()).runs || []);
    } catch {
      j(q, []);
    }
  }
  async function Rn() {
    try {
      let e = await fetch(`/api/jml/changelog?limit=20`);
      e.ok && j(un, (await e.json()).entries || []);
    } catch {
      j(un, []);
    }
  }
  async function zn() {
    try {
      let e = await fetch(`/api/directory/connect`);
      if (e.ok) {
        let t = await e.json();
        t.provider && j(Xt, t.provider);
      }
    } catch {}
  }
  function Bn(e, t) {
    (j(J, e),
      j(Y, t),
      j(X, ``),
      j(fn, ``),
      j(pn, ``),
      j(mn, ``),
      j(hn, ``),
      j(gn, ``),
      j(_n, ``),
      j(vn, ``),
      j(Q, null),
      j(dn, !0));
  }
  function Vn(e, t) {
    (j(J, p(V)[0] || null), j(Y, t), j(X, e.email), j(Q, null), j(dn, !0));
  }
  function Hn(e) {
    (p($).has(e) ? p($).delete(e) : p($).add(e), j($, new Set(p($))));
  }
  function Un() {
    p($).size === p(H).length ? j($, new Set()) : j($, new Set(p(H).map((e) => e.id)));
  }
  async function Wn() {
    let e = p(K)
      .filter((e) => p($).has(e.id))
      .map((e) => e.email);
    if (e.length !== 0) {
      if (p(yn) === `leaver`) {
        (j(
          wn,
          `This will run the leaver workflow for ${e.length} user(s). This may revoke access irreversibly.`,
        ),
          j(Cn, () => Gn(e)),
          j(Sn, !0));
        return;
      }
      await Gn(e);
    }
  }
  async function Gn(e) {
    (j(Z, !0), j(bn, 0), j(xn, e.length));
    let t = 0,
      n = 0,
      r = [];
    for (let i of e) {
      try {
        (
          await fetch(`/api/workflows/execute`, {
            method: `POST`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ type: p(yn), subjectEmail: i, idpSource: p(Xt) }),
          })
        ).ok
          ? t++
          : (n++, r.push(i));
      } catch {
        (n++, r.push(i));
      }
      x(bn);
    }
    (j(Z, !1), j(bn, 0), j(xn, 0), j($, new Set()));
    let i =
      r.length > 0
        ? ` (failed: ${r.slice(0, 3).join(`, `)}${r.length > 3 ? ` +${r.length - 3} more` : ``})`
        : ``;
    (F({
      message: `Bulk ${p(yn)}: ${t} succeeded, ${n} failed${i}`,
      variant: n > 0 ? `error` : `success`,
    }),
      Ln(),
      Rn());
  }
  async function Kn() {
    if (!(!p(J) || !p(X))) {
      if (p(Y) === `leaver`) {
        (j(
          wn,
          `This will revoke access for ${p(X)} across all configured apps. This action may be irreversible.`,
        ),
          j(Cn, () => qn()),
          j(Sn, !0));
        return;
      }
      await qn();
    }
  }
  async function qn() {
    if (!(!p(J) || !p(X))) {
      (j(Z, !0), j(Q, null));
      try {
        let e = await fetch(`/api/workflows/execute`, {
            method: `POST`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({
              appId: p(J).appId,
              type: p(Y),
              subjectEmail: p(X),
              idpSource: p(Xt),
              ...(p(Y) === `mover`
                ? {
                    moverContext: {
                      newDepartment: p(fn) || void 0,
                      newTitle: p(pn) || void 0,
                      newManager: p(mn) || void 0,
                      groupsToAdd: p(hn)
                        ? p(hn)
                            .split(`,`)
                            .map((e) => e.trim())
                            .filter(Boolean)
                        : void 0,
                      groupsToRemove: p(gn)
                        ? p(gn)
                            .split(`,`)
                            .map((e) => e.trim())
                            .filter(Boolean)
                        : void 0,
                      appsToAdd: p(_n)
                        ? p(_n)
                            .split(`,`)
                            .map((e) => e.trim())
                            .filter(Boolean)
                        : void 0,
                      appsToRevoke: p(vn)
                        ? p(vn)
                            .split(`,`)
                            .map((e) => e.trim())
                            .filter(Boolean)
                        : void 0,
                    },
                  }
                : {}),
            }),
          }),
          t = await e.json().catch(() => null);
        e.ok
          ? t?.steps
            ? (j(Q, t),
              F({ message: `${p(Y)} workflow completed for ${p(X)}`, variant: `success` }))
            : (j(Q, {
                success: !0,
                steps: (p(J)[p(Y)] || []).map((e) => ({ name: e.name, status: `success` })),
                message: `${p(Y)} workflow executed for ${p(X)}`,
              }),
              F({ message: `${p(Y)} workflow completed for ${p(X)}`, variant: `success` }))
          : (j(Q, {
              success: !1,
              steps: [],
              message: t?.error || `Workflow failed (HTTP ${e.status})`,
            }),
            F({ message: `${p(Y)} workflow failed for ${p(X)}`, variant: `error` }));
      } catch {
        (j(Q, { success: !1, steps: [], message: `Workflow execution service unavailable` }),
          F({ message: `Workflow execution failed`, variant: `error` }));
      }
      j(Z, !1);
    }
  }
  let Jn = b(null);
  (O(() => {
    let e = new URLSearchParams(window.location.search),
      t = e.get(`tab`);
    t && [`policies`, `pipeline`, `apps`, `activity`].includes(t) && j(U, t);
    let n = e.get(`run`);
    (n && (j(Jn, n), j(U, `activity`)), An());
  }),
    m(
      () => p(K),
      () => {
        j(
          k,
          p(K).filter((e) => {
            let t = new Date(e.createdAt).getTime();
            return e.status === `active` && Date.now() - t < 720 * 60 * 60 * 1e3;
          }),
        );
      },
    ),
    m(
      () => p(K),
      () => {
        j(
          P,
          p(K).filter((e) => e.status === `active`),
        );
      },
    ),
    m(
      () => p(K),
      () => {
        j(
          re,
          p(K).filter((e) => e.status !== `active`),
        );
      },
    ),
    m(
      () => p(q),
      () => {
        j(zt, p(q).slice(0, 10));
      },
    ),
    m(
      () => p(q),
      () => {
        j(Bt, {
          joiner: p(q).filter((e) => e.type === `joiner`).length,
          mover: p(q).filter((e) => e.type === `mover`).length,
          leaver: p(q).filter((e) => e.type === `leaver`).length,
        });
      },
    ),
    m(
      () => p(ln),
      () => {
        j(
          V,
          p(ln).filter((e) => e.connected),
        );
      },
    ),
    m(
      () => (p(V), p(Zt)),
      () => {
        j(
          Vt,
          p(V).filter((e) => !p(Zt) || e.appName.toLowerCase().includes(p(Zt).toLowerCase())),
        );
      },
    ),
    m(
      () => (p(K), p(Dn), p(En)),
      () => {
        j(
          H,
          p(K).filter(
            (e) =>
              !(
                (p(Dn) !== `all` && e.status !== p(Dn)) ||
                (p(En) &&
                  !e.email.toLowerCase().includes(p(En).toLowerCase()) &&
                  !(e.displayName || ``).toLowerCase().includes(p(En).toLowerCase()))
              ),
          ),
        );
      },
    ),
    m(
      () => p(G),
      () => {
        j(
          Ht,
          p(G).filter((e) => e.level === `org`),
        );
      },
    ),
    m(
      () => p(G),
      () => {
        j(
          Ut,
          p(G).filter((e) => e.level === `department`),
        );
      },
    ),
    m(
      () => p(G),
      () => {
        j(
          Wt,
          p(G).filter((e) => e.level === `team`),
        );
      },
    ),
    c(),
    C());
  var Yn = Rt(),
    Xn = T(Yn),
    Zn = _(Xn),
    Qn = A(_(Zn), 2),
    $n = _(Qn);
  (o(
    $n,
    5,
    () => kn,
    s,
    (t, n) => {
      var r = Oe(),
        o = _(r, !0);
      u(r);
      var s = {};
      (e(() => {
        (i(o, (p(n), D(() => p(n).label))),
          s !== (s = (p(n), D(() => p(n).id))) &&
            (r.value = (r.__value = (p(n), D(() => p(n).id))) ?? ``));
      }),
        a(t, r));
    },
  ),
    u($n),
    u(Qn),
    u(Zn));
  var er = A(Zn, 2),
    tr = (e) => {
      var t = ke(),
        n = T(t);
      (o(
        n,
        4,
        () => [1, 2, 3, 4],
        s,
        (e, t) => {
          _e(e, { class: `h-24 rounded-lg` });
        },
      ),
        u(n),
        _e(A(n, 2), { class: `h-64 rounded-lg` }),
        a(e, t));
    },
    nr = (c) => {
      var m = bt(),
        g = T(m),
        y = _(g);
      I(y, {
        children: (t, n) => {
          L(t, {
            class: `pt-5`,
            children: (t, n) => {
              var r = Ae(),
                o = _(r);
              (fe(_(o), { class: `w-5 h-5 text-green-500` }), u(o));
              var s = A(o, 2),
                c = _(s),
                l = _(c, !0);
              (u(c), N(2), u(s), u(r), e(() => i(l, (p(k), D(() => p(k).length)))), a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var b = A(y, 2);
      I(b, {
        children: (t, n) => {
          L(t, {
            class: `pt-5`,
            children: (t, n) => {
              var r = je(),
                o = _(r);
              (pe(_(o), { class: `w-5 h-5 text-primary` }), u(o));
              var s = A(o, 2),
                c = _(s),
                l = _(c, !0);
              (u(c), N(2), u(s), u(r), e(() => i(l, (p(P), D(() => p(P).length)))), a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var x = A(b, 2);
      (I(x, {
        children: (t, n) => {
          L(t, {
            class: `pt-5`,
            children: (t, n) => {
              var r = Me(),
                o = _(r);
              (De(_(o), { class: `w-5 h-5 text-destructive` }), u(o));
              var s = A(o, 2),
                c = _(s),
                l = _(c, !0);
              (u(c), N(2), u(s), u(r), e(() => i(l, (p(re), D(() => p(re).length)))), a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        I(A(x, 2), {
          children: (t, n) => {
            L(t, {
              class: `pt-5`,
              children: (t, n) => {
                var r = Ne(),
                  o = _(r);
                (ie(_(o), { class: `w-5 h-5 text-amber-500` }), u(o));
                var s = A(o, 2),
                  c = _(s),
                  l = _(c, !0);
                (u(c), N(2), u(s), u(r), e(() => i(l, (p(q), D(() => p(q).length)))), a(t, r));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        u(g));
      var S = A(g, 2);
      I(S, {
        children: (r, c) => {
          L(r, {
            class: `pt-5 pb-2`,
            children: (r, c) => {
              var l = Fe(),
                f = T(l);
              (o(
                f,
                5,
                () => (
                  p(Bt),
                  d(fe),
                  d(ae),
                  d(De),
                  D(() => [
                    {
                      type: `joiner`,
                      label: `Joiner`,
                      count: p(Bt).joiner,
                      icon: fe,
                      color: `text-green-500`,
                      bg: `bg-green-500/10 border-green-500/30`,
                    },
                    {
                      type: `mover`,
                      label: `Mover`,
                      count: p(Bt).mover,
                      icon: ae,
                      color: `text-primary`,
                      bg: `bg-primary/10 border-primary/30`,
                    },
                    {
                      type: `leaver`,
                      label: `Leaver`,
                      count: p(Bt).leaver,
                      icon: De,
                      color: `text-destructive`,
                      bg: `bg-destructive/10 border-destructive/30`,
                    },
                  ])
                ),
                s,
                (r, o, s) => {
                  var c = Pe(),
                    l = T(c),
                    d = (e) => {
                      se(e, { class: `w-5 h-5 text-muted-foreground/40 shrink-0 hidden md:block` });
                    };
                  n(l, (e) => {
                    s > 0 && e(d);
                  });
                  var f = A(l, 2),
                    m = _(f);
                  t(
                    m,
                    () => p(o).icon,
                    (e, t) => {
                      t(e, {
                        get class() {
                          return `w-6 h-6 mx-auto mb-1.5 ${(p(o), D(() => p(o).color)) ?? ``}`;
                        },
                      });
                    },
                  );
                  var h = A(m, 2),
                    g = _(h, !0);
                  u(h);
                  var v = A(h, 2),
                    y = _(v);
                  (u(v),
                    u(f),
                    e(() => {
                      (ee(
                        f,
                        1,
                        `flex-1 max-w-[200px] text-center rounded-lg border p-4 ${(p(o), D(() => p(o).bg)) ?? ``}`,
                      ),
                        ee(h, 1, `text-sm font-semibold ${(p(o), D(() => p(o).color)) ?? ``}`),
                        i(g, (p(o), D(() => p(o).label))),
                        i(
                          y,
                          `${(p(o), D(() => p(o).count)) ?? ``} run${(p(o), D(() => (p(o).count === 1 ? `` : `s`))) ?? ``}`,
                        ));
                    }),
                    a(r, c));
                },
              ),
                u(f));
              var m = A(f, 2),
                h = _(m);
              (u(m),
                e(() =>
                  i(
                    h,
                    `${(p(V), D(() => p(V).length)) ?? ``} connected app${(p(V), D(() => (p(V).length === 1 ? `` : `s`))) ?? ``} with lifecycle workflows configured`,
                  ),
                ),
                a(r, l));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var C = A(S, 2);
      xe(C, {
        get value() {
          return p(U);
        },
        set value(e) {
          j(U, e);
        },
        children: (e, t) => {
          be(e, {
            children: (e, t) => {
              var n = Ie(),
                r = T(n);
              {
                let e = E(() => p(U) === `policies`);
                Se(r, {
                  value: `policies`,
                  get active() {
                    return p(e);
                  },
                  $$events: { click: () => j(U, `policies`) },
                  children: (e, t) => {
                    (N(), a(e, f(`Lifecycle Policies`)));
                  },
                  $$slots: { default: !0 },
                });
              }
              var i = A(r, 2);
              {
                let e = E(() => p(U) === `pipeline`);
                Se(i, {
                  value: `pipeline`,
                  get active() {
                    return p(e);
                  },
                  $$events: { click: () => j(U, `pipeline`) },
                  children: (e, t) => {
                    (N(), a(e, f(`Users`)));
                  },
                  $$slots: { default: !0 },
                });
              }
              var o = A(i, 2);
              {
                let e = E(() => p(U) === `activity`);
                Se(o, {
                  value: `activity`,
                  get active() {
                    return p(e);
                  },
                  $$events: { click: () => j(U, `activity`) },
                  children: (e, t) => {
                    (N(), a(e, f(`Activity`)));
                  },
                  $$slots: { default: !0 },
                });
              }
              a(e, n);
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
        $$legacy: !0,
      });
      var O = A(C, 2),
        te = (t) => {
          var c = Je(),
            d = _(c);
          (R(A(_(d), 2), {
            size: `sm`,
            $$events: { click: () => j(nn, !0) },
            children: (e, t) => {
              var n = Le();
              (fe(T(n), { class: `w-4 h-4 mr-1` }), N(), a(e, n));
            },
            $$slots: { default: !0 },
          }),
            u(d));
          var m = A(d, 2),
            h = (e) => {
              I(e, {
                class: `border-dashed border-amber-500/50`,
                children: (e, t) => {
                  L(e, {
                    class: `py-12 text-center text-muted-foreground`,
                    children: (e, t) => {
                      var n = Re(),
                        r = T(n);
                      (de(r, { class: `w-12 h-12 mx-auto mb-3 text-amber-500 opacity-70` }),
                        R(A(r, 8), {
                          class: `mt-4`,
                          $$events: { click: () => j(nn, !0) },
                          children: (e, t) => {
                            (N(), a(e, f(`Create Role`)));
                          },
                          $$slots: { default: !0 },
                        }),
                        a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            g = (t) => {
              var c = l();
              (o(
                T(c),
                1,
                () => [
                  { label: `Org-wide`, level: `org`, items: p(Ht) },
                  { label: `Department`, level: `department`, items: p(Ut) },
                  { label: `Team`, level: `team`, items: p(Wt) },
                ],
                s,
                (t, c) => {
                  var d = l(),
                    m = T(d),
                    h = (t) => {
                      var l = qe(),
                        d = _(l),
                        m = _(d),
                        h = (e) => {
                          se(e, { class: `w-3.5 h-3.5 text-muted-foreground` });
                        },
                        g = w(() => (p(W), p(c), D(() => p(W).has(p(c).level)))),
                        v = (e) => {
                          oe(e, { class: `w-3.5 h-3.5 text-muted-foreground` });
                        };
                      n(m, (e) => {
                        p(g) ? e(h) : e(v, -1);
                      });
                      var y = A(m, 2),
                        b = _(y);
                      (u(y), u(d));
                      var x = A(d, 2),
                        S = (t) => {
                          var r = Ke();
                          (o(
                            r,
                            5,
                            () => (p(c), D(() => p(c).items)),
                            s,
                            (t, r) => {
                              I(t, {
                                class: `cursor-pointer hover:border-primary/30 transition-colors`,
                                $$events: { click: () => Mn(p(r).id) },
                                children: (t, c) => {
                                  L(t, {
                                    class: `p-4`,
                                    children: (t, c) => {
                                      var l = Ge(),
                                        d = T(l),
                                        m = _(d),
                                        h = _(m),
                                        g = (e) => {
                                          oe(e, { class: `w-4 h-4 text-muted-foreground` });
                                        },
                                        v = (e) => {
                                          se(e, { class: `w-4 h-4 text-muted-foreground` });
                                        };
                                      n(h, (e) => {
                                        (p($t), p(r), D(() => p($t) === p(r).id) ? e(g) : e(v, -1));
                                      });
                                      var y = A(h, 2),
                                        b = _(y),
                                        x = _(b, !0);
                                      u(b);
                                      var S = A(b, 2),
                                        C = (t) => {
                                          var n = ze(),
                                            o = _(n);
                                          (u(n),
                                            e(() =>
                                              i(o, `— ${(p(r), D(() => p(r).description)) ?? ``}`),
                                            ),
                                            a(t, n));
                                        };
                                      (n(S, (e) => {
                                        (p(r), D(() => p(r).description) && e(C));
                                      }),
                                        u(y),
                                        u(m));
                                      var w = A(m, 2),
                                        O = _(w),
                                        k = _(O);
                                      u(O);
                                      var j = A(O, 4),
                                        M = _(j);
                                      (u(j), u(w), u(d));
                                      var ee = A(d, 2),
                                        te = (t) => {
                                          var c = We(),
                                            l = _(c),
                                            d = (e) => {
                                              _e(e, { class: `h-8 w-full` });
                                            },
                                            m = (t) => {
                                              var c = Ue(),
                                                l = T(c),
                                                d = (e) => {
                                                  var t = Be(),
                                                    n = A(_(t), 2);
                                                  {
                                                    let e = E(
                                                      () => (
                                                        p(r),
                                                        D(
                                                          () =>
                                                            `/console/directory?tab=mappings&role=${p(r).id}`,
                                                        )
                                                      ),
                                                    );
                                                    R(n, {
                                                      size: `sm`,
                                                      variant: `outline`,
                                                      class: `mt-2`,
                                                      get href() {
                                                        return p(e);
                                                      },
                                                      children: (e, t) => {
                                                        (N(), a(e, f(`Add App Entitlements`)));
                                                      },
                                                      $$slots: { default: !0 },
                                                    });
                                                  }
                                                  (u(t), a(e, t));
                                                },
                                                m = (t) => {
                                                  var n = He();
                                                  (o(
                                                    n,
                                                    5,
                                                    () => (p(en), D(() => p(en).entitlements)),
                                                    s,
                                                    (t, n) => {
                                                      var r = Ve(),
                                                        o = _(r),
                                                        s = _(o, !0);
                                                      (u(o),
                                                        ge(A(o, 2), {
                                                          variant: `secondary`,
                                                          class: `text-xs`,
                                                          children: (t, r) => {
                                                            N();
                                                            var o = f();
                                                            (e(() =>
                                                              i(o, (p(n), D(() => p(n).appRole))),
                                                            ),
                                                              a(t, o));
                                                          },
                                                          $$slots: { default: !0 },
                                                        }),
                                                        u(r),
                                                        e(
                                                          (e) => i(s, e),
                                                          [() => (p(n), D(() => Jt(p(n).appId)))],
                                                        ),
                                                        a(t, r));
                                                    },
                                                  ),
                                                    u(n),
                                                    a(t, n));
                                                };
                                              n(l, (e) => {
                                                (p(en),
                                                  D(() => p(en).entitlements.length === 0)
                                                    ? e(d)
                                                    : e(m, -1));
                                              });
                                              var h = A(l, 2),
                                                g = _(h);
                                              {
                                                let e = E(
                                                  () => (
                                                    p(r),
                                                    D(
                                                      () =>
                                                        `/console/directory?tab=mappings&role=${p(r).id}`,
                                                    )
                                                  ),
                                                );
                                                R(g, {
                                                  size: `sm`,
                                                  variant: `outline`,
                                                  get href() {
                                                    return p(e);
                                                  },
                                                  children: (e, t) => {
                                                    (N(), a(e, f(`Manage Entitlements`)));
                                                  },
                                                  $$slots: { default: !0 },
                                                });
                                              }
                                              (u(h), a(t, c));
                                            };
                                          (n(l, (e) => {
                                            p(tn) ? e(d) : p(en) && e(m, 1);
                                          }),
                                            u(c),
                                            a(t, c));
                                        };
                                      (n(ee, (e) => {
                                        (p($t), p(r), D(() => p($t) === p(r).id) && e(te));
                                      }),
                                        e(() => {
                                          (i(x, (p(r), D(() => p(r).name))),
                                            i(
                                              k,
                                              `${(p(r), D(() => p(r).entitlementCount)) ?? ``} app${(p(r), D(() => (p(r).entitlementCount === 1 ? `` : `s`))) ?? ``}`,
                                            ),
                                            i(
                                              M,
                                              `${(p(r), D(() => p(r).assignmentCount)) ?? ``} assigned`,
                                            ));
                                        }),
                                        a(t, l));
                                    },
                                    $$slots: { default: !0 },
                                  });
                                },
                                $$slots: { default: !0 },
                              });
                            },
                          ),
                            u(r),
                            a(t, r));
                        },
                        C = w(() => (p(W), p(c), D(() => !p(W).has(p(c).level))));
                      (n(x, (e) => {
                        p(C) && e(S);
                      }),
                        u(l),
                        e(() =>
                          i(
                            b,
                            `${(p(c), D(() => p(c).label)) ?? ``} (${(p(c), D(() => p(c).items.length)) ?? ``})`,
                          ),
                        ),
                        r(`click`, d, () => Qt(p(c).level)),
                        a(t, l));
                    };
                  (n(m, (e) => {
                    (p(c), D(() => p(c).items.length > 0) && e(h));
                  }),
                    a(t, d));
                },
              ),
                a(t, c));
            };
          (n(m, (e) => {
            (p(G), D(() => p(G).length === 0) ? e(h) : e(g, -1));
          }),
            u(c),
            a(t, c));
        },
        F = (t) => {
          var c = rt(),
            l = _(c),
            d = _(l);
          (z(_(d), {
            type: `text`,
            placeholder: `Search users...`,
            get value() {
              return p(En);
            },
            set value(e) {
              j(En, e);
            },
            $$legacy: !0,
          }),
            u(d));
          var m = A(d, 2),
            g = _(m);
          g.value = g.__value = `all`;
          var y = A(g);
          y.value = y.__value = `active`;
          var b = A(y);
          b.value = b.__value = `inactive`;
          var x = A(b);
          ((x.value = x.__value = `suspended`), u(m));
          var S = A(m, 2),
            C = (t) => {
              var n = Xe(),
                r = _(n);
              ge(r, {
                variant: `secondary`,
                children: (t, n) => {
                  N();
                  var r = f();
                  (e(() => i(r, `${(p($), D(() => p($).size)) ?? ``} selected`)), a(t, r));
                },
                $$slots: { default: !0 },
              });
              var o = A(r, 2),
                s = _(o);
              s.value = s.__value = `joiner`;
              var c = A(s);
              c.value = c.__value = `mover`;
              var l = A(c);
              ((l.value = l.__value = `leaver`),
                u(o),
                R(A(o, 2), {
                  size: `sm`,
                  get disabled() {
                    return p(Z);
                  },
                  $$events: { click: Wn },
                  children: (t, n) => {
                    var r = Ye(),
                      o = T(r);
                    Ee(o, { class: `w-3 h-3 mr-1` });
                    var s = A(o);
                    (e(() =>
                      i(
                        s,
                        ` ${(p(Z), p(bn), p(xn), p($), D(() => (p(Z) ? `Processing ${p(bn)}/${p(xn)}...` : `Run for ${p($).size}`))) ?? ``}`,
                      ),
                    ),
                      a(t, r));
                  },
                  $$slots: { default: !0 },
                }),
                u(n),
                v(
                  o,
                  () => p(yn),
                  (e) => j(yn, e),
                ),
                a(t, n));
            };
          (n(S, (e) => {
            (p($), D(() => p($).size > 0) && e(C));
          }),
            u(l));
          var w = A(l, 2),
            O = (e) => {
              I(e, {
                class: `border-dashed border-destructive/30`,
                children: (e, t) => {
                  L(e, {
                    class: `py-10 text-center`,
                    children: (e, t) => {
                      var n = Ze(),
                        r = T(n);
                      (de(r, { class: `w-12 h-12 mx-auto mb-4 text-destructive/50` }),
                        R(A(r, 6), {
                          $$events: { click: In },
                          children: (e, t) => {
                            (N(), a(e, f(`Retry`)));
                          },
                          $$slots: { default: !0 },
                        }),
                        a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            k = (e) => {
              I(e, {
                class: `border-dashed`,
                children: (e, t) => {
                  L(e, {
                    class: `py-10 text-center`,
                    children: (e, t) => {
                      var n = Qe(),
                        r = T(n);
                      pe(r, { class: `w-12 h-12 mx-auto mb-4 text-muted-foreground/30` });
                      var i = A(r, 6);
                      (R(_(i), {
                        children: (e, t) => {
                          (N(), a(e, f(`Go to Directory`)));
                        },
                        $$slots: { default: !0 },
                      }),
                        u(i),
                        a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            M = (t) => {
              I(t, {
                children: (t, c) => {
                  L(t, {
                    class: `p-0`,
                    children: (t, c) => {
                      var l = nt(),
                        d = T(l),
                        m = _(d),
                        g = _(m),
                        v = _(g),
                        y = _(v),
                        b = _(y);
                      (h(b), u(y), N(5), u(v), u(g));
                      var x = A(g);
                      (o(
                        x,
                        5,
                        () => (p(H), D(() => p(H).slice(0, 50))),
                        s,
                        (t, o) => {
                          var s = et(),
                            c = _(s),
                            l = _(c);
                          (h(l), u(c));
                          var d = A(c),
                            m = _(d),
                            g = _(m),
                            v = _(g, !0);
                          u(g);
                          var y = A(g, 2),
                            b = (t) => {
                              var n = $e(),
                                r = _(n, !0);
                              (u(n), e(() => i(r, (p(o), D(() => p(o).email)))), a(t, n));
                            };
                          (n(y, (e) => {
                            (p(o), D(() => p(o).displayName) && e(b));
                          }),
                            u(m),
                            u(d));
                          var x = A(d),
                            S = _(x, !0);
                          u(x);
                          var C = A(x),
                            w = _(C);
                          {
                            let t = E(
                              () => (
                                p(o),
                                D(() =>
                                  p(o).status === `active`
                                    ? `success`
                                    : p(o).status === `suspended`
                                      ? `warning`
                                      : `secondary`,
                                )
                              ),
                            );
                            ge(w, {
                              get variant() {
                                return p(t);
                              },
                              children: (t, n) => {
                                N();
                                var r = f();
                                (e(() => i(r, (p(o), D(() => p(o).status)))), a(t, r));
                              },
                              $$slots: { default: !0 },
                            });
                          }
                          u(C);
                          var T = A(C),
                            O = _(T, !0);
                          u(T);
                          var k = A(T),
                            j = _(k),
                            M = _(j);
                          (fe(_(M), { class: `w-3 h-3` }), N(), u(M));
                          var te = A(M, 2);
                          (ae(_(te), { class: `w-3 h-3` }), N(), u(te));
                          var P = A(te, 2);
                          (De(_(P), { class: `w-3 h-3` }),
                            N(),
                            u(P),
                            u(j),
                            u(k),
                            u(s),
                            e(
                              (e, t, n) => {
                                (ee(s, 1, `border-t hover:bg-muted/50 ${e ?? ``}`),
                                  ne(l, t),
                                  i(v, (p(o), D(() => p(o).displayName || p(o).email))),
                                  i(S, (p(o), D(() => p(o).department || `—`))),
                                  i(O, n));
                              },
                              [
                                () => (
                                  p($),
                                  p(o),
                                  D(() => (p($).has(p(o).id) ? `bg-primary/5` : ``))
                                ),
                                () => (p($), p(o), D(() => p($).has(p(o).id))),
                                () => (p(o), D(() => qt(p(o).createdAt))),
                              ],
                            ),
                            r(`change`, l, () => Hn(p(o).id)),
                            r(`click`, M, () => Vn(p(o), `joiner`)),
                            r(`click`, te, () => Vn(p(o), `mover`)),
                            r(`click`, P, () => Vn(p(o), `leaver`)),
                            a(t, s));
                        },
                      ),
                        u(x),
                        u(m),
                        u(d));
                      var S = A(d, 2),
                        C = (t) => {
                          var n = tt(),
                            r = _(n);
                          (u(n),
                            e(() =>
                              i(
                                r,
                                `Showing 50 of ${(p(H), D(() => p(H).length)) ?? ``} users. Use search to narrow results.`,
                              ),
                            ),
                            a(t, n));
                        };
                      (n(S, (e) => {
                        (p(H), D(() => p(H).length > 50) && e(C));
                      }),
                        e(() =>
                          ne(
                            b,
                            (p($), p(H), D(() => p($).size === p(H).length && p(H).length > 0)),
                          ),
                        ),
                        r(`change`, b, Un),
                        a(t, l));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            };
          (n(w, (e) => {
            p(Tn) ? e(O) : (p(K), D(() => p(K).length === 0) ? e(k, 1) : e(M, -1));
          }),
            u(c),
            v(
              m,
              () => p(Dn),
              (e) => j(Dn, e),
            ),
            a(t, c));
        },
        ce = (t) => {
          var r = lt(),
            c = _(r);
          z(c, {
            type: `text`,
            placeholder: `Filter apps...`,
            class: `max-w-sm`,
            get value() {
              return p(Zt);
            },
            set value(e) {
              j(Zt, e);
            },
            $$legacy: !0,
          });
          var l = A(c, 2),
            m = (e) => {
              I(e, {
                class: `border-dashed`,
                children: (e, t) => {
                  L(e, {
                    class: `py-10 text-center`,
                    children: (e, t) => {
                      var n = it(),
                        r = T(n);
                      ue(r, { class: `w-12 h-12 mx-auto mb-4 text-muted-foreground/30` });
                      var i = A(r, 6);
                      (R(_(i), {
                        children: (e, t) => {
                          (N(), a(e, f(`Browse Marketplace`)));
                        },
                        $$slots: { default: !0 },
                      }),
                        u(i),
                        a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            h = (t) => {
              var n = ct();
              (o(
                n,
                5,
                () => p(Vt),
                s,
                (t, n) => {
                  I(t, {
                    class: `hover:border-primary/30 transition-colors`,
                    children: (t, r) => {
                      L(t, {
                        class: `pt-5`,
                        children: (t, r) => {
                          var c = st(),
                            l = T(c),
                            m = _(l),
                            h = _(m),
                            g = _(h);
                          (u(h), u(m));
                          var v = A(m, 2),
                            y = _(v),
                            b = _(y, !0);
                          u(y);
                          var x = A(y, 2),
                            S = _(x, !0);
                          (u(x), u(v), u(l));
                          var C = A(l, 2);
                          (o(
                            C,
                            4,
                            () => [
                              { type: `joiner`, label: `Joiner`, color: `text-green-500` },
                              { type: `mover`, label: `Mover`, color: `text-primary` },
                              { type: `leaver`, label: `Leaver`, color: `text-destructive` },
                            ],
                            s,
                            (t, r) => {
                              let o = E(() => (p(n), D(() => p(n)[r.type] || [])));
                              var s = ot(),
                                c = _(s),
                                l = _(c),
                                m = _(l, !0);
                              (u(l),
                                ge(A(l, 2), {
                                  variant: `secondary`,
                                  class: `text-[10px]`,
                                  children: (t, n) => {
                                    N();
                                    var r = f();
                                    (e(() =>
                                      i(r, `${(d(p(o)), D(() => p(o).length)) ?? ``} steps`),
                                    ),
                                      a(t, r));
                                  },
                                  $$slots: { default: !0 },
                                }),
                                u(c),
                                R(A(c, 2), {
                                  variant: `ghost`,
                                  size: `sm`,
                                  class: `h-7 px-2 text-xs`,
                                  $$events: { click: () => Bn(p(n), r.type) },
                                  children: (e, t) => {
                                    var n = at();
                                    (Ee(T(n), { class: `w-3 h-3 mr-1` }), N(), a(e, n));
                                  },
                                  $$slots: { default: !0 },
                                }),
                                u(s),
                                e(() => {
                                  (ee(l, 1, `text-xs font-medium ${D(() => r.color) ?? ``}`),
                                    i(
                                      m,
                                      D(() => r.label),
                                    ));
                                }),
                                a(t, s));
                            },
                          ),
                            u(C),
                            e(() => {
                              (M(
                                g,
                                `d`,
                                (d(Ce), p(n), D(() => Ce[p(n).category] || Ce.productivity)),
                              ),
                                i(b, (p(n), D(() => p(n).appName))),
                                i(S, (p(n), D(() => p(n).category))));
                            }),
                            a(t, c));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    $$slots: { default: !0 },
                  });
                },
              ),
                u(n),
                a(t, n));
            };
          (n(l, (e) => {
            (p(V), D(() => p(V).length === 0) ? e(m) : e(h, -1));
          }),
            u(r),
            a(t, r));
        },
        le = (t) => {
          var c = yt(),
            m = _(c);
          (I(m, {
            children: (t, c) => {
              var m = mt(),
                h = T(m);
              (me(h, {
                children: (e, t) => {
                  he(e, {
                    class: `text-base`,
                    children: (e, t) => {
                      (N(), a(e, f(`Workflow Runs`)));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              }),
                L(A(h, 2), {
                  class: `p-0`,
                  children: (t, c) => {
                    var m = l(),
                      h = T(m),
                      g = (e) => {
                        a(e, ut());
                      },
                      v = (t) => {
                        var c = pt(),
                          l = _(c),
                          m = A(_(l));
                        (o(
                          m,
                          5,
                          () => p(q),
                          s,
                          (t, o) => {
                            let s = E(
                              () => (
                                p(o),
                                D(
                                  () =>
                                    (p(o).status === `running` || p(o).status === `pending`) &&
                                    !p(o).completedAt &&
                                    p(o).startedAt &&
                                    Date.now() - new Date(p(o).startedAt).getTime() > 3600 * 1e3,
                                )
                              ),
                            );
                            var c = ft(),
                              l = T(c),
                              m = _(l),
                              h = _(m);
                            {
                              let t = E(
                                () => (
                                  p(o),
                                  D(() =>
                                    p(o).type === `joiner`
                                      ? `success`
                                      : p(o).type === `leaver`
                                        ? `destructive`
                                        : `default`,
                                  )
                                ),
                              );
                              ge(h, {
                                get variant() {
                                  return p(t);
                                },
                                class: `capitalize`,
                                children: (t, n) => {
                                  N();
                                  var r = f();
                                  (e(() => i(r, (p(o), D(() => p(o).type)))), a(t, r));
                                },
                                $$slots: { default: !0 },
                              });
                            }
                            u(m);
                            var g = A(m),
                              v = _(g, !0);
                            u(g);
                            var y = A(g),
                              b = _(y);
                            {
                              let t = E(
                                () => (
                                  p(o),
                                  d(p(s)),
                                  D(() =>
                                    p(o).status === `completed` || p(o).status === `success`
                                      ? `success`
                                      : p(o).status === `failed`
                                        ? `destructive`
                                        : p(s)
                                          ? `warning`
                                          : `info`,
                                  )
                                ),
                              );
                              ge(b, {
                                get variant() {
                                  return p(t);
                                },
                                class: `capitalize`,
                                children: (t, n) => {
                                  N();
                                  var r = f();
                                  (e(() =>
                                    i(
                                      r,
                                      (d(p(s)), p(o), D(() => (p(s) ? `Stalled` : p(o).status))),
                                    ),
                                  ),
                                    a(t, r));
                                },
                                $$slots: { default: !0 },
                              });
                            }
                            u(y);
                            var x = A(y),
                              S = _(x);
                            u(x);
                            var C = A(x),
                              w = _(C),
                              O = _(w, !0);
                            (u(w), u(C), u(l));
                            var k = A(l, 2),
                              te = (t) => {
                                var n = dt(),
                                  r = _(n),
                                  s = _(r),
                                  c = _(s),
                                  l = A(_(c), 2),
                                  d = _(l, !0);
                                (u(l), u(c));
                                var f = A(c, 2),
                                  m = A(_(f), 2),
                                  h = _(m, !0);
                                (u(m), u(f));
                                var g = A(f, 2),
                                  v = A(_(g), 2),
                                  y = _(v, !0);
                                (u(v),
                                  u(g),
                                  u(s),
                                  u(r),
                                  u(n),
                                  e(
                                    (e, t) => {
                                      (i(d, (p(o), D(() => p(o).id))), i(h, e), i(y, t));
                                    },
                                    [
                                      () => (
                                        p(o),
                                        D(() =>
                                          p(o).startedAt
                                            ? new Date(p(o).startedAt).toLocaleString()
                                            : `—`,
                                        )
                                      ),
                                      () => (
                                        p(o),
                                        D(() =>
                                          p(o).completedAt
                                            ? new Date(p(o).completedAt).toLocaleString()
                                            : `—`,
                                        )
                                      ),
                                    ],
                                  ),
                                  a(t, n));
                              };
                            (n(k, (e) => {
                              (p(Jn), p(o), D(() => p(Jn) === p(o).id) && e(te));
                            }),
                              e(
                                (e, t) => {
                                  (ee(
                                    l,
                                    1,
                                    `border-t hover:bg-muted/50 transition-colors cursor-pointer ${(p(Jn), p(o), D(() => (p(Jn) === p(o).id ? `bg-primary/5 border-l-2 border-l-primary` : ``))) ?? ``}`,
                                  ),
                                    i(v, (p(o), D(() => p(o).subjectEmail || p(o).email || `—`))),
                                    i(
                                      S,
                                      `${(p(o), D(() => p(o).stepsCompleted ?? p(o).stepsDone ?? 0)) ?? ``}/${(p(o), D(() => p(o).stepsTotal ?? 0)) ?? ``}`,
                                    ),
                                    M(w, `title`, e),
                                    i(O, t));
                                },
                                [
                                  () => (
                                    p(o),
                                    D(() =>
                                      p(o).startedAt
                                        ? new Date(p(o).startedAt).toLocaleString()
                                        : ``,
                                    )
                                  ),
                                  () => (
                                    p(o),
                                    D(() => (p(o).startedAt ? qt(p(o).startedAt) : `—`))
                                  ),
                                ],
                              ),
                              r(`click`, l, () => j(Jn, p(Jn) === p(o).id ? null : p(o).id)),
                              a(t, c));
                          },
                        ),
                          u(m),
                          u(l),
                          u(c),
                          a(t, c));
                      };
                    (n(h, (e) => {
                      (p(q), D(() => p(q).length === 0) ? e(g) : e(v, -1));
                    }),
                      a(t, m));
                  },
                  $$slots: { default: !0 },
                }),
                a(t, m));
            },
            $$slots: { default: !0 },
          }),
            I(A(m, 2), {
              children: (t, r) => {
                var c = vt(),
                  d = T(c);
                (me(d, {
                  children: (e, t) => {
                    he(e, {
                      class: `text-base`,
                      children: (e, t) => {
                        (N(), a(e, f(`Directory Changes`)));
                      },
                      $$slots: { default: !0 },
                    });
                  },
                  $$slots: { default: !0 },
                }),
                  L(A(d, 2), {
                    children: (t, r) => {
                      var c = l(),
                        d = T(c),
                        f = (e) => {
                          a(e, ht());
                        },
                        m = (t) => {
                          var r = _t();
                          (o(
                            r,
                            5,
                            () => p(un),
                            s,
                            (t, r) => {
                              var o = gt(),
                                s = _(o),
                                c = (e) => {
                                  fe(e, { class: `w-4 h-4 text-green-500 shrink-0` });
                                },
                                l = (e) => {
                                  De(e, { class: `w-4 h-4 text-destructive shrink-0` });
                                },
                                d = (e) => {
                                  ae(e, { class: `w-4 h-4 text-primary shrink-0` });
                                };
                              n(s, (e) => {
                                (p(r),
                                  D(
                                    () =>
                                      p(r).jmlAction === `joiner` || p(r).jmlAction === `created`,
                                  )
                                    ? e(c)
                                    : (p(r),
                                      D(
                                        () =>
                                          p(r).jmlAction === `leaver` ||
                                          p(r).jmlAction === `deactivated`,
                                      )
                                        ? e(l, 1)
                                        : e(d, -1)));
                              });
                              var f = A(s, 2),
                                m = _(f),
                                h = _(m, !0);
                              u(m);
                              var g = A(m, 2),
                                v = _(g);
                              (u(g),
                                u(f),
                                u(o),
                                e(
                                  (e) => {
                                    (i(h, (p(r), D(() => p(r).displayName || p(r).email))),
                                      i(
                                        v,
                                        `${(p(r), D(() => p(r).jmlAction)) ?? ``} • ${e ?? ``}`,
                                      ));
                                  },
                                  [() => (p(r), D(() => qt(p(r).createdAt)))],
                                ),
                                a(t, o));
                            },
                          ),
                            u(r),
                            a(t, r));
                        };
                      (n(d, (e) => {
                        (p(un), D(() => p(un).length === 0) ? e(f) : e(m, -1));
                      }),
                        a(t, c));
                    },
                    $$slots: { default: !0 },
                  }),
                  a(t, c));
              },
              $$slots: { default: !0 },
            }),
            u(c),
            a(t, c));
        };
      (n(O, (e) => {
        p(U) === `policies`
          ? e(te)
          : p(U) === `pipeline`
            ? e(F, 1)
            : p(U) === `apps`
              ? e(ce, 2)
              : p(U) === `activity` && e(le, 3);
      }),
        a(c, m));
    };
  (n(er, (e) => {
    p(Yt) ? e(tr) : e(nr, -1);
  }),
    u(Xn));
  var rr = A(Xn, 2);
  {
    let t = E(() => (p(J), D(() => (p(J) ? ` — ${p(J).appName}` : ``))));
    ve(rr, {
      get open() {
        return p(dn);
      },
      onClose: () => j(dn, !1),
      get title() {
        return `Run Workflow${p(t) ?? ``}`;
      },
      children: (t, c) => {
        var d = l(),
          m = T(d),
          h = (t) => {
            var c = l(),
              d = T(c),
              m = (t) => {
                var c = Et(),
                  l = _(c),
                  d = _(l);
                B(d, {
                  children: (e, t) => {
                    (N(), a(e, f(`Workflow Type`)));
                  },
                  $$slots: { default: !0 },
                });
                var m = A(d, 2);
                (o(
                  m,
                  4,
                  () => [`joiner`, `mover`, `leaver`],
                  s,
                  (t, n) => {
                    var o = xt(),
                      s = _(o, !0);
                    (u(o),
                      e(() => {
                        (ee(
                          o,
                          1,
                          `flex-1 py-2 text-xs font-medium rounded capitalize transition-colors border ${(p(Y), D(() => (p(Y) === n ? On[n] : `bg-muted text-muted-foreground border-transparent`))) ?? ``}`,
                        ),
                          i(s, n));
                      }),
                      r(`click`, o, () => j(Y, n)),
                      a(t, o));
                  },
                ),
                  u(m),
                  u(l));
                var h = A(l, 2),
                  g = _(h);
                B(g, {
                  children: (e, t) => {
                    (N(), a(e, f(`Target App`)));
                  },
                  $$slots: { default: !0 },
                });
                var y = A(g, 2);
                (o(
                  y,
                  5,
                  () => p(V),
                  s,
                  (t, n) => {
                    var r = St(),
                      o = _(r, !0);
                    u(r);
                    var s = {};
                    (e(() => {
                      (i(o, (p(n), D(() => p(n).appName))),
                        s !== (s = p(n)) && (r.value = (r.__value = p(n)) ?? ``));
                    }),
                      a(t, r));
                  },
                ),
                  u(y),
                  u(h));
                var b = A(h, 2),
                  x = _(b);
                (B(x, {
                  children: (e, t) => {
                    (N(), a(e, f(`Subject Email`)));
                  },
                  $$slots: { default: !0 },
                }),
                  z(A(x, 2), {
                    type: `email`,
                    placeholder: `user@company.com`,
                    get value() {
                      return p(X);
                    },
                    set value(e) {
                      j(X, e);
                    },
                    $$legacy: !0,
                  }),
                  u(b));
                var S = A(b, 2),
                  C = (e) => {
                    var t = Ct(),
                      n = A(_(t), 2),
                      r = _(n),
                      i = _(r);
                    (B(i, {
                      class: `text-xs`,
                      children: (e, t) => {
                        (N(), a(e, f(`New Department`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      z(A(i, 2), {
                        type: `text`,
                        placeholder: `Engineering`,
                        class: `h-8 text-xs`,
                        get value() {
                          return p(fn);
                        },
                        set value(e) {
                          j(fn, e);
                        },
                        $$legacy: !0,
                      }),
                      u(r));
                    var o = A(r, 2),
                      s = _(o);
                    (B(s, {
                      class: `text-xs`,
                      children: (e, t) => {
                        (N(), a(e, f(`New Title`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      z(A(s, 2), {
                        type: `text`,
                        placeholder: `Senior Engineer`,
                        class: `h-8 text-xs`,
                        get value() {
                          return p(pn);
                        },
                        set value(e) {
                          j(pn, e);
                        },
                        $$legacy: !0,
                      }),
                      u(o));
                    var c = A(o, 2),
                      l = _(c);
                    (B(l, {
                      class: `text-xs`,
                      children: (e, t) => {
                        (N(), a(e, f(`New Manager`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      z(A(l, 2), {
                        type: `email`,
                        placeholder: `manager@company.com`,
                        class: `h-8 text-xs`,
                        get value() {
                          return p(mn);
                        },
                        set value(e) {
                          j(mn, e);
                        },
                        $$legacy: !0,
                      }),
                      u(c),
                      u(n));
                    var d = A(n, 2),
                      m = _(d),
                      h = _(m);
                    (B(h, {
                      class: `text-xs`,
                      children: (e, t) => {
                        (N(), a(e, f(`Groups to Add`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      z(A(h, 2), {
                        type: `text`,
                        placeholder: `eng-team, devops`,
                        class: `h-8 text-xs`,
                        get value() {
                          return p(hn);
                        },
                        set value(e) {
                          j(hn, e);
                        },
                        $$legacy: !0,
                      }),
                      u(m));
                    var g = A(m, 2),
                      v = _(g);
                    (B(v, {
                      class: `text-xs`,
                      children: (e, t) => {
                        (N(), a(e, f(`Groups to Remove`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      z(A(v, 2), {
                        type: `text`,
                        placeholder: `sales-team`,
                        class: `h-8 text-xs`,
                        get value() {
                          return p(gn);
                        },
                        set value(e) {
                          j(gn, e);
                        },
                        $$legacy: !0,
                      }),
                      u(g),
                      u(d));
                    var y = A(d, 2),
                      b = _(y),
                      x = _(b);
                    (B(x, {
                      class: `text-xs`,
                      children: (e, t) => {
                        (N(), a(e, f(`Apps to Provision`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      z(A(x, 2), {
                        type: `text`,
                        placeholder: `github, jira`,
                        class: `h-8 text-xs`,
                        get value() {
                          return p(_n);
                        },
                        set value(e) {
                          j(_n, e);
                        },
                        $$legacy: !0,
                      }),
                      u(b));
                    var S = A(b, 2),
                      C = _(S);
                    (B(C, {
                      class: `text-xs`,
                      children: (e, t) => {
                        (N(), a(e, f(`Apps to Revoke`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      z(A(C, 2), {
                        type: `text`,
                        placeholder: `salesforce`,
                        class: `h-8 text-xs`,
                        get value() {
                          return p(vn);
                        },
                        set value(e) {
                          j(vn, e);
                        },
                        $$legacy: !0,
                      }),
                      u(S),
                      u(y),
                      u(t),
                      a(e, t));
                  };
                n(S, (e) => {
                  p(Y) === `mover` && e(C);
                });
                var w = A(S, 2),
                  T = (t) => {
                    var n = Tt(),
                      r = _(n),
                      c = _(r);
                    u(r);
                    var l = A(r, 2);
                    (o(
                      l,
                      5,
                      () => (p(J), p(Y), D(() => p(J)[p(Y)])),
                      s,
                      (t, n, r) => {
                        var o = wt(),
                          s = _(o);
                        s.textContent = `${r + 1}.`;
                        var c = A(s);
                        (u(o), e(() => i(c, ` ${(p(n), D(() => p(n).name)) ?? ``}`)), a(t, o));
                      },
                    ),
                      u(l),
                      u(n),
                      e(() => i(c, `Steps (${(p(J), p(Y), D(() => p(J)[p(Y)].length)) ?? ``})`)),
                      a(t, n));
                  };
                n(w, (e) => {
                  (p(J), p(Y), D(() => p(J)[p(Y)]?.length) && e(T));
                });
                var O = A(w, 2);
                {
                  let t = E(() => p(Z) || !p(X));
                  R(O, {
                    class: `w-full`,
                    get disabled() {
                      return p(t);
                    },
                    $$events: { click: Kn },
                    children: (t, n) => {
                      N();
                      var r = f();
                      (e(() => i(r, p(Z) ? `Executing...` : `Run ${p(Y)} workflow`)), a(t, r));
                    },
                    $$slots: { default: !0 },
                  });
                }
                (u(c),
                  v(
                    y,
                    () => p(J),
                    (e) => j(J, e),
                  ),
                  a(t, c));
              },
              h = (t) => {
                var r = jt(),
                  c = _(r),
                  l = _(c),
                  d = (e) => {
                    var t = Dt();
                    (ce(T(t), { class: `w-5 h-5 text-green-500` }), N(2), a(e, t));
                  },
                  m = (e) => {
                    var t = Ot();
                    (le(T(t), { class: `w-5 h-5 text-destructive` }), N(2), a(e, t));
                  };
                (n(l, (e) => {
                  (p(Q), D(() => p(Q).success) ? e(d) : e(m, -1));
                }),
                  u(c));
                var h = A(c, 2),
                  g = (t) => {
                    var n = kt(),
                      r = _(n, !0);
                    (u(n), e(() => i(r, (p(Q), D(() => p(Q).message)))), a(t, n));
                  };
                n(h, (e) => {
                  (p(Q), D(() => p(Q).message) && e(g));
                });
                var v = A(h, 2);
                (o(
                  v,
                  1,
                  () => (p(Q), D(() => p(Q).steps)),
                  s,
                  (t, r) => {
                    var o = At(),
                      s = _(o),
                      c = (e) => {
                        ce(e, { class: `w-4 h-4 text-green-500 shrink-0` });
                      },
                      l = (e) => {
                        le(e, { class: `w-4 h-4 text-destructive shrink-0` });
                      },
                      d = (e) => {
                        Te(e, { class: `w-4 h-4 text-muted-foreground shrink-0` });
                      };
                    n(s, (e) => {
                      (p(r),
                        D(() => p(r).status === `success`)
                          ? e(c)
                          : (p(r), D(() => p(r).status === `failed`) ? e(l, 1) : e(d, -1)));
                    });
                    var f = A(s, 2),
                      m = _(f, !0);
                    (u(f), u(o), e(() => i(m, (p(r), D(() => p(r).name)))), a(t, o));
                  },
                ),
                  ye(A(v, 2), {
                    children: (e, t) => {
                      R(e, {
                        variant: `secondary`,
                        $$events: { click: () => j(dn, !1) },
                        children: (e, t) => {
                          (N(), a(e, f(`Close`)));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    $$slots: { default: !0 },
                  }),
                  u(r),
                  a(t, r));
              };
            (n(d, (e) => {
              p(Q) ? e(h, -1) : e(m);
            }),
              a(t, c));
          };
        (n(m, (e) => {
          p(J) && e(h);
        }),
          a(t, d));
      },
      $$slots: { default: !0 },
    });
  }
  var ir = A(rr, 2);
  (ve(ir, {
    get open() {
      return p(Sn);
    },
    onClose: () => {
      (j(Sn, !1), j(Cn, null));
    },
    children: (t, n) => {
      var r = Nt(),
        o = A(_(r), 2),
        s = _(o, !0);
      (u(o),
        ye(A(o, 2), {
          children: (e, t) => {
            var n = Mt(),
              r = T(n);
            (R(r, {
              variant: `outline`,
              $$events: {
                click: () => {
                  (j(Sn, !1), j(Cn, null));
                },
              },
              children: (e, t) => {
                (N(), a(e, f(`Cancel`)));
              },
              $$slots: { default: !0 },
            }),
              R(A(r, 2), {
                variant: `destructive`,
                $$events: {
                  click: () => {
                    (j(Sn, !1), p(Cn) && p(Cn)(), j(Cn, null));
                  },
                },
                children: (e, t) => {
                  (N(), a(e, f(`Continue`)));
                },
                $$slots: { default: !0 },
              }),
              a(e, n));
          },
          $$slots: { default: !0 },
        }),
        u(r),
        e(() => i(s, p(wn))),
        a(t, r));
    },
    $$slots: { default: !0 },
  }),
    ve(A(ir, 2), {
      get open() {
        return p(nn);
      },
      onClose: () => j(nn, !1),
      children: (t, r) => {
        var c = Lt(),
          l = A(_(c), 4),
          d = _(l),
          m = _(d);
        (B(m, {
          children: (e, t) => {
            (N(), a(e, f(`Role Name`)));
          },
          $$slots: { default: !0 },
        }),
          z(A(m, 2), {
            placeholder: `e.g., Engineer, Sales Rep, Manager`,
            get value() {
              return p(rn);
            },
            set value(e) {
              j(rn, e);
            },
            $$legacy: !0,
          }),
          u(d));
        var h = A(d, 2),
          g = _(h);
        (B(g, {
          children: (e, t) => {
            (N(), a(e, f(`Description`)));
          },
          $$slots: { default: !0 },
        }),
          z(A(g, 2), {
            placeholder: `Optional description`,
            get value() {
              return p(an);
            },
            set value(e) {
              j(an, e);
            },
            $$legacy: !0,
          }),
          u(h));
        var y = A(h, 2),
          b = _(y);
        B(b, {
          children: (e, t) => {
            (N(), a(e, f(`Level`)));
          },
          $$slots: { default: !0 },
        });
        var x = A(b, 2),
          S = _(x);
        S.value = S.__value = `org`;
        var C = A(S);
        C.value = C.__value = `department`;
        var w = A(C);
        ((w.value = w.__value = `team`), u(x), u(y));
        var O = A(y, 2),
          k = (t) => {
            var n = Ft(),
              r = _(n);
            B(r, {
              children: (e, t) => {
                (N(), a(e, f(`Inherits From (optional)`)));
              },
              $$slots: { default: !0 },
            });
            var c = A(r, 2),
              l = _(c);
            ((l.value = l.__value = ``),
              o(
                A(l),
                1,
                () => p(G),
                s,
                (t, n) => {
                  var r = Pt(),
                    o = _(r);
                  u(r);
                  var s = {};
                  (e(() => {
                    (i(
                      o,
                      `${(p(n), D(() => p(n).name)) ?? ``} (${(p(n), D(() => p(n).level)) ?? ``})`,
                    ),
                      s !== (s = (p(n), D(() => p(n).id))) &&
                        (r.value = (r.__value = (p(n), D(() => p(n).id))) ?? ``));
                  }),
                    a(t, r));
                },
              ),
              u(c),
              u(n),
              v(
                c,
                () => p(sn),
                (e) => j(sn, e),
              ),
              a(t, n));
          };
        (n(O, (e) => {
          (p(G), D(() => p(G).length > 0) && e(k));
        }),
          u(l),
          ye(A(l, 2), {
            children: (t, n) => {
              var r = It(),
                o = T(r);
              R(o, {
                variant: `outline`,
                $$events: { click: () => j(nn, !1) },
                children: (e, t) => {
                  (N(), a(e, f(`Cancel`)));
                },
                $$slots: { default: !0 },
              });
              var s = A(o, 2);
              {
                let t = E(() => (p(cn), p(rn), D(() => p(cn) || !p(rn).trim())));
                R(s, {
                  get disabled() {
                    return p(t);
                  },
                  $$events: { click: Nn },
                  children: (t, n) => {
                    N();
                    var r = f();
                    (e(() => i(r, p(cn) ? `Creating...` : `Create Role`)), a(t, r));
                  },
                  $$slots: { default: !0 },
                });
              }
              a(t, r);
            },
            $$slots: { default: !0 },
          }),
          u(c),
          v(
            x,
            () => p(on),
            (e) => j(on, e),
          ),
          a(t, c));
      },
      $$slots: { default: !0 },
    }),
    v(
      $n,
      () => p(Xt),
      (e) => j(Xt, e),
    ),
    a(g, Yn),
    y());
}
export { zt as component };
