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
  b as m,
  bt as h,
  ct as g,
  gt as _,
  h as v,
  ht as y,
  l as b,
  ot as x,
  q as S,
  r as ee,
  st as C,
  ut as w,
  v as T,
  w as E,
  wt as D,
  xt as te,
  y as ne,
  z as O,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as re } from "../chunks/D8pbUplu.js";
import { n as k } from "../chunks/D4lFFHu4.js";
import { t as A } from "../chunks/Bh_67ZLW.js";
import { t as ie } from "../chunks/Cyprtw_22.js";
import { t as ae } from "../chunks/CMGwYO6i2.js";
import { a as oe } from "../chunks/DRwGYiyO2.js";
import { n as j, t as M } from "../chunks/BEJa09Kq2.js";
import { t as N } from "../chunks/Da7GIpgR2.js";
import { t as P } from "../chunks/B2LjsFjQ2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as I } from "../chunks/DOfJvt542.js";
import { t as L } from "../chunks/C8W1vu9i2.js";
import { t as R } from "../chunks/ejJaicvO2.js";
import { t as se } from "../chunks/oRaErrij2.js";
var ce = O(`<a> </a>`),
  le = O(`<!> <p class="pl-7"> </p>`, 1),
  ue = O(`<div class="space-y-4"></div>`),
  de = O(`<option> </option>`),
  fe = O(`<!> `, 1),
  pe = O(
    `<div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <select id="company-size" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><option>Select size...</option><!></select></div> <div class="pt-2"><!></div>`,
    1,
  ),
  me = O(
    `<div class="flex items-center gap-3"><img alt="Logo preview" class="h-10 w-10 rounded-lg object-cover border"/> <span class="text-sm text-muted-foreground">Preview</span></div>`,
  ),
  he = O(`<!> `, 1),
  ge = O(
    `<div class="space-y-2"><!> <!> <p class="text-xs text-muted-foreground">Displayed in the sidebar and Trust Center. Use a square image for best results.</p></div> <!> <div class="space-y-2"><!> <div class="flex items-center gap-3"><input id="accent-color" type="color" class="h-10 w-10 rounded-md border border-input cursor-pointer"/> <!></div> <p class="text-xs text-muted-foreground">Used for the sidebar brand icon when no logo is set.</p></div> <div class="pt-2"><!></div>`,
    1,
  ),
  _e = O(`<!> <!>`, 1),
  ve = O(`<!> Compliance Frameworks`, 1),
  ye = O(
    `<label><input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-input"/> <div><div class="font-medium text-sm"> </div> <div class="text-xs text-muted-foreground"> </div></div></label>`,
  ),
  be = O(
    `<!> <p class="pl-7">Select at least one framework. Without a selection, defaults (SOC 2, ISO 27001, NIST CSF) will be used.</p>`,
    1,
  ),
  xe = O(`<!> `, 1),
  Se = O(
    `<p class="text-sm text-muted-foreground">Select the compliance frameworks relevant to your organization. The Compliance Manager will only show controls and scores for your selected frameworks.</p> <div class="grid gap-3 sm:grid-cols-2"></div> <!> <div class="pt-2"><!></div>`,
    1,
  ),
  Ce = O(`<!> <!>`, 1),
  we = O(`<!> <!> <!>`, 1),
  Te = O(
    `<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Organization Settings</h1> <div class="flex gap-1 border-b"></div> <!> <!></div>`,
  );
