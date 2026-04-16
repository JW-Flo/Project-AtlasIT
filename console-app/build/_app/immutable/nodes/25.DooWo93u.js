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
  U as l,
  V as u,
  W as d,
  Z as f,
  at as p,
  bt as m,
  c as h,
  ct as g,
  d as ee,
  l as _,
  mt as v,
  ot as y,
  pt as b,
  q as x,
  r as S,
  st as C,
  ut as w,
  v as te,
  wt as T,
  xt as E,
  z as D,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as ne } from "../chunks/VtRqrqjA.js";
import { t as O } from "../chunks/CMgwAYwY.js";
import { t as k } from "../chunks/DiCJsy1x.js";
import { t as re } from "../chunks/Cdj3j7qG.js";
import { t as ie } from "../chunks/Cj66XTu9.js";
import { t as A } from "../chunks/D_3pYtt4.js";
import { t as j } from "../chunks/CMGwYO6i2.js";
import { n as M, t as N } from "../chunks/BEJa09Kq2.js";
import { t as ae } from "../chunks/Da7GIpgR2.js";
import { t as P } from "../chunks/B2LjsFjQ2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as I } from "../chunks/DmQt9wwK2.js";
import { t as L } from "../chunks/DOfJvt542.js";
import { t as oe } from "../chunks/oRaErrij2.js";
var R = D(`<!> Refresh`, 1),
  se = D(
    `<div class="text-sm text-muted-foreground">Evidence Pipeline (7 days)</div> <div class="text-lg font-semibold mt-1"> </div>`,
    1,
  ),
  ce = D(`<!> <p class="pl-7"> </p>`, 1),
  le = D(`<div class="space-y-3"></div>`),
  ue = D(`<span class="font-medium"> </span>`),
  de = D(`<span class="text-muted-foreground">—</span>`),
  fe = D(` <!>`, 1),
  pe = D(`<span class="text-muted-foreground text-xs">no workflow</span>`),
  me = D(`<span class="text-primary font-medium"> </span>`),
  he = D(`<span class="text-muted-foreground">0</span>`),
  ge = D(
    `<div class="text-sm flex gap-2 items-baseline"><span class="font-medium text-xs w-24 shrink-0"> </span> <span class="text-destructive/70 line-through text-xs"> </span> <!> <span class="text-xs"> </span></div>`,
  ),
  _e = D(`<div class="space-y-1.5"></div>`),
  ve = D(`<p class="text-xs text-muted-foreground"> </p>`),
  ye = D(` <span class="ml-1 opacity-60"> </span>`, 1),
  be = D(`<a class="no-underline"><!></a>`),
  xe = D(
    `<div class="space-y-2"><div class="text-xs text-muted-foreground"> </div> <div class="flex flex-wrap gap-1.5"></div></div>`,
  ),
  Se = D(
    `<p class="text-xs text-muted-foreground">No linked compliance evidence yet. Evidence is generated when lifecycle actions trigger compliance-mapped events.</p>`,
  ),
  Ce = D(
    `<div class="mt-3"><a class="text-xs text-primary hover:underline">View workflow run →</a></div>`,
  ),
  we = D(
    `<tr class="border-t bg-muted/30"><td colspan="9" class="px-6 py-4"><div class="grid gap-4 md:grid-cols-2"><div><h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Changes</h4> <!></div> <div><h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Linked Evidence</h4> <!> <!></div></div></td></tr>`,
  ),
  Te = D(
    `<tr class="border-t hover:bg-muted/50 cursor-pointer transition-colors"><td class="px-4 py-3 text-muted-foreground"><!></td><td class="px-4 py-3"><div class="font-medium"> </div> <div class="text-xs text-muted-foreground"> </div></td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-muted-foreground"><!></td><td class="px-4 py-3"><!></td><td class="px-4 py-3"><!></td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground whitespace-nowrap"> </td></tr> <!>`,
    1,
  ),
  z = D(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium w-6"></th><th class="px-4 py-3 font-medium">User</th><th class="px-4 py-3 font-medium">Event</th><th class="px-4 py-3 font-medium">Source</th><th class="px-4 py-3 font-medium">Policy</th><th class="px-4 py-3 font-medium">Apps +/-</th><th class="px-4 py-3 font-medium">Workflow</th><th class="px-4 py-3 font-medium">Evidence</th><th class="px-4 py-3 font-medium">Timestamp</th></tr></thead><tbody></tbody></table></div>`,
  ),
  Ee = D(`<!> <!>`, 1),
  De = D(`<!> Previous`, 1),
  Oe = D(`Next <!>`, 1),
  B = D(
    `<div class="flex justify-between items-center text-sm"><span class="text-muted-foreground"> </span> <div class="flex gap-2"><!> <!></div></div>`,
  ),
  ke = D(`<!> <!>`, 1),
  Ae = D(
    `<div class="space-y-6"><div class="flex items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">JML Changelog</h1> <p class="text-sm text-muted-foreground">Joiners, movers, and leavers with linked compliance evidence.</p></div> <!></div> <!> <div class="flex gap-2"></div> <!> <!></div>`,
  );
