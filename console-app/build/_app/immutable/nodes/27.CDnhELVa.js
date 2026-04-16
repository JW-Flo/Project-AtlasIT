import {
  $ as e,
  Et as t,
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
  c as ee,
  ct as b,
  d as te,
  h as ne,
  j as re,
  l as ie,
  lt as x,
  mt as S,
  ot as C,
  pt as w,
  q as T,
  r as E,
  s as D,
  st as O,
  ut as k,
  wt as A,
  xt as ae,
  z as j,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as M } from "../chunks/D4lFFHu4.js";
import { t as N } from "../chunks/_6xtu--D.js";
import { t as oe } from "../chunks/CMgwAYwY.js";
import { t as se } from "../chunks/Cj66XTu9.js";
import { t as ce } from "../chunks/D82KRzE1.js";
import { t as le } from "../chunks/D_3pYtt4.js";
import { t as P } from "../chunks/kq9QG3T02.js";
import { t as ue } from "../chunks/C_dKnYGb2.js";
import { t as F } from "../chunks/CMGwYO6i2.js";
import { n as I, t as L } from "../chunks/BEJa09Kq2.js";
import { t as R } from "../chunks/Cue2Cs472.js";
import { t as z } from "../chunks/DmQt9wwK2.js";
import { t as de } from "../chunks/DOfJvt542.js";
import { t as fe } from "../chunks/oRaErrij2.js";
function pe(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M12 8V4H8` }],
      [`rect`, { width: `16`, height: `12`, x: `4`, y: `8`, rx: `2` }],
      [`path`, { d: `M2 14h2` }],
      [`path`, { d: `M20 14h2` }],
      [`path`, { d: `M15 13v2` }],
      [`path`, { d: `M9 13v2` }],
    ];
  N(
    e,
    D({ name: `bot` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = l();
        (re(C(r), t, `default`, {}, null), a(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var me = j(`<!> `, 1),
  B = j(
    `<p class="text-xs text-muted-foreground uppercase font-medium">Total</p> <p class="text-2xl font-bold mt-1"> </p>`,
    1,
  ),
  he = j(
    `<p class="text-xs text-muted-foreground uppercase font-medium">Active</p> <p class="text-2xl font-bold mt-1 text-green-500"> </p>`,
    1,
  ),
  V = j(
    `<p class="text-xs text-muted-foreground uppercase font-medium">Expiring Soon</p> <p class="text-2xl font-bold mt-1 text-yellow-500"> </p>`,
    1,
  ),
  ge = j(
    `<p class="text-xs text-muted-foreground uppercase font-medium">High Risk</p> <p class="text-2xl font-bold mt-1 text-red-500"> </p>`,
    1,
  ),
  H = j(`<div class="grid gap-4 grid-cols-2 sm:grid-cols-4"><!> <!> <!> <!></div>`),
  _e = j(`<div class="space-y-3"></div>`),
  ve = j(`<!> <p class="pl-7"> </p>`, 1),
  ye = j(`<span class="text-xs text-muted-foreground"> </span>`),
  be = j(`<span class="text-xs text-muted-foreground">No expiry</span>`),
  xe = j(
    `<div><span class="text-xs font-medium text-muted-foreground uppercase">Scopes</span> <div class="flex flex-wrap gap-1 mt-1"><!> <!></div></div>`,
  ),
  Se = j(
    `<div><span class="text-xs font-medium text-muted-foreground uppercase">Risk Factors</span> <div class="flex flex-wrap gap-1 mt-1"><!></div></div>`,
  ),
  Ce = j(`<span> </span>`),
  we = j(`<!> Request Rotation`, 1),
  Te = j(`<!> <!>`, 1),
  Ee = j(`<!> <!>`, 1),
  De = j(`<span class="text-xs text-muted-foreground italic">Credential revoked</span>`),
  Oe = j(
    `<div class="flex gap-2 text-xs border-l-2 border-border pl-2 py-0.5"><span class="font-medium"> </span> <span class="text-muted-foreground"> </span> <span class="text-muted-foreground ml-auto shrink-0"> </span></div>`,
  ),
  ke = j(`<p class="text-xs text-muted-foreground italic">No audit entries.</p>`),
  Ae = j(
    `<tr class="border-t bg-muted/30"><td colspan="9" class="px-6 py-4"><div class="space-y-4"><div class="grid gap-4 sm:grid-cols-2"><div class="space-y-3"><div><span class="text-xs font-medium text-muted-foreground uppercase">External ID</span> <p class="mt-0.5 text-sm font-mono"> </p></div> <!> <!> <div class="flex gap-4 text-xs text-muted-foreground"><!> <span> </span></div></div> <div class="space-y-3"><div><span class="text-xs font-medium text-muted-foreground uppercase">Actions</span> <div class="flex gap-2 mt-1"><!></div></div> <div><span class="text-xs font-medium text-muted-foreground uppercase">Audit Log</span> <div class="mt-1 space-y-1 max-h-40 overflow-y-auto"><!></div></div></div></div></div></td></tr>`,
  ),
  je = j(
    `<tr class="border-t hover:bg-muted/50 cursor-pointer transition-colors"><td class="px-4 py-3 text-muted-foreground"><!></td><td class="px-4 py-3"><div class="flex items-center gap-2"><!> <span class="font-medium truncate max-w-[200px]"> </span></div></td><td class="px-4 py-3"><span class="text-xs"> </span></td><td class="px-4 py-3"><span class="text-xs"> </span></td><td class="px-4 py-3 text-xs text-muted-foreground"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-xs text-muted-foreground"> </td><td class="px-4 py-3"><!></td></tr> <!>`,
    1,
  ),
  Me = j(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium w-6"></th><th class="px-4 py-3 font-medium">Name</th><th class="px-4 py-3 font-medium">Type</th><th class="px-4 py-3 font-medium">Provider</th><th class="px-4 py-3 font-medium">Owner</th><th class="px-4 py-3 font-medium">Risk</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Last Used</th><th class="px-4 py-3 font-medium">Expiry</th></tr></thead><tbody></tbody></table></div>`,
  ),
  Ne = j(
    `<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Non-Human Identities</h1> <p class="text-sm text-muted-foreground">Service accounts, API keys, OAuth apps, and bot credentials across connected adapters.</p></div> <!></div> <!> <div class="flex flex-wrap gap-3 items-center"><div class="relative flex-1 min-w-[200px] max-w-sm"><!> <input type="text" placeholder="Search by name, owner, or provider..." class="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm"/></div> <select class="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>All Statuses</option><option>Active</option><option>Revoked</option><option>Rotation Pending</option></select> <select class="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>All Types</option><option>Service Account</option><option>OAuth App</option><option>Access Key</option><option>API Key</option><option>Bot Token</option><option>Deploy Key</option><option>OAuth Grant</option></select> <select class="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>All Providers</option><option>Google Workspace</option><option>Microsoft 365</option><option>AWS</option><option>GitHub</option><option>Okta</option><option>Slack</option></select></div> <!></div>`,
  );
