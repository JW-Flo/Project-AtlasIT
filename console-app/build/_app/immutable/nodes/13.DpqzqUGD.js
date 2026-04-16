import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Q as s,
  R as c,
  Tt as l,
  V as u,
  W as d,
  Z as f,
  at as p,
  b as m,
  bt as h,
  ct as g,
  l as _,
  ot as v,
  pt as y,
  q as b,
  r as x,
  st as S,
  ut as C,
  wt as w,
  xt as T,
  z as E,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as D } from "../chunks/D4lFFHu4.js";
import { t as O } from "../chunks/CMGwYO6i2.js";
import { n as k, t as ee } from "../chunks/BEJa09Kq2.js";
import { t as A } from "../chunks/Cue2Cs472.js";
import { t as j } from "../chunks/DmQt9wwK2.js";
import { t as te } from "../chunks/DOfJvt542.js";
import { t as M } from "../chunks/oRaErrij2.js";
import { t as N } from "../chunks/CohZSUWO.js";
var ne = E(`<div class="space-y-3"></div>`),
  P = E(`<!> <p class="pl-7"> </p>`, 1),
  re = E(
    `<div class="px-5 py-10 text-center text-sm text-muted-foreground">No automation runs found for this filter.</div>`,
  ),
  ie = E(
    `<tr class="border-t hover:bg-muted/40 cursor-pointer"><td class="px-4 py-3 font-medium"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3"><div class="text-foreground"> </div> <div class="text-xs text-muted-foreground"> </div></td></tr>`,
  ),
  ae = E(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Rule</th><th class="px-4 py-3 font-medium">Trigger</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Duration</th><th class="px-4 py-3 font-medium">Affected User</th><th class="px-4 py-3 font-medium">Started</th></tr></thead><tbody></tbody></table></div>`,
  ),
  oe = E(
    `<!> <div class="flex items-center justify-between text-sm text-muted-foreground"><div><!></div> <div class="flex items-center gap-2"><!> <!></div></div>`,
    1,
  ),
  se = E(
    `<div class="space-y-3"><!> <!> <div class="grid grid-cols-2 gap-3"><!> <!> <!> <!></div> <!></div>`,
  ),
  ce = E(`<div class="text-xs text-muted-foreground mt-1"> </div>`),
  le = E(
    `<div class="flex items-center gap-2 mb-1"><!> <span class="text-xs font-medium"> </span></div> <!>`,
    1,
  ),
  ue = E(`<div class="space-y-2"></div>`),
  de = E(`<p class="text-xs text-muted-foreground">No action results recorded.</p>`),
  fe = E(
    `<div class="mb-4"><div class="text-sm font-medium"> </div> <!></div> <div class="grid grid-cols-2 gap-3 mb-4"><div><div class="text-xs text-muted-foreground mb-0.5">Status</div> <!></div> <div><div class="text-xs text-muted-foreground mb-0.5">Duration</div> <span class="text-sm"> </span></div> <div><div class="text-xs text-muted-foreground mb-0.5">Started</div> <span class="text-xs"> </span></div> <div><div class="text-xs text-muted-foreground mb-0.5">Completed</div> <span class="text-xs"> </span></div></div> <div><div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Action Results</div> <!></div>`,
    1,
  ),
  pe = E(
    `<div class="space-y-6"><div class="flex items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">Automation Runs</h1> <p class="text-sm text-muted-foreground">Execution log for automation rules across your tenant.</p></div> <div class="flex items-center gap-2"><label class="text-sm text-muted-foreground" for="status-filter">Status</label> <select id="status-filter" class="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>All</option><option>Success</option><option>Failed</option><option>Skipped</option></select></div></div> <!></div> <!>`,
    1,
  );
