import {
  l as pt,
  a as mt,
  b as _t,
  g as ht,
  c as gt,
} from "../chunks/DXY25tU5.js";
import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  aa as yt,
  V as E,
  ab as R,
  ac as qt,
  f as p,
  af as T,
  d as t,
  a as u,
  ag as bt,
  ar as wt,
  ad as f,
  u as c,
  s as I,
  ah as o,
  ai as n,
  at as z,
  ae as K,
} from "../chunks/DLjC2_M2.js";
import { e as Ie, s as g } from "../chunks/39A_Ntu8.js";
import { i as C } from "../chunks/BHVF3NEQ.js";
import { e as V, i as Te } from "../chunks/B36Hb1sH.js";
import { r as Ct } from "../chunks/sxWjfql8.js";
import { s as xt } from "../chunks/Buy6Yj7A.js";
import { b as It } from "../chunks/C2VxBUJ8.js";
import { i as Tt } from "../chunks/CLYubSJh.js";
import { p as Et } from "../chunks/DXlasQxZ.js";
const Nt = "SOC2",
  At = 5,
  Mt = 8,
  Ft = 8,
  kt = {
    health: "Health",
    coverage: "Coverage",
    incidents: "Incidents",
    activity: "Activity",
    notifications: "Notifications",
  };
function St(v) {
  return !!v && typeof v == "object" && "code" in v && "message" in v;
}
function Ot(v, h) {
  const q = kt[v];
  if (St(h)) {
    const _ = [];
    (h.code && _.push(h.code), h.requestId && _.push(`req:${h.requestId}`));
    const b = _.length ? ` [${_.join(" ")}]` : "";
    return `${q}: ${h.message}${b}`;
  }
  return h instanceof Error ? `${q}: ${h.message}` : `${q}: Failed to load`;
}
const $t = async ({ fetch: v }) => {
    const h = new Date().toISOString(),
      q = {
        health: gt(v),
        coverage: ht(Nt, v),
        incidents: _t(At, v),
        activity: mt(Mt, v),
        notifications: pt(Ft, v),
      },
      _ = {},
      b = [];
    await Promise.all(
      Object.keys(q).map(async (N) => {
        try {
          _[N] = await q[N];
        } catch (F) {
          b.push(Ot(N, F));
        }
      }),
    );
    const s = Object.keys(_).length,
      y = _.notifications,
      k = {
        fetchedAt: h,
        health: _.health ?? null,
        coverage: _.coverage ?? null,
        incidents: _.incidents ?? [],
        activity: _.activity ?? [],
        notifications: (y == null ? void 0 : y.items) ?? [],
        notificationsUnreadCount: y == null ? void 0 : y.unreadCount,
        allFailed: s === 0,
      };
    return (b.length && (k.partialError = b.join("; ")), k);
  },
  Sa = Object.freeze(
    Object.defineProperty({ __proto__: null, load: $t }, Symbol.toStringTag, {
      value: "Module",
    }),
  ),
  de =
    typeof Intl < "u" && Intl.RelativeTimeFormat
      ? new Intl.RelativeTimeFormat(void 0, { numeric: "auto" })
      : null,
  jt = [
    [60, 1],
    [3600, 60],
    [86400, 3600],
    [604800, 86400],
    [2629800, 604800],
    [31557600, 2629800],
  ];
