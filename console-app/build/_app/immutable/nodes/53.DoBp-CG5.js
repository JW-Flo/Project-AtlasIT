import {
  $ as e,
  C as t,
  F as n,
  H as r,
  I as i,
  L as a,
  N as o,
  P as s,
  Q as c,
  R as l,
  T as u,
  Tt as d,
  V as f,
  W as p,
  Z as m,
  at as h,
  bt as g,
  ct as _,
  gt as v,
  ht as y,
  l as b,
  lt as x,
  ot as S,
  pt as C,
  q as w,
  r as T,
  st as E,
  ut as D,
  v as O,
  w as ee,
  wt as k,
  xt as A,
  z as j,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as M } from "../chunks/D8pbUplu.js";
import { n as N, t as P } from "../chunks/BEJa09Kq2.js";
import { t as F } from "../chunks/DmQt9wwK2.js";
import { t as I } from "../chunks/oRaErrij2.js";
var L = j(`<div class="space-y-4"><!> <!> <!></div>`),
  R = j(
    `<h1 class="text-2xl font-semibold tracking-tight">Trust Center unavailable</h1> <p class="text-sm text-muted-foreground">This trust page does not exist or is not publicly enabled.</p>`,
    1,
  ),
  te = j(`<img class="h-10 w-10 rounded-md object-cover border"/>`),
  ne = j(
    `<div class="h-10 w-10 rounded-md border bg-muted flex items-center justify-center text-sm font-semibold"> </div>`,
  ),
  re = j(
    `<div class="text-sm text-muted-foreground">Evidence records</div> <div class="mt-1 text-2xl font-semibold"> </div>`,
    1,
  ),
  ie = j(
    `<div class="text-sm text-muted-foreground">Last audit update</div> <div class="mt-1 text-2xl font-semibold"> </div>`,
    1,
  ),
  ae = j(
    `<div class="text-sm text-muted-foreground">Connected apps</div> <div class="mt-1 text-2xl font-semibold"> </div>`,
    1,
  ),
  oe = j(`<span class="inline-block h-2 w-2 rounded-full bg-green-500" title="Fresh"></span>`),
  se = j(`<span class="inline-block h-2 w-2 rounded-full bg-yellow-500" title="Stale"></span>`),
  ce = j(`&middot; <span> </span>`, 1),
  le = j(
    `<div class="flex items-start gap-2 text-xs"><div class="mt-0.5"><!></div> <div class="flex-1"><div class="font-medium capitalize"> </div> <div class="text-muted-foreground"> <!></div></div></div>`,
  ),
  ue = j(`<div class="text-xs text-muted-foreground">No evidence recorded for this control.</div>`),
  de = j(`<div class="ml-4 pl-3 border-l-2 border-muted space-y-2 py-2"><!></div>`),
  fe = j(
    `<button class="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"><div class="flex items-center justify-between"><span class="text-sm font-medium"> </span> <!></div> <div class="text-xs text-muted-foreground mt-0.5"> </div></button> <!>`,
    1,
  ),
  pe = j(`<div class="mt-4 space-y-1"></div>`),
  me = j(
    `<div class="flex items-center justify-between gap-3"><h3 class="font-semibold"> </h3> <!></div> <div class="text-sm text-muted-foreground"> </div> <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary"></div></div> <!>`,
    1,
  ),
  he = j(`<div class="space-y-4"></div>`),
  ge = j(`<img class="h-8 w-8 object-contain"/>`),
  _e = j(
    `<div class="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-semibold"> </div>`,
  ),
  ve = j(`<!> <div class="text-xs text-muted-foreground line-clamp-2"> </div>`, 1),
  ye = j(`<div class="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"></div>`),
  be = j(
    `<header class="space-y-3"><div class="flex items-center gap-3"><!> <div><h1 class="text-3xl font-semibold tracking-tight"> </h1> <p class="text-sm text-muted-foreground">Public security posture snapshot</p></div></div></header> <section class="grid gap-4 sm:grid-cols-3"><!> <!> <!></section> <section class="space-y-3"><h2 class="text-xl font-semibold">Framework scores</h2> <!></section> <section class="space-y-3"><h2 class="text-xl font-semibold">Connected integrations</h2> <!></section>`,
    1,
  ),
  z = j(
    `<div class="min-h-screen bg-background text-foreground"><div class="mx-auto max-w-6xl px-6 py-10 space-y-8"><!></div></div>`,
  );
