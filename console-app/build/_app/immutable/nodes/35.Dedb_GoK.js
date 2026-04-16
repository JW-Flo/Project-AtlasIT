import {
  $ as e,
  F as t,
  I as n,
  L as r,
  N as i,
  P as a,
  Q as o,
  Tt as s,
  W as c,
  Z as l,
  _ as u,
  at as d,
  bt as f,
  ct as p,
  gt as m,
  h as ee,
  ht as h,
  l as g,
  lt as te,
  ot as _,
  q as v,
  r as y,
  st as b,
  ut as x,
  v as S,
  w as C,
  wt as w,
  xt as T,
  z as E,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as ne } from "../chunks/D8pbUplu.js";
import { n as D } from "../chunks/D4lFFHu4.js";
import { t as O } from "../chunks/GTPgCmsy.js";
import { t as k } from "../chunks/Bh_67ZLW.js";
import { t as re } from "../chunks/CMGwYO6i2.js";
import { n as ie, t as ae } from "../chunks/BEJa09Kq2.js";
import { t as oe } from "../chunks/Da7GIpgR2.js";
import { t as se } from "../chunks/B2LjsFjQ2.js";
import { t as ce } from "../chunks/Cue2Cs472.js";
import { t as le } from "../chunks/DOfJvt542.js";
import { t as A } from "../chunks/oRaErrij2.js";
var ue = E(`<a> </a>`),
  j = E(`<!> <p class="pl-7"> </p>`, 1),
  M = E(`<div class="space-y-3"><!> <!></div>`),
  N = E(`<!> SLA Response Deadlines`, 1),
  P = E(
    `<div class="flex items-center gap-4 p-3 rounded-lg border bg-card"><div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span> </span> <span class="text-xs text-muted-foreground"> </span></div> <p class="text-xs text-muted-foreground mt-0.5"> </p></div> <div class="flex items-center gap-2 shrink-0"><input type="number" min="0.02" max="168" step="0.5" class="w-20 h-9 rounded-md border border-input bg-background px-3 text-sm text-right tabular-nums"/> <span class="text-xs text-muted-foreground w-10">hours</span></div></div>`,
  ),
  F = E(`<!> `, 1),
  I = E(
    `<p class="text-sm text-muted-foreground">Configure how long each severity level has before the SLA is considered breached.
          New incidents and severity changes will use these deadlines.</p> <div class="grid gap-4"></div> <div class="flex justify-end pt-2"><!></div>`,
    1,
  ),
  L = E(`<!> <!>`, 1),
  R = E(
    `<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Incident Settings</h1> <div class="flex gap-1 border-b"></div> <!> <!></div>`,
  );
