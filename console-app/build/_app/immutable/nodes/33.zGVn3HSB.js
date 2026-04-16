import {
  $ as e,
  F as t,
  I as n,
  L as r,
  N as i,
  P as a,
  Q as o,
  R as s,
  Tt as c,
  V as l,
  W as u,
  Z as d,
  _ as f,
  a as p,
  at as m,
  bt as h,
  ct as g,
  gt as _,
  h as v,
  ht as y,
  j as b,
  l as ee,
  ot as x,
  pt as S,
  q as C,
  r as te,
  s as w,
  st as T,
  ut as E,
  v as ne,
  w as re,
  wt as D,
  xt as ie,
  z as O,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as ae } from "../chunks/D8pbUplu.js";
import { t as k } from "../chunks/_6xtu--D.js";
import { t as oe } from "../chunks/DiCJsy1x.js";
import { t as se } from "../chunks/Cdj3j7qG.js";
import { t as A } from "../chunks/DxdpJY9x.js";
import { t as ce } from "../chunks/CMGwYO6i2.js";
import { t as le } from "../chunks/B0pEiESM2.js";
import { n as j, t as M } from "../chunks/BEJa09Kq2.js";
import { t as N } from "../chunks/Cue2Cs472.js";
import { t as ue } from "../chunks/DOfJvt542.js";
import { t as de } from "../chunks/oRaErrij2.js";
function fe(e, t) {
  let n = p(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    i = [
      [
        `path`,
        {
          d: `M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z`,
        },
      ],
    ];
  k(
    e,
    w({ name: `funnel` }, () => n, {
      get iconNode() {
        return i;
      },
      children: (e, n) => {
        var i = s();
        (b(x(i), t, `default`, {}, null), r(e, i));
      },
      $$slots: { default: !0 },
    }),
  );
}
var pe = O(`<span class="ml-1 h-2 w-2 rounded-full bg-primary inline-block"></span>`),
  me = O(`<!> Filters <!>`, 1),
  he = O(`<!> CSV`, 1),
  ge = O(`<!> JSON`, 1),
  _e = O(`<a> </a>`),
  ve = O(`<!> Clear`, 1),
  ye = O(
    `<div class="flex flex-wrap items-end gap-4"><div class="flex flex-col gap-1"><label class="text-xs font-medium text-muted-foreground" for="filter-action">Action</label> <input id="filter-action" type="text" placeholder="e.g. user.invited" class="h-9 rounded-md border border-input bg-background px-3 text-sm"/></div> <div class="flex flex-col gap-1"><label class="text-xs font-medium text-muted-foreground" for="filter-from">From</label> <input id="filter-from" type="date" class="h-9 rounded-md border border-input bg-background px-3 text-sm"/></div> <div class="flex flex-col gap-1"><label class="text-xs font-medium text-muted-foreground" for="filter-to">To</label> <input id="filter-to" type="date" class="h-9 rounded-md border border-input bg-background px-3 text-sm"/></div> <!> <!></div>`,
  ),
  be = O(`<!> <p class="pl-7"> </p>`, 1),
  xe = O(`<div class="space-y-3"></div>`),
  Se = O(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3 text-muted-foreground whitespace-nowrap"> </td><td class="px-4 py-3"> </td><td class="px-4 py-3 font-medium"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-muted-foreground max-w-xs truncate"> </td></tr>`,
  ),
  Ce = O(
    `<tr><td colspan="5" class="px-4 py-6 text-center text-muted-foreground">No audit log entries</td></tr>`,
  ),
  we = O(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Date</th><th class="px-4 py-3 font-medium">Actor</th><th class="px-4 py-3 font-medium">Action</th><th class="px-4 py-3 font-medium">Target</th><th class="px-4 py-3 font-medium">Details</th></tr></thead><tbody></tbody></table></div>`,
  ),
  Te = O(`<!> Previous`, 1),
  Ee = O(`Next <!>`, 1),
  De = O(
    `<div class="flex justify-between items-center text-sm"><span class="text-muted-foreground"> </span> <div class="flex gap-2"><!> <!></div></div>`,
  ),
  Oe = O(`<!> <!>`, 1),
  ke = O(
    `<div class="space-y-6"><div class="flex items-center justify-between"><h1 class="text-2xl font-semibold tracking-tight">Audit Log</h1> <div class="flex gap-2"><!> <!> <!></div></div> <div class="flex gap-1 border-b"></div> <!> <!> <!></div>`,
  );
function P(s, p) {
  ie(p, !1);
  let b = () => _(ae, `$page`, w),
    [w, O] = y(),
    k = g(),
    P = g(),
    Ae = [
      { href: `/console/settings`, label: `General` },
      { href: `/console/settings/users`, label: `Users` },
      { href: `/console/settings/audit-log`, label: `Audit Log` },
      { href: `/console/settings/billing`, label: `Billing` },
      { href: `/console/settings/trust`, label: `Trust Center` },
      { href: `/console/settings/incidents`, label: `Incidents` },
      { href: `/console/settings/security`, label: `Security` },
      { href: `/console/settings/notifications`, label: `Notifications` },
    ],
    F = g([]),
    I = g(0),
    L = g(!0),
    R = g(``),
    z = g(0),
    B = g(``),
    V = g(``),
    H = g(``),
    U = g(!1),
    W = g(!1);
  function je(e = {}) {
    let t = new URLSearchParams();
    (t.set(`limit`, String(e.limit ?? 50)),
      t.set(`offset`, String(e.offset ?? u(z))),
      u(B) && t.set(`action`, u(B)),
      u(V) && t.set(`from`, u(V)),
      u(H) && t.set(`to`, u(H)));
    for (let [n, r] of Object.entries(e)) n !== `limit` && n !== `offset` && t.set(n, r);
    return t.toString();
  }
  async function G() {
    (E(L, !0), E(R, ``));
    try {
      let e = je(),
        t = await fetch(`/api/tenant/audit-log?${e}`);
      if (!t.ok) throw Error(`Failed to load audit log (${t.status})`);
      let n = await t.json();
      (E(F, n.entries || []), E(I, n.total || 0));
    } catch (e) {
      E(R, e?.message || `Failed to load audit log`);
    } finally {
      E(L, !1);
    }
  }
  function Me() {
    (E(z, 0), G());
  }
  function Ne() {
    (E(B, ``), E(V, ``), E(H, ``), E(z, 0), G());
  }
  function Pe() {
    u(z) <= 0 || (E(z, Math.max(0, u(z) - 50)), G());
  }
  function Fe() {
    u(z) + 50 >= u(I) || (E(z, u(z) + 50), G());
  }
  async function K(e) {
    E(W, !0);
    try {
      let t = new URLSearchParams();
      (t.set(`format`, e),
        u(B) && t.set(`action`, u(B)),
        u(V) && t.set(`from`, u(V)),
        u(H) && t.set(`to`, u(H)));
      let n = await fetch(`/api/tenant/audit-log/export?${t}`);
      if (!n.ok) throw Error(`Export failed`);
      let r = await n.blob(),
        i = URL.createObjectURL(r),
        a = document.createElement(`a`);
      ((a.href = i), (a.download = `audit-log-export.${e}`), a.click(), URL.revokeObjectURL(i));
    } catch (e) {
      E(R, e?.message || `Export failed`);
    } finally {
      E(W, !1);
    }
  }
  (te(G),
    d(
      () => b(),
      () => {
        E(k, b().url.pathname);
      },
    ),
    d(
      () => (u(B), u(V), u(H)),
      () => {
        E(P, u(B) || u(V) || u(H));
      },
    ),
    o(),
    ee());
  var q = ke(),
    J = m(q),
    Y = T(m(J), 2),
    X = m(Y);
  N(X, {
    variant: `outline`,
    size: `sm`,
    $$events: { click: () => E(U, !u(U)) },
    children: (e, n) => {
      var i = me(),
        a = x(i);
      fe(a, { class: `h-4 w-4 mr-1` });
      var o = T(a, 2),
        s = (e) => {
          r(e, pe());
        };
      (t(o, (e) => {
        u(P) && e(s);
      }),
        r(e, i));
    },
    $$slots: { default: !0 },
  });
  var Z = T(X, 2);
  (N(Z, {
    variant: `outline`,
    size: `sm`,
    get disabled() {
      return u(W);
    },
    $$events: { click: () => K(`csv`) },
    children: (e, t) => {
      var n = he();
      (A(x(n), { class: `h-4 w-4 mr-1` }), D(), r(e, n));
    },
    $$slots: { default: !0 },
  }),
    N(T(Z, 2), {
      variant: `outline`,
      size: `sm`,
      get disabled() {
        return u(W);
      },
      $$events: { click: () => K(`json`) },
      children: (e, t) => {
        var n = ge();
        (A(x(n), { class: `h-4 w-4 mr-1` }), D(), r(e, n));
      },
      $$slots: { default: !0 },
    }),
    c(Y),
    c(J));
  var Q = T(J, 2);
  (i(
    Q,
    5,
    () => Ae,
    a,
    (t, i) => {
      var a = _e(),
        o = m(a, !0);
      (c(a),
        e(() => {
          (ne(a, `href`, (u(i), C(() => u(i).href))),
            re(
              a,
              1,
              `px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${(u(k), u(i), C(() => (u(k) === u(i).href ? `text-foreground border-b-2 border-primary` : `text-muted-foreground hover:text-foreground`))) ?? ``}`,
            ),
            n(o, (u(i), C(() => u(i).label))));
        }),
        r(t, a));
    },
  ),
    c(Q));
  var $ = T(Q, 2),
    Ie = (e) => {
      j(e, {
        children: (e, n) => {
          M(e, {
            class: `p-4`,
            children: (e, n) => {
              var i = ye(),
                a = m(i),
                o = T(m(a), 2);
              (f(o), c(a));
              var s = T(a, 2),
                d = T(m(s), 2);
              (f(d), c(s));
              var p = T(s, 2),
                h = T(m(p), 2);
              (f(h), c(p));
              var g = T(p, 2);
              N(g, {
                size: `sm`,
                $$events: { click: Me },
                children: (e, t) => {
                  (D(), r(e, l(`Apply`)));
                },
                $$slots: { default: !0 },
              });
              var _ = T(g, 2),
                y = (e) => {
                  N(e, {
                    variant: `ghost`,
                    size: `sm`,
                    $$events: { click: Ne },
                    children: (e, t) => {
                      var n = ve();
                      (le(x(n), { class: `h-4 w-4 mr-1` }), D(), r(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                };
              (t(_, (e) => {
                u(P) && e(y);
              }),
                c(i),
                v(
                  o,
                  () => u(B),
                  (e) => E(B, e),
                ),
                v(
                  d,
                  () => u(V),
                  (e) => E(V, e),
                ),
                v(
                  h,
                  () => u(H),
                  (e) => E(H, e),
                ),
                r(e, i));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  t($, (e) => {
    u(U) && e(Ie);
  });
  var Le = T($, 2),
    Re = (t) => {
      ue(t, {
        variant: `destructive`,
        children: (t, i) => {
          var a = be(),
            o = x(a);
          ce(o, { class: `h-4 w-4` });
          var s = T(o, 2),
            l = m(s, !0);
          (c(s), e(() => n(l, u(R))), r(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t(Le, (e) => {
    u(R) && e(Re);
  });
  var ze = T(Le, 2),
    Be = (e) => {
      var t = xe();
      (i(
        t,
        4,
        () => [1, 2, 3],
        a,
        (e, t) => {
          de(e, { class: `h-12 rounded-lg` });
        },
      ),
        c(t),
        r(e, t));
    },
    Ve = (o) => {
      var s = Oe(),
        l = x(s);
      j(l, {
        children: (t, o) => {
          M(t, {
            class: `p-0`,
            children: (t, o) => {
              var s = we(),
                l = m(s),
                d = T(m(l));
              (i(
                d,
                5,
                () => u(F),
                a,
                (t, i) => {
                  var a = Se(),
                    o = m(a),
                    s = m(o, !0);
                  c(o);
                  var l = T(o),
                    d = m(l, !0);
                  c(l);
                  var f = T(l),
                    p = m(f, !0);
                  c(f);
                  var h = T(f),
                    g = m(h, !0);
                  c(h);
                  var _ = T(h),
                    v = m(_, !0);
                  (c(_),
                    c(a),
                    e(
                      (e) => {
                        (n(s, e),
                          n(d, (u(i), C(() => u(i).actor))),
                          n(p, (u(i), C(() => u(i).action))),
                          n(g, (u(i), C(() => u(i).target || `---`))),
                          n(v, (u(i), C(() => u(i).details || `---`))));
                      },
                      [() => (u(i), C(() => new Date(u(i).date).toLocaleString()))],
                    ),
                    r(t, a));
                },
                (e) => {
                  r(e, Ce());
                },
              ),
                c(d),
                c(l),
                c(s),
                r(t, s));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var d = T(l, 2),
        f = (t) => {
          var i = De(),
            a = m(i),
            o = m(a);
          c(a);
          var s = T(a, 2),
            l = m(s);
          {
            let e = S(() => u(z) <= 0);
            N(l, {
              variant: `outline`,
              size: `sm`,
              get disabled() {
                return u(e);
              },
              $$events: { click: Pe },
              children: (e, t) => {
                var n = Te();
                (oe(x(n), { class: `h-4 w-4 mr-1` }), D(), r(e, n));
              },
              $$slots: { default: !0 },
            });
          }
          var d = T(l, 2);
          {
            let e = S(() => u(z) + 50 >= u(I));
            N(d, {
              variant: `outline`,
              size: `sm`,
              get disabled() {
                return u(e);
              },
              $$events: { click: Fe },
              children: (e, t) => {
                D();
                var n = Ee();
                (se(T(x(n)), { class: `h-4 w-4 ml-1` }), r(e, n));
              },
              $$slots: { default: !0 },
            });
          }
          (c(s),
            c(i),
            e(
              (e) => n(o, `Showing ${u(z) + 1}--${e ?? ``} of ${u(I) ?? ``}`),
              [() => (u(z), u(I), C(() => Math.min(u(z) + 50, u(I))))],
            ),
            r(t, i));
        };
      (t(d, (e) => {
        u(I) > 50 && e(f);
      }),
        r(o, s));
    };
  (t(ze, (e) => {
    u(L) ? e(Be) : e(Ve, -1);
  }),
    c(q),
    r(s, q),
    h(),
    O());
}
export { P as component };