function B(j, B) {
  A(B, !1);
  let V = () => v(M, `$page`, H),
    [H, U] = y(),
    W = _(),
    G = _(!0),
    K = _(!1),
    q = _(null),
    J = _(null),
    Y = _({}),
    X = _(null);
  async function xe() {
    (D(G, !0), D(K, !1));
    try {
      let e = await fetch(`/api/trust/${p(W)}`);
      if (e.status === 404) {
        (D(K, !0), D(q, null));
        return;
      }
      if (!e.ok) {
        D(q, null);
        return;
      }
      D(q, await e.json());
    } catch {
      D(q, null);
    } finally {
      D(G, !1);
    }
  }
  function Se(e) {
    let t = new Date(e);
    return Number.isNaN(t.getTime()) ? `—` : t.toLocaleDateString();
  }
  function Ce(e) {
    return e >= 80 ? `success` : e >= 60 ? `warning` : `destructive`;
  }
  async function we(e, t) {
    if (p(J) === e) {
      D(J, null);
      return;
    }
    if ((D(J, e), !p(Y)[e])) {
      D(X, e);
      try {
        let n = await fetch(
          `/api/trust/${p(W)}/evidence?control=${encodeURIComponent(e)}&framework=${encodeURIComponent(t)}`,
        );
        if (n.ok) {
          let t = await n.json();
          (x(Y, (p(Y)[e] = t.evidence ?? [])), D(Y, p(Y)));
        }
      } catch {
      } finally {
        D(X, null);
      }
    }
  }
  function Te(e) {
    switch (e) {
      case `verified`:
        return `Verified`;
      case `implemented`:
        return `Implemented`;
      case `in_progress`:
        return `In Progress`;
      default:
        return `Not Started`;
    }
  }
  function Z(e) {
    switch (e) {
      case `verified`:
        return `success`;
      case `implemented`:
        return `success`;
      case `in_progress`:
        return `warning`;
      default:
        return `destructive`;
    }
  }
  function Ee(e) {
    return e.startsWith(`adapter:`)
      ? e.replace(`adapter:`, ``).replace(/_/g, ` `)
      : e.replace(/_/g, ` `);
  }
  (T(xe),
    m(
      () => V(),
      () => {
        D(W, V().params.slug);
      },
    ),
    c(),
    b());
  var Q = z(),
    $ = h(Q),
    De = h($),
    Oe = (e) => {
      var t = L(),
        n = h(t);
      I(n, { class: `h-12 w-64` });
      var r = E(n, 2);
      (I(r, { class: `h-24 rounded-xl` }), I(E(r, 2), { class: `h-48 rounded-xl` }), d(t), a(e, t));
    },
    ke = (e) => {
      N(e, {
        class: `border-dashed`,
        children: (e, t) => {
          P(e, {
            class: `py-14 text-center space-y-2`,
            children: (e, t) => {
              var n = R();
              (k(2), a(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    Ae = (c) => {
      var m = be(),
        g = S(m),
        _ = h(g),
        v = h(_),
        y = (t) => {
          var n = te();
          (e(() => {
            (O(n, `src`, (p(q), w(() => p(q).tenant.logoUrl))),
              O(n, `alt`, (p(q), w(() => `${p(q).tenant.name} logo`))));
          }),
            a(t, n));
        },
        b = (t) => {
          var n = ne(),
            r = h(n, !0);
          (d(n),
            e((e) => i(r, e), [() => (p(q), w(() => p(q).tenant.name.slice(0, 1).toUpperCase()))]),
            a(t, n));
        };
      n(v, (e) => {
        (p(q), w(() => p(q).tenant.logoUrl) ? e(y) : e(b, -1));
      });
      var x = E(v, 2),
        T = h(x),
        D = h(T);
      (d(T), k(2), d(x), d(_), d(g));
      var A = E(g, 2),
        j = h(A);
      N(j, {
        children: (t, n) => {
          P(t, {
            class: `pt-6`,
            children: (t, n) => {
              var r = re(),
                o = E(S(r), 2),
                s = h(o, !0);
              (d(o), e(() => i(s, (p(q), w(() => p(q).evidenceCount)))), a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var M = E(j, 2);
      (N(M, {
        children: (t, n) => {
          P(t, {
            class: `pt-6`,
            children: (t, n) => {
              var r = ie(),
                o = E(S(r), 2),
                s = h(o, !0);
              (d(o), e((e) => i(s, e), [() => (p(q), w(() => Se(p(q).lastAuditDate)))]), a(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        N(E(M, 2), {
          children: (t, n) => {
            P(t, {
              class: `pt-6`,
              children: (t, n) => {
                var r = ae(),
                  o = E(S(r), 2),
                  s = h(o, !0);
                (d(o), e(() => i(s, (p(q), w(() => p(q).connectedApps.length)))), a(t, r));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        d(A));
      var L = E(A, 2),
        R = E(h(L), 2),
        z = (e) => {
          N(e, {
            class: `border-dashed`,
            children: (e, t) => {
              P(e, {
                class: `py-8 text-sm text-muted-foreground`,
                children: (e, t) => {
                  (k(), a(e, f(`No framework data available yet.`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        },
        B = (c) => {
          var m = he();
          (o(
            m,
            5,
            () => (p(q), w(() => p(q).frameworks)),
            s,
            (c, m) => {
              N(c, {
                children: (c, g) => {
                  P(c, {
                    class: `pt-6 space-y-3`,
                    children: (c, g) => {
                      var _ = me(),
                        v = S(_),
                        y = h(v),
                        b = h(y, !0);
                      d(y);
                      var x = E(y, 2);
                      {
                        let t = C(() => (p(m), w(() => Ce(p(m).score))));
                        F(x, {
                          get variant() {
                            return p(t);
                          },
                          children: (t, n) => {
                            k();
                            var r = f();
                            (e(() => i(r, `${(p(m), w(() => p(m).score)) ?? ``}%`)), a(t, r));
                          },
                          $$slots: { default: !0 },
                        });
                      }
                      d(v);
                      var T = E(v, 2),
                        D = h(T);
                      d(T);
                      var O = E(T, 2),
                        A = h(O);
                      d(O);
                      var j = E(O, 2),
                        M = (t) => {
                          var c = pe();
                          (o(
                            c,
                            5,
                            () => (p(m), w(() => p(m).controls)),
                            s,
                            (t, c) => {
                              var g = fe(),
                                _ = S(g),
                                v = h(_),
                                y = h(v),
                                b = h(y, !0);
                              d(y);
                              var x = E(y, 2);
                              {
                                let t = C(() => (p(c), w(() => Z(p(c).status))));
                                F(x, {
                                  get variant() {
                                    return p(t);
                                  },
                                  class: `text-xs`,
                                  children: (t, n) => {
                                    k();
                                    var r = f();
                                    (e((e) => i(r, e), [() => (p(c), w(() => Te(p(c).status)))]),
                                      a(t, r));
                                  },
                                  $$slots: { default: !0 },
                                });
                              }
                              d(v);
                              var T = E(v, 2),
                                D = h(T, !0);
                              (d(T), d(_));
                              var O = E(_, 2),
                                A = (t) => {
                                  var r = de(),
                                    f = h(r),
                                    m = (e) => {
                                      I(e, { class: `h-8 w-full` });
                                    },
                                    g = (t) => {
                                      var r = l();
                                      (o(
                                        S(r),
                                        1,
                                        () => (p(Y), p(c), w(() => p(Y)[p(c).controlId])),
                                        s,
                                        (t, r) => {
                                          var o = le(),
                                            s = h(o),
                                            c = h(s),
                                            l = (e) => {
                                              a(e, oe());
                                            },
                                            f = (e) => {
                                              a(e, se());
                                            };
                                          (n(c, (e) => {
                                            (p(r), w(() => p(r).isFresh) ? e(l) : e(f, -1));
                                          }),
                                            d(s));
                                          var m = E(s, 2),
                                            g = h(m),
                                            _ = h(g, !0);
                                          d(g);
                                          var v = E(g, 2),
                                            y = h(v),
                                            b = E(y),
                                            x = (t) => {
                                              var n = ce(),
                                                o = E(S(n)),
                                                s = h(o, !0);
                                              (d(o),
                                                e(() => {
                                                  (ee(
                                                    o,
                                                    1,
                                                    u(
                                                      (p(r),
                                                      w(() =>
                                                        p(r).status === `pass`
                                                          ? `text-green-600`
                                                          : p(r).status === `fail`
                                                            ? `text-red-600`
                                                            : ``,
                                                      )),
                                                    ),
                                                  ),
                                                    i(s, (p(r), w(() => p(r).status))));
                                                }),
                                                a(t, n));
                                            };
                                          (n(b, (e) => {
                                            (p(r), w(() => p(r).status) && e(x));
                                          }),
                                            d(v),
                                            d(m),
                                            d(o),
                                            e(
                                              (e, t) => {
                                                (i(_, e),
                                                  i(
                                                    y,
                                                    `${t ?? ``} · ${(p(r), w(() => p(r).ageDescription)) ?? ``} `,
                                                  ));
                                              },
                                              [
                                                () => (p(r), w(() => Ee(p(r).source))),
                                                () => (
                                                  p(r),
                                                  w(() => p(r).evidenceType.replace(/_/g, ` `))
                                                ),
                                              ],
                                            ),
                                            a(t, o));
                                        },
                                      ),
                                        a(t, r));
                                    },
                                    _ = (e) => {
                                      a(e, ue());
                                    };
                                  (n(f, (e) => {
                                    (p(X),
                                      p(c),
                                      w(() => p(X) === p(c).controlId)
                                        ? e(m)
                                        : (p(Y),
                                          p(c),
                                          w(() => p(Y)[p(c).controlId]?.length)
                                            ? e(g, 1)
                                            : e(_, -1)));
                                  }),
                                    d(r),
                                    a(t, r));
                                };
                              (n(O, (e) => {
                                (p(J), p(c), w(() => p(J) === p(c).controlId) && e(A));
                              }),
                                e(() => {
                                  (i(b, (p(c), w(() => p(c).controlId))),
                                    i(D, (p(c), w(() => p(c).controlName))));
                                }),
                                r(`click`, _, () => we(p(c).controlId, p(m).name)),
                                a(t, g));
                            },
                          ),
                            d(c),
                            a(t, c));
                        };
                      (n(j, (e) => {
                        (p(m), w(() => p(m).controls && p(m).controls.length > 0) && e(M));
                      }),
                        e(
                          (e) => {
                            (i(b, (p(m), w(() => p(m).name))),
                              i(
                                D,
                                `${(p(m), w(() => p(m).controlsImplemented)) ?? ``}/${(p(m), w(() => p(m).controlsTotal)) ?? ``} controls implemented`,
                              ),
                              t(A, e));
                          },
                          [
                            () => (
                              p(m),
                              w(() => `width: ${Math.max(0, Math.min(100, p(m).score))}%`)
                            ),
                          ],
                        ),
                        a(c, _));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
          ),
            d(m),
            a(c, m));
        };
      (n(R, (e) => {
        (p(q), w(() => p(q).frameworks.length === 0) ? e(z) : e(B, -1));
      }),
        d(L));
      var V = E(L, 2),
        H = E(h(V), 2),
        U = (e) => {
          N(e, {
            class: `border-dashed`,
            children: (e, t) => {
              P(e, {
                class: `py-8 text-sm text-muted-foreground`,
                children: (e, t) => {
                  (k(), a(e, f(`No connected integrations published.`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        },
        W = (t) => {
          var r = ye();
          (o(
            r,
            5,
            () => (p(q), w(() => p(q).connectedApps)),
            s,
            (t, r) => {
              N(t, {
                children: (t, o) => {
                  P(t, {
                    class: `py-4 flex flex-col items-center gap-2 text-center`,
                    children: (t, o) => {
                      var s = ve(),
                        c = S(s),
                        l = (t) => {
                          var n = ge();
                          (e(() => {
                            (O(n, `src`, (p(r), w(() => p(r).logoUrl))),
                              O(n, `alt`, (p(r), w(() => `${p(r).name} logo`))));
                          }),
                            a(t, n));
                        },
                        u = (t) => {
                          var n = _e(),
                            o = h(n, !0);
                          (d(n),
                            e(
                              (e) => i(o, e),
                              [() => (p(r), w(() => p(r).name.slice(0, 1).toUpperCase()))],
                            ),
                            a(t, n));
                        };
                      n(c, (e) => {
                        (p(r), w(() => p(r).logoUrl) ? e(l) : e(u, -1));
                      });
                      var f = E(c, 2),
                        m = h(f, !0);
                      (d(f), e(() => i(m, (p(r), w(() => p(r).name)))), a(t, s));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              });
            },
          ),
            d(r),
            a(t, r));
        };
      (n(H, (e) => {
        (p(q), w(() => p(q).connectedApps.length === 0) ? e(U) : e(W, -1));
      }),
        d(V),
        e(() => i(D, `${(p(q), w(() => p(q).tenant.name)) ?? ``} Trust Center`)),
        a(c, m));
    },
    je = (e) => {
      N(e, {
        class: `border-dashed`,
        children: (e, t) => {
          P(e, {
            class: `py-14 text-center text-sm text-muted-foreground`,
            children: (e, t) => {
              (k(), a(e, f(`Unable to load Trust Center data right now.`)));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (n(De, (e) => {
    p(G) ? e(Oe) : p(K) ? e(ke, 1) : p(q) ? e(Ae, 2) : e(je, -1);
  }),
    d($),
    d(Q),
    a(j, Q),
    g(),
    U());
}
export { B as component };