function Dt(v) {
  const h = Date.now(),
    q = Lt(v, h),
    _ = Math.floor((q - h) / 1e3),
    b = Math.abs(_);
  if (!de) return Rt(b, q);
  const s = Pt(b, _);
  if (s) return s;
  const y = Math.round(_ / 31557600);
  return de.format(y, "year");
}
function Lt(v, h) {
  if (typeof v == "number") return v;
  if (typeof v == "string") {
    const q = Date.parse(v);
    return Number.isFinite(q) ? q : h;
  }
  return v instanceof Date ? v.getTime() : h;
}
function Rt(v, h) {
  return v < 60
    ? "just now"
    : v < 3600
      ? `${Math.round(v / 60)}m ago`
      : v < 86400
        ? `${Math.round(v / 3600)}h ago`
        : v < 604800
          ? `${Math.round(v / 86400)}d ago`
          : new Date(h).toLocaleDateString();
}
function Pt(v, h) {
  for (const [q, _] of jt)
    if (v < q) {
      const b = Math.round(h / _);
      return de.format(b, Wt(_));
    }
  return null;
}
function Wt(v) {
  switch (v) {
    case 1:
      return "second";
    case 60:
      return "minute";
    case 3600:
      return "hour";
    case 86400:
      return "day";
    case 604800:
      return "week";
    case 2629800:
      return "month";
    default:
      return "day";
  }
}
function Ut(v, h = new Date()) {
  const q = new Date(v);
  if (isNaN(q.getTime())) return "";
  const _ = q.getTime() - h.getTime(),
    b = Math.abs(_),
    s = _ > 0 ? "in" : "ago",
    y = Math.round(b / 1e3),
    k = 60,
    N = 60 * k,
    F = 24 * N,
    O = 7 * F,
    U = 30 * F,
    P = 365 * F;
  function A(J, Q) {
    return J + Q;
  }
  if (y < 5) return s === "in" ? "soon" : "just now";
  if (y < k) return `${A(y, "s")} ${s}`;
  const $ = Math.round(y / k);
  if ($ < 60) return `${A($, "m")} ${s}`;
  const j = Math.round(y / N);
  if (j < 24) return `${A(j, "h")} ${s}`;
  const G = Math.round(y / F);
  if (G < 7) return `${A(G, "d")} ${s}`;
  const Y = Math.round(y / O);
  if (Y < 5) return `${A(Y, "w")} ${s}`;
  const B = Math.round(y / U);
  if (B < 12) return `${A(B, "mo")} ${s}`;
  const ue = Math.round(y / P);
  return `${A(ue, "y")} ${s}`;
}
function Ht(v) {
  return v
    ? v.startsWith("policy.")
      ? "⚖️"
      : v.startsWith("evidence.")
        ? "🧾"
        : v.startsWith("incident.")
          ? "🚨"
          : v.startsWith("workflow.")
            ? "🔁"
            : v.startsWith("access.")
              ? "🔐"
              : "•"
    : "•";
}
var zt = p('<span class="notifications-badge svelte-qd118l"> </span>'),
  Kt = p('<span class="notifications-badge svelte-qd118l"> </span>'),
  Vt = p(
    '<div class="alert warning svelte-qd118l"><div class="svelte-qd118l"><strong class="svelte-qd118l">Some services did not respond.</strong> <span class="svelte-qd118l"> </span></div></div>',
  ),
  Gt = p('<p class="detail svelte-qd118l"> </p>'),
  Yt = p(
    '<div class="alert danger svelte-qd118l"><div class="svelte-qd118l"><strong class="svelte-qd118l">Health data unavailable</strong> <p class="svelte-qd118l">We could not reach the compliance health endpoint. Retry to request a fresh snapshot.</p> <!></div> <button type="button" class="retry-btn svelte-qd118l"> </button></div>',
  ),
  Bt = p('<span class="metric-value svelte-qd118l"> </span>'),
  Jt = p('<div class="skeleton skeleton-lg svelte-qd118l"></div>'),
  Qt = p('<span class="metric-value svelte-qd118l"> </span>'),
  Xt = p('<span class="metric-value svelte-qd118l">—</span>'),
  Zt = p('<span class="metric-value svelte-qd118l"> </span>'),
  ea = p('<span class="metric-value svelte-qd118l"> </span>'),
  ta = p('<div class="skeleton skeleton-lg svelte-qd118l"></div>'),
  aa = p('<span class="metric-value svelte-qd118l"> </span>'),
  sa = p('<div class="skeleton skeleton-lg svelte-qd118l"></div>'),
  ra = p(
    '<span class="latency-chip svelte-qd118l"><span class="chip-label svelte-qd118l"> </span> <span class="chip-value svelte-qd118l"> </span></span>',
  ),
  la = p('<div class="latency-chips svelte-qd118l"></div>'),
  na = p('<p class="panel-subtitle svelte-qd118l"> </p>'),
  ia = p(
    '<div class="table-placeholder-row svelte-qd118l" aria-hidden="true"><div class="skeleton skeleton-line svelte-qd118l"></div></div>',
  ),
  oa = p('<div class="panel-body svelte-qd118l"></div>'),
  va = p(
    '<div class="panel-body empty svelte-qd118l">No controls match the current filter.</div>',
  ),
  ca = p(
    '<tr class="svelte-qd118l"><td class="svelte-qd118l"> </td><td class="numeric svelte-qd118l"> </td><td class="numeric svelte-qd118l"> </td></tr>',
  ),
  da = p(
    '<div class="panel-body scrollable svelte-qd118l"><table class="coverage-table svelte-qd118l"><thead class="svelte-qd118l"><tr class="svelte-qd118l"><th scope="col" class="svelte-qd118l">Control</th><th scope="col" class="numeric svelte-qd118l">Evidence</th><th scope="col" class="numeric svelte-qd118l">% of framework</th></tr></thead><tbody class="svelte-qd118l"></tbody></table></div>',
  ),
  ua = p(
    '<li class="list-item incident svelte-qd118l"><span> </span> <div class="item-body svelte-qd118l"><span class="item-title svelte-qd118l"> </span> <span class="item-meta svelte-qd118l"> </span></div></li>',
  ),
  fa = p('<ul class="list svelte-qd118l"></ul>'),
  pa = p(
    '<div class="empty svelte-qd118l">Unable to load incidents right now.</div>',
  ),
  ma = p('<div class="empty svelte-qd118l">No open incidents.</div>'),
  _a = p(
    '<li class="list-item activity svelte-qd118l"><span class="badge badge-muted svelte-qd118l"> </span> <div class="item-body svelte-qd118l"><span class="item-title svelte-qd118l"> </span> <span class="item-meta svelte-qd118l"> </span></div></li>',
  ),
  ha = p('<ul class="list svelte-qd118l"></ul>'),
  ga = p('<div class="empty svelte-qd118l">Activity feed unavailable.</div>'),
  ya = p('<div class="empty svelte-qd118l">No activity recorded.</div>'),
  qa = p(
    '<div class="page svelte-qd118l"><header class="page-header svelte-qd118l"><div class="svelte-qd118l"><h1 class="svelte-qd118l">Compliance Dashboard</h1> <p class="timestamp svelte-qd118l"> </p></div> <!></header> <!> <!> <section class="metrics-grid svelte-qd118l"><div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Coverage</span> <!></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Open incidents</span> <!></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Evidence items</span> <!></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Policy templates</span> <!></div></section> <!> <div class="content-grid svelte-qd118l"><section class="panel coverage-panel svelte-qd118l"><header class="panel-header svelte-qd118l"><div class="svelte-qd118l"><h2 class="svelte-qd118l">Coverage Controls</h2> <!></div> <input class="filter-input svelte-qd118l" type="search" placeholder="Filter controls"/></header> <!></section> <section class="panel svelte-qd118l"><header class="panel-header svelte-qd118l"><h2 class="svelte-qd118l">Open Incidents</h2></header> <div class="panel-body svelte-qd118l"><!></div></section> <section class="panel svelte-qd118l"><header class="panel-header svelte-qd118l"><h2 class="svelte-qd118l">Recent Activity</h2></header> <div class="panel-body svelte-qd118l"><!></div></section></div></div>',
  );
