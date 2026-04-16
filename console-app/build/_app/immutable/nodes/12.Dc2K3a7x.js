import {
  $ as e,
  C as t,
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
  at as f,
  bt as p,
  ct as m,
  h,
  l as g,
  nt as _,
  ot as v,
  pt as y,
  st as b,
  ut as x,
  w as S,
  wt as C,
  xt as w,
  z as T,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as E } from "../chunks/D4lFFHu4.js";
import { t as D } from "../chunks/CMgwAYwY.js";
import { t as O } from "../chunks/Cj66XTu9.js";
import { n as k, t as A } from "../chunks/eaBWeOv7.js";
import { n as j, t as M } from "../chunks/BEJa09Kq2.js";
import { t as N } from "../chunks/Da7GIpgR2.js";
import { t as P } from "../chunks/B2LjsFjQ2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as I } from "../chunks/DmQt9wwK2.js";
import { t as L } from "../chunks/DOfJvt542.js";
var R = T(`<!> Generate Rule`, 1),
  z = T(
    `<div class="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm flex items-center gap-2"><!> Translating policy...</div>`,
  ),
  B = T(`<p> </p>`),
  V = T(
    `<textarea rows="5" placeholder="Describe your policy in plain English... e.g. When someone leaves engineering, revoke GitHub and Jira access immediately." class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"></textarea> <div class="flex items-center gap-2"><!></div> <!> <!>`,
    1,
  ),
  H = T(`<!> <!>`, 1),
  ee = T(`<li class="rounded border px-2 py-1 bg-muted/40"> </li>`),
  te = T(`<ul class="space-y-1 text-sm"></ul>`),
  ne = T(`<p class="text-sm text-muted-foreground">No explicit conditions.</p>`),
  re = T(`<li class="rounded border px-2 py-1 bg-muted/40"> </li>`),
  ie = T(`<ol class="space-y-1 text-sm list-decimal pl-5"></ol>`),
  ae = T(`<p class="text-sm text-muted-foreground">No actions generated.</p>`),
  oe = T(
    `<div><div class="text-lg font-semibold"> </div> <p class="text-sm text-muted-foreground"> </p></div> <div class="flex items-center gap-2"><span class="text-sm text-muted-foreground">Trigger</span> <!></div> <div><div class="text-sm font-medium mb-1">Conditions</div> <!></div> <div><div class="text-sm font-medium mb-1">Actions</div> <!></div>`,
    1,
  ),
  se = T(`<!> <!>`, 1),
  ce = T(
    `<div class="rounded border px-3 py-2"><div class="flex items-center gap-2 mb-1"><!> <!></div> <div class="text-sm font-medium"> </div> <div class="text-xs text-muted-foreground"> </div></div>`,
  ),
  le = T(`<p class="text-sm text-muted-foreground">No compliance mappings generated.</p>`),
  ue = T(`<div class="px-3 pb-3 text-sm text-muted-foreground"> </div>`),
  de = T(
    `<div><div class="flex items-center justify-between text-sm mb-1"><span> </span> <span> </span></div> <div class="h-2 rounded-full bg-muted overflow-hidden"><div></div></div></div> <div class="space-y-2"><!></div> <div class="rounded border"><button class="w-full px-3 py-2 text-left text-sm font-medium flex items-center justify-between">AI Reasoning <!></button> <!></div>`,
    1,
  ),
  fe = T(`<!> <!>`, 1),
  pe = T(
    `<div class="grid gap-4 lg:grid-cols-2"><!> <!></div> <div class="flex items-center gap-2"><!> <!></div>`,
    1,
  ),
  me = T(
    `<div class="space-y-6"><div><h1 class="text-2xl font-semibold tracking-tight">NL Automation Builder</h1> <p class="text-sm text-muted-foreground">Describe your lifecycle policy in plain English and generate an automation rule with compliance mapping.</p></div> <!> <!></div>`,
  );