function V(D, V) {
  E(V, !1);
  let H = g(),
    U = g(),
    W = g(!0),
    G = g(null),
    K = g([]),
    q = g(0),
    J = g(0),
    Y = g(``),
    X = [],
    Z = g({ totalEvidence: 0, controlsCovered: 0 }),
    Q = g(new Set());
  function je(e) {
    return e === `joiner` || e === `rehire` ? `success` : e === `mover` ? `warning` : `destructive`;
  }
  function Me(e) {
    return e === `joiner`
      ? `Joiner`
      : e === `mover`
        ? `Mover`
        : e === `rehire`
          ? `Rehire`
          : `Leaver`;
  }
  function Ne(e) {
    return e === `positive` ? `success` : e === `detrimental` ? `destructive` : `secondary`;
  }
  function Pe(e) {
    let t = e.appsProvisioned ?? 0,
      n = e.appsDeprovisioned ?? 0;
    if (t === 0 && n === 0) return `—`;
    let r = [];
    return (t > 0 && r.push(`+${t}`), n > 0 && r.push(`-${n}`), r.join(` / `));
  }
  function Fe(e) {
    return e.displayName && e.displayName !== `-`
      ? e.displayName
      : e.email
        ? e.email
            .split(`@`)[0]
            .split(/[._-]/)
            .map((e) => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase())
            .join(` `)
        : e.userId?.substring(0, 8) || `Unknown`;
  }
  function Ie(e) {
    switch (e) {
      case `completed`:
        return `success`;
      case `failed`:
        return `destructive`;
      case `running`:
        return `warning`;
      default:
        return `secondary`;
    }
  }
  function Le(e) {
    return !e || typeof e != `object`
      ? []
      : Object.entries(e)
          .filter(([e, t]) => t && typeof t == `object` && (`old` in t || `new` in t))
          .map(([e, t]) => ({
            field: e.replace(/_/g, ` `).replace(/\b\w/g, (e) => e.toUpperCase()),
            old: String(t.old ?? `—`),
            new: String(t.new ?? `—`),
          }));
  }
  function Re(e) {
    return e === `joiner` || e === `rehire`
      ? [`onboarding`, `access_grant`]
      : e === `mover`
        ? [`access_grant`, `access_revoke`]
        : [`offboarding`, `access_revoke`];
  }
  function ze(e) {
    let t = new Set(Re(e.jmlAction)),
      n = new Date(e.createdAt).getTime(),
      r = X.filter((r) => {
        if (!t.has(r.category) || (r.subject || ``).toLowerCase() !== (e.email || ``).toLowerCase())
          return !1;
        let i = new Date(r.createdAt).getTime();
        return Number.isNaN(n) || Number.isNaN(i) ? !0 : Math.abs(i - n) <= 7200 * 1e3;
      }),
      i = new Map();
    for (let e of r) {
      let t = `${e.framework}:${e.controlId}`;
      i.has(t) || i.set(t, { framework: e.framework, controlId: e.controlId, impact: e.impact });
    }
    return { count: r.length, controls: Array.from(i.values()) };
  }
  function Be(e) {
    (d(Q).has(e) ? d(Q).delete(e) : d(Q).add(e), w(Q, new Set(d(Q))));
  }
  async function Ve() {
    let e = new Date(Date.now() - 10080 * 60 * 1e3).toISOString(),
      t = new URLSearchParams({ since: e, limit: `300`, offset: `0` });
    if (d(Y)) {
      let e =
        d(Y) === `joiner` || d(Y) === `rehire`
          ? `onboarding`
          : d(Y) === `leaver`
            ? `offboarding`
            : `access_grant`;
      t.set(`category`, e);
    }
    let n = await fetch(`/api/evidence-feed?${t}`);
    if (!n.ok) throw Error(`Failed to load evidence feed (${n.status})`);
    let r = await n.json();
    ((X = Array.isArray(r.feed) ? r.feed : []),
      w(Z, {
        totalEvidence: Number(r?.summary?.totalEvidence ?? X.length),
        controlsCovered: Number(r?.summary?.controlsCovered ?? 0),
      }));
  }
  async function $() {
    (w(W, !0), w(G, null));
    try {
      let e = new URLSearchParams({ limit: `50`, offset: String(d(J)) });
      d(Y) && e.set(`action`, d(Y));
      let t = await fetch(`/api/jml/changelog?${e}`);
      if (!t.ok) throw Error(`Failed to load JML changelog (${t.status})`);
      let n = await t.json();
      (w(K, Array.isArray(n.entries) ? n.entries : []), w(q, n.total ?? d(K).length));
      try {
        await Ve();
      } catch {
        ((X = []), w(Z, { totalEvidence: 0, controlsCovered: 0 }));
      }
    } catch (e) {
      (w(G, e?.message || `Failed to load JML changelog`), w(K, []), w(q, 0));
    } finally {
      w(W, !1);
    }
  }
  function He(e) {
    (w(Y, e), w(J, 0), $());
  }
  function Ue() {
    d(J) <= 0 || (w(J, Math.max(0, d(J) - 50)), $());
  }
  function We() {
    d(J) + 50 >= d(q) || (w(J, d(J) + 50), $());
  }
  (S($),
    f(
      () => (d(q), d(J)),
      () => {
        w(H, d(q) === 0 ? 0 : d(J) + 1);
      },
    ),
    f(
      () => (d(J), d(q)),
      () => {
        w(U, Math.min(d(J) + 50, d(q)));
      },
    ),
    s(),
    _());
  var Ge = Ae(),
    Ke = p(Ge);
  (F(C(p(Ke), 2), {
    variant: `secondary`,
    size: `sm`,
    $$events: {
      click: () => {
        (w(J, 0), $());
      },
    },
    children: (e, t) => {
      var n = R();
      (A(y(n), { class: `h-3.5 w-3.5 mr-1.5` }), T(), i(e, n));
    },
    $$slots: { default: !0 },
  }),
    c(Ke));
  var qe = C(Ke, 2);
  M(qe, {
    class: `border-primary/20 bg-primary/5`,
    children: (t, n) => {
      N(t, {
        class: `pt-5`,
        children: (t, n) => {
          var a = se(),
            o = C(y(a), 2),
            s = p(o);
          (c(o),
            e(() =>
              r(
                s,
                `${d(q) ?? ``} lifecycle events generated ${(d(Z), x(() => d(Z).totalEvidence)) ?? ``} evidence items across ${(d(Z), x(() => d(Z).controlsCovered)) ?? ``} controls this week`,
              ),
            ),
            i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  });
  var Je = C(qe, 2);
  (a(
    Je,
    4,
    () => [
      { value: ``, label: `All` },
      { value: `joiner`, label: `Joiner` },
      { value: `mover`, label: `Mover` },
      { value: `leaver`, label: `Leaver` },
    ],
    o,
    (t, n) => {
      {
        let a = b(() => (d(Y), x(() => (d(Y) === n.value ? `default` : `outline`))));
        F(t, {
          get variant() {
            return d(a);
          },
          size: `sm`,
          $$events: { click: () => He(n.value) },
          children: (t, a) => {
            T();
            var o = u();
            (e(() =>
              r(
                o,
                x(() => n.label),
              ),
            ),
              i(t, o));
          },
          $$slots: { default: !0 },
        });
      }
    },
  ),
    c(Je));
  var Ye = C(Je, 2),
    Xe = (t) => {
      L(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = ce(),
            o = y(a);
          j(o, { class: `h-4 w-4` });
          var s = C(o, 2),
            l = p(s, !0);
          (c(s), e(() => r(l, d(G))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t(Ye, (e) => {
    d(G) && e(Xe);
  });
  var Ze = C(Ye, 2),
    Qe = (e) => {
      var t = le();
      (a(
        t,
        4,
        () => [1, 2, 3, 4, 5],
        o,
        (e, t) => {
          oe(e, { class: `h-14 rounded-lg` });
        },
      ),
        c(t),
        i(e, t));
    },
    $e = (t) => {
      M(t, {
        class: `border-dashed`,
        children: (t, n) => {
          N(t, {
            class: `py-10 text-center text-sm text-muted-foreground`,
            children: (t, n) => {
              T();
              var a = u();
              (e(() => r(a, `No JML events found${d(Y) ? ` for action "${d(Y)}"` : ``}.`)),
                i(t, a));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    et = (s) => {
      var f = ke(),
        m = y(f);
      M(m, {
        children: (s, f) => {
          var m = Ee(),
            g = y(m);
          (ae(g, {
            children: (e, t) => {
              P(e, {
                children: (e, t) => {
                  (T(), i(e, u(`Events`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            N(C(g, 2), {
              class: `p-0`,
              children: (s, f) => {
                var m = z(),
                  g = p(m),
                  _ = C(p(g));
                (a(
                  _,
                  5,
                  () => d(K),
                  o,
                  (s, f) => {
                    let m = b(() => (d(f), x(() => ze(d(f))))),
                      g = b(() => (d(f), x(() => Le(d(f).delta))));
                    var _ = Te(),
                      S = y(_),
                      w = p(S),
                      E = p(w),
                      D = (e) => {
                        ie(e, { class: `h-4 w-4` });
                      },
                      k = v(() => (d(Q), d(f), x(() => d(Q).has(d(f).id)))),
                      re = (e) => {
                        O(e, { class: `h-4 w-4` });
                      };
                    (t(E, (e) => {
                      d(k) ? e(D) : e(re, -1);
                    }),
                      c(w));
                    var A = C(w),
                      j = p(A),
                      M = p(j, !0);
                    c(j);
                    var N = C(j, 2),
                      ae = p(N, !0);
                    (c(N), c(A));
                    var P = C(A),
                      F = p(P);
                    {
                      let t = b(() => (d(f), x(() => je(d(f).jmlAction))));
                      I(F, {
                        get variant() {
                          return d(t);
                        },
                        children: (t, n) => {
                          T();
                          var a = u();
                          (e((e) => r(a, e), [() => (d(f), x(() => Me(d(f).jmlAction)))]), i(t, a));
                        },
                        $$slots: { default: !0 },
                      });
                    }
                    c(P);
                    var L = C(P),
                      oe = p(L, !0);
                    c(L);
                    var R = C(L),
                      se = p(R),
                      ce = (t) => {
                        I(t, {
                          variant: `outline`,
                          class: `text-xs`,
                          children: (t, n) => {
                            T();
                            var a = u();
                            (e(() => r(a, (d(f), x(() => d(f).policyApplied)))), i(t, a));
                          },
                          $$slots: { default: !0 },
                        });
                      },
                      le = (e) => {
                        i(e, u(`—`));
                      };
                    (t(se, (e) => {
                      (d(f), x(() => d(f).policyApplied) ? e(ce) : e(le, -1));
                    }),
                      c(R));
                    var z = C(R),
                      Ee = p(z),
                      De = (t) => {
                        var n = ue(),
                          a = p(n, !0);
                        (c(n), e((e) => r(a, e), [() => (d(f), x(() => Pe(d(f))))]), i(t, n));
                      },
                      Oe = (e) => {
                        i(e, de());
                      };
                    (t(Ee, (e) => {
                      (d(f),
                        x(() => d(f).appsProvisioned > 0 || d(f).appsDeprovisioned > 0)
                          ? e(De)
                          : e(Oe, -1));
                    }),
                      c(z));
                    var B = C(z),
                      ke = p(B),
                      Ae = (n) => {
                        {
                          let a = b(() => (d(f), x(() => Ie(d(f).workflowStatus))));
                          I(n, {
                            get variant() {
                              return d(a);
                            },
                            class: `text-xs capitalize`,
                            children: (n, a) => {
                              T();
                              var o = fe(),
                                s = y(o),
                                c = C(s),
                                l = (t) => {
                                  var n = u();
                                  (e(() =>
                                    r(
                                      n,
                                      `(${(d(f), x(() => d(f).workflowStepsDone)) ?? ``}/${(d(f), x(() => d(f).workflowStepsTotal)) ?? ``})`,
                                    ),
                                  ),
                                    i(t, n));
                                };
                              (t(c, (e) => {
                                (d(f), x(() => d(f).workflowStepsTotal > 0) && e(l));
                              }),
                                e(() => r(s, `${(d(f), x(() => d(f).workflowStatus)) ?? ``} `)),
                                i(n, o));
                            },
                            $$slots: { default: !0 },
                          });
                        }
                      },
                      H = (e) => {
                        i(e, pe());
                      };
                    (t(ke, (e) => {
                      (d(f), x(() => d(f).workflowStatus) ? e(Ae) : e(H, -1));
                    }),
                      c(B));
                    var U = C(B),
                      W = p(U),
                      G = (t) => {
                        var n = me(),
                          a = p(n, !0);
                        (c(n), e(() => r(a, (l(d(m)), x(() => d(m).count)))), i(t, n));
                      },
                      K = (e) => {
                        i(e, he());
                      };
                    (t(W, (e) => {
                      (l(d(m)), x(() => d(m).count > 0) ? e(G) : e(K, -1));
                    }),
                      c(U));
                    var q = C(U),
                      J = p(q, !0);
                    (c(q), c(S));
                    var Y = C(S, 2),
                      X = (s) => {
                        var u = we(),
                          _ = p(u),
                          v = p(_),
                          S = p(v),
                          w = C(p(S), 2),
                          E = (t) => {
                            var n = _e();
                            (a(
                              n,
                              5,
                              () => d(g),
                              o,
                              (t, n) => {
                                var a = ge(),
                                  o = p(a),
                                  s = p(o, !0);
                                c(o);
                                var l = C(o, 2),
                                  u = p(l, !0);
                                c(l);
                                var f = C(l, 2);
                                ne(f, { class: `h-3 w-3 text-muted-foreground shrink-0` });
                                var m = C(f, 2),
                                  h = p(m, !0);
                                (c(m),
                                  c(a),
                                  e(() => {
                                    (r(s, (d(n), x(() => d(n).field))),
                                      r(u, (d(n), x(() => d(n).old))),
                                      r(h, (d(n), x(() => d(n).new))));
                                  }),
                                  i(t, a));
                              },
                            ),
                              c(n),
                              i(t, n));
                          },
                          D = (t) => {
                            var n = ve(),
                              a = p(n, !0);
                            (c(n),
                              e(() =>
                                r(
                                  a,
                                  (d(f),
                                  x(() =>
                                    d(f).changeType === `created`
                                      ? `New user created`
                                      : d(f).changeType === `deactivated`
                                        ? `User deactivated`
                                        : d(f).changeType === `deleted`
                                          ? `User deleted`
                                          : d(f).changeType === `reactivated`
                                            ? `User reactivated`
                                            : `No field-level changes recorded`,
                                  )),
                                ),
                              ),
                              i(t, n));
                          };
                        (t(w, (e) => {
                          (l(d(g)), x(() => d(g).length > 0) ? e(E) : e(D, -1));
                        }),
                          c(S));
                        var O = C(S, 2),
                          k = C(p(O), 2),
                          re = (t) => {
                            var s = xe(),
                              u = p(s),
                              f = p(u);
                            c(u);
                            var g = C(u, 2);
                            (a(
                              g,
                              5,
                              () => (l(d(m)), x(() => d(m).controls)),
                              o,
                              (t, a) => {
                                var o = be(),
                                  s = p(o);
                                {
                                  let t = b(() => (d(a), x(() => Ne(d(a).impact))));
                                  I(s, {
                                    get variant() {
                                      return d(t);
                                    },
                                    class: `cursor-pointer hover:opacity-80 text-xs`,
                                    children: (t, n) => {
                                      T();
                                      var o = ye(),
                                        s = y(o),
                                        l = C(s),
                                        u = p(l, !0);
                                      (c(l),
                                        e(() => {
                                          (r(
                                            s,
                                            `${(d(a), x(() => d(a).framework)) ?? ``} ${(d(a), x(() => d(a).controlId)) ?? ``} `,
                                          ),
                                            r(
                                              u,
                                              (d(a),
                                              x(() =>
                                                d(a).impact === `positive`
                                                  ? `+`
                                                  : d(a).impact === `detrimental`
                                                    ? `-`
                                                    : `~`,
                                              )),
                                            ));
                                        }),
                                        i(t, o));
                                    },
                                    $$slots: { default: !0 },
                                  });
                                }
                                (c(o),
                                  e(() =>
                                    te(
                                      o,
                                      `href`,
                                      `/console/compliance?tab=controls&framework=${(d(a), x(() => d(a).framework)) ?? ``}`,
                                    ),
                                  ),
                                  n(
                                    `click`,
                                    o,
                                    ee(function (e) {
                                      h.call(this, V, e);
                                    }),
                                  ),
                                  i(t, o));
                              },
                            ),
                              c(g),
                              c(s),
                              e(() =>
                                r(
                                  f,
                                  `${(l(d(m)), x(() => d(m).count)) ?? ``} evidence item${(l(d(m)), x(() => (d(m).count === 1 ? `` : `s`))) ?? ``} across ${(l(d(m)), x(() => d(m).controls.length)) ?? ``} control${(l(d(m)), x(() => (d(m).controls.length === 1 ? `` : `s`))) ?? ``}`,
                                ),
                              ),
                              i(t, s));
                          },
                          ie = (e) => {
                            i(e, Se());
                          };
                        t(k, (e) => {
                          (l(d(m)), x(() => d(m).controls.length > 0) ? e(re) : e(ie, -1));
                        });
                        var A = C(k, 2),
                          j = (t) => {
                            var r = Ce(),
                              a = p(r);
                            (c(r),
                              e(() =>
                                te(
                                  a,
                                  `href`,
                                  `/console/workflows?run=${(d(f), x(() => d(f).workflowRunId)) ?? ``}`,
                                ),
                              ),
                              n(
                                `click`,
                                a,
                                ee(function (e) {
                                  h.call(this, V, e);
                                }),
                              ),
                              i(t, r));
                          };
                        (t(A, (e) => {
                          (d(f), x(() => d(f).workflowRunId) && e(j));
                        }),
                          c(O),
                          c(v),
                          c(_),
                          c(u),
                          i(s, u));
                      },
                      Z = v(() => (d(Q), d(f), x(() => d(Q).has(d(f).id))));
                    (t(Y, (e) => {
                      d(Z) && e(X);
                    }),
                      e(
                        (e, t) => {
                          (r(M, e),
                            r(ae, (d(f), x(() => d(f).email || `—`))),
                            r(oe, (d(f), x(() => d(f).source || `—`))),
                            r(J, t));
                        },
                        [
                          () => (d(f), x(() => Fe(d(f)))),
                          () => (
                            d(f),
                            x(() =>
                              d(f).createdAt ? new Date(d(f).createdAt).toLocaleString() : `—`,
                            )
                          ),
                        ],
                      ),
                      n(`click`, S, () => Be(d(f).id)),
                      i(s, _));
                  },
                ),
                  c(_),
                  c(g),
                  c(m),
                  i(s, m));
              },
              $$slots: { default: !0 },
            }),
            i(s, m));
        },
        $$slots: { default: !0 },
      });
      var g = C(m, 2),
        _ = (t) => {
          var n = B(),
            a = p(n),
            o = p(a);
          c(a);
          var s = C(a, 2),
            l = p(s);
          {
            let e = b(() => d(J) <= 0);
            F(l, {
              variant: `outline`,
              size: `sm`,
              get disabled() {
                return d(e);
              },
              $$events: { click: Ue },
              children: (e, t) => {
                var n = De();
                (k(y(n), { class: `h-4 w-4 mr-1` }), T(), i(e, n));
              },
              $$slots: { default: !0 },
            });
          }
          var u = C(l, 2);
          {
            let e = b(() => d(J) + 50 >= d(q));
            F(u, {
              variant: `outline`,
              size: `sm`,
              get disabled() {
                return d(e);
              },
              $$events: { click: We },
              children: (e, t) => {
                T();
                var n = Oe();
                (re(C(y(n)), { class: `h-4 w-4 ml-1` }), i(e, n));
              },
              $$slots: { default: !0 },
            });
          }
          (c(s),
            c(n),
            e(() => r(o, `Showing ${d(H) ?? ``}–${d(U) ?? ``} of ${d(q) ?? ``}`)),
            i(t, n));
        };
      (t(g, (e) => {
        d(q) > 50 && e(_);
      }),
        i(s, f));
    };
  (t(Ze, (e) => {
    d(W) ? e(Qe) : (d(K), x(() => d(K).length === 0) ? e($e, 1) : e(et, -1));
  }),
    c(Ge),
    i(D, Ge),
    m());
}
export { V as component };
