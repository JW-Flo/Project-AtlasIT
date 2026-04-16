import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Q as s,
  Tt as c,
  V as l,
  W as u,
  Z as d,
  _ as f,
  at as p,
  bt as m,
  ct as h,
  gt as g,
  ht as _,
  l as v,
  ot as ee,
  q as y,
  r as b,
  st as x,
  ut as S,
  v as C,
  w,
  wt as T,
  xt as E,
  y as D,
  z as O,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as k } from "../chunks/D8pbUplu.js";
import { n as A } from "../chunks/D4lFFHu4.js";
import { r as j } from "../chunks/BdUjKaVy2.js";
import { n as te, t as ne } from "../chunks/BEJa09Kq2.js";
import { t as re } from "../chunks/Cue2Cs472.js";
import { t as ie } from "../chunks/DOfJvt542.js";
import { t as M } from "../chunks/ejJaicvO2.js";
import { t as N } from "../chunks/oRaErrij2.js";
var P = [`SOC 2`, `ISO 27001`, `NIST CSF`, `HIPAA`, `GDPR`];
function F(e) {
  let t = Array.isArray(e?.visibleFrameworks) ? e?.visibleFrameworks : [],
    n = Array.from(new Set(t)).filter((e) => P.includes(e)),
    r = e?.controlVisibility,
    i = {};
  if (r && typeof r == `object`) {
    let e = new Set([`public`, `nda`, `private`]);
    for (let [t, n] of Object.entries(r)) e.has(n) && (i[t] = n);
  }
  return { isPublic: !!e?.isPublic, visibleFrameworks: n, controlVisibility: i };
}
function I(e, t, n) {
  return P.includes(t) ? (n ? Array.from(new Set([...e, t])) : e.filter((e) => e !== t)) : e;
}
var L = O(`<a> </a>`),
  R = O(`<p> </p>`),
  z = O(`<div class="space-y-3"></div>`),
  B = O(
    `<label class="flex items-center gap-3 rounded-md border px-3 py-2"><input type="checkbox"/> <span class="text-sm"> </span></label>`,
  ),
  V = O(
    `<div class="space-y-2"><!> <label class="flex items-center gap-3 rounded-md border px-3 py-2"><input type="checkbox"/> <span class="text-sm">Expose your Trust Center at <code> </code></span></label></div> <div class="space-y-2"><!> <p class="text-sm text-muted-foreground">Only selected frameworks will be shown on your public Trust Center page.</p> <div class="grid gap-2 sm:grid-cols-2"></div></div> <div><!></div>`,
    1,
  ),
  ae = O(
    `<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Trust Center Settings</h1> <div class="flex gap-1 border-b"></div> <!> <!></div>`,
  );