function me(E, me) {
  T(me, !1);
  let he = g(),
    ge = g(),
    F = g(),
    I = g(),
    L = g(!0),
    R = g(null),
    z = g([]),
    B = g(null),
    V = g(!1),
    H = g(`all`),
    U = g(25),
    W = g(0),
    G = g(0);
  function K(e) {
    return e === `success` ? `success` : e === `failed` ? `destructive` : `secondary`;
  }
  function _e(e) {
    if (!e) return `manual`;
    if (typeof e == `string`) return e;
    if (typeof e == `object`) {
      let t = e;
      return String(t.type ?? t.event ?? t.name ?? `trigger`);
    }
    return `trigger`;
  }
  function ve(e, t) {
    if (!e || !t) return `--`;
    let n = new Date(e).getTime(),
      r = new Date(t).getTime();
    if (Number.isNaN(n) || Number.isNaN(r) || r < n) return `--`;
    let i = r - n;
    if (i < 1e3) return `${i}ms`;
    let a = Math.round(i / 1e3);
    return a < 60 ? `${a}s` : `${Math.floor(a / 60)}m ${a % 60}s`;
  }
  function ye(e) {
    if (!e) return `--`;
    let t = new Date(e).getTime();
    if (Number.isNaN(t)) return `--`;
    let n = Date.now() - t,
      r = Math.floor(n / 1e3);
    if (r < 60) return `${r}s ago`;
    let i = Math.floor(r / 60);
    if (i < 60) return `${i}m ago`;
    let a = Math.floor(i / 60);
    return a < 24 ? `${a}h ago` : `${Math.floor(a / 24)}d ago`;
  }
  async function q() {
    (C(L, !0), C(R, null));
    let e = d(H) === `all` ? `` : `&status=${d(H)}`,
      t = `/api/automation/executions?limit=${d(U)}&offset=${d(W)}${e}`;
    try {
      let e = await fetch(t);
      if (!e.ok) throw Error(`Failed to load runs (${e.status})`);
      let n = await e.json(),
        r = Array.isArray(n?.data) ? n.data : Array.isArray(n?.executions) ? n.executions : [],
        i = n?.meta ?? {};
      (C(
        z,
        r.map((e) => ({
          id: e.id,
          ruleName: e.ruleName ?? null,
          triggerEvent: e.triggerEvent ?? e.trigger_event ?? null,
          status: e.status,
          startedAt: e.startedAt ?? e.created_at ?? ``,
          completedAt: e.completedAt ?? e.completed_at ?? null,
          affectedUserEmail: e.affectedUserEmail ?? e.affected_user_email ?? null,
        })),
      ),
        C(G, Number(i.total ?? n?.total ?? d(z).length)),
        C(U, Number(i.limit ?? d(U))),
        C(W, Number(i.offset ?? d(W))));
    } catch (e) {
      (C(R, e?.message || `Failed to load automation runs`), C(z, []), C(G, 0));
    } finally {
      C(L, !1);
    }
  }
  function be(e) {
    (C(H, e), C(W, 0), q());
  }
  function xe() {
    d(F) && (C(W, Math.max(0, d(W) - d(U))), q());
  }
  function Se() {
    d(I) && (C(W, d(W) + d(U)), q());
  }
  async function Ce(e) {
    (C(V, !0), C(B, null));
    try {
      let t = await fetch(`/api/automation/executions/${e.id}`);
      if (t.ok) {
        let e = await t.json();
        C(B, e.execution ?? e);
      } else D({ message: `Failed to load execution details`, variant: `error` });
    } catch {
      D({ message: `Failed to load execution details`, variant: `error` });
    } finally {
      C(V, !1);
    }
  }
  function we() {
    (C(B, null), C(V, !1));
  }
  function Te(e) {
    return e.replace(/_/g, ` `).replace(/\b\w/g, (e) => e.toUpperCase());
  }
  (x(q),
    f(
      () => (d(G), d(W)),
      () => {
        C(he, d(G) === 0 ? 0 : d(W) + 1);
      },
    ),
    f(
      () => (d(W), d(U), d(G)),
      () => {
        C(ge, Math.min(d(W) + d(U), d(G)));
      },
    ),
    f(
      () => d(W),
      () => {
        C(F, d(W) > 0);
      },
    ),
    f(
      () => (d(W), d(U), d(G)),
      () => {
        C(I, d(W) + d(U) < d(G));
      },
    ),
    s(),
    _());
  var Ee = pe(),
    J = v(Ee),
    Y = p(J),
    De = S(p(Y), 2),
    X = S(p(De), 2),
    Z = p(X);
  Z.value = Z.__value = `all`;
  var Q = S(Z);
  Q.value = Q.__value = `success`;
  var $ = S(Q);
  $.value = $.__value = `failed`;
  var Oe = S($);
  ((Oe.value = Oe.__value = `skipped`), l(X), l(De), l(Y));
  var ke = S(Y, 2),
    Ae = (e) => {
      var t = ne();
      (a(
        t,
        4,
        () => [1, 2, 3, 4],
        o,
        (e, t) => {
          M(e, { class: `h-14 rounded-lg` });
        },
      ),
        l(t),
        i(e, t));
    },
    je = (t) => {
      te(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = P(),
            o = v(a);
          O(o, { class: `h-4 w-4` });
          var s = S(o, 2),
            c = p(s, !0);
          (l(s), e(() => r(c, d(R))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    Me = (s) => {
      var f = oe(),
        m = v(f);
      k(m, {
        children: (s, f) => {
          ee(s, {
            class: `p-0`,
            children: (s, f) => {
              var m = c(),
                h = v(m),
                g = (e) => {
                  i(e, re());
                },
                _ = (t) => {
                  var s = ae(),
                    c = p(s),
                    f = S(p(c));
                  (a(
                    f,
                    5,
                    () => d(z),
                    o,
                    (t, a) => {
                      var o = ie(),
                        s = p(o),
                        c = p(s, !0);
                      l(s);
                      var f = S(s),
                        m = p(f, !0);
                      l(f);
                      var h = S(f),
                        g = p(h);
                      {
                        let t = y(() => (d(a), b(() => K(d(a).status))));
                        j(g, {
                          get variant() {
                            return d(t);
                          },
                          children: (t, n) => {
                            w();
                            var o = u();
                            (e(() => r(o, (d(a), b(() => d(a).status)))), i(t, o));
                          },
                          $$slots: { default: !0 },
                        });
                      }
                      l(h);
                      var _ = S(h),
                        v = p(_, !0);
                      l(_);
                      var x = S(_),
                        C = p(x, !0);
                      l(x);
                      var T = S(x),
                        E = p(T),
                        D = p(E, !0);
                      l(E);
                      var O = S(E, 2),
                        k = p(O, !0);
                      (l(O),
                        l(T),
                        l(o),
                        e(
                          (e, t, n, i) => {
                            (r(c, (d(a), b(() => d(a).ruleName || `Unnamed rule`))),
                              r(m, e),
                              r(v, t),
                              r(C, (d(a), b(() => d(a).affectedUserEmail || `--`))),
                              r(D, n),
                              r(k, i));
                          },
                          [
                            () => (d(a), b(() => _e(d(a).triggerEvent))),
                            () => (d(a), b(() => ve(d(a).startedAt, d(a).completedAt))),
                            () => (d(a), b(() => ye(d(a).startedAt))),
                            () => (
                              d(a),
                              b(() =>
                                d(a).startedAt ? new Date(d(a).startedAt).toLocaleString() : `--`,
                              )
                            ),
                          ],
                        ),
                        n(`click`, o, () => Ce(d(a))),
                        i(t, o));
                    },
                  ),
                    l(f),
                    l(c),
                    l(s),
                    i(t, s));
                };
              (t(h, (e) => {
                (d(z), b(() => d(z).length === 0) ? e(g) : e(_, -1));
              }),
                i(s, m));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var h = S(m, 2),
        g = p(h),
        _ = p(g),
        x = (t) => {
          var n = u();
          (e(() => r(n, `Showing ${d(he) ?? ``}–${d(ge) ?? ``} of ${d(G) ?? ``}`)), i(t, n));
        },
        C = (e) => {
          i(e, u(`Showing 0 results`));
        };
      (t(_, (e) => {
        d(G) > 0 ? e(x) : e(C, -1);
      }),
        l(g));
      var T = S(g, 2),
        E = p(T);
      {
        let e = y(() => !d(F));
        A(E, {
          variant: `outline`,
          size: `sm`,
          get disabled() {
            return d(e);
          },
          $$events: { click: xe },
          children: (e, t) => {
            (w(), i(e, u(`Previous`)));
          },
          $$slots: { default: !0 },
        });
      }
      var D = S(E, 2);
      {
        let e = y(() => !d(I));
        A(D, {
          variant: `outline`,
          size: `sm`,
          get disabled() {
            return d(e);
          },
          $$events: { click: Se },
          children: (e, t) => {
            (w(), i(e, u(`Next`)));
          },
          $$slots: { default: !0 },
        });
      }
      (l(T), l(h), i(s, f));
    };
  (t(ke, (e) => {
    d(L) ? e(Ae) : d(R) ? e(je, 1) : e(Me, -1);
  }),
    l(J));
  var Ne = S(J, 2);
  {
    let n = y(() => d(V) || d(B) !== null);
    N(Ne, {
      get open() {
        return d(n);
      },
      onClose: we,
      title: `Execution Detail`,
      children: (n, s) => {
        var f = c(),
          m = v(f),
          h = (e) => {
            var t = se(),
              n = p(t);
            M(n, { class: `h-5 w-48` });
            var r = S(n, 2);
            M(r, { class: `h-4 w-32` });
            var a = S(r, 2),
              o = p(a);
            M(o, { class: `h-12` });
            var s = S(o, 2);
            M(s, { class: `h-12` });
            var c = S(s, 2);
            (M(c, { class: `h-12` }),
              M(S(c, 2), { class: `h-12` }),
              l(a),
              M(S(a, 2), { class: `h-24` }),
              l(t),
              i(e, t));
          },
          g = (n) => {
            var s = fe(),
              c = v(s),
              f = p(c),
              m = p(f, !0);
            l(f);
            var h = S(f, 2),
              g = (t) => {
                j(t, {
                  variant: `outline`,
                  class: `mt-1`,
                  children: (t, n) => {
                    w();
                    var a = u();
                    (e(() => r(a, (d(B), b(() => d(B).triggerType)))), i(t, a));
                  },
                  $$slots: { default: !0 },
                });
              };
            (t(h, (e) => {
              (d(B), b(() => d(B).triggerType) && e(g));
            }),
              l(c));
            var _ = S(c, 2),
              x = p(_),
              C = S(p(x), 2);
            {
              let t = y(() => (d(B), b(() => K(d(B).status))));
              j(C, {
                get variant() {
                  return d(t);
                },
                class: `capitalize`,
                children: (t, n) => {
                  w();
                  var a = u();
                  (e(() => r(a, (d(B), b(() => d(B).status)))), i(t, a));
                },
                $$slots: { default: !0 },
              });
            }
            l(x);
            var T = S(x, 2),
              E = S(p(T), 2),
              D = p(E, !0);
            (l(E), l(T));
            var O = S(T, 2),
              A = S(p(O), 2),
              te = p(A, !0);
            (l(A), l(O));
            var M = S(O, 2),
              N = S(p(M), 2),
              ne = p(N, !0);
            (l(N), l(M), l(_));
            var P = S(_, 2),
              re = S(p(P), 2),
              ie = (n) => {
                var s = ue();
                (a(
                  s,
                  5,
                  () => (d(B), b(() => d(B).results)),
                  o,
                  (n, a) => {
                    k(n, {
                      children: (n, o) => {
                        ee(n, {
                          class: `py-2 px-3`,
                          children: (n, o) => {
                            var s = le(),
                              c = v(s),
                              f = p(c);
                            {
                              let t = y(() => (d(a), b(() => K(d(a).status))));
                              j(f, {
                                get variant() {
                                  return d(t);
                                },
                                class: `capitalize`,
                                children: (t, n) => {
                                  w();
                                  var o = u();
                                  (e(() => r(o, (d(a), b(() => d(a).status)))), i(t, o));
                                },
                                $$slots: { default: !0 },
                              });
                            }
                            var m = S(f, 2),
                              h = p(m, !0);
                            (l(m), l(c));
                            var g = S(c, 2),
                              _ = (t) => {
                                var n = ce(),
                                  o = p(n, !0);
                                (l(n), e(() => r(o, (d(a), b(() => d(a).message)))), i(t, n));
                              };
                            (t(g, (e) => {
                              (d(a), b(() => d(a).message) && e(_));
                            }),
                              e((e) => r(h, e), [() => (d(a), b(() => Te(d(a).actionType)))]),
                              i(n, s));
                          },
                          $$slots: { default: !0 },
                        });
                      },
                      $$slots: { default: !0 },
                    });
                  },
                ),
                  l(s),
                  i(n, s));
              },
              ae = (e) => {
                i(e, de());
              };
            (t(re, (e) => {
              (d(B), b(() => d(B).results && d(B).results.length > 0) ? e(ie) : e(ae, -1));
            }),
              l(P),
              e(
                (e, t) => {
                  (r(m, (d(B), b(() => d(B).ruleName))),
                    r(D, (d(B), b(() => (d(B).durationMs ? `${d(B).durationMs}ms` : `-`)))),
                    r(te, e),
                    r(ne, t));
                },
                [
                  () => (d(B), b(() => new Date(d(B).startedAt).toLocaleString())),
                  () => (
                    d(B),
                    b(() => (d(B).completedAt ? new Date(d(B).completedAt).toLocaleString() : `-`))
                  ),
                ],
              ),
              i(n, s));
          };
        (t(m, (e) => {
          d(V) ? e(h) : d(B) && e(g, 1);
        }),
          i(n, f));
      },
      $$slots: { default: !0 },
    });
  }
  (m(
    X,
    () => d(H),
    (e) => C(H, e),
  ),
    n(`change`, X, (e) => be(e.currentTarget.value)),
    i(E, Ee),
    h());
}
export { me as component };