function z(O, z) {
  te(z, !1);
  let B = () => _(re, `$page`, Ee),
    [Ee, De] = y(),
    V = g(),
    Oe = [
      { id: `SOC2`, name: `SOC 2`, desc: `Service Organization Controls` },
      { id: `ISO27001`, name: `ISO 27001`, desc: `Information Security Management` },
      { id: `NIST CSF`, name: `NIST CSF`, desc: `Cybersecurity Framework` },
      { id: `HIPAA`, name: `HIPAA`, desc: `Health Insurance Portability` },
      { id: `GDPR`, name: `GDPR`, desc: `General Data Protection Regulation` },
    ],
    ke = [
      { href: `/console/settings`, label: `General` },
      { href: `/console/settings/users`, label: `Users` },
      { href: `/console/settings/audit-log`, label: `Audit Log` },
      { href: `/console/settings/billing`, label: `Billing` },
      { href: `/console/settings/trust`, label: `Trust Center` },
      { href: `/console/settings/incidents`, label: `Incidents` },
      { href: `/console/settings/security`, label: `Security` },
      { href: `/console/settings/notifications`, label: `Notifications` },
    ],
    H = g(!0),
    U = g(``),
    W = g(!1),
    G = g(``),
    K = g(``),
    q = g(``),
    J = g(``),
    Y = g(``),
    X = g([]),
    Ae = [`1-10`, `11-50`, `51-200`, `201-500`, `500+`];
  async function je() {
    (w(H, !0), w(U, ``));
    try {
      let e = await fetch(`/api/tenant/settings`);
      if (!e.ok) throw Error(`Failed to load settings (${e.status})`);
      let t = await e.json();
      (w(G, t.name || ``),
        w(K, t.industry || ``),
        w(q, t.size || ``),
        w(J, t.logoUrl || ``),
        w(Y, t.accentColor || ``),
        w(X, t.frameworks || []));
    } catch (e) {
      w(U, e?.message || `Failed to load settings`);
    } finally {
      w(H, !1);
    }
  }
  async function Z() {
    w(W, !0);
    try {
      if (
        !(
          await fetch(`/api/tenant/settings`, {
            method: `PATCH`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({
              name: u(G),
              industry: u(K),
              size: u(q),
              logoUrl: u(J),
              accentColor: u(Y),
              frameworks: u(X),
            }),
          })
        ).ok
      )
        throw Error(`Failed to save settings`);
      (k({ message: `Settings saved`, variant: `success` }),
        oe(),
        window.dispatchEvent(
          new CustomEvent(`branding-updated`, { detail: { logoUrl: u(J), accentColor: u(Y) } }),
        ));
    } catch (e) {
      k({ message: e?.message || `Failed to save settings`, variant: `error` });
    } finally {
      w(W, !1);
    }
  }
  (ee(je),
    d(
      () => B(),
      () => {
        w(V, B().url.pathname);
      },
    ),
    s(),
    b());
  var Q = Te(),
    $ = C(p(Q), 2);
  (a(
    $,
    5,
    () => ke,
    o,
    (t, n) => {
      var a = ce(),
        o = p(a, !0);
      (c(a),
        e(() => {
          (T(a, `href`, (u(n), S(() => u(n).href))),
            E(
              a,
              1,
              `px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${(u(V), u(n), S(() => (u(V) === u(n).href ? `text-foreground border-b-2 border-primary` : `text-muted-foreground hover:text-foreground`))) ?? ``}`,
            ),
            r(o, (u(n), S(() => u(n).label))));
        }),
        i(t, a));
    },
  ),
    c($));
  var Me = C($, 2),
    Ne = (t) => {
      I(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = le(),
            o = x(a);
          ae(o, { class: `h-4 w-4` });
          var s = C(o, 2),
            l = p(s, !0);
          (c(s), e(() => r(l, u(U))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t(Me, (e) => {
    u(U) && e(Ne);
  });
  var Pe = C(Me, 2),
    Fe = (e) => {
      var t = ue();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          se(e, { class: `h-12 rounded-lg` });
        },
      ),
        c(t),
        i(e, t));
    },
    Ie = (s) => {
      var d = we(),
        h = x(d);
      j(h, {
        children: (t, n) => {
          M(t, {
            class: `pt-6 space-y-5`,
            children: (t, n) => {
              var s = pe(),
                d = x(s),
                f = p(d);
              (R(f, {
                htmlFor: `org-name`,
                children: (e, t) => {
                  (D(), i(e, l(`Organization Name`)));
                },
                $$slots: { default: !0 },
              }),
                L(C(f, 2), {
                  id: `org-name`,
                  get value() {
                    return u(G);
                  },
                  set value(e) {
                    w(G, e);
                  },
                  $$legacy: !0,
                }),
                c(d));
              var h = C(d, 2),
                g = p(h);
              (R(g, {
                htmlFor: `industry`,
                children: (e, t) => {
                  (D(), i(e, l(`Industry`)));
                },
                $$slots: { default: !0 },
              }),
                L(C(g, 2), {
                  id: `industry`,
                  get value() {
                    return u(K);
                  },
                  set value(e) {
                    w(K, e);
                  },
                  $$legacy: !0,
                }),
                c(h));
              var _ = C(h, 2),
                v = p(_);
              R(v, {
                htmlFor: `company-size`,
                children: (e, t) => {
                  (D(), i(e, l(`Company Size`)));
                },
                $$slots: { default: !0 },
              });
              var y = C(v, 2),
                b = p(y);
              ((b.value = b.__value = ``),
                a(
                  C(b),
                  1,
                  () => Ae,
                  o,
                  (t, n) => {
                    var a = de(),
                      o = p(a, !0);
                    c(a);
                    var s = {};
                    (e(() => {
                      (r(o, u(n)), s !== (s = u(n)) && (a.value = (a.__value = u(n)) ?? ``));
                    }),
                      i(t, a));
                  },
                ),
                c(y),
                c(_));
              var S = C(_, 2);
              (F(p(S), {
                get disabled() {
                  return u(W);
                },
                $$events: { click: Z },
                children: (t, n) => {
                  var a = fe(),
                    o = x(a);
                  A(o, { class: `h-4 w-4 mr-1.5` });
                  var s = C(o);
                  (e(() => r(s, ` ${u(W) ? `Saving...` : `Save Changes`}`)), i(t, a));
                },
                $$slots: { default: !0 },
              }),
                c(S),
                m(
                  y,
                  () => u(q),
                  (e) => w(q, e),
                ),
                i(t, s));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var g = C(h, 2);
      (j(g, {
        children: (n, a) => {
          var o = _e(),
            s = x(o);
          (N(s, {
            children: (e, t) => {
              P(e, {
                children: (e, t) => {
                  (D(), i(e, l(`Branding`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            M(C(s, 2), {
              class: `space-y-5`,
              children: (n, a) => {
                var o = ge(),
                  s = x(o),
                  d = p(s);
                (R(d, {
                  htmlFor: `logo-url`,
                  children: (e, t) => {
                    (D(), i(e, l(`Logo URL`)));
                  },
                  $$slots: { default: !0 },
                }),
                  L(C(d, 2), {
                    id: `logo-url`,
                    placeholder: `https://example.com/logo.png`,
                    get value() {
                      return u(J);
                    },
                    set value(e) {
                      w(J, e);
                    },
                    $$legacy: !0,
                  }),
                  D(2),
                  c(s));
                var m = C(s, 2),
                  h = (t) => {
                    var n = me(),
                      r = p(n);
                    (D(2), c(n), e(() => T(r, `src`, u(J))), i(t, n));
                  };
                t(m, (e) => {
                  u(J) && e(h);
                });
                var g = C(m, 2),
                  _ = p(g);
                R(_, {
                  htmlFor: `accent-color`,
                  children: (e, t) => {
                    (D(), i(e, l(`Accent Color`)));
                  },
                  $$slots: { default: !0 },
                });
                var y = C(_, 2),
                  b = p(y);
                (f(b),
                  L(C(b, 2), {
                    placeholder: `#3b82f6`,
                    class: `max-w-[160px]`,
                    get value() {
                      return u(Y);
                    },
                    set value(e) {
                      w(Y, e);
                    },
                    $$legacy: !0,
                  }),
                  c(y),
                  D(2),
                  c(g));
                var S = C(g, 2);
                (F(p(S), {
                  get disabled() {
                    return u(W);
                  },
                  $$events: { click: Z },
                  children: (t, n) => {
                    var a = he(),
                      o = x(a);
                    A(o, { class: `h-4 w-4 mr-1.5` });
                    var s = C(o);
                    (e(() => r(s, ` ${u(W) ? `Saving...` : `Save Branding`}`)), i(t, a));
                  },
                  $$slots: { default: !0 },
                }),
                  c(S),
                  v(
                    b,
                    () => u(Y),
                    (e) => w(Y, e),
                  ),
                  i(n, o));
              },
              $$slots: { default: !0 },
            }),
            i(n, o));
        },
        $$slots: { default: !0 },
      }),
        j(C(g, 2), {
          children: (s, l) => {
            var d = Ce(),
              m = x(d);
            (N(m, {
              children: (e, t) => {
                P(e, {
                  class: `flex items-center gap-2`,
                  children: (e, t) => {
                    var n = ve();
                    (ie(x(n), { class: `h-5 w-5` }), D(), i(e, n));
                  },
                  $$slots: { default: !0 },
                });
              },
              $$slots: { default: !0 },
            }),
              M(C(m, 2), {
                class: `space-y-4`,
                children: (s, l) => {
                  var d = Se(),
                    m = C(x(d), 2);
                  (a(
                    m,
                    5,
                    () => Oe,
                    o,
                    (t, a) => {
                      var o = ye(),
                        s = p(o);
                      f(s);
                      var l = C(s, 2),
                        d = p(l),
                        m = p(d, !0);
                      c(d);
                      var h = C(d, 2),
                        g = p(h, !0);
                      (c(h),
                        c(l),
                        c(o),
                        e(
                          (e, t) => {
                            (E(
                              o,
                              1,
                              `flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${e ?? ``}`,
                            ),
                              ne(s, t),
                              r(m, (u(a), S(() => u(a).name))),
                              r(g, (u(a), S(() => u(a).desc))));
                          },
                          [
                            () => (
                              u(X),
                              u(a),
                              S(() =>
                                u(X).includes(u(a).id)
                                  ? `border-primary bg-primary/5`
                                  : `hover:bg-accent`,
                              )
                            ),
                            () => (u(X), u(a), S(() => u(X).includes(u(a).id))),
                          ],
                        ),
                        n(`change`, s, () => {
                          u(X).includes(u(a).id)
                            ? w(
                                X,
                                u(X).filter((e) => e !== u(a).id),
                              )
                            : w(X, [...u(X), u(a).id]);
                        }),
                        i(t, o));
                    },
                  ),
                    c(m));
                  var h = C(m, 2),
                    g = (e) => {
                      I(e, {
                        variant: `destructive`,
                        children: (e, t) => {
                          var n = be();
                          (ae(x(n), { class: `h-4 w-4` }), D(2), i(e, n));
                        },
                        $$slots: { default: !0 },
                      });
                    };
                  t(h, (e) => {
                    (u(X), S(() => u(X).length === 0) && e(g));
                  });
                  var _ = C(h, 2);
                  (F(p(_), {
                    get disabled() {
                      return u(W);
                    },
                    $$events: { click: Z },
                    children: (t, n) => {
                      var a = xe(),
                        o = x(a);
                      A(o, { class: `h-4 w-4 mr-1.5` });
                      var s = C(o);
                      (e(() => r(s, ` ${u(W) ? `Saving...` : `Save Frameworks`}`)), i(t, a));
                    },
                    $$slots: { default: !0 },
                  }),
                    c(_),
                    i(s, d));
                },
                $$slots: { default: !0 },
              }),
              i(s, d));
          },
          $$slots: { default: !0 },
        }),
        i(s, d));
    };
  (t(Pe, (e) => {
    u(H) ? e(Fe) : e(Ie, -1);
  }),
    c(Q),
    i(O, Q),
    h(),
    De());
}
export { z as component };