function H(O, H) {
  E(H, !1);
  let U = () => g(k, `$page`, G),
    W = () => g(j, `$session`, G),
    [G, oe] = _(),
    K = h(),
    se = [
      { href: `/console/settings`, label: `General` },
      { href: `/console/settings/users`, label: `Users` },
      { href: `/console/settings/audit-log`, label: `Audit Log` },
      { href: `/console/settings/billing`, label: `Billing` },
      { href: `/console/settings/trust`, label: `Trust Center` },
      { href: `/console/settings/incidents`, label: `Incidents` },
      { href: `/console/settings/security`, label: `Security` },
      { href: `/console/settings/notifications`, label: `Notifications` },
    ],
    q = h(!0),
    J = h(!1),
    Y = h(``),
    X = h(F(void 0));
  async function ce() {
    (S(q, !0), S(Y, ``));
    try {
      let e = await fetch(`/api/trust/settings`);
      if (!e.ok) throw Error(`Failed to load trust settings (${e.status})`);
      S(X, F((await e.json()).settings));
    } catch (e) {
      (S(Y, e?.message || `Failed to load trust settings`), S(X, F(void 0)));
    } finally {
      S(q, !1);
    }
  }
  async function le() {
    S(J, !0);
    try {
      let e = await fetch(`/api/trust/settings`, {
        method: `PATCH`,
        headers: { "content-type": `application/json` },
        body: JSON.stringify(u(X)),
      });
      if (!e.ok) throw Error(`Failed to save trust settings (${e.status})`);
      (S(X, F((await e.json()).settings)),
        A({ message: `Trust Center settings saved`, variant: `success` }));
    } catch (e) {
      A({ message: e?.message || `Failed to save trust settings`, variant: `error` });
    } finally {
      S(J, !1);
    }
  }
  function ue(e, t) {
    S(X, { ...u(X), visibleFrameworks: I(u(X).visibleFrameworks, e, t) });
  }
  (b(ce),
    d(
      () => U(),
      () => {
        S(K, U().url.pathname);
      },
    ),
    s(),
    v());
  var Z = ae(),
    Q = x(p(Z), 2);
  (a(
    Q,
    5,
    () => se,
    o,
    (t, n) => {
      var a = L(),
        o = p(a, !0);
      (c(a),
        e(() => {
          (C(a, `href`, (u(n), y(() => u(n).href))),
            w(
              a,
              1,
              `px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${(u(K), u(n), y(() => (u(K) === u(n).href ? `text-foreground border-b-2 border-primary` : `text-muted-foreground hover:text-foreground`))) ?? ``}`,
            ),
            r(o, (u(n), y(() => u(n).label))));
        }),
        i(t, a));
    },
  ),
    c(Q));
  var $ = x(Q, 2),
    de = (t) => {
      ie(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = R(),
            o = p(a, !0);
          (c(a), e(() => r(o, u(Y))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t($, (e) => {
    u(Y) && e(de);
  });
  var fe = x($, 2),
    pe = (e) => {
      var t = z();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          N(e, { class: `h-12 rounded-lg` });
        },
      ),
        c(t),
        i(e, t));
    },
    me = (t) => {
      te(t, {
        children: (t, s) => {
          ne(t, {
            class: `pt-6 space-y-6`,
            children: (t, s) => {
              var d = V(),
                m = ee(d),
                h = p(m);
              M(h, {
                class: `text-base`,
                children: (e, t) => {
                  (T(), i(e, l(`Public visibility`)));
                },
                $$slots: { default: !0 },
              });
              var g = x(h, 2),
                _ = p(g);
              f(_);
              var v = x(_, 2),
                b = x(p(v)),
                C = p(b);
              (c(b), c(v), c(g), c(m));
              var w = x(m, 2),
                E = p(w);
              M(E, {
                class: `text-base`,
                children: (e, t) => {
                  (T(), i(e, l(`Visible frameworks`)));
                },
                $$slots: { default: !0 },
              });
              var O = x(E, 4);
              (a(
                O,
                5,
                () => P,
                o,
                (t, a) => {
                  var o = B(),
                    s = p(o);
                  f(s);
                  var l = x(s, 2),
                    d = p(l, !0);
                  (c(l),
                    c(o),
                    e(
                      (e) => {
                        (D(s, e), r(d, u(a)));
                      },
                      [() => (u(X), u(a), y(() => u(X).visibleFrameworks.includes(u(a))))],
                    ),
                    n(`change`, s, (e) => ue(u(a), e.currentTarget.checked)),
                    i(t, o));
                },
              ),
                c(O),
                c(w));
              var k = x(w, 2);
              (re(p(k), {
                get disabled() {
                  return u(J);
                },
                $$events: { click: le },
                children: (t, n) => {
                  T();
                  var a = l();
                  (e(() => r(a, u(J) ? `Saving...` : `Save Trust Settings`)), i(t, a));
                },
                $$slots: { default: !0 },
              }),
                c(k),
                e(() => {
                  (D(_, (u(X), y(() => u(X).isPublic))),
                    r(C, `/trust/${(W(), y(() => W()?.tenantId ?? `your-org`)) ?? ``}`));
                }),
                n(`change`, _, (e) => {
                  S(X, { ...u(X), isPublic: e.currentTarget.checked });
                }),
                i(t, d));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (t(fe, (e) => {
    u(q) ? e(pe) : e(me, -1);
  }),
    c(Z),
    i(O, Z),
    m(),
    oe());
}
export { H as component };