function Oa(v, h) {
  yt(h, !1);
  const q = E(),
    _ = E();
  let b = Et(h, "data", 8),
    s = E(b()),
    y = E(b().fetchedAt),
    k = E(b().fetchedAt),
    N = E(!1),
    F = E(null),
    O = E([]),
    U = E([]),
    P = E([]),
    A = E(0),
    $ = E(""),
    j = E("");
  const G = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }),
    Y = new Intl.NumberFormat("en-US"),
    B = [
      { key: "workflowExecute", label: "Workflow Execute" },
      { key: "policyGenerate", label: "Policy Generate" },
      { key: "policyEvaluate", label: "Policy Evaluate" },
    ],
    J = ((e, a = 150) => {
      let l;
      return (...r) => {
        (clearTimeout(l), (l = setTimeout(() => e(...r), a)));
      };
    })((e) => {
      I(j, e.trim().toLowerCase());
    }, 150);
  function Q(e) {
    const a = e.target.value;
    (I($, a), J(t($)));
  }
  function Ee(e) {
    if (!e || typeof e != "object") return null;
    const a =
        typeof e.p50 == "number"
          ? e.p50
          : typeof e.avg == "number"
            ? e.avg
            : null,
      l =
        typeof e.p95 == "number"
          ? e.p95
          : typeof e.p90 == "number"
            ? e.p90
            : null;
    if (a === null && l === null) return null;
    const r = (d) => `${Math.round(d)}ms`;
    return a !== null && l !== null
      ? `${r(a)} p50 / ${r(l)} p95`
      : r(a ?? l ?? 0);
  }
  function fe(e) {
    return e == null || Number.isNaN(e) ? "—" : `${G.format(e)}%`;
  }
  function W(e) {
    return e == null || Number.isNaN(e) ? "—" : Y.format(e);
  }
  function pe(e) {
    if (!e) return "—";
    const a = Dt(e);
    return /\d{4}-\d{2}-\d{2}/.test(a) ? a : Ut(e);
  }
  function Ne(e) {
    if (!e) return "—";
    const a = new Date(e);
    return Number.isNaN(a.getTime()) ? e : a.toLocaleString();
  }
  function Ae(e) {
    if (!e) return "severity-neutral";
    const a = e.toLowerCase();
    return a === "critical"
      ? "severity-critical"
      : a === "high"
        ? "severity-high"
        : a === "medium"
          ? "severity-medium"
          : a === "low"
            ? "severity-low"
            : "severity-neutral";
  }
  function Me(e) {
    return Ht(e.type);
  }
  function Fe(e) {
    return !!e && typeof e == "object" && "code" in e && "message" in e;
  }
  async function ke() {
    if (!t(N)) {
      (I(N, !0), I(F, null));
      try {
        const e = await fetch(`${window.location.pathname}.json`, {
          headers: { Accept: "application/json" },
        });
        if (!e.ok) {
          const l = await e.text();
          throw new Error(
            `HTTP ${e.status} ${e.statusText}${l ? ` - ${l}` : ""}`,
          );
        }
        const a = await e.json();
        (I(s, a), I(k, a.fetchedAt));
      } catch (e) {
        I(F, Fe(e) || e instanceof Error ? e.message : "Unable to refresh");
      } finally {
        I(N, !1);
      }
    }
  }
  const Se = 5;
  (R(
    () => (wt(b()), t(y), t(k)),
    () => {
      b().fetchedAt !== t(y) &&
        b().fetchedAt !== t(k) &&
        (I(y, b().fetchedAt), I(s, b()));
    },
  ),
    R(
      () => t(s),
      () => {
        var e;
        I(O, ((e = t(s).coverage) == null ? void 0 : e.controls) ?? []);
      },
    ),
    R(
      () => t(O),
      () => {
        I(
          A,
          t(O).reduce((e, a) => e + a.evidenceCount, 0),
        );
      },
    ),
    R(
      () => (t(j), t(O)),
      () => {
        I(
          U,
          t(j)
            ? t(O).filter((e) => e.controlKey.toLowerCase().includes(t(j)))
            : t(O),
        );
      },
    ),
    R(
      () => (t(U), t(A)),
      () => {
        I(
          P,
          t(U).map((e) => ({
            ...e,
            percent: t(A) > 0 ? (e.evidenceCount / t(A)) * 100 : 0,
          })),
        );
      },
    ),
    R(
      () => t(s),
      () => {
        I(
          q,
          (t(s).notifications ?? []).filter((e) => {
            var l;
            const a = (l = e.severity) == null ? void 0 : l.toLowerCase();
            return a === "critical" || a === "high";
          }).length,
        );
      },
    ),
    R(
      () => t(s),
      () => {
        I(
          _,
          B.map(({ key: e, label: a }) => {
            var i;
            const l =
                ((i = t(s).health) == null ? void 0 : i.latency) ?? void 0,
              r = l ? l[e] : void 0,
              d = Ee(r);
            return d ? { label: a, display: d } : null;
          }).filter(Boolean),
        );
      },
    ),
    qt(),
    Tt());
  var X = qa(),
    Z = o(X),
    ee = o(Z),
    me = f(o(ee), 2),
    Oe = o(me);
  (n(me), n(ee));
  var $e = f(ee, 2);
  {
    var je = (e) => {
        var a = zt(),
          l = o(a);
        (n(a),
          T(() =>
            g(
              l,
              `Unread: ${(t(s), c(() => t(s).notificationsUnreadCount) ?? "")}`,
            ),
          ),
          u(e, a));
      },
      De = (e) => {
        var a = z(),
          l = K(a);
        {
          var r = (d) => {
            var i = Kt(),
              m = o(i);
            (n(i), T(() => g(m, `High priority: ${t(q) ?? ""}`)), u(d, i));
          };
          C(
            l,
            (d) => {
              t(q) > 0 && d(r);
            },
            !0,
          );
        }
        u(e, a);
      };
    C($e, (e) => {
      (t(s),
        c(
          () =>
            t(s).notificationsUnreadCount && t(s).notificationsUnreadCount > 0,
        )
          ? e(je)
          : e(De, !1));
    });
  }
  n(Z);
  var _e = f(Z, 2);
  {
    var Le = (e) => {
      var a = Vt(),
        l = o(a),
        r = f(o(l), 2),
        d = o(r, !0);
      (n(r),
        n(l),
        n(a),
        T(() => g(d, (t(s), c(() => t(s).partialError)))),
        u(e, a));
    };
    C(_e, (e) => {
      (t(s), c(() => t(s).partialError) && e(Le));
    });
  }
  var he = f(_e, 2);
  {
    var Re = (e) => {
      var a = Yt(),
        l = o(a),
        r = f(o(l), 4);
      {
        var d = (x) => {
          var w = Gt(),
            S = o(w, !0);
          (n(w), T(() => g(S, t(F))), u(x, w));
        };
        C(r, (x) => {
          t(F) && x(d);
        });
      }
      n(l);
      var i = f(l, 2),
        m = o(i, !0);
      (n(i),
        n(a),
        T(() => {
          ((i.disabled = t(N)), g(m, t(N) ? "Retrying..." : "Retry"));
        }),
        Ie("click", i, ke),
        u(e, a));
    };
    C(he, (e) => {
      (t(s), c(() => !t(s).health) && e(Re));
    });
  }
  var te = f(he, 2),
    ae = o(te),
    Pe = f(o(ae), 2);
  {
    var We = (e) => {
        var a = Bt(),
          l = o(a, !0);
        (n(a),
          T(
            (r) => g(l, r),
            [() => (t(s), c(() => fe(t(s).coverage.coveragePercent)))],
          ),
          u(e, a));
      },
      Ue = (e) => {
        var a = Jt();
        u(e, a);
      };
    C(Pe, (e) => {
      (t(s), c(() => t(s).coverage) ? e(We) : e(Ue, !1));
    });
  }
  n(ae);
  var se = f(ae, 2),
    He = f(o(se), 2);
  {
    var ze = (e) => {
        var a = Qt(),
          l = o(a, !0);
        (n(a),
          T((r) => g(l, r), [() => (t(s), c(() => W(t(s).incidents.length)))]),
          u(e, a));
      },
      Ke = (e) => {
        var a = z(),
          l = K(a);
        {
          var r = (i) => {
              var m = Xt();
              u(i, m);
            },
            d = (i) => {
              var m = Zt(),
                x = o(m, !0);
              (n(m), T((w) => g(x, w), [() => c(() => W(0))]), u(i, m));
            };
          C(
            l,
            (i) => {
              (t(s), c(() => t(s).allFailed) ? i(r) : i(d, !1));
            },
            !0,
          );
        }
        u(e, a);
      };
    C(He, (e) => {
      (t(s),
        c(() => t(s).incidents && t(s).incidents.length) ? e(ze) : e(Ke, !1));
    });
  }
  n(se);
  var re = f(se, 2),
    Ve = f(o(re), 2);
  {
    var Ge = (e) => {
        var a = ea(),
          l = o(a, !0);
        (n(a),
          T(
            (r) => g(l, r),
            [
              () => (
                t(s),
                c(() => {
                  var r;
                  return W(
                    (r = t(s).health) == null ? void 0 : r.evidenceCount,
                  );
                })
              ),
            ],
          ),
          u(e, a));
      },
      Ye = (e) => {
        var a = ta();
        u(e, a);
      };
    C(Ve, (e) => {
      (t(s), c(() => t(s).health) ? e(Ge) : e(Ye, !1));
    });
  }
  n(re);
  var ge = f(re, 2),
    Be = f(o(ge), 2);
  {
    var Je = (e) => {
        var a = aa(),
          l = o(a, !0);
        (n(a),
          T(
            (r) => g(l, r),
            [
              () => (
                t(s),
                c(() => {
                  var r, d;
                  return W(
                    ((d = (r = t(s).health) == null ? void 0 : r.policies) ==
                    null
                      ? void 0
                      : d.templates) ?? null,
                  );
                })
              ),
            ],
          ),
          u(e, a));
      },
      Qe = (e) => {
        var a = sa();
        u(e, a);
      };
    C(Be, (e) => {
      (t(s),
        c(() => {
          var a;
          return (a = t(s).health) == null ? void 0 : a.policies;
        })
          ? e(Je)
          : e(Qe, !1));
    });
  }
  (n(ge), n(te));
  var ye = f(te, 2);
  {
    var Xe = (e) => {
      var a = la();
      (V(
        a,
        5,
        () => t(_),
        Te,
        (l, r) => {
          var d = ra(),
            i = o(d),
            m = o(i, !0);
          n(i);
          var x = f(i, 2),
            w = o(x, !0);
          (n(x),
            n(d),
            T(() => {
              (g(m, (t(r), c(() => t(r).label))),
                g(w, (t(r), c(() => t(r).display))));
            }),
            u(l, d));
        },
      ),
        n(a),
        u(e, a));
    };
    C(ye, (e) => {
      (t(_), c(() => t(_).length) && e(Xe));
    });
  }
  var qe = f(ye, 2),
    le = o(qe),
    ne = o(le),
    ie = o(ne),
    Ze = f(o(ie), 2);
  {
    var et = (e) => {
      var a = na(),
        l = o(a);
      (n(a),
        T(
          (r) => g(l, `${r ?? ""} controls tracked`),
          [() => (t(s), c(() => W(t(s).coverage.totalControls)))],
        ),
        u(e, a));
    };
    C(Ze, (e) => {
      (t(s), c(() => t(s).coverage) && e(et));
    });
  }
  n(ie);
  var oe = f(ie, 2);
  (Ct(oe), n(ne));
  var tt = f(ne, 2);
  {
    var at = (e) => {
        var a = oa();
        (V(
          a,
          5,
          () => c(() => Array(Se)),
          Te,
          (l, r) => {
            var d = ia();
            u(l, d);
          },
        ),
          n(a),
          u(e, a));
      },
      st = (e) => {
        var a = z(),
          l = K(a);
        {
          var r = (i) => {
              var m = va();
              u(i, m);
            },
            d = (i) => {
              var m = da(),
                x = o(m),
                w = f(o(x));
              (V(
                w,
                5,
                () => t(P),
                (S) => S.controlKey,
                (S, M) => {
                  var D = ca(),
                    L = o(D),
                    H = o(L, !0);
                  n(L);
                  var ce = f(L),
                    ct = o(ce, !0);
                  n(ce);
                  var xe = f(ce),
                    dt = o(xe, !0);
                  (n(xe),
                    n(D),
                    T(
                      (ut, ft) => {
                        (g(H, (t(M), c(() => t(M).controlKey))),
                          g(ct, ut),
                          g(dt, ft));
                      },
                      [
                        () => (t(M), c(() => W(t(M).evidenceCount))),
                        () => (t(M), c(() => fe(t(M).percent))),
                      ],
                    ),
                    u(S, D));
                },
              ),
                n(w),
                n(x),
                n(m),
                u(i, m));
            };
          C(
            l,
            (i) => {
              (t(P), c(() => !t(P).length) ? i(r) : i(d, !1));
            },
            !0,
          );
        }
        u(e, a);
      };
    C(tt, (e) => {
      (t(s), c(() => !t(s).coverage) ? e(at) : e(st, !1));
    });
  }
  n(le);
  var ve = f(le, 2),
    be = f(o(ve), 2),
    rt = o(be);
  {
    var lt = (e) => {
        var a = fa();
        (V(
          a,
          5,
          () => (t(s), c(() => t(s).incidents)),
          (l) => l.id,
          (l, r) => {
            var d = ua(),
              i = o(d),
              m = o(i, !0);
            n(i);
            var x = f(i, 2),
              w = o(x),
              S = o(w, !0);
            n(w);
            var M = f(w, 2),
              D = o(M, !0);
            (n(M),
              n(x),
              n(d),
              T(
                (L, H) => {
                  (xt(i, 1, L, "svelte-qd118l"),
                    g(m, (t(r), c(() => t(r).severity ?? "unknown"))),
                    g(S, (t(r), c(() => t(r).title || `Incident ${t(r).id}`))),
                    g(D, H));
                },
                [
                  () => (t(r), c(() => `badge ${Ae(t(r).severity)}`)),
                  () => (t(r), c(() => pe(t(r).createdAt))),
                ],
              ),
              u(l, d));
          },
        ),
          n(a),
          u(e, a));
      },
      nt = (e) => {
        var a = z(),
          l = K(a);
        {
          var r = (i) => {
              var m = pa();
              u(i, m);
            },
            d = (i) => {
              var m = ma();
              u(i, m);
            };
          C(
            l,
            (i) => {
              (t(s), c(() => t(s).allFailed) ? i(r) : i(d, !1));
            },
            !0,
          );
        }
        u(e, a);
      };
    C(rt, (e) => {
      (t(s),
        c(() => t(s).incidents && t(s).incidents.length) ? e(lt) : e(nt, !1));
    });
  }
  (n(be), n(ve));
  var we = f(ve, 2),
    Ce = f(o(we), 2),
    it = o(Ce);
  {
    var ot = (e) => {
        var a = ha();
        (V(
          a,
          5,
          () => (t(s), c(() => t(s).activity)),
          (l) => l.id,
          (l, r) => {
            var d = _a(),
              i = o(d),
              m = o(i, !0);
            n(i);
            var x = f(i, 2),
              w = o(x),
              S = o(w, !0);
            n(w);
            var M = f(w, 2),
              D = o(M, !0);
            (n(M),
              n(x),
              n(d),
              T(
                (L, H) => {
                  (g(m, L), g(S, (t(r), c(() => t(r).message))), g(D, H));
                },
                [
                  () => (t(r), c(() => Me(t(r)))),
                  () => (t(r), c(() => pe(t(r).createdAt))),
                ],
              ),
              u(l, d));
          },
        ),
          n(a),
          u(e, a));
      },
      vt = (e) => {
        var a = z(),
          l = K(a);
        {
          var r = (i) => {
              var m = ga();
              u(i, m);
            },
            d = (i) => {
              var m = ya();
              u(i, m);
            };
          C(
            l,
            (i) => {
              (t(s), c(() => t(s).allFailed) ? i(r) : i(d, !1));
            },
            !0,
          );
        }
        u(e, a);
      };
    C(it, (e) => {
      (t(s),
        c(() => t(s).activity && t(s).activity.length) ? e(ot) : e(vt, !1));
    });
  }
  (n(Ce),
    n(we),
    n(qe),
    n(X),
    T(
      (e) => g(Oe, `Data captured ${e ?? ""}`),
      [() => (t(s), c(() => Ne(t(s).fetchedAt)))],
    ),
    It(
      oe,
      () => t($),
      (e) => I($, e),
    ),
    Ie("input", oe, Q),
    u(v, X),
    bt());
}
export { Oa as component, Sa as universal };
//# sourceMappingURL=3.DV3oJise.js.map