function z(E, z) {
  T(z, !1);
  let B = () => m(ne, `$page`, V),
    [V, H] = h(),
    U = p(),
    de = [
      { href: `/console/settings`, label: `General` },
      { href: `/console/settings/users`, label: `Users` },
      { href: `/console/settings/audit-log`, label: `Audit Log` },
      { href: `/console/settings/billing`, label: `Billing` },
      { href: `/console/settings/trust`, label: `Trust Center` },
      { href: `/console/settings/incidents`, label: `Incidents` },
      { href: `/console/settings/security`, label: `Security` },
      { href: `/console/settings/notifications`, label: `Notifications` },
    ],
    fe = [
      {
        key: `critical`,
        label: `Critical`,
        color: `text-red-500`,
        desc: `System down, data breach, security emergency`,
      },
      {
        key: `high`,
        label: `High`,
        color: `text-orange-500`,
        desc: `Major feature broken, compliance risk`,
      },
      {
        key: `medium`,
        label: `Medium`,
        color: `text-yellow-500`,
        desc: `Degraded service, minor security issue`,
      },
      {
        key: `low`,
        label: `Low`,
        color: `text-muted-foreground`,
        desc: `Cosmetic issue, minor inconvenience`,
      },
    ],
    W = p(!0),
    G = p(!1),
    K = p(``),
    q = { critical: 3600, high: 14400, medium: 86400, low: 259200 };
  function pe(e) {
    if (e >= 86400) {
      let t = Math.floor(e / 86400),
        n = Math.floor((e % 86400) / 3600);
      return n > 0 ? `${t}d ${n}h` : `${t}d`;
    }
    if (e >= 3600) {
      let t = Math.floor(e / 3600),
        n = Math.floor((e % 3600) / 60);
      return n > 0 ? `${t}h ${n}m` : `${t}h`;
    }
    return `${Math.floor(e / 60)}m`;
  }
  let J = p({});
  function Y(e) {
    return Math.round((e / 3600) * 10) / 10;
  }
  function X(e) {
    return Math.round(e * 3600);
  }
  async function me() {
    (x(W, !0), x(K, ``));
    try {
      let e = await fetch(`/api/incidents/sla-config`);
      if (!e.ok) throw Error(`Failed to load SLA config (${e.status})`);
      ((q = await e.json()),
        x(J, { critical: Y(q.critical), high: Y(q.high), medium: Y(q.medium), low: Y(q.low) }));
    } catch (e) {
      x(K, e?.message || `Failed to load SLA configuration`);
    } finally {
      x(W, !1);
    }
  }
  async function he() {
    (x(G, !0), x(K, ``));
    try {
      let e = {
        critical: X(c(J).critical),
        high: X(c(J).high),
        medium: X(c(J).medium),
        low: X(c(J).low),
      };
      if (e.critical > e.high || e.high > e.medium || e.medium > e.low) {
        (x(K, `SLA deadlines must increase from Critical to Low (Critical is the tightest)`),
          x(G, !1));
        return;
      }
      let t = await fetch(`/api/incidents/sla-config`, {
        method: `PUT`,
        headers: { "Content-Type": `application/json` },
        body: JSON.stringify(e),
      });
      if (!t.ok) {
        let e = await t.json().catch(() => ({}));
        throw Error(e.error || `Failed to save (${t.status})`);
      }
      ((q = await t.json()), D({ message: `SLA configuration saved`, variant: `success` }));
    } catch (e) {
      (x(K, e?.message || `Failed to save SLA configuration`),
        D({ message: c(K), variant: `error` }));
    } finally {
      x(G, !1);
    }
  }
  (y(me),
    l(
      () => B(),
      () => {
        x(U, B().url.pathname);
      },
    ),
    o(),
    g());
  var Z = R(),
    Q = b(d(Z), 2);
  (i(
    Q,
    5,
    () => de,
    a,
    (t, i) => {
      var a = ue(),
        o = d(a, !0);
      (s(a),
        e(() => {
          (S(a, `href`, (c(i), v(() => c(i).href))),
            C(
              a,
              1,
              `px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${(c(U), c(i), v(() => (c(U) === c(i).href ? `text-foreground border-b-2 border-primary` : `text-muted-foreground hover:text-foreground`))) ?? ``}`,
            ),
            n(o, (c(i), v(() => c(i).label))));
        }),
        r(t, a));
    },
  ),
    s(Q));
  var $ = b(Q, 2),
    ge = (t) => {
      le(t, {
        variant: `destructive`,
        children: (t, i) => {
          var a = j(),
            o = _(a);
          re(o, { class: `h-4 w-4` });
          var l = b(o, 2),
            u = d(l, !0);
          (s(l), e(() => n(u, c(K))), r(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t($, (e) => {
    c(K) && e(ge);
  });
  var _e = b($, 2),
    ve = (e) => {
      var t = M(),
        n = d(t);
      (A(n, { class: `h-10 rounded-lg` }), A(b(n, 2), { class: `h-48 rounded-lg` }), s(t), r(e, t));
    },
    ye = (t) => {
      ie(t, {
        children: (t, o) => {
          var l = L(),
            f = _(l);
          (oe(f, {
            children: (e, t) => {
              se(e, {
                class: `flex items-center gap-2`,
                children: (e, t) => {
                  var n = N();
                  (O(_(n), { class: `h-5 w-5` }), w(), r(e, n));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            ae(b(f, 2), {
              class: `space-y-6`,
              children: (t, o) => {
                var l = I(),
                  f = b(_(l), 2);
                (i(
                  f,
                  5,
                  () => fe,
                  a,
                  (t, i) => {
                    var a = P(),
                      o = d(a),
                      l = d(o),
                      f = d(l),
                      p = d(f, !0);
                    s(f);
                    var m = b(f, 2),
                      h = d(m);
                    (s(m), s(l));
                    var g = b(l, 2),
                      _ = d(g, !0);
                    (s(g), s(o));
                    var y = b(o, 2),
                      x = d(y);
                    (u(x),
                      w(2),
                      s(y),
                      s(a),
                      e(
                        (e) => {
                          (C(f, 1, `font-medium ${(c(i), v(() => c(i).color)) ?? ``}`),
                            n(p, (c(i), v(() => c(i).label))),
                            n(h, `(${e ?? ``})`),
                            n(_, (c(i), v(() => c(i).desc))));
                        },
                        [() => (c(J), c(i), v(() => pe(X(c(J)[c(i).key] ?? 0))))],
                      ),
                      ee(
                        x,
                        () => c(J)[c(i).key],
                        (e) => te(J, (c(J)[c(i).key] = e)),
                      ),
                      r(t, a));
                  },
                ),
                  s(f));
                var p = b(f, 2);
                (ce(d(p), {
                  get disabled() {
                    return c(G);
                  },
                  $$events: { click: he },
                  children: (t, i) => {
                    var a = F(),
                      o = _(a);
                    k(o, { class: `h-4 w-4 mr-1.5` });
                    var s = b(o);
                    (e(() => n(s, ` ${c(G) ? `Saving...` : `Save SLA Config`}`)), r(t, a));
                  },
                  $$slots: { default: !0 },
                }),
                  s(p),
                  r(t, l));
              },
              $$slots: { default: !0 },
            }),
            r(t, l));
        },
        $$slots: { default: !0 },
      });
    };
  (t(_e, (e) => {
    c(W) ? e(ve) : e(ye, -1);
  }),
    s(Z),
    r(E, Z),
    f(),
    H());
}
export { z as component };