function U(g, re) {
  ae(re, !1);
  let D = b(),
    j = b(!0),
    N = b(null),
    U = b([]),
    Pe = b(0),
    W = b(!1),
    G = b(``),
    K = b(``),
    q = b(``),
    J = b(``),
    Y = b(null),
    Fe = b(!1),
    X = b([]),
    Z = b(new Set()),
    Ie = {
      service_account: `Service Account`,
      oauth_app: `OAuth App`,
      access_key: `Access Key`,
      api_key: `API Key`,
      bot_token: `Bot Token`,
      deploy_key: `Deploy Key`,
      oauth_grant: `OAuth Grant`,
    },
    Le = {
      google_workspace: `Google Workspace`,
      microsoft_365: `Microsoft 365`,
      aws: `AWS`,
      github: `GitHub`,
      okta: `Okta`,
      slack: `Slack`,
    };
  function Re(e) {
    return Ie[e] ?? e;
  }
  function ze(e) {
    return Le[e] ?? e;
  }
  function Be(e) {
    return e >= 80 ? `destructive` : e >= 50 ? `warning` : e >= 20 ? `secondary` : `success`;
  }
  function Ve(e) {
    return e === `active`
      ? `success`
      : e === `revoked`
        ? `destructive`
        : e === `rotation_pending`
          ? `warning`
          : `secondary`;
  }
  function He(e) {
    if (!e) return `Never`;
    let t = Date.now() - new Date(e).getTime(),
      n = Math.floor(t / 864e5);
    if (n > 30) return `${Math.floor(n / 30)}mo ago`;
    if (n > 0) return `${n}d ago`;
    let r = Math.floor(t / 36e5);
    return r > 0 ? `${r}h ago` : `Just now`;
  }
  function Ue(e) {
    if (!e) return null;
    let t = new Date(e).getTime() - Date.now();
    return t <= 0
      ? { label: `Expired`, variant: `destructive` }
      : t <= 7 * 864e5
        ? { label: `Expires in ${Math.ceil(t / 864e5)}d`, variant: `warning` }
        : null;
  }
  function We(e) {
    return e
      ? Array.isArray(e)
        ? e
        : typeof e == `string`
          ? e
              .split(`,`)
              .map((e) => e.trim())
              .filter(Boolean)
          : []
      : [];
  }
  async function Ge() {
    (k(j, !0), k(N, null));
    try {
      let e = new URLSearchParams();
      (p(G) && e.set(`status`, p(G)),
        p(K) && e.set(`type`, p(K)),
        p(q) && e.set(`provider`, p(q)),
        e.set(`limit`, `200`));
      let t = await fetch(`/api/nhi?${e}`);
      if (!t.ok) throw Error(`Failed to load (${t.status})`);
      let n = await t.json();
      (k(U, n.credentials ?? []), k(Pe, n.total ?? 0));
    } catch (e) {
      (k(N, e?.message || `Failed to load NHI credentials`), k(U, []));
    } finally {
      k(j, !1);
    }
  }
  async function Ke() {
    k(W, !0);
    try {
      let e = await fetch(`/api/nhi`, { method: `POST` }),
        t = await e.json();
      e.ok
        ? (M({
            message: `Discovery complete: ${t.total ?? t.synced ?? t.discovered ?? 0} credentials found`,
            variant: `success`,
          }),
          await Ge())
        : M({ message: t.error || t.message || `Discovery failed`, variant: `error` });
    } catch (e) {
      M({ message: e?.message || `Discovery failed`, variant: `error` });
    } finally {
      k(W, !1);
    }
  }
  async function qe(e) {
    if (p(Y) === e) {
      k(Y, null);
      return;
    }
    (k(Y, e), k(Fe, !0), k(X, []));
    try {
      let t = await fetch(`/api/nhi/${e}`);
      t.ok && k(X, (await t.json()).auditLog ?? []);
    } catch {}
    k(Fe, !1);
  }
  async function Je(e, t) {
    (p(Z).add(e), k(Z, new Set(p(Z))));
    try {
      let n = await fetch(`/api/nhi/${e}`, {
        method: `PATCH`,
        headers: { "Content-Type": `application/json` },
        body: JSON.stringify({ status: t }),
      });
      if (!n.ok) throw Error(`Failed to update`);
      let r = await n.json(),
        i = p(U).findIndex((t) => t.id === e);
      (i >= 0 && r.credential && (x(U, (p(U)[i] = r.credential)), k(U, [...p(U)])),
        M({ message: `Status changed to ${t}`, variant: `success` }));
    } catch (e) {
      M({ message: e?.message || `Update failed`, variant: `error` });
    }
    (p(Z).delete(e), k(Z, new Set(p(Z))));
  }
  async function Ye(e) {
    (p(Z).add(e), k(Z, new Set(p(Z))));
    try {
      if (!(await fetch(`/api/nhi/${e}`, { method: `DELETE` })).ok) throw Error(`Failed to revoke`);
      let t = p(U).findIndex((t) => t.id === e);
      (t >= 0 && (x(U, (p(U)[t] = { ...p(U)[t], status: `revoked` })), k(U, [...p(U)])),
        M({ message: `Credential revoked`, variant: `success` }));
    } catch (e) {
      M({ message: e?.message || `Revoke failed`, variant: `error` });
    }
    (p(Z).delete(e), k(Z, new Set(p(Z))));
  }
  function Xe() {
    Ge();
  }
  (E(Ge),
    m(
      () => (p(U), p(J)),
      () => {
        k(
          D,
          p(U).filter((e) => {
            if (p(J)) {
              let t = p(J).toLowerCase();
              if (
                !e.displayName?.toLowerCase().includes(t) &&
                !e.ownerEmail?.toLowerCase().includes(t) &&
                !e.provider?.toLowerCase().includes(t)
              )
                return !1;
            }
            return !0;
          }),
        );
      },
    ),
    c(),
    ie());
  var Ze = Ne(),
    Qe = _(Ze);
  (R(O(_(Qe), 2), {
    get disabled() {
      return p(W);
    },
    size: `sm`,
    $$events: { click: Ke },
    children: (t, n) => {
      var r = me(),
        o = C(r);
      {
        let e = w(() => (p(W) ? `animate-spin` : ``));
        le(o, {
          get class() {
            return `h-4 w-4 mr-1.5 ${p(e) ?? ``}`;
          },
        });
      }
      var s = O(o);
      (e(() => i(s, ` ${p(W) ? `Scanning...` : `Discover NHIs`}`)), a(t, r));
    },
    $$slots: { default: !0 },
  }),
    u(Qe));
  var $e = O(Qe, 2),
    et = (t) => {
      let n = w(() => (p(U), T(() => p(U).filter((e) => e.status === `active`).length))),
        r = w(
          () => (p(U), T(() => p(U).filter((e) => Ue(e.expiresAt)?.variant === `warning`).length)),
        ),
        o = w(
          () => (
            p(U),
            T(() => p(U).filter((e) => Ue(e.expiresAt)?.variant === `destructive`).length)
          ),
        ),
        s = w(() => (p(U), T(() => p(U).filter((e) => e.riskScore >= 80).length)));
      var c = H(),
        l = _(c);
      I(l, {
        children: (t, n) => {
          L(t, {
            class: `pt-4 pb-3`,
            children: (t, n) => {
              var r = B(),
                o = O(C(r), 2),
                s = _(o, !0);
              (u(o), e(() => i(s, p(Pe))), a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var d = O(l, 2);
      I(d, {
        children: (t, r) => {
          L(t, {
            class: `pt-4 pb-3`,
            children: (t, r) => {
              var o = he(),
                s = O(C(o), 2),
                c = _(s, !0);
              (u(s), e(() => i(c, p(n))), a(t, o));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var f = O(d, 2);
      (I(f, {
        children: (t, n) => {
          L(t, {
            class: `pt-4 pb-3`,
            children: (t, n) => {
              var s = V(),
                c = O(C(s), 2),
                l = _(c, !0);
              (u(c), e(() => i(l, p(r) + p(o))), a(t, s));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        I(O(f, 2), {
          children: (t, n) => {
            L(t, {
              class: `pt-4 pb-3`,
              children: (t, n) => {
                var r = ge(),
                  o = O(C(r), 2),
                  c = _(o, !0);
                (u(o), e(() => i(c, p(s))), a(t, r));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        u(c),
        a(t, c));
    };
  n($e, (e) => {
    (p(j), p(U), T(() => !p(j) && p(U).length > 0) && e(et));
  });
  var tt = O($e, 2),
    nt = _(tt),
    rt = _(nt);
  P(rt, { class: `absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground` });
  var it = O(rt, 2);
  (h(it), u(nt));
  var Q = O(nt, 2),
    at = _(Q);
  at.value = at.__value = ``;
  var ot = O(at);
  ot.value = ot.__value = `active`;
  var st = O(ot);
  st.value = st.__value = `revoked`;
  var ct = O(st);
  ((ct.value = ct.__value = `rotation_pending`), u(Q));
  var $ = O(Q, 2),
    lt = _($);
  lt.value = lt.__value = ``;
  var ut = O(lt);
  ut.value = ut.__value = `service_account`;
  var dt = O(ut);
  dt.value = dt.__value = `oauth_app`;
  var ft = O(dt);
  ft.value = ft.__value = `access_key`;
  var pt = O(ft);
  pt.value = pt.__value = `api_key`;
  var mt = O(pt);
  mt.value = mt.__value = `bot_token`;
  var ht = O(mt);
  ht.value = ht.__value = `deploy_key`;
  var gt = O(ht);
  ((gt.value = gt.__value = `oauth_grant`), u($));
  var _t = O($, 2),
    vt = _(_t);
  vt.value = vt.__value = ``;
  var yt = O(vt);
  yt.value = yt.__value = `google_workspace`;
  var bt = O(yt);
  bt.value = bt.__value = `microsoft_365`;
  var xt = O(bt);
  xt.value = xt.__value = `aws`;
  var St = O(xt);
  St.value = St.__value = `github`;
  var Ct = O(St);
  Ct.value = Ct.__value = `okta`;
  var wt = O(Ct);
  ((wt.value = wt.__value = `slack`), u(_t), u(tt));
  var Tt = O(tt, 2),
    Et = (e) => {
      var t = _e();
      (o(
        t,
        4,
        () => [1, 2, 3, 4],
        s,
        (e, t) => {
          fe(e, { class: `h-14 rounded-lg` });
        },
      ),
        u(t),
        a(e, t));
    },
    Dt = (t) => {
      de(t, {
        variant: `destructive`,
        children: (t, n) => {
          var r = ve(),
            o = C(r);
          F(o, { class: `h-4 w-4` });
          var s = O(o, 2),
            c = _(s, !0);
          (u(s), e(() => i(c, p(N))), a(t, r));
        },
        $$slots: { default: !0 },
      });
    },
    Ot = (e) => {
      I(e, {
        class: `border-dashed`,
        children: (e, t) => {
          L(e, {
            class: `py-10 text-center text-sm text-muted-foreground`,
            children: (e, t) => {
              var r = l(),
                i = C(r),
                o = (e) => {
                  a(
                    e,
                    f(
                      `No NHI credentials discovered yet. Click "Discover NHIs" to scan connected adapters.`,
                    ),
                  );
                },
                s = (e) => {
                  a(e, f(`No credentials match your filters.`));
                };
              (n(i, (e) => {
                (p(U), T(() => p(U).length === 0) ? e(o) : e(s, -1));
              }),
                a(e, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    kt = (c) => {
      I(c, {
        children: (c, m) => {
          L(c, {
            class: `p-0`,
            children: (c, m) => {
              var h = Me(),
                g = _(h),
                v = O(_(g));
              (o(
                v,
                5,
                () => p(D),
                s,
                (c, m) => {
                  let h = w(() => (p(m), T(() => Ue(p(m).expiresAt))));
                  var g = je(),
                    v = C(g),
                    y = _(v),
                    b = _(y),
                    ne = (e) => {
                      se(e, { class: `h-4 w-4` });
                    },
                    ie = (e) => {
                      oe(e, { class: `h-4 w-4` });
                    };
                  (n(b, (e) => {
                    (p(Y), p(m), T(() => p(Y) === p(m).id) ? e(ne) : e(ie, -1));
                  }),
                    u(y));
                  var x = O(y),
                    E = _(x),
                    D = _(E),
                    k = (e) => {
                      pe(e, { class: `h-4 w-4 text-muted-foreground shrink-0` });
                    },
                    ae = (e) => {
                      ce(e, { class: `h-4 w-4 text-muted-foreground shrink-0` });
                    },
                    j = (e) => {
                      ue(e, { class: `h-4 w-4 text-muted-foreground shrink-0` });
                    };
                  n(D, (e) => {
                    (p(m),
                      T(() => p(m).credentialType === `bot_token`)
                        ? e(k)
                        : (p(m),
                          T(
                            () =>
                              p(m).credentialType === `access_key` ||
                              p(m).credentialType === `api_key`,
                          )
                            ? e(ae, 1)
                            : e(j, -1)));
                  });
                  var M = O(D, 2),
                    N = _(M, !0);
                  (u(M), u(E), u(x));
                  var P = O(x),
                    F = _(P),
                    I = _(F, !0);
                  (u(F), u(P));
                  var L = O(P),
                    de = _(L),
                    me = _(de, !0);
                  (u(de), u(L));
                  var B = O(L),
                    he = _(B, !0);
                  u(B);
                  var V = O(B),
                    ge = _(V);
                  {
                    let t = w(() => (p(m), T(() => Be(p(m).riskScore))));
                    z(ge, {
                      get variant() {
                        return p(t);
                      },
                      class: `text-xs tabular-nums`,
                      children: (t, n) => {
                        A();
                        var r = f();
                        (e(() => i(r, (p(m), T(() => p(m).riskScore)))), a(t, r));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  u(V);
                  var H = O(V),
                    _e = _(H);
                  {
                    let t = w(() => (p(m), T(() => Ve(p(m).status))));
                    z(_e, {
                      get variant() {
                        return p(t);
                      },
                      class: `text-xs capitalize`,
                      children: (t, n) => {
                        A();
                        var r = f();
                        (e((e) => i(r, e), [() => (p(m), T(() => p(m).status.replace(`_`, ` `)))]),
                          a(t, r));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  u(H);
                  var ve = O(H),
                    Me = _(ve, !0);
                  u(ve);
                  var Ne = O(ve),
                    U = _(Ne),
                    Pe = (t) => {
                      z(t, {
                        get variant() {
                          return (d(p(h)), T(() => p(h).variant));
                        },
                        class: `text-xs`,
                        children: (t, n) => {
                          A();
                          var r = f();
                          (e(() => i(r, (d(p(h)), T(() => p(h).label)))), a(t, r));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    W = (t) => {
                      var n = ye(),
                        r = _(n, !0);
                      (u(n),
                        e(
                          (e) => i(r, e),
                          [() => (p(m), T(() => new Date(p(m).expiresAt).toLocaleDateString()))],
                        ),
                        a(t, n));
                    },
                    G = (e) => {
                      a(e, be());
                    };
                  (n(U, (e) => {
                    p(h) ? e(Pe) : (p(m), T(() => p(m).expiresAt) ? e(W, 1) : e(G, -1));
                  }),
                    u(Ne),
                    u(v));
                  var K = O(v, 2),
                    q = (c) => {
                      var d = Ae(),
                        h = _(d),
                        g = _(h),
                        v = _(g),
                        y = _(v),
                        b = _(y),
                        ne = O(_(b), 2),
                        ie = _(ne, !0);
                      (u(ne), u(b));
                      var x = O(b, 2),
                        E = (t) => {
                          var r = xe(),
                            c = O(_(r), 2),
                            l = _(c);
                          o(
                            l,
                            1,
                            () => (p(m), T(() => We(p(m).scopes).slice(0, 10))),
                            s,
                            (t, n) => {
                              z(t, {
                                variant: `secondary`,
                                class: `text-xs font-mono`,
                                children: (t, r) => {
                                  A();
                                  var o = f();
                                  (e(() => i(o, p(n))), a(t, o));
                                },
                                $$slots: { default: !0 },
                              });
                            },
                          );
                          var d = O(l, 2),
                            h = (t) => {
                              z(t, {
                                variant: `secondary`,
                                class: `text-xs`,
                                children: (t, n) => {
                                  A();
                                  var r = f();
                                  (e(
                                    (e) => i(r, `+${e ?? ``} more`),
                                    [() => (p(m), T(() => We(p(m).scopes).length - 10))],
                                  ),
                                    a(t, r));
                                },
                                $$slots: { default: !0 },
                              });
                            },
                            g = S(() => (p(m), T(() => We(p(m).scopes).length > 10)));
                          (n(d, (e) => {
                            p(g) && e(h);
                          }),
                            u(c),
                            u(r),
                            a(t, r));
                        },
                        D = S(() => (p(m), T(() => We(p(m).scopes).length > 0)));
                      n(x, (e) => {
                        p(D) && e(E);
                      });
                      var k = O(x, 2),
                        ae = (r) => {
                          var c = Se(),
                            d = O(_(c), 2),
                            h = _(d),
                            g = (t) => {
                              var n = l();
                              (o(
                                C(n),
                                1,
                                () => (p(m), T(() => p(m).riskFactors)),
                                s,
                                (t, n) => {
                                  z(t, {
                                    variant: `warning`,
                                    class: `text-xs`,
                                    children: (t, r) => {
                                      A();
                                      var o = f();
                                      (e(
                                        (e) => i(o, e),
                                        [() => (p(n), T(() => String(p(n)).replace(/_/g, ` `)))],
                                      ),
                                        a(t, o));
                                    },
                                    $$slots: { default: !0 },
                                  });
                                },
                              ),
                                a(t, n));
                            },
                            v = S(() => (p(m), T(() => Array.isArray(p(m).riskFactors)))),
                            y = (n) => {
                              var r = l();
                              (o(
                                C(r),
                                1,
                                () => (p(m), T(() => Object.entries(p(m).riskFactors))),
                                s,
                                (n, r) => {
                                  var o = S(() => t(p(r), 2));
                                  let s = () => p(o)[0],
                                    c = () => p(o)[1];
                                  z(n, {
                                    variant: `warning`,
                                    class: `text-xs`,
                                    children: (t, n) => {
                                      A();
                                      var r = f();
                                      (e(() => i(r, `${s() ?? ``}: ${c() ?? ``}`)), a(t, r));
                                    },
                                    $$slots: { default: !0 },
                                  });
                                },
                              ),
                                a(n, r));
                            };
                          (n(h, (e) => {
                            p(v) ? e(g) : e(y, -1);
                          }),
                            u(d),
                            u(c),
                            a(r, c));
                        },
                        j = S(
                          () => (
                            p(m),
                            T(
                              () =>
                                p(m).riskFactors &&
                                (Array.isArray(p(m).riskFactors)
                                  ? p(m).riskFactors.length > 0
                                  : Object.keys(p(m).riskFactors).length > 0),
                            )
                          ),
                        );
                      n(k, (e) => {
                        p(j) && e(ae);
                      });
                      var M = O(k, 2),
                        N = _(M),
                        oe = (t) => {
                          var n = Ce(),
                            r = _(n);
                          (u(n),
                            e(
                              (e) => i(r, `Rotated: ${e ?? ``}`),
                              [() => (p(m), T(() => He(p(m).lastRotatedAt)))],
                            ),
                            a(t, n));
                        };
                      n(N, (e) => {
                        (p(m), T(() => p(m).lastRotatedAt) && e(oe));
                      });
                      var se = O(N, 2),
                        ce = _(se);
                      (u(se), u(M), u(y));
                      var P = O(y, 2),
                        ue = _(P),
                        F = O(_(ue), 2),
                        I = _(F),
                        L = (e) => {
                          var t = Te(),
                            n = C(t);
                          {
                            let e = w(() => (p(Z), p(m), T(() => p(Z).has(p(m).id))));
                            R(n, {
                              size: `sm`,
                              variant: `outline`,
                              get disabled() {
                                return p(e);
                              },
                              $$events: { click: () => Je(p(m).id, `rotation_pending`) },
                              children: (e, t) => {
                                var n = we();
                                (le(C(n), { class: `h-3 w-3 mr-1` }), A(), a(e, n));
                              },
                              $$slots: { default: !0 },
                            });
                          }
                          var r = O(n, 2);
                          {
                            let e = w(() => (p(Z), p(m), T(() => p(Z).has(p(m).id))));
                            R(r, {
                              size: `sm`,
                              variant: `destructive`,
                              get disabled() {
                                return p(e);
                              },
                              $$events: { click: () => Ye(p(m).id) },
                              children: (e, t) => {
                                (A(), a(e, f(`Revoke`)));
                              },
                              $$slots: { default: !0 },
                            });
                          }
                          a(e, t);
                        },
                        de = (e) => {
                          var t = Ee(),
                            n = C(t);
                          {
                            let e = w(() => (p(Z), p(m), T(() => p(Z).has(p(m).id))));
                            R(n, {
                              size: `sm`,
                              variant: `outline`,
                              get disabled() {
                                return p(e);
                              },
                              $$events: { click: () => Je(p(m).id, `active`) },
                              children: (e, t) => {
                                (A(), a(e, f(`Mark Rotated`)));
                              },
                              $$slots: { default: !0 },
                            });
                          }
                          var r = O(n, 2);
                          {
                            let e = w(() => (p(Z), p(m), T(() => p(Z).has(p(m).id))));
                            R(r, {
                              size: `sm`,
                              variant: `destructive`,
                              get disabled() {
                                return p(e);
                              },
                              $$events: { click: () => Ye(p(m).id) },
                              children: (e, t) => {
                                (A(), a(e, f(`Revoke`)));
                              },
                              $$slots: { default: !0 },
                            });
                          }
                          a(e, t);
                        },
                        pe = (e) => {
                          a(e, De());
                        };
                      (n(I, (e) => {
                        (p(m),
                          T(() => p(m).status === `active`)
                            ? e(L)
                            : (p(m),
                              T(() => p(m).status === `rotation_pending`) ? e(de, 1) : e(pe, -1)));
                      }),
                        u(F),
                        u(ue));
                      var me = O(ue, 2),
                        B = O(_(me), 2),
                        he = _(B),
                        V = (e) => {
                          fe(e, { class: `h-6 rounded` });
                        },
                        ge = (t) => {
                          var n = l();
                          (o(
                            C(n),
                            1,
                            () => p(X),
                            s,
                            (t, n) => {
                              var r = Oe(),
                                o = _(r),
                                s = _(o, !0);
                              u(o);
                              var c = O(o, 2),
                                l = _(c, !0);
                              u(c);
                              var d = O(c, 2),
                                f = _(d, !0);
                              (u(d),
                                u(r),
                                e(
                                  (e, t) => {
                                    (i(s, (p(n), T(() => p(n).actor || `System`))),
                                      i(l, e),
                                      i(f, t));
                                  },
                                  [
                                    () => (
                                      p(n),
                                      T(() => p(n).action.replace(`nhi_credential.`, ``))
                                    ),
                                    () => (
                                      p(n),
                                      T(() => new Date(p(n).createdAt).toLocaleString())
                                    ),
                                  ],
                                ),
                                a(t, r));
                            },
                          ),
                            a(t, n));
                        },
                        H = (e) => {
                          a(e, ke());
                        };
                      (n(he, (e) => {
                        p(Fe) ? e(V) : (p(X), T(() => p(X).length > 0) ? e(ge, 1) : e(H, -1));
                      }),
                        u(B),
                        u(me),
                        u(P),
                        u(v),
                        u(g),
                        u(h),
                        u(d),
                        e(
                          (e) => {
                            (i(ie, (p(m), T(() => p(m).externalId || `—`))),
                              i(ce, `Discovered: ${e ?? ``}`));
                          },
                          [() => (p(m), T(() => new Date(p(m).createdAt).toLocaleDateString()))],
                        ),
                        r(
                          `click`,
                          F,
                          te(function (e) {
                            ee.call(this, re, e);
                          }),
                        ),
                        a(c, d));
                    };
                  (n(K, (e) => {
                    (p(Y), p(m), T(() => p(Y) === p(m).id) && e(q));
                  }),
                    e(
                      (e, t, n) => {
                        (i(N, (p(m), T(() => p(m).displayName || p(m).externalId || `Unknown`))),
                          i(I, e),
                          i(me, t),
                          i(
                            he,
                            (p(m), T(() => p(m).ownerEmail || p(m).linkedUserEmail || `Unowned`)),
                          ),
                          i(Me, n));
                      },
                      [
                        () => (p(m), T(() => Re(p(m).credentialType))),
                        () => (p(m), T(() => ze(p(m).provider))),
                        () => (p(m), T(() => He(p(m).lastUsedAt))),
                      ],
                    ),
                    r(`click`, v, () => qe(p(m).id)),
                    a(c, g));
                },
              ),
                u(v),
                u(g),
                u(h),
                a(c, h));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (n(Tt, (e) => {
    p(j) ? e(Et) : p(N) ? e(Dt, 1) : (p(D), T(() => p(D).length === 0) ? e(Ot, 2) : e(kt, -1));
  }),
    u(Ze),
    ne(
      it,
      () => p(J),
      (e) => k(J, e),
    ),
    v(
      Q,
      () => p(G),
      (e) => k(G, e),
    ),
    r(`change`, Q, Xe),
    v(
      $,
      () => p(K),
      (e) => k(K, e),
    ),
    r(`change`, $, Xe),
    v(
      _t,
      () => p(q),
      (e) => k(q, e),
    ),
    r(`change`, _t, Xe),
    a(g, Ze),
    y());
}
export { U as component };
