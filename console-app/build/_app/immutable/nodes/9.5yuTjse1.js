import {
  $ as e,
  B as t,
  C as n,
  F as r,
  H as i,
  I as a,
  L as o,
  N as s,
  P as c,
  Q as l,
  R as u,
  Tt as d,
  U as f,
  V as p,
  W as m,
  Z as h,
  a as g,
  at as _,
  bt as v,
  ct as y,
  j as b,
  l as x,
  ot as S,
  pt as C,
  q as w,
  r as T,
  s as E,
  st as D,
  ut as O,
  v as k,
  w as A,
  wt as j,
  xt as ee,
  z as M,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as N } from "../chunks/D4lFFHu4.js";
import { t as P } from "../chunks/_6xtu--D.js";
import { t as te } from "../chunks/Bbgqa3ML.js";
import { t as ne } from "../chunks/DxdpJY9x.js";
import { t as re } from "../chunks/C_dKnYGb2.js";
import { t as ie } from "../chunks/CMGwYO6i2.js";
import { n as F, t as I } from "../chunks/BEJa09Kq2.js";
import { t as L } from "../chunks/Da7GIpgR2.js";
import { t as R } from "../chunks/B2LjsFjQ2.js";
import { t as ae } from "../chunks/Cue2Cs472.js";
import { t as z } from "../chunks/DmQt9wwK2.js";
import { t as B } from "../chunks/oRaErrij2.js";
function oe(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M8 2v4` }],
      [`path`, { d: `M16 2v4` }],
      [`rect`, { width: `18`, height: `18`, x: `3`, y: `4`, rx: `2` }],
      [`path`, { d: `M3 10h18` }],
    ];
  P(
    e,
    E({ name: `calendar` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = u();
        (b(S(r), t, `default`, {}, null), o(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function se(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M3 3v16a2 2 0 0 0 2 2h16` }],
      [`path`, { d: `M18 17V9` }],
      [`path`, { d: `M13 17V5` }],
      [`path`, { d: `M8 17v-3` }],
    ];
  P(
    e,
    E({ name: `chart-column` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = u();
        (b(S(r), t, `default`, {}, null), o(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function ce(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`circle`, { cx: `12`, cy: `12`, r: `10` }],
      [`circle`, { cx: `12`, cy: `12`, r: `6` }],
      [`circle`, { cx: `12`, cy: `12`, r: `2` }],
    ];
  P(
    e,
    E({ name: `target` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = u();
        (b(S(r), t, `default`, {}, null), o(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function V(e, t) {
  let n = g(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M16 7h6v6` }],
      [`path`, { d: `m22 7-8.5 8.5-5-5L2 17` }],
    ];
  P(
    e,
    E({ name: `trending-up` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = u();
        (b(S(r), t, `default`, {}, null), o(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var le = M(`<button> </button>`),
  ue = M(`<!> `, 1),
  de = M(`<!> <!> <!>`, 1),
  fe = M(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"></div>`),
  pe = M(
    `<div class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"> </div>`,
  ),
  me = M(`<!> <span class="text-green-600"> </span>`, 1),
  he = M(`<!> <span class="text-red-600"> </span>`, 1),
  ge = M(`<span class="text-muted-foreground">No change this week</span>`),
  _e = M(
    `<div class="flex items-start justify-between"><div><p class="text-sm font-medium text-muted-foreground">Overall Compliance</p> <p class="mt-1 text-3xl font-bold text-foreground"> </p> <div class="mt-1 flex items-center gap-1 text-xs"><!></div></div> <div class="rounded-full bg-primary/10 p-2"><!></div></div>`,
  ),
  ve = M(
    `<div class="flex items-start justify-between"><div><p class="text-sm font-medium text-muted-foreground">Evidence Collected</p> <p class="mt-1 text-3xl font-bold text-foreground"> </p> <p class="mt-1 text-xs text-muted-foreground">items across all frameworks</p></div> <div class="rounded-full bg-blue-500/10 p-2"><!></div></div>`,
  ),
  ye = M(
    `<div class="flex items-start justify-between"><div><p class="text-sm font-medium text-muted-foreground">Automation Runs</p> <p class="mt-1 text-3xl font-bold text-foreground"> </p> <p class="mt-1 text-xs text-muted-foreground"> </p></div> <div class="rounded-full bg-violet-500/10 p-2"><!></div></div>`,
  ),
  be = M(
    `<div class="flex items-start justify-between"><div><p class="text-sm font-medium text-muted-foreground">Open Risks</p> <p class="mt-1 text-3xl font-bold text-foreground"> </p> <p class="mt-1 text-xs text-muted-foreground"> </p></div> <div class="rounded-full bg-orange-500/10 p-2"><!></div></div>`,
  ),
  xe = M(`<!> Compliance Trend`, 1),
  Se = t(
    `<line stroke="hsl(var(--border))" stroke-width="0.5" stroke-dasharray="4,4"></line><text font-size="9" fill="hsl(var(--muted-foreground))"> </text>`,
    1,
  ),
  Ce = t(`<circle r="3" fill="hsl(var(--primary))"></circle>`),
  we = M(`<span> </span> <span> </span> <span> </span>`, 1),
  Te = M(
    `<div class="overflow-hidden rounded-md"><svg class="w-full" aria-label="Compliance score trend over time"><defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(var(--primary))" stop-opacity="0.3"></stop><stop offset="100%" stop-color="hsl(var(--primary))" stop-opacity="0.02"></stop></linearGradient></defs><!><path fill="url(#trendGrad)"></path><polyline fill="none" stroke="hsl(var(--primary))" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline><!></svg></div> <div class="mt-1 flex justify-between text-xs text-muted-foreground"><!></div>`,
    1,
  ),
  Ee = M(`<p class="text-sm text-muted-foreground">No trend data available yet.</p>`),
  De = M(`<!> <!>`, 1),
  Oe = M(`<!> Framework Scores`, 1),
  ke = M(
    `<div class="space-y-1"><div class="flex items-center justify-between text-sm"><span class="font-medium text-foreground"> </span> <div class="flex items-center gap-2"><!> <span class="text-muted-foreground w-12 text-right"> </span></div></div> <div class="h-2 w-full rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full bg-primary transition-all duration-500"></div></div> <div class="flex gap-3 text-xs text-muted-foreground"><span> </span> <span> </span> <span> </span></div></div>`,
  ),
  Ae = M(`<div class="space-y-4"></div>`),
  je = M(
    `<p class="text-sm text-muted-foreground">No framework data available. Configure compliance frameworks to see scores.</p>`,
  ),
  Me = M(`<!> <!>`, 1),
  Ne = M(`<!> Evidence Volume (Weekly)`, 1),
  Pe = t(`<rect rx="2" fill="hsl(var(--primary))" opacity="0.75"></rect>`),
  Fe = M(`<span> </span> <span> </span> <span> </span>`, 1),
  Ie = M(
    `<div class="overflow-hidden rounded-md"><svg class="w-full" aria-label="Evidence collected per week"></svg></div> <div class="mt-1 flex justify-between text-xs text-muted-foreground"><!></div> <p class="mt-2 text-xs text-muted-foreground"> </p>`,
    1,
  ),
  Le = M(`<p class="text-sm text-muted-foreground">No evidence volume data available yet.</p>`),
  Re = M(`<!> <!>`, 1),
  ze = M(`<!> Automation Performance`, 1),
  Be = M(
    `<div class="space-y-1"><div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">Access Review Completion</span> <span class="font-medium text-foreground"> </span></div> <div class="h-2 w-full rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full bg-green-500 transition-all duration-500"></div></div> <p class="text-xs text-muted-foreground"> </p></div>`,
  ),
  Ve = M(
    `<div class="space-y-4"><div class="grid grid-cols-2 gap-4"><div class="rounded-lg bg-muted/50 p-3"><p class="text-xs text-muted-foreground">Active Rules</p> <p class="text-2xl font-bold text-foreground"> </p> <p class="text-xs text-muted-foreground"> </p></div> <div class="rounded-lg bg-muted/50 p-3"><p class="text-xs text-muted-foreground">Success Rate</p> <p class="text-2xl font-bold text-foreground"> </p> <p class="text-xs text-muted-foreground"> </p></div> <div class="rounded-lg bg-muted/50 p-3"><p class="text-xs text-muted-foreground">Executions</p> <p class="text-2xl font-bold text-foreground"> </p> <p class="text-xs text-muted-foreground">total runs</p></div> <div class="rounded-lg bg-muted/50 p-3"><p class="text-xs text-muted-foreground">Time Saved</p> <p class="text-2xl font-bold text-foreground"> </p> <p class="text-xs text-muted-foreground">estimated</p></div></div> <!></div>`,
  ),
  He = M(`<!> <!>`, 1),
  Ue = M(`<!> Top Risks — Controls with Lowest Scores`, 1),
  We = M(
    `<tr class="hover:bg-muted/30 transition-colors"><td class="py-3 pr-4 font-mono text-xs text-foreground"> </td><td class="py-3 pr-4 text-foreground max-w-[240px] truncate"> </td><td class="py-3 pr-4"><!></td><td class="py-3 pr-4 text-right"><span> </span></td><td class="py-3"><!></td></tr>`,
  ),
  Ge = M(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-border text-left"><th class="pb-2 pr-4 font-medium text-muted-foreground">Control Ref</th><th class="pb-2 pr-4 font-medium text-muted-foreground">Title</th><th class="pb-2 pr-4 font-medium text-muted-foreground">Framework</th><th class="pb-2 pr-4 font-medium text-muted-foreground text-right">Score</th><th class="pb-2 font-medium text-muted-foreground">Status</th></tr></thead><tbody class="divide-y divide-border"></tbody></table></div>`,
  ),
  Ke = M(
    `<p class="text-sm text-muted-foreground">No risk data available. Configure compliance controls to see top risks.</p>`,
  ),
  qe = M(`<!> <!>`, 1),
  Je = M(
    `<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><!> <!> <!> <!></div> <div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><!> <!></div> <div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><!> <!></div> <!>`,
    1,
  ),
  Ye = M(
    `<div class="flex flex-col gap-6 p-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 class="text-2xl font-bold text-foreground">Analytics & Reporting</h1> <p class="text-sm text-muted-foreground mt-1">Compliance posture, automation performance, and security trends</p></div> <div class="flex items-center gap-2"><div class="flex items-center gap-1 rounded-md border border-border bg-background p-1"><!> <!></div> <!></div></div> <!></div>`,
  );
function H(t, g) {
  ee(g, !1);
  let b = y(),
    E = y(),
    M = y(),
    P = y(),
    H = y(),
    U = y(),
    W = y(),
    G = y(),
    K = y(),
    q = y(!0),
    J = y(null),
    Y = y(null),
    X = y(`30`);
  function Xe(e, t, n, r = 8) {
    if (e.length === 0) return ``;
    let i = e.map((e) => e.score),
      a = Math.min(...i),
      o = Math.max(...i) - a || 1,
      s = t - r * 2,
      c = n - r * 2;
    return e
      .map((t, n) => {
        let i = r + (e.length === 1 ? s / 2 : (n / (e.length - 1)) * s),
          l = r + c - ((t.score - a) / o) * c;
        return `${i.toFixed(1)},${l.toFixed(1)}`;
      })
      .join(` `);
  }
  function Ze(e, t, n, r = 8) {
    if (e.length === 0) return ``;
    let i = Xe(e, t, n, r),
      a = i.split(` `),
      o = a[0].split(`,`)[0],
      s = a[a.length - 1].split(`,`)[0],
      c = n - r;
    return `M ${o},${c} L ${i.replace(/(\S+),(\S+)/g, `$1,$2`)} L ${s},${c} Z`;
  }
  function Qe(e, t, n, r = 8) {
    if (e.length === 0) return [];
    let i = Math.max(...e.map((e) => e.count), 1),
      a = t - r * 2,
      o = n - r * 2,
      s = Math.max(2, a / e.length - 2);
    return e.map((t, n) => {
      let c = (t.count / i) * o;
      return {
        x: r + (n / e.length) * a + 1,
        y: r + o - c,
        w: s,
        h: Math.max(1, c),
        count: t.count,
        week: t.week,
      };
    });
  }
  function $e(e) {
    return e === `verified` || e === `implemented`
      ? `success`
      : e === `in_progress`
        ? `warning`
        : e === `not_started`
          ? `destructive`
          : `secondary`;
  }
  function et(e) {
    return (
      {
        not_started: `Not Started`,
        in_progress: `In Progress`,
        implemented: `Implemented`,
        verified: `Verified`,
      }[e] ?? e
    );
  }
  function tt(e) {
    return e === `A`
      ? `success`
      : e === `B`
        ? `default`
        : e === `C` || e === `D`
          ? `warning`
          : `destructive`;
  }
  function Z(e) {
    return e.length === 10
      ? new Date(e).toLocaleDateString(`en-US`, { month: `short`, day: `numeric` })
      : e.slice(5);
  }
  async function nt() {
    (O(q, !0), O(J, null));
    try {
      let e = await fetch(`/api/analytics/dashboard`);
      if (!e.ok) {
        O(J, (await e.json().catch(() => ({}))).error ?? `Request failed (${e.status})`);
        return;
      }
      O(Y, await e.json());
    } catch {
      O(J, `Failed to load analytics data`);
    } finally {
      O(q, !1);
    }
  }
  let Q = y(!1);
  async function rt() {
    O(Q, !0);
    try {
      let e = await fetch(`/api/analytics/report?format=csv`);
      if (!e.ok) {
        N({
          message: (await e.json().catch(() => ({}))).error || `Report generation failed`,
          variant: `error`,
        });
        return;
      }
      let t = await e.blob(),
        n = URL.createObjectURL(t),
        r = document.createElement(`a`);
      ((r.href = n),
        (r.download =
          (e.headers.get(`Content-Disposition`) || ``).match(/filename="([^"]+)"/)?.[1] ||
          `atlasit-report-${new Date().toISOString().slice(0, 10)}.csv`),
        document.body.appendChild(r),
        r.click(),
        r.remove(),
        URL.revokeObjectURL(n),
        N({ message: `Report downloaded`, variant: `success` }));
    } catch {
      N({ message: `Report generation failed`, variant: `error` });
    } finally {
      O(Q, !1);
    }
  }
  (T(() => {
    nt();
  }),
    h(
      () => m(Y),
      () => {
        O(b, m(Y)?.overallScore ?? 0);
      },
    ),
    h(
      () => m(Y),
      () => {
        O(E, m(Y)?.trendDelta ?? 0);
      },
    ),
    h(
      () => m(Y),
      () => {
        O(M, m(Y)?.complianceTrend ?? []);
      },
    ),
    h(
      () => m(Y),
      () => {
        O(P, m(Y)?.frameworkBreakdown ?? []);
      },
    ),
    h(
      () => m(Y),
      () => {
        O(H, m(Y)?.evidenceVolume ?? []);
      },
    ),
    h(
      () => m(Y),
      () => {
        O(U, m(Y)?.totalEvidence ?? 0);
      },
    ),
    h(
      () => m(Y),
      () => {
        O(
          W,
          m(Y)?.automationMetrics ?? {
            totalRules: 0,
            activeRules: 0,
            rulesExecuted: 0,
            successRate: 0,
            failureCount: 0,
            timeSavedHours: 0,
          },
        );
      },
    ),
    h(
      () => m(Y),
      () => {
        O(
          G,
          m(Y)?.securityPosture ?? {
            openIncidents: 0,
            resolvedIncidents: 0,
            criticalIncidents: 0,
            accessReviewsTotal: 0,
            accessReviewsCompleted: 0,
            accessReviewCompletionRate: 0,
          },
        );
      },
    ),
    h(
      () => m(Y),
      () => {
        O(K, m(Y)?.topRisks ?? []);
      },
    ),
    l(),
    x());
  var it = Ye(),
    $ = _(it),
    at = D(_($), 2),
    ot = _(at),
    st = _(ot);
  (oe(st, { class: `ml-1 h-4 w-4 text-muted-foreground` }),
    s(
      D(st, 2),
      0,
      () => [
        { value: `7`, label: `7 days` },
        { value: `30`, label: `30 days` },
        { value: `90`, label: `90 days` },
        { value: `365`, label: `12 months` },
      ],
      c,
      (t, n) => {
        var r = le(),
          s = _(r, !0);
        (d(r),
          e(() => {
            (A(
              r,
              1,
              `rounded px-3 py-1 text-xs font-medium transition-colors
              ${(m(X), w(() => (m(X) === n.value ? `bg-primary text-primary-foreground` : `text-muted-foreground hover:text-foreground hover:bg-muted`))) ?? ``}`,
            ),
              a(
                s,
                w(() => n.label),
              ));
          }),
          i(`click`, r, () => O(X, n.value)),
          o(t, r));
      },
    ),
    d(ot),
    ae(D(ot, 2), {
      variant: `outline`,
      size: `sm`,
      get disabled() {
        return m(Q);
      },
      $$events: { click: rt },
      children: (t, n) => {
        var r = ue(),
          i = S(r);
        ne(i, { class: `mr-2 h-4 w-4` });
        var s = D(i);
        (e(() => a(s, ` ${m(Q) ? `Generating...` : `Download Report`}`)), o(t, r));
      },
      $$slots: { default: !0 },
    }),
    d(at),
    d($));
  var ct = D($, 2),
    lt = (e) => {
      var t = fe();
      (s(
        t,
        4,
        () => [0, 1, 2, 3],
        c,
        (e, t) => {
          F(e, {
            children: (e, t) => {
              I(e, {
                class: `p-6`,
                children: (e, t) => {
                  var n = de(),
                    r = S(n);
                  B(r, { class: `h-4 w-32 mb-2` });
                  var i = D(r, 2);
                  (B(i, { class: `h-8 w-20 mb-1` }), B(D(i, 2), { class: `h-3 w-24` }), o(e, n));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        },
      ),
        d(t),
        o(e, t));
    },
    ut = (t) => {
      var n = pe(),
        r = _(n, !0);
      (d(n), e(() => a(r, m(J))), o(t, n));
    },
    dt = (t) => {
      var i = Je(),
        l = S(i),
        h = _(l);
      F(h, {
        children: (t, n) => {
          I(t, {
            class: `p-6`,
            children: (t, n) => {
              var i = _e(),
                s = _(i),
                c = D(_(s), 2),
                l = _(c);
              d(c);
              var u = D(c, 2),
                f = _(u),
                p = (t) => {
                  var n = me(),
                    r = S(n);
                  V(r, { class: `h-3 w-3 text-green-500` });
                  var i = D(r, 2),
                    s = _(i);
                  (d(i), e(() => a(s, `+${m(E) ?? ``}% this week`)), o(t, n));
                },
                h = (t) => {
                  var n = he(),
                    r = S(n);
                  V(r, { class: `h-3 w-3 rotate-180 text-red-500` });
                  var i = D(r, 2),
                    s = _(i);
                  (d(i), e(() => a(s, `${m(E) ?? ``}% this week`)), o(t, n));
                },
                g = (e) => {
                  o(e, ge());
                };
              (r(f, (e) => {
                m(E) > 0 ? e(p) : m(E) < 0 ? e(h, 1) : e(g, -1);
              }),
                d(u),
                d(s));
              var v = D(s, 2);
              (re(_(v), { class: `h-5 w-5 text-primary` }),
                d(v),
                d(i),
                e(() => a(l, `${m(b) ?? ``}%`)),
                o(t, i));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var g = D(h, 2);
      F(g, {
        children: (t, n) => {
          I(t, {
            class: `p-6`,
            children: (t, n) => {
              var r = ve(),
                i = _(r),
                s = D(_(i), 2),
                c = _(s, !0);
              (d(s), j(2), d(i));
              var l = D(i, 2);
              (se(_(l), { class: `h-5 w-5 text-blue-500` }),
                d(l),
                d(r),
                e((e) => a(c, e), [() => (m(U), w(() => m(U).toLocaleString()))]),
                o(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var v = D(g, 2);
      (F(v, {
        children: (t, n) => {
          I(t, {
            class: `p-6`,
            children: (t, n) => {
              var r = ye(),
                i = _(r),
                s = D(_(i), 2),
                c = _(s, !0);
              d(s);
              var l = D(s, 2),
                u = _(l);
              (d(l), d(i));
              var f = D(i, 2);
              (te(_(f), { class: `h-5 w-5 text-violet-500` }),
                d(f),
                d(r),
                e(
                  (e) => {
                    (a(c, e),
                      a(
                        u,
                        `${(m(W), w(() => m(W).successRate)) ?? ``}% success · ~${(m(W), w(() => m(W).timeSavedHours)) ?? ``}h saved`,
                      ));
                  },
                  [() => (m(W), w(() => m(W).rulesExecuted.toLocaleString()))],
                ),
                o(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        F(D(v, 2), {
          children: (t, n) => {
            I(t, {
              class: `p-6`,
              children: (t, n) => {
                var r = be(),
                  i = _(r),
                  s = D(_(i), 2),
                  c = _(s, !0);
                d(s);
                var l = D(s, 2),
                  u = _(l);
                (d(l), d(i));
                var f = D(i, 2);
                (ie(_(f), { class: `h-5 w-5 text-orange-500` }),
                  d(f),
                  d(r),
                  e(() => {
                    (a(c, (m(G), w(() => m(G).openIncidents))),
                      a(
                        u,
                        `${(m(G), w(() => m(G).criticalIncidents)) ?? ``} critical · ${(m(G), w(() => m(G).resolvedIncidents)) ?? ``} resolved`,
                      ));
                  }),
                  o(t, r));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        d(l));
      var y = D(l, 2),
        x = _(y);
      (F(x, {
        children: (t, n) => {
          var i = De(),
            l = S(i);
          (L(l, {
            children: (e, t) => {
              R(e, {
                class: `flex items-center gap-2`,
                children: (e, t) => {
                  var n = xe();
                  (V(S(n), { class: `h-4 w-4 text-primary` }), j(), o(e, n));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            I(D(l, 2), {
              children: (t, n) => {
                var i = u(),
                  l = S(i),
                  p = (t) => {
                    let n = C(() => 480),
                      i = C(() => 160),
                      l = C(() => 10),
                      p = C(
                        () => (
                          m(M),
                          f(m(n)),
                          f(m(i)),
                          f(m(l)),
                          w(() => Xe(m(M), m(n), m(i), m(l)))
                        ),
                      ),
                      h = C(
                        () => (
                          m(M),
                          f(m(n)),
                          f(m(i)),
                          f(m(l)),
                          w(() => Ze(m(M), m(n), m(i), m(l)))
                        ),
                      );
                    var g = Te(),
                      v = S(g),
                      y = _(v);
                    k(y, `viewBox`, `0 0 ${m(n) ?? ``} ${m(i) ?? ``}`);
                    var b = D(_(y));
                    s(
                      b,
                      0,
                      () => [25, 50, 75, 100],
                      c,
                      (t, s) => {
                        let c = C(() => (m(M), w(() => m(M).map((e) => e.score)))),
                          p = C(() => (f(m(c)), w(() => Math.min(...m(c))))),
                          h = C(() => (f(m(c)), w(() => Math.max(...m(c))))),
                          g = C(() => m(h) - m(p) || 1),
                          v = C(
                            () =>
                              m(l) + (m(i) - m(l) * 2) - ((s - m(p)) / m(g)) * (m(i) - m(l) * 2),
                          );
                        var y = u(),
                          b = S(y),
                          x = (t) => {
                            var r = Se(),
                              i = S(r);
                            (k(i, `x1`, m(l)), k(i, `x2`, m(n) - m(l)));
                            var c = D(i);
                            k(c, `x`, m(l) + 2);
                            var u = _(c);
                            (d(c),
                              e(() => {
                                (k(i, `y1`, m(v)),
                                  k(i, `y2`, m(v)),
                                  k(c, `y`, m(v) - 2),
                                  a(u, `${s ?? ``}%`));
                              }),
                              o(t, r));
                          };
                        (r(b, (e) => {
                          m(v) >= m(l) && m(v) <= m(i) - m(l) && e(x);
                        }),
                          o(t, y));
                      },
                    );
                    var x = D(b),
                      T = D(x);
                    (s(
                      D(T),
                      1,
                      () => m(M),
                      c,
                      (t, a, s) => {
                        let c = C(
                            () => (
                              f(m(l)),
                              m(M),
                              f(m(n)),
                              w(
                                () =>
                                  m(l) +
                                  (m(M).length === 1
                                    ? (m(n) - m(l) * 2) / 2
                                    : (s / (m(M).length - 1)) * (m(n) - m(l) * 2)),
                              )
                            ),
                          ),
                          d = C(() => (m(M), w(() => m(M).map((e) => e.score)))),
                          p = C(() => (f(m(d)), w(() => Math.min(...m(d))))),
                          h = C(() => (f(m(d)), w(() => Math.max(...m(d))))),
                          g = C(() => m(h) - m(p) || 1),
                          _ = C(
                            () => (
                              f(m(l)),
                              f(m(i)),
                              m(a),
                              f(m(p)),
                              f(m(g)),
                              w(
                                () =>
                                  m(l) +
                                  (m(i) - m(l) * 2) -
                                  ((m(a).score - m(p)) / m(g)) * (m(i) - m(l) * 2),
                              )
                            ),
                          );
                        var v = u(),
                          y = S(v),
                          b = (t) => {
                            var n = Ce();
                            (e(() => {
                              (k(n, `cx`, m(c)), k(n, `cy`, m(_)));
                            }),
                              o(t, n));
                          };
                        (r(y, (e) => {
                          (m(M), w(() => s === 0 || s === m(M).length - 1 || s % 3 == 0) && e(b));
                        }),
                          o(t, v));
                      },
                    ),
                      d(y),
                      d(v));
                    var E = D(v, 2),
                      O = _(E),
                      A = (t) => {
                        var n = we(),
                          r = S(n),
                          i = _(r, !0);
                        d(r);
                        var s = D(r, 2),
                          c = _(s, !0);
                        d(s);
                        var l = D(s, 2),
                          u = _(l, !0);
                        (d(l),
                          e(
                            (e, t, n) => {
                              (a(i, e), a(c, t), a(u, n));
                            },
                            [
                              () => (m(M), w(() => Z(m(M)[0].week))),
                              () => (m(M), w(() => Z(m(M)[Math.floor(m(M).length / 2)].week))),
                              () => (m(M), w(() => Z(m(M)[m(M).length - 1].week))),
                            ],
                          ),
                          o(t, n));
                      };
                    (r(O, (e) => {
                      (m(M), w(() => m(M).length > 0) && e(A));
                    }),
                      d(E),
                      e(() => {
                        (k(x, `d`, m(h)), k(T, `points`, m(p)));
                      }),
                      o(t, g));
                  },
                  h = (e) => {
                    o(e, Ee());
                  };
                (r(l, (e) => {
                  (m(M), w(() => m(M).length > 0) ? e(p) : e(h, -1));
                }),
                  o(t, i));
              },
              $$slots: { default: !0 },
            }),
            o(t, i));
        },
        $$slots: { default: !0 },
      }),
        F(D(x, 2), {
          children: (t, i) => {
            var l = Me(),
              f = S(l);
            (L(f, {
              children: (e, t) => {
                R(e, {
                  class: `flex items-center gap-2`,
                  children: (e, t) => {
                    var n = Oe();
                    (ce(S(n), { class: `h-4 w-4 text-primary` }), j(), o(e, n));
                  },
                  $$slots: { default: !0 },
                });
              },
              $$slots: { default: !0 },
            }),
              I(D(f, 2), {
                children: (t, i) => {
                  var l = u(),
                    f = S(l),
                    h = (t) => {
                      var r = Ae();
                      (s(
                        r,
                        5,
                        () => m(P),
                        c,
                        (t, r) => {
                          var i = ke(),
                            s = _(i),
                            c = _(s),
                            l = _(c, !0);
                          d(c);
                          var u = D(c, 2),
                            f = _(u);
                          {
                            let t = C(() => (m(r), w(() => tt(m(r).grade))));
                            z(f, {
                              get variant() {
                                return m(t);
                              },
                              class: `text-xs`,
                              children: (t, n) => {
                                j();
                                var i = p();
                                (e(() => a(i, (m(r), w(() => m(r).grade)))), o(t, i));
                              },
                              $$slots: { default: !0 },
                            });
                          }
                          var h = D(f, 2),
                            g = _(h);
                          (d(h), d(u), d(s));
                          var v = D(s, 2),
                            y = _(v);
                          d(v);
                          var b = D(v, 2),
                            x = _(b),
                            S = _(x);
                          d(x);
                          var T = D(x, 2),
                            E = _(T);
                          d(T);
                          var O = D(T, 2),
                            k = _(O);
                          (d(O),
                            d(b),
                            d(i),
                            e(
                              (e, t) => {
                                (a(l, (m(r), w(() => m(r).framework))),
                                  a(g, `${e ?? ``}%`),
                                  n(y, `width: ${t ?? ``}%`),
                                  a(S, `${(m(r), w(() => m(r).controlsTotal)) ?? ``} controls`),
                                  a(
                                    E,
                                    `${(m(r), w(() => m(r).controlsImplemented)) ?? ``} implemented`,
                                  ),
                                  a(k, `${(m(r), w(() => m(r).controlsVerified)) ?? ``} verified`));
                              },
                              [
                                () => (m(r), w(() => m(r).score.toFixed(1))),
                                () => (m(r), w(() => Math.min(100, m(r).score))),
                              ],
                            ),
                            o(t, i));
                        },
                      ),
                        d(r),
                        o(t, r));
                    },
                    g = (e) => {
                      o(e, je());
                    };
                  (r(f, (e) => {
                    (m(P), w(() => m(P).length > 0) ? e(h) : e(g, -1));
                  }),
                    o(t, l));
                },
                $$slots: { default: !0 },
              }),
              o(t, l));
          },
          $$slots: { default: !0 },
        }),
        d(y));
      var T = D(y, 2),
        O = _(T);
      (F(O, {
        children: (t, n) => {
          var i = Re(),
            l = S(i);
          (L(l, {
            children: (e, t) => {
              R(e, {
                class: `flex items-center gap-2`,
                children: (e, t) => {
                  var n = Ne();
                  (se(S(n), { class: `h-4 w-4 text-blue-500` }), j(), o(e, n));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            I(D(l, 2), {
              children: (t, n) => {
                var i = u(),
                  l = S(i),
                  p = (t) => {
                    let n = C(() => 480),
                      i = C(() => 120),
                      l = C(() => 8),
                      u = C(
                        () => (
                          m(H),
                          f(m(n)),
                          f(m(i)),
                          f(m(l)),
                          w(() => Qe(m(H), m(n), m(i), m(l)))
                        ),
                      );
                    var p = Ie(),
                      h = S(p),
                      g = _(h);
                    (k(g, `viewBox`, `0 0 ${m(n) ?? ``} ${m(i) ?? ``}`),
                      s(
                        g,
                        5,
                        () => m(u),
                        c,
                        (t, n) => {
                          var r = Pe();
                          (e(() => {
                            (k(r, `x`, (m(n), w(() => m(n).x))),
                              k(r, `y`, (m(n), w(() => m(n).y))),
                              k(r, `width`, (m(n), w(() => m(n).w))),
                              k(r, `height`, (m(n), w(() => m(n).h))));
                          }),
                            o(t, r));
                        },
                      ),
                      d(g),
                      d(h));
                    var v = D(h, 2),
                      y = _(v),
                      b = (t) => {
                        var n = Fe(),
                          r = S(n),
                          i = _(r, !0);
                        d(r);
                        var s = D(r, 2),
                          c = _(s, !0);
                        d(s);
                        var l = D(s, 2),
                          u = _(l, !0);
                        (d(l),
                          e(
                            (e, t, n) => {
                              (a(i, e), a(c, t), a(u, n));
                            },
                            [
                              () => (m(H), w(() => Z(m(H)[0].week))),
                              () => (m(H), w(() => Z(m(H)[Math.floor(m(H).length / 2)].week))),
                              () => (m(H), w(() => Z(m(H)[m(H).length - 1].week))),
                            ],
                          ),
                          o(t, n));
                      };
                    (r(y, (e) => {
                      (m(H), w(() => m(H).length > 0) && e(b));
                    }),
                      d(v));
                    var x = D(v, 2),
                      T = _(x);
                    (d(x),
                      e(
                        (e) => a(T, `${e ?? ``} total evidence items collected`),
                        [() => (m(U), w(() => m(U).toLocaleString()))],
                      ),
                      o(t, p));
                  },
                  h = (e) => {
                    o(e, Le());
                  };
                (r(l, (e) => {
                  (m(H), w(() => m(H).length > 0) ? e(p) : e(h, -1));
                }),
                  o(t, i));
              },
              $$slots: { default: !0 },
            }),
            o(t, i));
        },
        $$slots: { default: !0 },
      }),
        F(D(O, 2), {
          children: (t, i) => {
            var s = He(),
              c = S(s);
            (L(c, {
              children: (e, t) => {
                R(e, {
                  class: `flex items-center gap-2`,
                  children: (e, t) => {
                    var n = ze();
                    (te(S(n), { class: `h-4 w-4 text-violet-500` }), j(), o(e, n));
                  },
                  $$slots: { default: !0 },
                });
              },
              $$slots: { default: !0 },
            }),
              I(D(c, 2), {
                children: (t, i) => {
                  var s = Ve(),
                    c = _(s),
                    l = _(c),
                    u = D(_(l), 2),
                    f = _(u, !0);
                  d(u);
                  var p = D(u, 2),
                    h = _(p);
                  (d(p), d(l));
                  var g = D(l, 2),
                    v = D(_(g), 2),
                    y = _(v);
                  d(v);
                  var b = D(v, 2),
                    x = _(b);
                  (d(b), d(g));
                  var S = D(g, 2),
                    C = D(_(S), 2),
                    T = _(C, !0);
                  (d(C), j(2), d(S));
                  var E = D(S, 2),
                    O = D(_(E), 2),
                    k = _(O);
                  (d(O), j(2), d(E), d(c));
                  var A = D(c, 2),
                    ee = (t) => {
                      var r = Be(),
                        i = _(r),
                        s = D(_(i), 2),
                        c = _(s);
                      (d(s), d(i));
                      var l = D(i, 2),
                        u = _(l);
                      d(l);
                      var f = D(l, 2),
                        p = _(f);
                      (d(f),
                        d(r),
                        e(() => {
                          (a(c, `${(m(G), w(() => m(G).accessReviewCompletionRate)) ?? ``}%`),
                            n(
                              u,
                              `width: ${(m(G), w(() => m(G).accessReviewCompletionRate)) ?? ``}%`,
                            ),
                            a(
                              p,
                              `${(m(G), w(() => m(G).accessReviewsCompleted)) ?? ``} of ${(m(G), w(() => m(G).accessReviewsTotal)) ?? ``} reviews completed`,
                            ));
                        }),
                        o(t, r));
                    };
                  (r(A, (e) => {
                    (m(G), w(() => m(G).accessReviewsTotal > 0) && e(ee));
                  }),
                    d(s),
                    e(
                      (e) => {
                        (a(f, (m(W), w(() => m(W).activeRules))),
                          a(h, `of ${(m(W), w(() => m(W).totalRules)) ?? ``} total`),
                          a(y, `${(m(W), w(() => m(W).successRate)) ?? ``}%`),
                          a(x, `${(m(W), w(() => m(W).failureCount)) ?? ``} failures`),
                          a(T, e),
                          a(k, `~${(m(W), w(() => m(W).timeSavedHours)) ?? ``}h`));
                      },
                      [() => (m(W), w(() => m(W).rulesExecuted.toLocaleString()))],
                    ),
                    o(t, s));
                },
                $$slots: { default: !0 },
              }),
              o(t, s));
          },
          $$slots: { default: !0 },
        }),
        d(T),
        F(D(T, 2), {
          children: (t, n) => {
            var i = qe(),
              l = S(i);
            (L(l, {
              children: (e, t) => {
                R(e, {
                  class: `flex items-center gap-2`,
                  children: (e, t) => {
                    var n = Ue();
                    (ie(S(n), { class: `h-4 w-4 text-orange-500` }), j(), o(e, n));
                  },
                  $$slots: { default: !0 },
                });
              },
              $$slots: { default: !0 },
            }),
              I(D(l, 2), {
                children: (t, n) => {
                  var i = u(),
                    l = S(i),
                    f = (t) => {
                      var n = Ge(),
                        r = _(n),
                        i = D(_(r));
                      (s(
                        i,
                        5,
                        () => m(K),
                        c,
                        (t, n) => {
                          var r = We(),
                            i = _(r),
                            s = _(i, !0);
                          d(i);
                          var c = D(i),
                            l = _(c, !0);
                          d(c);
                          var u = D(c);
                          (z(_(u), {
                            variant: `secondary`,
                            class: `text-xs`,
                            children: (t, r) => {
                              j();
                              var i = p();
                              (e(() => a(i, (m(n), w(() => m(n).framework)))), o(t, i));
                            },
                            $$slots: { default: !0 },
                          }),
                            d(u));
                          var f = D(u),
                            h = _(f),
                            g = _(h);
                          (d(h), d(f));
                          var v = D(f),
                            y = _(v);
                          {
                            let t = C(() => (m(n), w(() => $e(m(n).status))));
                            z(y, {
                              get variant() {
                                return m(t);
                              },
                              class: `text-xs`,
                              children: (t, r) => {
                                j();
                                var i = p();
                                (e((e) => a(i, e), [() => (m(n), w(() => et(m(n).status)))]),
                                  o(t, i));
                              },
                              $$slots: { default: !0 },
                            });
                          }
                          (d(v),
                            d(r),
                            e(() => {
                              (a(s, (m(n), w(() => m(n).controlRef))),
                                k(c, `title`, (m(n), w(() => m(n).title))),
                                a(l, (m(n), w(() => m(n).title))),
                                A(
                                  h,
                                  1,
                                  `font-semibold ${(m(n), w(() => (m(n).score < 25 ? `text-red-500` : m(n).score < 50 ? `text-orange-500` : m(n).score < 75 ? `text-yellow-500` : `text-green-500`))) ?? ``}`,
                                ),
                                a(g, `${(m(n), w(() => m(n).score)) ?? ``}%`));
                            }),
                            o(t, r));
                        },
                      ),
                        d(i),
                        d(r),
                        d(n),
                        o(t, n));
                    },
                    h = (e) => {
                      o(e, Ke());
                    };
                  (r(l, (e) => {
                    (m(K), w(() => m(K).length > 0) ? e(f) : e(h, -1));
                  }),
                    o(t, i));
                },
                $$slots: { default: !0 },
              }),
              o(t, i));
          },
          $$slots: { default: !0 },
        }),
        o(t, i));
    };
  (r(ct, (e) => {
    m(q) ? e(lt) : m(J) ? e(ut, 1) : m(Y) && e(dt, 2);
  }),
    d(it),
    o(t, it),
    v());
}
export { H as component };
