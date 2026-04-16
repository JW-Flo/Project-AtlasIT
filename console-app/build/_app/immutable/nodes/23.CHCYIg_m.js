import {
  $ as e,
  D as t,
  F as n,
  H as r,
  I as i,
  L as a,
  N as o,
  P as s,
  R as c,
  Tt as l,
  V as u,
  W as d,
  X as f,
  a as p,
  at as m,
  bt as h,
  c as g,
  ct as _,
  d as v,
  j as y,
  l as b,
  mt as x,
  ot as S,
  pt as ee,
  r as C,
  rt as w,
  s as T,
  st as E,
  ut as D,
  w as O,
  wt as k,
  xt as A,
  z as j,
} from "../chunks/CjbcrE1v.js";
import { t as te } from "../chunks/CkfEZRj5.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as M } from "../chunks/D4lFFHu4.js";
import { t as N } from "../chunks/_6xtu--D.js";
import { t as P } from "../chunks/Dg5qJDVh.js";
import { t as ne } from "../chunks/KeBPUFmG.js";
import { t as F } from "../chunks/CMGwYO6i2.js";
import { t as I } from "../chunks/BHPTFPdW2.js";
import "../chunks/CZkNuRnP2.js";
import { n as L, t as R } from "../chunks/BEJa09Kq2.js";
import { t as z } from "../chunks/Cue2Cs472.js";
import { t as B } from "../chunks/DmQt9wwK2.js";
import { t as V } from "../chunks/oRaErrij2.js";
function H(e, t) {
  let n = p(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [
        `path`,
        {
          d: `M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,
        },
      ],
      [`path`, { d: `M12 8v4` }],
      [`path`, { d: `M12 16h.01` }],
    ];
  N(
    e,
    T({ name: `shield-alert` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = c();
        (y(S(r), t, `default`, {}, null), a(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function re(e, t) {
  let n = p(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M16 17h6v-6` }],
      [`path`, { d: `m22 17-8.5-8.5-5 5L2 7` }],
    ];
  N(
    e,
    T({ name: `trending-down` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = c();
        (y(S(r), t, `default`, {}, null), a(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var U = j(`<div class="grid grid-cols-1 md:grid-cols-4 gap-4"></div>`),
  ie = j(
    `<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1"><!> Coverage</div> <div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground"> </div>`,
    1,
  ),
  ae = j(
    `<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1"><!> Gaps</div> <div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground"> </div>`,
    1,
  ),
  oe = j(
    `<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1"><!> Drift Alerts</div> <div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Active compliance drift events</div>`,
    1,
  ),
  se = j(
    `<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1"><!> Anomalies</div> <div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Risk anomalies detected</div>`,
    1,
  ),
  ce = j(
    `<!> <p class="text-lg font-medium">No compliance gaps detected</p> <p>All controls have recent, passing evidence.</p>`,
    1,
  ),
  le = j(`<span class="text-xs text-muted-foreground"> </span>`),
  ue = j(`<!> `, 1),
  de = j(
    `<div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center gap-2 mb-1"><!> <span class="font-medium"> </span> <span class="text-muted-foreground"> </span> <span> </span></div> <div class="flex items-center gap-2 mb-2"><span> </span> <!></div> <p class="text-sm text-muted-foreground"> </p></div> <div class="flex flex-col gap-1 shrink-0" role="group"><!> <!></div></div>`,
  ),
  fe = j(`<div class="space-y-3"></div>`),
  pe = j(
    `<!> <p class="text-lg font-medium">No drift alerts</p> <p>No compliance regression events detected recently.</p>`,
    1,
  ),
  me = j(`<p class="text-xs text-muted-foreground mt-1"> </p>`),
  he = j(
    `<div class="flex items-center gap-2 mb-2"><span> </span> <!> <span class="text-xs text-muted-foreground"> </span></div> <p class="text-sm"> </p> <!>`,
    1,
  ),
  ge = j(`<div class="space-y-3"></div>`),
  _e = j(
    `<!> <p class="text-lg font-medium">No risk anomalies</p> <p>No unusual access patterns detected in recent automation history.</p>`,
    1,
  ),
  ve = j(`<div class="flex gap-1 mt-2"></div>`),
  ye = j(`<p class="text-xs text-muted-foreground mt-1"> </p>`),
  be = j(
    `<div class="flex items-center gap-2 mb-2"><span> </span> <!> <span class="text-xs text-muted-foreground"> </span></div> <p class="text-sm"> </p> <!> <!>`,
    1,
  ),
  xe = j(`<div class="space-y-3"></div>`),
  Se = j(
    `<p class="text-lg font-medium">Analytics unavailable</p> <p>Unable to load analytics data. Try refreshing the page.</p>`,
    1,
  ),
  Ce = j(
    `<div class="text-sm text-muted-foreground mb-1">Overall Score</div> <div class="text-3xl font-bold"> </div> <div> </div>`,
    1,
  ),
  we = j(
    `<div class="text-sm text-muted-foreground mb-1">Automation Rules</div> <div class="text-3xl font-bold"> </div> <div class="text-xs text-muted-foreground"> </div>`,
    1,
  ),
  Te = j(
    `<div class="text-sm text-muted-foreground mb-1">Time Saved</div> <div class="text-3xl font-bold"> </div> <div class="text-xs text-muted-foreground">estimated via automation</div>`,
    1,
  ),
  Ee = j(
    `<div class="flex items-center justify-between"><div class="flex items-center gap-3"><span> </span> <div><div class="font-medium"> </div> <div class="text-xs text-muted-foreground"> </div></div></div> <div class="text-right"><div class="font-medium"> </div></div></div>`,
  ),
  De = j(`<h3 class="font-medium mb-3">Framework Breakdown</h3> <div class="space-y-3"></div>`, 1),
  Oe = j(
    `<div class="flex items-center justify-between py-1 border-b border-border last:border-0"><div><span class="text-sm font-medium"> </span> <span class="text-sm text-muted-foreground ml-2"> </span></div> <div class="flex items-center gap-2"><!> <span> </span></div></div>`,
  ),
  ke = j(`<h3 class="font-medium mb-3">Top Risks</h3> <div class="space-y-2"></div>`, 1),
  Ae = j(`<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><!> <!> <!></div> <!> <!>`, 1),
  je = j(`<!> Create Automation Rule`, 1),
  Me = j(`<!> Connect Adapter`, 1),
  Ne = j(`<!> Generate Policy`, 1),
  Pe = j(
    `<h3 class="font-medium mb-3">Quick Actions</h3> <div class="flex flex-wrap gap-2"><!> <!> <!></div>`,
    1,
  ),
  Fe = j(
    `<div class="grid grid-cols-1 md:grid-cols-4 gap-4"><!> <!> <!> <!></div> <div class="border-b"><nav class="flex space-x-4"><button> </button> <button> </button> <button> </button> <button>Analytics</button></nav></div> <!> <!> <!> <!> <!>`,
    1,
  ),
  Ie = j(
    `<div class="space-y-6"><div><h1 class="text-2xl font-bold tracking-tight">Compliance Intelligence</h1> <p class="text-muted-foreground">Proactive gap analysis, drift detection, and risk anomaly monitoring</p></div> <!></div>`,
  );
function W(p, y) {
  A(y, !1);
  let T = _(!0),
    j = _(null),
    N = _(null),
    W = _([]),
    G = _([]),
    K = _([]),
    q = _(`gaps`),
    J = new Set(),
    Y = _(null),
    X = {
      "CC6.1": [
        { slug: `okta`, name: `Okta`, type: `MFA policy` },
        { slug: `google-workspace`, name: `Google Workspace`, type: `2-Step Verification` },
        { slug: `microsoft-365`, name: `Microsoft 365`, type: `MFA enforcement` },
        { slug: `aws`, name: `AWS`, type: `IAM MFA` },
      ],
      "CC6.6": [
        { slug: `google-workspace`, name: `Google Workspace`, type: `sharing settings` },
        { slug: `slack`, name: `Slack`, type: `retention policy` },
      ],
      "CC6.7": [
        { slug: `microsoft-365`, name: `Microsoft 365`, type: `encryption status` },
        { slug: `aws`, name: `AWS`, type: `encryption at rest` },
      ],
      "CC7.1": [{ slug: `aws`, name: `AWS`, type: `CloudTrail` }],
      "CC8.1": [{ slug: `github`, name: `GitHub`, type: `branch protection` }],
      "A.9.2.1": [
        { slug: `okta`, name: `Okta`, type: `password policy` },
        { slug: `google-workspace`, name: `Google Workspace`, type: `SSO enforcement` },
        { slug: `slack`, name: `Slack`, type: `SSO enforcement` },
      ],
      "A.9.4.2": [
        { slug: `okta`, name: `Okta`, type: `MFA policy` },
        { slug: `microsoft-365`, name: `Microsoft 365`, type: `Conditional Access` },
      ],
      "A.12.6.1": [{ slug: `github`, name: `GitHub`, type: `branch protection` }],
    };
  function Z(e) {
    return (X[e.controlId] ?? []).filter((e) => J.has(e.slug));
  }
  async function Le(e) {
    let t = Z(e);
    if (t.length !== 0) {
      D(Y, e.controlId);
      try {
        (
          await fetch(`/api/evidence-collection/collect`, {
            method: `POST`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({
              controlId: e.controlId,
              framework: e.framework,
              adapters: t.map((e) => e.slug),
            }),
          })
        ).ok
          ? (M({ variant: `success`, message: `Evidence collection triggered for ${e.controlId}` }),
            await Q())
          : M({ variant: `error`, message: `Evidence collection failed` });
      } catch {
        M({ variant: `error`, message: `Evidence collection request failed` });
      }
      D(Y, null);
    }
  }
  function Re(e) {
    let t = Z(e);
    if (t.length > 0) {
      let n = t.map((e) => `${e.name} (${e.type})`).join(`, `);
      return e.gapType === `missing`
        ? `Collect ${e.controlName} evidence from your connected ${n}`
        : e.gapType === `stale`
          ? `Re-collect ${e.controlName} evidence from ${n} — last collected ${e.staleDays}d ago`
          : `Review ${e.controlName} configuration in ${n} — evidence is failing`;
    }
    return e.recommendation;
  }
  C(async () => {
    (await Promise.allSettled([Q(), Be(), Ve(), ze(), He()]), D(T, !1));
  });
  async function ze() {
    try {
      let e = await fetch(`/api/apps/status`);
      if (e.ok) {
        let t = await e.json();
        for (let e of t.applications ?? []) e.connected && J.add(e.id);
        J = J;
      }
    } catch {}
  }
  async function Q() {
    try {
      let e = await fetch(`/api/compliance-intelligence/gaps`);
      if (!e.ok) throw Error(`Failed to load gaps`);
      let t = await e.json();
      (D(N, t.summary), D(W, t.gaps ?? []));
    } catch {
      M({ variant: `error`, message: `Failed to load compliance gaps` });
    }
  }
  async function Be() {
    try {
      let e = await fetch(`/api/compliance-intelligence/drift`);
      if (!e.ok) throw Error(`Failed to load drift`);
      D(G, (await e.json()).alerts ?? []);
    } catch {
      M({ variant: `error`, message: `Failed to load drift alerts` });
    }
  }
  async function Ve() {
    try {
      let e = await fetch(`/api/compliance-intelligence/anomalies`);
      if (!e.ok) throw Error(`Failed to load anomalies`);
      D(K, (await e.json()).anomalies ?? []);
    } catch {
      M({ variant: `error`, message: `Failed to load anomalies` });
    }
  }
  async function He() {
    try {
      let e = await fetch(`/api/analytics/dashboard?days=30`);
      e.ok && D(j, await e.json());
    } catch {}
  }
  function Ue(e) {
    return e === `A` || e === `A+`
      ? `text-green-500`
      : e === `B` || e === `B+`
        ? `text-blue-500`
        : e === `C`
          ? `text-yellow-500`
          : `text-red-500`;
  }
  function We(e) {
    switch (e) {
      case `critical`:
        return `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case `high`:
        return `bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`;
      case `medium`:
        return `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      default:
        return `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    }
  }
  function Ge(e) {
    switch (e) {
      case `missing`:
        return `No Evidence`;
      case `stale`:
        return `Stale Evidence`;
      case `failing`:
        return `Failing`;
      default:
        return e;
    }
  }
  b();
  var $ = Ie();
  t(`1uircp0`, (e) => {
    f(() => {
      w.title = `Compliance Insights | AtlasIT`;
    });
  });
  var Ke = E(m($), 2),
    qe = (e) => {
      var t = U();
      (o(
        t,
        4,
        () => [, , , ,],
        s,
        (e, t) => {
          L(e, {
            children: (e, t) => {
              R(e, {
                class: `p-4`,
                children: (e, t) => {
                  V(e, { class: `h-16 w-full` });
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        },
      ),
        l(t),
        a(e, t));
    },
    Je = (t) => {
      var f = Fe(),
        p = S(f),
        h = m(p);
      L(h, {
        children: (t, n) => {
          R(t, {
            class: `p-4`,
            children: (t, n) => {
              var r = ie(),
                o = S(r);
              (H(m(o), { class: `h-4 w-4` }), k(), l(o));
              var s = E(o, 2),
                c = m(s);
              l(s);
              var u = E(s, 2),
                f = m(u);
              (l(u),
                e(() => {
                  (i(c, `${d(N)?.coveragePercent ?? 0 ?? ``}%`),
                    i(
                      f,
                      `${d(N)?.coveredControls ?? 0 ?? ``} / ${d(N)?.totalControls ?? 0 ?? ``} controls covered`,
                    ));
                }),
                a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var _ = E(h, 2);
      L(_, {
        children: (t, n) => {
          R(t, {
            class: `p-4`,
            children: (t, n) => {
              var r = ae(),
                o = S(r);
              (F(m(o), { class: `h-4 w-4 text-red-500` }), k(), l(o));
              var s = E(o, 2),
                c = m(s, !0);
              l(s);
              var u = E(s, 2),
                f = m(u);
              (l(u),
                e(() => {
                  (i(
                    c,
                    (d(N)?.missingCount ?? 0) + (d(N)?.staleCount ?? 0) + (d(N)?.failingCount ?? 0),
                  ),
                    i(
                      f,
                      `${d(N)?.missingCount ?? 0 ?? ``} missing, ${d(N)?.staleCount ?? 0 ?? ``} stale, ${d(N)?.failingCount ?? 0 ?? ``} failing`,
                    ));
                }),
                a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var b = E(_, 2);
      (L(b, {
        children: (t, n) => {
          R(t, {
            class: `p-4`,
            children: (t, n) => {
              var r = oe(),
                o = S(r);
              (re(m(o), { class: `h-4 w-4 text-orange-500` }), k(), l(o));
              var s = E(o, 2),
                c = m(s, !0);
              (l(s), k(2), e(() => i(c, d(G).length)), a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        L(E(b, 2), {
          children: (t, n) => {
            R(t, {
              class: `p-4`,
              children: (t, n) => {
                var r = se(),
                  o = S(r);
                (I(m(o), { class: `h-4 w-4 text-yellow-500` }), k(), l(o));
                var s = E(o, 2),
                  c = m(s, !0);
                (l(s), k(2), e(() => i(c, d(K).length)), a(t, r));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        l(p));
      var C = E(p, 2),
        w = m(C),
        T = m(w),
        A = m(T);
      l(T);
      var M = E(T, 2),
        V = m(M);
      l(M);
      var U = E(M, 2),
        Ie = m(U);
      l(U);
      var J = E(U, 2);
      (l(w), l(C));
      var X = E(C, 2),
        ze = (t) => {
          var f = c(),
            p = S(f),
            h = (e) => {
              L(e, {
                children: (e, t) => {
                  R(e, {
                    class: `p-8 text-center text-muted-foreground`,
                    children: (e, t) => {
                      var n = ce();
                      (ne(S(n), { class: `h-12 w-12 mx-auto mb-3 text-green-500` }), k(4), a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            _ = (t) => {
              var c = fe();
              (o(
                c,
                5,
                () => d(W),
                s,
                (t, o) => {
                  L(t, {
                    class: `cursor-pointer hover:border-primary/50 transition-colors`,
                    $$events: {
                      click: () =>
                        te(
                          `/console/compliance/feed?framework=${d(o).framework}&controlId=${d(o).controlId}`,
                        ),
                    },
                    children: (t, s) => {
                      R(t, {
                        class: `p-4`,
                        children: (t, s) => {
                          var c = de(),
                            f = m(c),
                            p = m(f),
                            h = m(p);
                          B(h, {
                            variant: `outline`,
                            children: (t, n) => {
                              k();
                              var r = u();
                              (e(() => i(r, d(o).framework)), a(t, r));
                            },
                            $$slots: { default: !0 },
                          });
                          var _ = E(h, 2),
                            b = m(_, !0);
                          l(_);
                          var C = E(_, 2),
                            w = m(C);
                          l(C);
                          var T = E(C, 2),
                            D = m(T, !0);
                          (l(T), l(p));
                          var A = E(p, 2),
                            j = m(A),
                            te = m(j, !0);
                          l(j);
                          var M = E(j, 2),
                            N = (t) => {
                              var n = le(),
                                r = m(n);
                              (l(n),
                                e(() => i(r, `${d(o).staleDays ?? ``}d since last evidence`)),
                                a(t, n));
                            };
                          (n(M, (e) => {
                            d(o).staleDays !== null && e(N);
                          }),
                            l(A));
                          var P = E(A, 2),
                            ne = m(P, !0);
                          (l(P), l(f));
                          var F = E(f, 2),
                            L = m(F),
                            R = (t) => {
                              {
                                let n = ee(() => d(Y) === d(o).controlId);
                                z(t, {
                                  variant: `default`,
                                  size: `sm`,
                                  get disabled() {
                                    return d(n);
                                  },
                                  $$events: { click: () => Le(d(o)) },
                                  children: (t, n) => {
                                    var r = ue(),
                                      s = S(r);
                                    I(s, { class: `h-3 w-3 mr-1` });
                                    var c = E(s);
                                    (e(() =>
                                      i(
                                        c,
                                        ` ${d(Y) === d(o).controlId ? `Collecting...` : `Collect Now`}`,
                                      ),
                                    ),
                                      a(t, r));
                                  },
                                  $$slots: { default: !0 },
                                });
                              }
                            },
                            V = x(() => Z(d(o)).length > 0);
                          n(L, (e) => {
                            d(V) && e(R);
                          });
                          var H = E(L, 2),
                            re = (e) => {
                              z(e, {
                                variant: `outline`,
                                size: `sm`,
                                href: `/console/automation`,
                                children: (e, t) => {
                                  (k(), a(e, u(`Create Rule`)));
                                },
                                $$slots: { default: !0 },
                              });
                            };
                          (n(H, (e) => {
                            d(o).suggestedAction && e(re);
                          }),
                            l(F),
                            l(c),
                            e(
                              (e, t, n) => {
                                (i(b, d(o).controlId),
                                  i(w, `— ${d(o).controlName ?? ``}`),
                                  O(
                                    T,
                                    1,
                                    `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e ?? ``}`,
                                  ),
                                  i(D, d(o).priority),
                                  O(
                                    j,
                                    1,
                                    `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${d(o).gapType === `failing` ? `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200` : d(o).gapType === `stale` ? `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200` : `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`}`,
                                  ),
                                  i(te, t),
                                  i(ne, n));
                              },
                              [() => We(d(o).priority), () => Ge(d(o).gapType), () => Re(d(o))],
                            ),
                            r(
                              `click`,
                              F,
                              v(function (e) {
                                g.call(this, y, e);
                              }),
                            ),
                            a(t, c));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    $$slots: { default: !0 },
                  });
                },
              ),
                l(c),
                a(t, c));
            };
          (n(p, (e) => {
            d(W).length === 0 ? e(h) : e(_, -1);
          }),
            a(t, f));
        };
      n(X, (e) => {
        d(q) === `gaps` && e(ze);
      });
      var Q = E(X, 2),
        Be = (t) => {
          var r = c(),
            f = S(r),
            p = (e) => {
              L(e, {
                children: (e, t) => {
                  R(e, {
                    class: `p-8 text-center text-muted-foreground`,
                    children: (e, t) => {
                      var n = pe();
                      (re(S(n), { class: `h-12 w-12 mx-auto mb-3 text-green-500` }), k(4), a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            h = (t) => {
              var r = ge();
              (o(
                r,
                5,
                () => d(G),
                s,
                (t, r) => {
                  L(t, {
                    children: (t, o) => {
                      R(t, {
                        class: `p-4`,
                        children: (t, o) => {
                          var s = he(),
                            c = S(s),
                            f = m(c),
                            p = m(f, !0);
                          l(f);
                          var h = E(f, 2);
                          B(h, {
                            variant: `outline`,
                            children: (t, n) => {
                              k();
                              var o = u();
                              (e(() => i(o, d(r).category)), a(t, o));
                            },
                            $$slots: { default: !0 },
                          });
                          var g = E(h, 2),
                            _ = m(g, !0);
                          (l(g), l(c));
                          var v = E(c, 2),
                            y = m(v, !0);
                          l(v);
                          var b = E(v, 2),
                            x = (t) => {
                              var n = me(),
                                o = m(n, !0);
                              (l(n), e(() => i(o, d(r).data.suggestedRemediation)), a(t, n));
                            };
                          (n(b, (e) => {
                            d(r).data.suggestedRemediation && e(x);
                          }),
                            e(
                              (e, t) => {
                                (O(
                                  f,
                                  1,
                                  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e ?? ``}`,
                                ),
                                  i(p, d(r).severity),
                                  i(_, t),
                                  i(
                                    y,
                                    d(r).data.description ??
                                      `Compliance drift detected — review details in the compliance dashboard.`,
                                  ));
                              },
                              [
                                () => We(d(r).severity),
                                () => new Date(d(r).createdAt).toLocaleString(),
                              ],
                            ),
                            a(t, s));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    $$slots: { default: !0 },
                  });
                },
              ),
                l(r),
                a(t, r));
            };
          (n(f, (e) => {
            d(G).length === 0 ? e(p) : e(h, -1);
          }),
            a(t, r));
        };
      n(Q, (e) => {
        d(q) === `drift` && e(Be);
      });
      var Ve = E(Q, 2),
        He = (t) => {
          var r = c(),
            f = S(r),
            p = (e) => {
              L(e, {
                children: (e, t) => {
                  R(e, {
                    class: `p-8 text-center text-muted-foreground`,
                    children: (e, t) => {
                      var n = _e();
                      (I(S(n), { class: `h-12 w-12 mx-auto mb-3 text-green-500` }), k(4), a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            h = (t) => {
              var r = xe();
              (o(
                r,
                5,
                () => d(K),
                s,
                (t, r) => {
                  L(t, {
                    children: (t, c) => {
                      R(t, {
                        class: `p-4`,
                        children: (t, c) => {
                          var f = be(),
                            p = S(f),
                            h = m(p),
                            g = m(h, !0);
                          l(h);
                          var _ = E(h, 2);
                          B(_, {
                            variant: `outline`,
                            children: (t, n) => {
                              k();
                              var o = u();
                              (e((e) => i(o, e), [() => d(r).anomalyType.replace(/_/g, ` `)]),
                                a(t, o));
                            },
                            $$slots: { default: !0 },
                          });
                          var v = E(_, 2),
                            y = m(v, !0);
                          (l(v), l(p));
                          var b = E(p, 2),
                            x = m(b, !0);
                          l(b);
                          var ee = E(b, 2),
                            C = (t) => {
                              var n = ve();
                              (o(
                                n,
                                5,
                                () => d(r).affectedApps,
                                s,
                                (t, n) => {
                                  B(t, {
                                    variant: `secondary`,
                                    children: (t, r) => {
                                      k();
                                      var o = u();
                                      (e(() => i(o, d(n))), a(t, o));
                                    },
                                    $$slots: { default: !0 },
                                  });
                                },
                              ),
                                l(n),
                                a(t, n));
                            };
                          n(ee, (e) => {
                            d(r).affectedApps.length > 0 && e(C);
                          });
                          var w = E(ee, 2),
                            T = (t) => {
                              var n = ye(),
                                o = m(n);
                              (l(n),
                                e(
                                  (e) =>
                                    i(
                                      o,
                                      `Affected users: ${e ?? ``}${d(r).affectedUsers.length > 5 ? ` +${d(r).affectedUsers.length - 5} more` : ``}`,
                                    ),
                                  [() => d(r).affectedUsers.slice(0, 5).join(`, `)],
                                ),
                                a(t, n));
                            };
                          (n(w, (e) => {
                            d(r).affectedUsers.length > 0 && e(T);
                          }),
                            e(
                              (e, t) => {
                                (O(
                                  h,
                                  1,
                                  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e ?? ``}`,
                                ),
                                  i(g, d(r).severity),
                                  i(y, t),
                                  i(x, d(r).description));
                              },
                              [
                                () => We(d(r).severity),
                                () => new Date(d(r).detectedAt).toLocaleString(),
                              ],
                            ),
                            a(t, f));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    $$slots: { default: !0 },
                  });
                },
              ),
                l(r),
                a(t, r));
            };
          (n(f, (e) => {
            d(K).length === 0 ? e(p) : e(h, -1);
          }),
            a(t, r));
        };
      n(Ve, (e) => {
        d(q) === `anomalies` && e(He);
      });
      var $ = E(Ve, 2),
        Ke = (t) => {
          var r = c(),
            f = S(r),
            p = (e) => {
              L(e, {
                children: (e, t) => {
                  R(e, {
                    class: `p-8 text-center text-muted-foreground`,
                    children: (e, t) => {
                      var n = Se();
                      (k(2), a(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
            h = (t) => {
              var r = Ae(),
                c = S(r),
                f = m(c);
              L(f, {
                children: (t, n) => {
                  R(t, {
                    class: `p-4`,
                    children: (t, n) => {
                      var r = Ce(),
                        o = E(S(r), 2),
                        s = m(o);
                      l(o);
                      var c = E(o, 2),
                        u = m(c);
                      (l(c),
                        e(() => {
                          (i(s, `${d(j).overallScore ?? ``}%`),
                            O(
                              c,
                              1,
                              `text-xs ${d(j).trendDelta >= 0 ? `text-green-500` : `text-red-500`}`,
                            ),
                            i(
                              u,
                              `${d(j).trendDelta >= 0 ? `+` : ``}${d(j).trendDelta ?? ``}% vs last period`,
                            ));
                        }),
                        a(t, r));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
              var p = E(f, 2);
              (L(p, {
                children: (t, n) => {
                  R(t, {
                    class: `p-4`,
                    children: (t, n) => {
                      var r = we(),
                        o = E(S(r), 2),
                        s = m(o, !0);
                      l(o);
                      var c = E(o, 2),
                        u = m(c);
                      (l(c),
                        e(() => {
                          (i(s, d(j).automationMetrics.activeRules),
                            i(
                              u,
                              `${d(j).automationMetrics.rulesExecuted ?? ``} executions, ${d(j).automationMetrics.successRate ?? ``}% success`,
                            ));
                        }),
                        a(t, r));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              }),
                L(E(p, 2), {
                  children: (t, n) => {
                    R(t, {
                      class: `p-4`,
                      children: (t, n) => {
                        var r = Te(),
                          o = E(S(r), 2),
                          s = m(o);
                        (l(o),
                          k(2),
                          e(() => i(s, `${d(j).automationMetrics.timeSavedHours ?? ``}h`)),
                          a(t, r));
                      },
                      $$slots: { default: !0 },
                    });
                  },
                  $$slots: { default: !0 },
                }),
                l(c));
              var h = E(c, 2),
                g = (t) => {
                  L(t, {
                    children: (t, n) => {
                      R(t, {
                        class: `p-4`,
                        children: (t, n) => {
                          var r = De(),
                            c = E(S(r), 2);
                          (o(
                            c,
                            5,
                            () => d(j).frameworkBreakdown,
                            s,
                            (t, n) => {
                              var r = Ee(),
                                o = m(r),
                                s = m(o),
                                c = m(s, !0);
                              l(s);
                              var u = E(s, 2),
                                f = m(u),
                                p = m(f, !0);
                              l(f);
                              var h = E(f, 2),
                                g = m(h);
                              (l(h), l(u), l(o));
                              var _ = E(o, 2),
                                v = m(_),
                                y = m(v);
                              (l(v),
                                l(_),
                                l(r),
                                e(
                                  (e) => {
                                    (O(s, 1, `text-2xl font-bold ${e ?? ``}`),
                                      i(c, d(n).grade),
                                      i(p, d(n).framework),
                                      i(
                                        g,
                                        `${d(n).controlsImplemented ?? ``}/${d(n).controlsTotal ?? ``} implemented, ${d(n).controlsVerified ?? ``} verified`,
                                      ),
                                      i(y, `${d(n).score ?? ``}%`));
                                  },
                                  [() => Ue(d(n).grade)],
                                ),
                                a(t, r));
                            },
                          ),
                            l(c),
                            a(t, r));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    $$slots: { default: !0 },
                  });
                };
              n(h, (e) => {
                d(j).frameworkBreakdown.length > 0 && e(g);
              });
              var _ = E(h, 2),
                v = (t) => {
                  L(t, {
                    children: (t, n) => {
                      R(t, {
                        class: `p-4`,
                        children: (t, n) => {
                          var r = ke(),
                            c = E(S(r), 2);
                          (o(
                            c,
                            5,
                            () => d(j).topRisks.slice(0, 5),
                            s,
                            (t, n) => {
                              var r = Oe(),
                                o = m(r),
                                s = m(o),
                                c = m(s, !0);
                              l(s);
                              var f = E(s, 2),
                                p = m(f, !0);
                              (l(f), l(o));
                              var h = E(o, 2),
                                g = m(h);
                              B(g, {
                                variant: `outline`,
                                children: (t, r) => {
                                  k();
                                  var o = u();
                                  (e(() => i(o, d(n).framework)), a(t, o));
                                },
                                $$slots: { default: !0 },
                              });
                              var _ = E(g, 2),
                                v = m(_);
                              (l(_),
                                l(h),
                                l(r),
                                e(() => {
                                  (i(c, d(n).controlRef),
                                    i(p, d(n).title),
                                    O(
                                      _,
                                      1,
                                      `text-sm font-medium ${d(n).score < 30 ? `text-red-500` : d(n).score < 60 ? `text-yellow-500` : `text-green-500`}`,
                                    ),
                                    i(v, `${d(n).score ?? ``}%`));
                                }),
                                a(t, r));
                            },
                          ),
                            l(c),
                            a(t, r));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    $$slots: { default: !0 },
                  });
                };
              (n(_, (e) => {
                d(j).topRisks.length > 0 && e(v);
              }),
                a(t, r));
            };
          (n(f, (e) => {
            d(j) ? e(h, -1) : e(p);
          }),
            a(t, r));
        };
      (n($, (e) => {
        d(q) === `analytics` && e(Ke);
      }),
        L(E($, 2), {
          children: (e, t) => {
            R(e, {
              class: `p-4`,
              children: (e, t) => {
                var n = Pe(),
                  r = E(S(n), 2),
                  i = m(r);
                z(i, {
                  variant: `outline`,
                  size: `sm`,
                  href: `/console/automation`,
                  children: (e, t) => {
                    var n = je();
                    (I(S(n), { class: `h-4 w-4 mr-1` }), k(), a(e, n));
                  },
                  $$slots: { default: !0 },
                });
                var o = E(i, 2);
                (z(o, {
                  variant: `outline`,
                  size: `sm`,
                  href: `/console/marketplace`,
                  children: (e, t) => {
                    var n = Me();
                    (H(S(n), { class: `h-4 w-4 mr-1` }), k(), a(e, n));
                  },
                  $$slots: { default: !0 },
                }),
                  z(E(o, 2), {
                    variant: `outline`,
                    size: `sm`,
                    href: `/console/policies`,
                    children: (e, t) => {
                      var n = Ne();
                      (P(S(n), { class: `h-4 w-4 mr-1` }), k(), a(e, n));
                    },
                    $$slots: { default: !0 },
                  }),
                  l(r),
                  a(e, n));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        e(() => {
          (O(
            T,
            1,
            `px-3 py-2 text-sm font-medium border-b-2 transition-colors ${d(q) === `gaps` ? `border-primary text-primary` : `border-transparent text-muted-foreground hover:text-foreground`}`,
          ),
            i(A, `Compliance Gaps (${d(W).length ?? ``})`),
            O(
              M,
              1,
              `px-3 py-2 text-sm font-medium border-b-2 transition-colors ${d(q) === `drift` ? `border-primary text-primary` : `border-transparent text-muted-foreground hover:text-foreground`}`,
            ),
            i(V, `Drift Alerts (${d(G).length ?? ``})`),
            O(
              U,
              1,
              `px-3 py-2 text-sm font-medium border-b-2 transition-colors ${d(q) === `anomalies` ? `border-primary text-primary` : `border-transparent text-muted-foreground hover:text-foreground`}`,
            ),
            i(Ie, `Risk Anomalies (${d(K).length ?? ``})`),
            O(
              J,
              1,
              `px-3 py-2 text-sm font-medium border-b-2 transition-colors ${d(q) === `analytics` ? `border-primary text-primary` : `border-transparent text-muted-foreground hover:text-foreground`}`,
            ));
        }),
        r(`click`, T, () => D(q, `gaps`)),
        r(`click`, M, () => D(q, `drift`)),
        r(`click`, U, () => D(q, `anomalies`)),
        r(`click`, J, () => D(q, `analytics`)),
        a(t, f));
    };
  (n(Ke, (e) => {
    d(T) ? e(qe) : e(Je, -1);
  }),
    l($),
    a(p, $),
    h());
}
export { W as component };
