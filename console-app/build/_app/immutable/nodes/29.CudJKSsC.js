import {
  $ as e,
  Et as t,
  F as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Tt as s,
  V as c,
  W as l,
  at as u,
  bt as d,
  ct as f,
  l as p,
  mt as m,
  ot as h,
  pt as g,
  r as _,
  st as v,
  ut as y,
  w as b,
  wt as x,
  xt as S,
  z as C,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as w } from "../chunks/Bbgqa3ML.js";
import { t as T } from "../chunks/D_3pYtt4.js";
import { t as E } from "../chunks/7PU7Bd1h2.js";
import { t as D } from "../chunks/CMGwYO6i2.js";
import { t as O } from "../chunks/BXmH0DjJ2.js";
import { n as k, t as A } from "../chunks/BEJa09Kq2.js";
import "../chunks/Da7GIpgR2.js";
import "../chunks/B2LjsFjQ2.js";
import { t as j } from "../chunks/Cue2Cs472.js";
import { t as M } from "../chunks/DmQt9wwK2.js";
import { t as N } from "../chunks/DOfJvt542.js";
async function P() {
  let [e, t] = await Promise.allSettled([fetch(`/api/health`), fetch(`/api/platform/usage`)]),
    n = e.status === `fulfilled` && e.value.ok ? await e.value.json() : null,
    r = t.status === `fulfilled` && t.value.ok ? await t.value.json() : null;
  return (
    n &&
      r &&
      ((n.usage.recentInvocations = r.total || 0),
      (n.usage.breakerOpenScripts = r.breakerOpenScripts || 0)),
    { health: n, usage: r }
  );
}
var F = C(`<!> `, 1),
  I = C(`<!> <p class="pl-7"> </p>`, 1),
  L = C(
    `<div class="flex items-center gap-2 mb-3"><span></span> <h3 class="font-medium capitalize"> </h3></div> <div class="text-sm space-y-1.5"><div class="flex justify-between"><span class="text-muted-foreground">Status</span> <!></div> <div class="flex justify-between"><span class="text-muted-foreground">Latency</span> <span> </span></div> <div class="flex justify-between"><span class="text-muted-foreground">HTTP</span> <span> </span></div> <div class="flex justify-between"><span class="text-muted-foreground">Checked</span> <span class="text-xs text-muted-foreground"> </span></div></div>`,
    1,
  ),
  R = C(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"></div>`),
  z = C(`<p class="text-sm text-muted-foreground">No service data available</p>`),
  ee = C(
    `<!> <div class="pl-7"><p class="font-medium">Circuit Breaker Open</p> <p class="text-sm"> </p></div>`,
    1,
  ),
  te = C(
    `<div class="flex justify-between text-sm"><span> </span> <span class="font-mono text-muted-foreground"> </span></div>`,
  ),
  ne = C(
    `<div><h4 class="font-medium mb-2 text-muted-foreground">Top Scripts by Invocations</h4> <div class="space-y-1"></div></div>`,
  ),
  re = C(
    `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"><div><div class="flex items-center gap-2 mb-1"><!></div> <div class="text-2xl font-bold text-primary"> </div> <div class="text-sm text-muted-foreground">Total Scripts</div></div> <div><div class="flex items-center gap-2 mb-1"><!></div> <div class="text-2xl font-bold text-destructive"> </div> <div class="text-sm text-muted-foreground">Failures</div></div> <div><div class="flex items-center gap-2 mb-1"><!></div> <div class="text-2xl font-bold text-warning"> </div> <div class="text-sm text-muted-foreground">Failure Rate</div></div> <div><div class="flex items-center gap-2 mb-1"><!></div> <div class="text-2xl font-bold text-green-500"> </div> <div class="text-sm text-muted-foreground">Tenants</div></div></div> <!> <!>`,
    1,
  ),
  B = C(
    `<p class="text-sm text-muted-foreground">Usage data unavailable (configuration required)</p>`,
  ),
  ie = C(`<span class="text-xs text-muted-foreground"> </span>`),
  ae = C(
    `<div class="flex justify-between text-sm"><span class="text-muted-foreground"> </span> <span> </span></div>`,
  ),
  oe = C(
    `<div class="p-3 rounded border"><div class="flex items-center gap-2 mb-2"><span></span> <span class="font-medium capitalize"> </span> <!></div> <!> <div class="text-xs text-muted-foreground mt-1"> </div></div>`,
  ),
  se = C(
    `<div class="flex items-center gap-3 mb-4"><span></span> <span class="font-medium"> </span> <!></div> <div class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>`,
    1,
  ),
  ce = C(
    `<section><h2 class="text-lg font-semibold mb-4">Functional Health (SLO)</h2> <!></section>`,
  ),
  le = C(
    `<div class="flex items-center gap-3"><span></span> <span> </span> <span class="text-xs text-muted-foreground ml-auto"> </span></div>`,
  ),
  ue = C(
    `<div class="flex items-center gap-3 mb-4"><div> </div> <span class="text-sm text-muted-foreground"> </span> <!></div> <div class="space-y-2"></div>`,
    1,
  ),
  de = C(`<section><h2 class="text-lg font-semibold mb-4">Activation Journey</h2> <!></section>`),
  fe = C(
    `<div class="space-y-6"><div class="flex justify-between items-center"><div><h1 class="text-2xl font-semibold tracking-tight">Platform Status</h1> <p class="text-sm text-muted-foreground">Service health and usage metrics</p></div> <!></div> <!> <section><h2 class="text-lg font-semibold mb-4">Service Health</h2> <!></section> <section><h2 class="text-lg font-semibold mb-4">Usage Summary</h2> <!></section> <!> <!></div>`,
  );
function V(C, V) {
  S(V, !1);
  let H = f(null),
    U = f(null),
    W = f(null),
    G = f(null),
    K = f(!0),
    q = f(``);
  async function J() {
    try {
      let e = await P();
      (y(H, e.health), y(U, e.usage), y(q, ``));
    } catch (e) {
      (y(q, `Failed to load status`), console.error(e));
    }
    (y(K, !1), pe(), me());
  }
  async function pe() {
    try {
      let e = await fetch(`/api/platform/health-deep`);
      e.ok && y(W, await e.json());
    } catch {}
  }
  async function me() {
    try {
      let e = await fetch(`/api/platform/journey-metrics`);
      e.ok && y(G, await e.json());
    } catch {}
  }
  _(() => {
    J();
    let e = setInterval(J, 3e4);
    return () => clearInterval(e);
  });
  function he(e) {
    return e ? `Operational` : `Down`;
  }
  p();
  var Y = fe(),
    X = u(Y);
  (j(v(u(X), 2), {
    variant: `outline`,
    size: `sm`,
    get disabled() {
      return l(K);
    },
    $$events: { click: J },
    children: (t, n) => {
      var a = F(),
        o = h(a);
      {
        let e = g(() => (l(K) ? `animate-spin` : ``));
        T(o, {
          get class() {
            return `h-4 w-4 mr-1.5 ${l(e) ?? ``}`;
          },
        });
      }
      var s = v(o);
      (e(() => r(s, ` ${l(K) ? `Refreshing...` : `Refresh`}`)), i(t, a));
    },
    $$slots: { default: !0 },
  }),
    s(X));
  var Z = v(X, 2),
    ge = (t) => {
      N(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = I(),
            o = h(a);
          D(o, { class: `h-4 w-4` });
          var c = v(o, 2),
            d = u(c, !0);
          (s(c), e(() => r(d, l(q))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  n(Z, (e) => {
    l(q) && e(ge);
  });
  var Q = v(Z, 2),
    _e = v(u(Q), 2),
    ve = (n) => {
      var d = R();
      (a(
        d,
        5,
        () => Object.entries(l(H).services),
        o,
        (n, a) => {
          var o = m(() => t(l(a), 2));
          let d = () => l(o)[0],
            f = () => l(o)[1];
          k(n, {
            children: (t, n) => {
              A(t, {
                class: `pt-5`,
                children: (t, n) => {
                  var a = L(),
                    o = h(a),
                    p = u(o),
                    m = v(p, 2),
                    _ = u(m, !0);
                  (s(m), s(o));
                  var y = v(o, 2),
                    S = u(y),
                    C = v(u(S), 2);
                  {
                    let t = g(() => (f().ok ? `success` : `destructive`));
                    M(C, {
                      get variant() {
                        return l(t);
                      },
                      children: (t, n) => {
                        x();
                        var a = c();
                        (e((e) => r(a, e), [() => he(f().ok)]), i(t, a));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  s(S);
                  var w = v(S, 2),
                    T = v(u(w), 2),
                    E = u(T, !0);
                  (s(T), s(w));
                  var D = v(w, 2),
                    O = v(u(D), 2),
                    k = u(O, !0);
                  (s(O), s(D));
                  var A = v(D, 2),
                    j = v(u(A), 2),
                    N = u(j, !0);
                  (s(j),
                    s(A),
                    s(y),
                    e(
                      (e) => {
                        (b(
                          p,
                          1,
                          `w-2.5 h-2.5 rounded-full ${f().ok ? `bg-green-500` : `bg-destructive`}`,
                        ),
                          r(_, d()),
                          r(E, f().latencyMs ? `${f().latencyMs}ms` : `N/A`),
                          r(k, f().status || `---`),
                          r(N, e));
                      },
                      [() => new Date(f().lastChecked).toLocaleTimeString()],
                    ),
                    i(t, a));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        },
      ),
        s(d),
        i(n, d));
    },
    ye = (e) => {
      k(e, {
        children: (e, t) => {
          A(e, {
            class: `py-4`,
            children: (e, t) => {
              i(e, z());
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (n(_e, (e) => {
    l(H)?.services ? e(ve) : l(K) || e(ye, 1);
  }),
    s(Q));
  var $ = v(Q, 2),
    be = v(u($), 2),
    xe = (t) => {
      k(t, {
        children: (t, c) => {
          A(t, {
            class: `pt-5`,
            children: (t, c) => {
              var d = re(),
                f = h(d),
                p = u(f),
                m = u(p);
              (E(u(m), { class: `h-4 w-4 text-primary` }), s(m));
              var g = v(m, 2),
                _ = u(g, !0);
              (s(g), x(2), s(p));
              var y = v(p, 2),
                b = u(y);
              (D(u(b), { class: `h-4 w-4 text-destructive` }), s(b));
              var S = v(b, 2),
                C = u(S, !0);
              (s(S), x(2), s(y));
              var T = v(y, 2),
                k = u(T);
              (w(u(k), { class: `h-4 w-4 text-warning` }), s(k));
              var A = v(k, 2),
                j = u(A);
              (s(A), x(2), s(T));
              var M = v(T, 2),
                P = u(M);
              (O(u(P), { class: `h-4 w-4 text-green-500` }), s(P));
              var F = v(P, 2),
                I = u(F, !0);
              (s(F), x(2), s(M), s(f));
              var L = v(f, 2),
                R = (t) => {
                  N(t, {
                    variant: `warning`,
                    class: `mb-4`,
                    children: (t, n) => {
                      var a = ee(),
                        o = h(a);
                      D(o, { class: `h-4 w-4` });
                      var c = v(o, 2),
                        d = v(u(c), 2),
                        f = u(d);
                      (s(d),
                        s(c),
                        e(() =>
                          r(
                            f,
                            `${l(U).breakerOpenScripts ?? ``} scripts have circuit breakers open`,
                          ),
                        ),
                        i(t, a));
                    },
                    $$slots: { default: !0 },
                  });
                };
              n(L, (e) => {
                l(U).breakerOpenScripts && l(U).breakerOpenScripts > 0 && e(R);
              });
              var z = v(L, 2),
                B = (t) => {
                  var n = ne(),
                    c = v(u(n), 2);
                  (a(
                    c,
                    5,
                    () => l(U).topScripts.slice(0, 5),
                    o,
                    (t, n) => {
                      var a = te(),
                        o = u(a),
                        c = u(o, !0);
                      s(o);
                      var d = v(o, 2),
                        f = u(d, !0);
                      (s(d),
                        s(a),
                        e(() => {
                          (r(c, l(n).name), r(f, l(n).invocations));
                        }),
                        i(t, a));
                    },
                  ),
                    s(c),
                    s(n),
                    i(t, n));
                };
              (n(z, (e) => {
                l(U).topScripts && l(U).topScripts.length > 0 && e(B);
              }),
                e(
                  (e) => {
                    (r(_, l(U).total || 0),
                      r(C, l(U).failures || 0),
                      r(j, `${e ?? ``}%`),
                      r(I, l(U).tenants || 0));
                  },
                  [() => ((l(U).failureRate || 0) * 100).toFixed(1)],
                ),
                i(t, d));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    Se = (e) => {
      k(e, {
        children: (e, t) => {
          A(e, {
            class: `py-4`,
            children: (e, t) => {
              i(e, B());
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (n(be, (e) => {
    l(U)?.ok ? e(xe) : e(Se, -1);
  }),
    s($));
  var Ce = v($, 2),
    we = (d) => {
      var f = ce();
      (k(v(u(f), 2), {
        children: (d, f) => {
          A(d, {
            class: `pt-5`,
            children: (d, f) => {
              var p = se(),
                _ = h(p),
                y = u(_),
                S = v(y, 2),
                C = u(S, !0);
              s(S);
              var w = v(S, 2);
              {
                let t = g(() => (l(W).sloMet ? `success` : `destructive`));
                M(w, {
                  get variant() {
                    return l(t);
                  },
                  children: (t, n) => {
                    x();
                    var a = c();
                    (e(() =>
                      r(a, `${l(W).passingChecks ?? ``}/${l(W).totalChecks ?? ``} checks passing`),
                    ),
                      i(t, a));
                  },
                  $$slots: { default: !0 },
                });
              }
              s(_);
              var T = v(_, 2);
              (a(
                T,
                5,
                () => l(W).services ?? [],
                o,
                (c, d) => {
                  var f = oe(),
                    p = u(f),
                    h = u(p),
                    g = v(h, 2),
                    _ = u(g, !0);
                  s(g);
                  var y = v(g, 2),
                    x = (t) => {
                      var n = ie(),
                        a = u(n);
                      (s(n), e(() => r(a, `v${l(d).version ?? ``}`)), i(t, n));
                    };
                  (n(y, (e) => {
                    l(d).version && e(x);
                  }),
                    s(p));
                  var S = v(p, 2);
                  a(
                    S,
                    1,
                    () => Object.entries(l(d).functionalChecks),
                    o,
                    (n, a) => {
                      var o = m(() => t(l(a), 2));
                      let c = () => l(o)[0],
                        d = () => l(o)[1];
                      var f = ae(),
                        p = u(f),
                        h = u(p, !0);
                      s(p);
                      var g = v(p, 2),
                        _ = u(g, !0);
                      (s(g),
                        s(f),
                        e(() => {
                          (r(h, c()),
                            b(
                              g,
                              1,
                              d() === `pass`
                                ? `text-green-500`
                                : d() === `fail`
                                  ? `text-destructive`
                                  : `text-muted-foreground`,
                            ),
                            r(_, d()));
                        }),
                        i(n, f));
                    },
                  );
                  var C = v(S, 2),
                    w = u(C);
                  (s(C),
                    s(f),
                    e(() => {
                      (b(
                        h,
                        1,
                        `w-2 h-2 rounded-full ${l(d).reachable ? `bg-green-500` : `bg-destructive`}`,
                      ),
                        r(_, l(d).name),
                        r(w, `${l(d).latencyMs ?? ``}ms`));
                    }),
                    i(c, f));
                },
              ),
                s(T),
                e(() => {
                  (b(
                    y,
                    1,
                    `w-3 h-3 rounded-full ${l(W).healthy ? `bg-green-500` : `bg-destructive`}`,
                  ),
                    r(C, l(W).healthy ? `All Systems Functional` : `Degraded`));
                }),
                i(d, p));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        s(f),
        i(d, f));
    };
  n(Ce, (e) => {
    l(W) && e(we);
  });
  var Te = v(Ce, 2),
    Ee = (t) => {
      var d = de();
      (k(v(u(d), 2), {
        children: (t, d) => {
          A(t, {
            class: `pt-5`,
            children: (t, d) => {
              var f = ue(),
                p = h(f),
                m = u(p),
                g = u(m);
              s(m);
              var _ = v(m, 2),
                y = u(_);
              s(_);
              var S = v(_, 2),
                C = (e) => {
                  M(e, {
                    variant: `success`,
                    children: (e, t) => {
                      (x(), i(e, c(`Fully Activated`)));
                    },
                    $$slots: { default: !0 },
                  });
                };
              (n(S, (e) => {
                l(G).fullyActivated && e(C);
              }),
                s(p));
              var w = v(p, 2);
              (a(
                w,
                5,
                () => l(G).steps ?? [],
                o,
                (t, n, a) => {
                  var o = le(),
                    c = u(o);
                  c.textContent = a + 1;
                  var d = v(c, 2),
                    f = u(d, !0);
                  s(d);
                  var p = v(d, 2),
                    m = u(p, !0);
                  (s(p),
                    s(o),
                    e(
                      (e) => {
                        (b(
                          c,
                          1,
                          `w-6 h-6 rounded-full flex items-center justify-center text-xs ${l(n).completed ? `bg-green-500 text-white` : `bg-muted text-muted-foreground`}`,
                        ),
                          b(
                            d,
                            1,
                            `font-medium capitalize ${l(n).completed ? `` : `text-muted-foreground`}`,
                          ),
                          r(f, e),
                          r(m, l(n).evidence));
                      },
                      [() => l(n).name.replace(/_/g, ` `)],
                    ),
                    i(t, o));
                },
              ),
                s(w),
                e(() => {
                  (b(
                    m,
                    1,
                    `text-2xl font-bold ${l(G).fullyActivated ? `text-green-500` : `text-primary`}`,
                  ),
                    r(g, `${l(G).completionRate ?? ``}%`),
                    r(y, `${l(G).completedSteps ?? ``}/${l(G).totalSteps ?? ``} steps complete`));
                }),
                i(t, f));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        s(d),
        i(t, d));
    };
  (n(Te, (e) => {
    l(G) && e(Ee);
  }),
    s(Y),
    i(C, Y),
    d());
}
export { V as component };
