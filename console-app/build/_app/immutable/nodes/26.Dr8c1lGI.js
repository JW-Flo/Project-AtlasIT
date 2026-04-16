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
  U as u,
  V as d,
  W as f,
  Z as p,
  at as m,
  bt as h,
  ct as g,
  gt as _,
  h as v,
  ht as y,
  l as b,
  lt as x,
  nt as S,
  ot as C,
  pt as w,
  q as T,
  r as E,
  st as D,
  ut as O,
  v as k,
  w as A,
  wt as j,
  xt as M,
  z as N,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as P } from "../chunks/D8pbUplu.js";
import { n as F } from "../chunks/D4lFFHu4.js";
import { t as I } from "../chunks/BZ8YNDoC.js";
import { t as ee } from "../chunks/B05d0eRK.js";
import { t as L } from "../chunks/CAW9w7U8.js";
import { t as te } from "../chunks/BGY9DLPb.js";
import { n as ne, t as re } from "../chunks/BEJa09Kq2.js";
import { t as R } from "../chunks/Cue2Cs472.js";
import { t as z } from "../chunks/DmQt9wwK2.js";
import { t as ie } from "../chunks/C8W1vu9i2.js";
import { t as ae } from "../chunks/ejJaicvO2.js";
import { t as oe } from "../chunks/CohZSUWO.js";
import { t as se } from "../chunks/Bsj77roc.js";
import { n as B, r as ce, t as le } from "../chunks/CiPWnwLM.js";
var ue = N(`<a href="/console/integrations"><!></a>`),
  de = N(`<button type="button"> </button>`),
  fe = N(`<span></span>`),
  pe = N(`<!> Manage in API Manager`, 1),
  me = N(`<a href="/console/integrations"><!></a> <!>`, 1),
  he = N(
    `<div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg></div> <!></div> <h3 class="text-sm font-semibold mb-1 flex items-center gap-1.5"> <!></h3> <div class="text-xs text-muted-foreground mb-1"> </div> <div class="text-xs text-muted-foreground/70 mb-4 line-clamp-2"> </div> <div class="mt-auto space-y-2"><!></div>`,
    1,
  ),
  ge = N(
    `<div class="text-center py-12 text-muted-foreground"><p class="text-lg">No integrations found</p> <p class="text-sm mt-1">Try a different search or category</p></div>`,
  ),
  _e = N(`<div></div>`),
  ve = N(`<!> <p class="text-xs text-center text-muted-foreground"> </p>`, 1),
  ye = N(`Continue to Credentials <!>`, 1),
  be = N(
    `<div class="space-y-4"><div class="rounded-lg p-4 bg-muted"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg></div> <div><div class="text-sm font-semibold"> </div> <div class="text-xs text-muted-foreground capitalize"> </div></div></div> <p class="text-xs text-muted-foreground mb-3"> </p> <div class="space-y-2 text-xs text-muted-foreground"><div class="flex justify-between"><span>Auth Method</span><span class="font-medium text-foreground"> </span></div> <div class="flex justify-between"><span>Tier</span><span class="font-medium capitalize text-foreground"> </span></div> <div class="flex justify-between"><span>Credentials Required</span><span class="font-medium text-foreground"> </span></div></div></div> <!></div>`,
  ),
  xe = N(`<span class="text-destructive">*</span>`),
  Se = N(` <!>`, 1),
  Ce = N(
    `<textarea rows="4" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"></textarea>`,
  ),
  we = N(`<p class="text-xs text-muted-foreground"> </p>`),
  Te = N(`<div class="space-y-1.5"><!> <!> <!></div>`),
  Ee = N(`<!> Back`, 1),
  De = N(`<div class="space-y-4"><p class="text-xs text-muted-foreground"> </p> <!> <!> <!></div>`),
  Oe = N(`<a href="/console/integrations"><!></a> <a href="/console/workflows"><!></a> <!>`, 1),
  ke = N(
    `<div class="space-y-4 text-center"><div class="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-green-500/15"><!></div> <div><p class="text-sm font-semibold"> </p> <p class="text-xs text-muted-foreground mt-1">JML workflows are now available for this application. You can manage credentials anytime in the API Manager.</p></div> <!></div>`,
  ),
  Ae = N(`<div class="flex items-center gap-2 mb-6"></div> <!>`, 1),
  je = N(
    `<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Marketplace</h1> <p class="text-sm text-muted-foreground">Connect your business apps to AtlasIT for automated compliance and IT management</p></div> <div class="flex items-center gap-3"><!></div></div> <!> <div class="flex flex-wrap gap-2"></div> <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></div> <!></div> <!>`,
    1,
  );