function U(T, U) {
  w(U, !1);
  let W = m(``),
    G = m(!1),
    K = m(null),
    q = m(null),
    J = m(!1),
    Y = m(!1);
  function he(e) {
    return e >= 0.8 ? `bg-green-500` : e >= 0.5 ? `bg-yellow-500` : `bg-destructive`;
  }
  function ge(e) {
    return e >= 0.8 ? `High` : e >= 0.5 ? `Medium` : `Low`;
  }
  function X(e) {
    return Math.max(0, Math.min(100, Math.round(e * 100)));
  }
  async function _e() {
    if (d(W).trim()) {
      (x(G, !0), x(K, null), x(q, null));
      try {
        let e = await fetch(`/api/automation/nl`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ prompt: d(W).trim() }),
        });
        if (!e.ok) throw Error(`Failed to generate rule (${e.status})`);
        let t = await e.json();
        if (t?.status !== `success` || !t?.data) throw Error(`Unexpected response from NL builder`);
        (x(q, t.data), x(J, !0));
      } catch (e) {
        (x(K, e?.message || `Failed to generate rule`), x(q, null));
      } finally {
        x(G, !1);
      }
    }
  }
  async function ve() {
    if (d(q)?.rule) {
      x(Y, !0);
      try {
        let e = await fetch(`/api/automation/rules`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify(d(q).rule),
        });
        if (!e.ok) throw Error(`Failed to save rule (${e.status})`);
        E({ message: `Rule saved successfully`, variant: `success` });
      } catch (e) {
        E({ message: e?.message || `Failed to save rule`, variant: `error` });
      } finally {
        x(Y, !1);
      }
    }
  }
  function ye() {
    (d(q)?.prompt && x(W, d(q).prompt), x(q, null), x(K, null));
  }
  function Z(e) {
    return e == null ? `--` : typeof e == `string` ? e : JSON.stringify(e);
  }
  g();
  var Q = me(),
    $ = b(f(Q), 2);
  j($, {
    children: (t, r) => {
      var o = H(),
        s = v(o);
      (N(s, {
        children: (e, t) => {
          P(e, {
            children: (e, t) => {
              (C(), a(e, u(`Policy Prompt`)));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        M(b(s, 2), {
          class: `space-y-4`,
          children: (t, r) => {
            var o = V(),
              s = v(o);
            _(s);
            var c = b(s, 2),
              u = f(c);
            {
              let e = y(() => d(G) || !d(W).trim());
              F(u, {
                get disabled() {
                  return d(e);
                },
                $$events: { click: _e },
                children: (e, t) => {
                  var n = R();
                  (A(v(n), { class: `h-4 w-4 mr-1.5` }), C(), a(e, n));
                },
                $$slots: { default: !0 },
              });
            }
            l(c);
            var p = b(c, 2),
              m = (e) => {
                var t = z();
                (k(f(t), { class: `h-4 w-4 animate-spin` }), C(), l(t), a(e, t));
              };
            n(p, (e) => {
              d(G) && e(m);
            });
            var g = b(p, 2),
              S = (t) => {
                L(t, {
                  variant: `destructive`,
                  children: (t, n) => {
                    var r = B(),
                      o = f(r, !0);
                    (l(r), e(() => i(o, d(K))), a(t, r));
                  },
                  $$slots: { default: !0 },
                });
              };
            (n(g, (e) => {
              d(K) && e(S);
            }),
              h(
                s,
                () => d(W),
                (e) => x(W, e),
              ),
              a(t, o));
          },
          $$slots: { default: !0 },
        }),
        a(t, o));
    },
    $$slots: { default: !0 },
  });
  var be = b($, 2),
    xe = (p) => {
      var m = pe(),
        h = v(m),
        g = f(h);
      (j(g, {
        children: (t, r) => {
          var c = se(),
            p = v(c);
          (N(p, {
            children: (e, t) => {
              P(e, {
                children: (e, t) => {
                  (C(), a(e, u(`Generated Rule Preview`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            M(b(p, 2), {
              class: `space-y-4`,
              children: (t, r) => {
                var c = oe(),
                  p = v(c),
                  m = f(p),
                  h = f(m, !0);
                l(m);
                var g = b(m, 2),
                  _ = f(g, !0);
                (l(g), l(p));
                var y = b(p, 2);
                (I(b(f(y), 2), {
                  variant: `outline`,
                  children: (t, n) => {
                    C();
                    var r = u();
                    (e(() => i(r, d(q).rule.triggerType)), a(t, r));
                  },
                  $$slots: { default: !0 },
                }),
                  l(y));
                var x = b(y, 2),
                  S = b(f(x), 2),
                  w = (t) => {
                    var n = te();
                    (o(
                      n,
                      5,
                      () => d(q).rule.conditions,
                      s,
                      (t, n) => {
                        var r = ee(),
                          o = f(r, !0);
                        (l(r), e((e) => i(o, e), [() => Z(d(n))]), a(t, r));
                      },
                    ),
                      l(n),
                      a(t, n));
                  },
                  T = (e) => {
                    a(e, ne());
                  };
                (n(S, (e) => {
                  d(q).rule.conditions?.length ? e(w) : e(T, -1);
                }),
                  l(x));
                var E = b(x, 2),
                  D = b(f(E), 2),
                  O = (t) => {
                    var n = ie();
                    (o(
                      n,
                      5,
                      () => d(q).rule.actions,
                      s,
                      (t, n) => {
                        var r = re(),
                          o = f(r, !0);
                        (l(r), e((e) => i(o, e), [() => Z(d(n))]), a(t, r));
                      },
                    ),
                      l(n),
                      a(t, n));
                  },
                  k = (e) => {
                    a(e, ae());
                  };
                (n(D, (e) => {
                  d(q).rule.actions?.length ? e(O) : e(k, -1);
                }),
                  l(E),
                  e(() => {
                    (i(h, d(q).rule.name), i(_, d(q).rule.description));
                  }),
                  a(t, c));
              },
              $$slots: { default: !0 },
            }),
            a(t, c));
        },
        $$slots: { default: !0 },
      }),
        j(b(g, 2), {
          children: (p, m) => {
            var h = fe(),
              g = v(h);
            (N(g, {
              children: (e, t) => {
                P(e, {
                  children: (e, t) => {
                    (C(), a(e, u(`Compliance Coverage Preview`)));
                  },
                  $$slots: { default: !0 },
                });
              },
              $$slots: { default: !0 },
            }),
              M(b(g, 2), {
                class: `space-y-4`,
                children: (p, m) => {
                  var h = de(),
                    g = v(h),
                    _ = f(g),
                    y = f(_),
                    w = f(y);
                  l(y);
                  var T = b(y, 2),
                    E = f(T);
                  (l(T), l(_));
                  var k = b(_, 2),
                    A = f(k);
                  (l(k), l(g));
                  var j = b(g, 2),
                    M = f(j),
                    N = (t) => {
                      var n = c();
                      (o(
                        v(n),
                        1,
                        () => d(q).compliancePreview,
                        s,
                        (t, n) => {
                          var r = ce(),
                            o = f(r),
                            s = f(o);
                          (I(s, {
                            variant: `outline`,
                            children: (t, r) => {
                              C();
                              var o = u();
                              (e(() => i(o, d(n).framework)), a(t, o));
                            },
                            $$slots: { default: !0 },
                          }),
                            I(b(s, 2), {
                              variant: `secondary`,
                              children: (t, r) => {
                                C();
                                var o = u();
                                (e(() => i(o, d(n).controlId)), a(t, o));
                              },
                              $$slots: { default: !0 },
                            }),
                            l(o));
                          var c = b(o, 2),
                            p = f(c, !0);
                          l(c);
                          var m = b(c, 2),
                            h = f(m);
                          (l(m),
                            l(r),
                            e(() => {
                              (i(p, d(n).controlName),
                                i(
                                  h,
                                  `Evidence: ${d(n).evidenceType ?? ``} • from action: ${d(n).fromAction ?? ``}`,
                                ));
                            }),
                            a(t, r));
                        },
                      ),
                        a(t, n));
                    },
                    P = (e) => {
                      a(e, le());
                    };
                  (n(M, (e) => {
                    d(q).compliancePreview?.length ? e(N) : e(P, -1);
                  }),
                    l(j));
                  var F = b(j, 2),
                    L = f(F),
                    R = b(f(L)),
                    z = (e) => {
                      O(e, { class: `h-4 w-4` });
                    },
                    B = (e) => {
                      D(e, { class: `h-4 w-4` });
                    };
                  (n(R, (e) => {
                    d(J) ? e(z) : e(B, -1);
                  }),
                    l(L));
                  var V = b(L, 2),
                    H = (t) => {
                      var n = ue(),
                        r = f(n, !0);
                      (l(n), e(() => i(r, d(q).reasoning)), a(t, n));
                    };
                  (n(V, (e) => {
                    d(J) && e(H);
                  }),
                    l(F),
                    e(
                      (e, n, r, a) => {
                        (i(w, `Confidence: ${e ?? ``}`), i(E, `${n ?? ``}%`), S(A, 1, r), t(A, a));
                      },
                      [
                        () => ge(d(q).confidence),
                        () => X(d(q).confidence),
                        () => `h-full ${he(d(q).confidence)}`,
                        () => `width: ${X(d(q).confidence)}%`,
                      ],
                    ),
                    r(`click`, L, () => x(J, !d(J))),
                    a(p, h));
                },
                $$slots: { default: !0 },
              }),
              a(p, h));
          },
          $$slots: { default: !0 },
        }),
        l(h));
      var _ = b(h, 2),
        y = f(_);
      (F(y, {
        get disabled() {
          return d(Y);
        },
        $$events: { click: ve },
        children: (t, n) => {
          C();
          var r = u();
          (e(() => i(r, d(Y) ? `Saving...` : `Save as Rule`)), a(t, r));
        },
        $$slots: { default: !0 },
      }),
        F(b(y, 2), {
          variant: `outline`,
          $$events: { click: ye },
          children: (e, t) => {
            (C(), a(e, u(`Refine`)));
          },
          $$slots: { default: !0 },
        }),
        l(_),
        a(p, m));
    };
  (n(be, (e) => {
    d(q) && e(xe);
  }),
    l(Q),
    a(T, Q),
    p());
}
export { U as component };