function Me(N, Me) {
  M(Me, !1);
  let Ne = () => _(P, `$page`, Pe),
    [Pe, Fe] = y(),
    V = g(),
    H = g(),
    Ie = g(),
    U = g(ce.map((e) => ({ ...e }))),
    W = g(`all`),
    G = g(``),
    K = g(!1),
    q = g(null),
    J = g(1),
    Y = g(!1),
    X = g({});
  E(async () => {
    try {
      let e = await fetch(`/api/apps/status`);
      if (e.ok) {
        let t = (await e.json()).applications || [],
          n = {},
          r = {};
        for (let e of t) ((n[e.id] = !!e.connected), e.healthy !== void 0 && (r[e.id] = e.healthy));
        O(
          U,
          f(U).map((e) => ({ ...e, connected: !!n[e.id], healthy: r[e.id] })),
        );
      }
    } catch {}
    let e = Ne().url.searchParams.get(`error`);
    if (e) {
      F({ title: `Connection Failed`, description: decodeURIComponent(e), variant: `destructive` });
      let t = new URL(window.location.href);
      (t.searchParams.delete(`error`),
        t.searchParams.delete(`appId`),
        window.history.replaceState({}, ``, t.toString()));
    }
  });
  function Le(e) {
    (O(q, e), O(J, 1), O(Y, !1), O(X, {}), O(K, !0));
  }
  async function Re() {
    if (f(q)) {
      O(Y, !0);
      try {
        if (f(q).auth === `platform_oauth`) {
          (F({ message: `Redirecting to ${f(q).name} for authorization...`, variant: `info` }),
            (window.location.href = `/api/apps/oauth/start?appId=${f(q).id}`));
          return;
        }
        let e = { appId: f(q).id, credentials: { ...f(X) } },
          t = await fetch(`/api/apps/connect`, {
            method: `POST`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify(e),
          });
        if (!t.ok) {
          (F({
            message: (await t.json().catch(() => ({}))).error || `Failed to save credentials`,
            variant: `error`,
          }),
            O(Y, !1));
          return;
        }
        if (f(q).auth === `tenant_oauth`) {
          (F({ message: `Redirecting to ${f(q).name} for authorization...`, variant: `info` }),
            (window.location.href = `/api/apps/oauth/start?appId=${f(q).id}`));
          return;
        }
        (O(
          U,
          f(U).map((e) => (e.id === f(q).id ? { ...e, connected: !0, status: `live` } : e)),
        ),
          O(J, 3),
          F({ message: `${f(q).name} connected!`, variant: `success` }));
      } catch (e) {
        F({ message: e?.message || `Connection failed`, variant: `error` });
      }
      O(Y, !1);
    }
  }
  async function ze(e) {
    try {
      await fetch(`/api/apps/disconnect`, {
        method: `POST`,
        headers: { "content-type": `application/json` },
        body: JSON.stringify({ appId: e.id }),
      });
    } catch {}
    let t = ce.find((t) => t.id === e.id);
    (O(
      U,
      f(U).map((n) => (n.id === e.id ? { ...n, connected: !1, status: t?.status ?? n.status } : n)),
    ),
      F({ message: `${e.name} disconnected`, variant: `info` }));
  }
  function Be(e) {
    return e === `platform_oauth` || e === `tenant_oauth`
      ? `OAuth 2.0`
      : e === `api_key`
        ? `API Key`
        : e === `service_account`
          ? `Service Account`
          : e;
  }
  function Ve(e) {
    return e.type === `password` ? `password` : e.type === `url` ? `url` : `text`;
  }
  (p(
    () => (f(U), f(W), f(G)),
    () => {
      O(
        V,
        f(U).filter(
          (e) =>
            !(
              (f(W) !== `all` && e.category !== f(W)) ||
              (f(G) && !e.name.toLowerCase().includes(f(G).toLowerCase()))
            ),
        ),
      );
    },
  ),
    p(
      () => f(U),
      () => {
        O(H, f(U).filter((e) => e.connected).length);
      },
    ),
    p(
      () => (f(q), f(X)),
      () => {
        O(
          Ie,
          f(q)
            ? f(q)
                .credentialFields.filter((e) => e.required)
                .every((e) => f(X)[e.key]?.trim())
            : !1,
        );
      },
    ),
    s(),
    b());
  var He = je(),
    Z = C(He),
    Q = m(Z),
    Ue = D(m(Q), 2),
    We = m(Ue),
    Ge = (t) => {
      var n = ue();
      (z(m(n), {
        variant: `success`,
        class: `cursor-pointer`,
        children: (t, n) => {
          j();
          var a = d();
          (e(() => r(a, `${f(H) ?? ``} Connected → API Manager`)), i(t, a));
        },
        $$slots: { default: !0 },
      }),
        l(n),
        i(t, n));
    };
  (t(We, (e) => {
    f(H) > 0 && e(Ge);
  }),
    l(Ue),
    l(Q));
  var Ke = D(Q, 2);
  ie(Ke, {
    type: `text`,
    placeholder: `Search integrations...`,
    class: `max-w-md`,
    get value() {
      return f(G);
    },
    set value(e) {
      O(G, e);
    },
    $$legacy: !0,
  });
  var $ = D(Ke, 2);
  (a(
    $,
    5,
    () => le,
    o,
    (t, a) => {
      var o = de(),
        s = m(o, !0);
      (l(o),
        e(() => {
          (A(
            o,
            1,
            `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${(f(W), f(a), T(() => (f(W) === f(a).id ? `bg-primary text-primary-foreground` : `bg-muted text-muted-foreground hover:text-foreground`))) ?? ``}`,
          ),
            r(s, (f(a), T(() => f(a).label))));
        }),
        n(`click`, o, () => O(W, f(a).id)),
        i(t, o));
    },
  ),
    l($));
  var qe = D($, 2);
  (a(
    qe,
    5,
    () => f(V),
    o,
    (n, a) => {
      {
        let o = w(() => (f(a), T(() => (f(a).connected ? `border-green-500/30` : ``))));
        ne(n, {
          get class() {
            return `${f(o) ?? ``} cursor-pointer hover:shadow-md transition-shadow`;
          },
          $$events: {
            click: () => {
              !f(a).connected && f(a).status !== `planned` && Le(f(a));
            },
          },
          children: (n, o) => {
            re(n, {
              class: `pt-5 flex flex-col h-full`,
              children: (n, o) => {
                var s = he(),
                  c = C(s),
                  p = m(c),
                  h = m(p),
                  g = m(h);
                (l(h), l(p));
                var _ = D(p, 2);
                {
                  let t = w(
                    () => (
                      f(a),
                      T(() =>
                        f(a).connected
                          ? `success`
                          : f(a).status === `stable`
                            ? `default`
                            : f(a).status === `beta`
                              ? `warning`
                              : `secondary`,
                      )
                    ),
                  );
                  z(_, {
                    get variant() {
                      return f(t);
                    },
                    children: (t, n) => {
                      j();
                      var o = d();
                      (e(() => r(o, (f(a), T(() => (f(a).connected ? `Connected` : f(a).status))))),
                        i(t, o));
                    },
                    $$slots: { default: !0 },
                  });
                }
                l(c);
                var v = D(c, 2),
                  y = m(v),
                  b = D(y),
                  x = (t) => {
                    var n = fe();
                    (e(() => {
                      (A(
                        n,
                        1,
                        `inline-block w-2 h-2 rounded-full ${(f(a), T(() => (f(a).healthy === !0 ? `bg-green-500` : f(a).healthy === !1 ? `bg-red-500` : `bg-gray-400`))) ?? ``}`,
                      ),
                        k(
                          n,
                          `title`,
                          (f(a),
                          T(() =>
                            f(a).healthy === !0
                              ? `Healthy`
                              : f(a).healthy === !1
                                ? `Unhealthy`
                                : `Not tested`,
                          )),
                        ));
                    }),
                      i(t, n));
                  };
                (t(b, (e) => {
                  (f(a), T(() => f(a).connected) && e(x));
                }),
                  l(v));
                var S = D(v, 2),
                  E = m(S);
                l(S);
                var O = D(S, 2),
                  M = m(O, !0);
                l(O);
                var N = D(O, 2),
                  P = m(N),
                  F = (e) => {
                    var t = me(),
                      n = C(t);
                    (R(m(n), {
                      variant: `outline`,
                      size: `sm`,
                      class: `w-full`,
                      children: (e, t) => {
                        var n = pe();
                        (te(C(n), { class: `h-3 w-3 mr-1.5` }), j(), i(e, n));
                      },
                      $$slots: { default: !0 },
                    }),
                      l(n),
                      R(D(n, 2), {
                        variant: `destructive`,
                        size: `sm`,
                        class: `w-full`,
                        $$events: { click: () => ze(f(a)) },
                        children: (e, t) => {
                          (j(), i(e, d(`Disconnect`)));
                        },
                        $$slots: { default: !0 },
                      }),
                      i(e, t));
                  },
                  I = (e) => {
                    R(e, {
                      size: `sm`,
                      class: `w-full`,
                      disabled: !0,
                      children: (e, t) => {
                        (j(), i(e, d(`Coming Soon`)));
                      },
                      $$slots: { default: !0 },
                    });
                  },
                  ee = (e) => {
                    R(e, {
                      size: `sm`,
                      class: `w-full`,
                      $$events: { click: () => Le(f(a)) },
                      children: (e, t) => {
                        (j(), i(e, d(`Connect`)));
                      },
                      $$slots: { default: !0 },
                    });
                  };
                (t(P, (e) => {
                  (f(a),
                    T(() => f(a).connected)
                      ? e(F)
                      : (f(a), T(() => f(a).status === `planned`) ? e(I, 1) : e(ee, -1)));
                }),
                  l(N),
                  e(
                    (e) => {
                      (k(g, `d`, (u(B), f(a), T(() => B[f(a).category] || B.productivity))),
                        r(y, `${(f(a), T(() => f(a).name)) ?? ``} `),
                        r(
                          E,
                          `${(f(a), T(() => f(a).category)) ?? ``} · ${e ?? ``} · ${(f(a), T(() => f(a).tier)) ?? ``}`,
                        ),
                        r(M, (f(a), T(() => f(a).description))));
                    },
                    [() => (f(a), T(() => Be(f(a).auth)))],
                  ),
                  i(n, s));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        });
      }
    },
  ),
    l(qe));
  var Je = D(qe, 2),
    Ye = (e) => {
      i(e, ge());
    };
  (t(Je, (e) => {
    (f(V), T(() => f(V).length === 0) && e(Ye));
  }),
    l(Z));
  var Xe = D(Z, 2);
  {
    let n = w(() => (f(q), T(() => f(q)?.name || ``)));
    oe(Xe, {
      get open() {
        return f(K);
      },
      onClose: () => O(K, !1),
      get title() {
        return `Connect ${f(n) ?? ``}`;
      },
      children: (n, s) => {
        var p = c(),
          h = C(p),
          g = (n) => {
            var s = Ae(),
              c = C(s);
            (a(
              c,
              4,
              () => [1, 2, 3],
              o,
              (t, n) => {
                var r = _e();
                (e(() =>
                  A(
                    r,
                    1,
                    `h-1.5 rounded-full flex-1 transition-all ${n <= f(J) ? `bg-primary` : `bg-muted`}`,
                  ),
                ),
                  i(t, r));
              },
            ),
              l(c));
            var p = D(c, 2),
              h = (n) => {
                var a = be(),
                  o = m(a),
                  s = m(o),
                  c = m(s),
                  p = m(c),
                  h = m(p);
                (l(p), l(c));
                var g = D(c, 2),
                  _ = m(g),
                  v = m(_, !0);
                l(_);
                var y = D(_, 2),
                  b = m(y, !0);
                (l(y), l(g), l(s));
                var x = D(s, 2),
                  S = m(x, !0);
                l(x);
                var w = D(x, 2),
                  E = m(w),
                  A = D(m(E)),
                  M = m(A, !0);
                (l(A), l(E));
                var N = D(E, 2),
                  P = D(m(N)),
                  F = m(P, !0);
                (l(P), l(N));
                var I = D(N, 2),
                  L = D(m(I)),
                  te = m(L);
                (l(L), l(I), l(w), l(o));
                var ne = D(o, 2),
                  re = (t) => {
                    var n = ve(),
                      a = C(n);
                    R(a, {
                      class: `w-full`,
                      get disabled() {
                        return f(Y);
                      },
                      $$events: { click: Re },
                      children: (t, n) => {
                        j();
                        var a = d();
                        (e(() =>
                          r(
                            a,
                            (f(Y),
                            f(q),
                            T(() => (f(Y) ? `Redirecting...` : `Authorize ${f(q).name}`))),
                          ),
                        ),
                          i(t, a));
                      },
                      $$slots: { default: !0 },
                    });
                    var o = D(a, 2),
                      s = m(o);
                    (l(o),
                      e(() =>
                        r(
                          s,
                          `You'll be redirected to ${(f(q), T(() => f(q).name)) ?? ``} to grant AtlasIT access to your workspace.`,
                        ),
                      ),
                      i(t, n));
                  },
                  z = (e) => {
                    R(e, {
                      class: `w-full`,
                      $$events: { click: () => O(J, 2) },
                      children: (e, t) => {
                        j();
                        var n = ye();
                        (ee(D(C(n)), { class: `h-4 w-4 ml-1.5` }), i(e, n));
                      },
                      $$slots: { default: !0 },
                    });
                  };
                (t(ne, (e) => {
                  (f(q), T(() => f(q).auth === `platform_oauth`) ? e(re) : e(z, -1));
                }),
                  l(a),
                  e(
                    (e, t) => {
                      (k(h, `d`, (u(B), f(q), T(() => B[f(q).category] || B.productivity))),
                        r(v, (f(q), T(() => f(q).name))),
                        r(b, (f(q), T(() => f(q).category))),
                        r(S, (f(q), T(() => f(q).description))),
                        r(M, e),
                        r(F, (f(q), T(() => f(q).tier))),
                        r(te, `${t ?? ``} fields`));
                    },
                    [
                      () => (f(q), T(() => Be(f(q).auth))),
                      () => (f(q), T(() => f(q).credentialFields.filter((e) => e.required).length)),
                    ],
                  ),
                  i(n, a));
              },
              g = (n) => {
                var s = De(),
                  c = m(s),
                  u = m(c);
                l(c);
                var p = D(c, 2);
                a(
                  p,
                  1,
                  () => (f(q), T(() => f(q).credentialFields)),
                  o,
                  (n, a) => {
                    var o = Te(),
                      s = m(o);
                    ae(s, {
                      children: (n, o) => {
                        j();
                        var s = Se(),
                          c = C(s),
                          l = D(c),
                          u = (e) => {
                            i(e, xe());
                          };
                        (t(l, (e) => {
                          (f(a), T(() => f(a).required) && e(u));
                        }),
                          e(() => r(c, `${(f(a), T(() => f(a).label)) ?? ``} `)),
                          i(n, s));
                      },
                      $$slots: { default: !0 },
                    });
                    var c = D(s, 2),
                      u = (t) => {
                        var n = Ce();
                        (S(n),
                          e(() => k(n, `placeholder`, (f(a), T(() => f(a).placeholder || ``)))),
                          v(
                            n,
                            () => f(X)[f(a).key],
                            (e) => x(X, (f(X)[f(a).key] = e)),
                          ),
                          i(t, n));
                      },
                      d = (e) => {
                        {
                          let t = w(() => (f(a), T(() => Ve(f(a))))),
                            n = w(() => (f(a), T(() => f(a).placeholder || ``)));
                          ie(e, {
                            get type() {
                              return f(t);
                            },
                            get placeholder() {
                              return f(n);
                            },
                            get value() {
                              return f(X)[f(a).key];
                            },
                            set value(e) {
                              x(X, (f(X)[f(a).key] = e));
                            },
                            $$legacy: !0,
                          });
                        }
                      };
                    t(c, (e) => {
                      (f(a), T(() => f(a).type === `textarea`) ? e(u) : e(d, -1));
                    });
                    var p = D(c, 2),
                      h = (t) => {
                        var n = we(),
                          o = m(n, !0);
                        (l(n), e(() => r(o, (f(a), T(() => f(a).helpText)))), i(t, n));
                      };
                    (t(p, (e) => {
                      (f(a), T(() => f(a).helpText) && e(h));
                    }),
                      l(o),
                      i(n, o));
                  },
                );
                var h = D(p, 2);
                {
                  let t = w(() => f(Y) || !f(Ie));
                  R(h, {
                    class: `w-full`,
                    get disabled() {
                      return f(t);
                    },
                    $$events: { click: Re },
                    children: (t, n) => {
                      j();
                      var a = d();
                      (e(() =>
                        r(
                          a,
                          (f(Y), f(q), T(() => (f(Y) ? `Connecting...` : `Connect ${f(q).name}`))),
                        ),
                      ),
                        i(t, a));
                    },
                    $$slots: { default: !0 },
                  });
                }
                (R(D(h, 2), {
                  variant: `outline`,
                  class: `w-full`,
                  $$events: { click: () => O(J, 1) },
                  children: (e, t) => {
                    var n = Ee();
                    (I(C(n), { class: `h-4 w-4 mr-1.5` }), j(), i(e, n));
                  },
                  $$slots: { default: !0 },
                }),
                  l(s),
                  e(() =>
                    r(
                      u,
                      `Enter the credentials for ${(f(q), T(() => f(q).name)) ?? ``}. These are stored encrypted and used to connect to the API on your behalf.`,
                    ),
                  ),
                  i(n, s));
              },
              _ = (t) => {
                var n = ke(),
                  a = m(n);
                (L(m(a), { class: `w-6 h-6 text-green-500` }), l(a));
                var o = D(a, 2),
                  s = m(o),
                  c = m(s);
                (l(s),
                  j(2),
                  l(o),
                  se(D(o, 2), {
                    children: (e, t) => {
                      var n = Oe(),
                        r = C(n);
                      (R(m(r), {
                        size: `sm`,
                        children: (e, t) => {
                          (j(), i(e, d(`API Manager`)));
                        },
                        $$slots: { default: !0 },
                      }),
                        l(r));
                      var a = D(r, 2);
                      (R(m(a), {
                        variant: `outline`,
                        size: `sm`,
                        children: (e, t) => {
                          (j(), i(e, d(`Workflows`)));
                        },
                        $$slots: { default: !0 },
                      }),
                        l(a),
                        R(D(a, 2), {
                          variant: `secondary`,
                          size: `sm`,
                          $$events: { click: () => O(K, !1) },
                          children: (e, t) => {
                            (j(), i(e, d(`Close`)));
                          },
                          $$slots: { default: !0 },
                        }),
                        i(e, n));
                    },
                    $$slots: { default: !0 },
                  }),
                  l(n),
                  e(() => r(c, `${(f(q), T(() => f(q).name)) ?? ``} Connected`)),
                  i(t, n));
              };
            (t(p, (e) => {
              f(J) === 1 ? e(h) : f(J) === 2 ? e(g, 1) : e(_, -1);
            }),
              i(n, s));
          };
        (t(h, (e) => {
          f(q) && e(g);
        }),
          i(n, p));
      },
      $$slots: { default: !0 },
    });
  }
  (i(N, He), h(), Fe());
}
export { Me as component };
