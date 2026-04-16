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
  V as l,
  W as u,
  Z as d,
  _ as f,
  at as p,
  b as m,
  bt as h,
  c as g,
  ct as _,
  d as v,
  h as y,
  l as b,
  ot as x,
  pt as S,
  q as C,
  r as w,
  st as T,
  ut as E,
  v as D,
  w as O,
  wt as k,
  xt as A,
  z as j,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as ee } from "../chunks/gpmMc_Bx.js";
import { t as M } from "../chunks/CMGwYO6i2.js";
import { n as N, t as P } from "../chunks/BEJa09Kq2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as I } from "../chunks/DmQt9wwK2.js";
import { t as L } from "../chunks/DOfJvt542.js";
import { t as R } from "../chunks/C8W1vu9i2.js";
import { t as z } from "../chunks/ejJaicvO2.js";
import { t as B } from "../chunks/oRaErrij2.js";
var V = j(
    `<div class="text-sm text-muted-foreground">Total Evidence</div><div class="text-2xl font-bold mt-1"> </div>`,
    1,
  ),
  te = j(
    `<div class="text-sm text-muted-foreground">Frameworks Covered</div><div class="text-2xl font-bold mt-1"> </div>`,
    1,
  ),
  ne = j(
    `<div class="text-sm text-muted-foreground">Controls Covered</div><div class="text-2xl font-bold mt-1"> </div>`,
    1,
  ),
  re = j(
    `<div class="text-sm text-muted-foreground">Positive Events</div><div class="text-2xl font-bold mt-1 text-success"> </div>`,
    1,
  ),
  ie = j(
    `<div class="text-sm text-muted-foreground">Detrimental Events</div><div class="text-2xl font-bold mt-1 text-destructive"> </div>`,
    1,
  ),
  ae = j(`<option> </option>`),
  oe = j(`<option> </option>`),
  se = j(
    `<div class="grid gap-3 md:grid-cols-3 lg:grid-cols-6"><div class="space-y-1.5"><!> <select class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"><option>All Frameworks</option><!></select></div> <div class="space-y-1.5"><!> <!></div> <div class="space-y-1.5"><!> <select class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"><option>All Categories</option><!></select></div> <div class="space-y-1.5"><!> <select class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"><option>All</option><option>Positive</option><option>Detrimental</option><option>Neutral</option></select></div> <div class="space-y-1.5"><!> <input type="date" class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"/></div> <div class="flex items-end gap-2"><!> <!></div></div>`,
  ),
  ce = j(`<div class="space-y-3"></div>`),
  le = j(`<!> <p class="pl-7"> </p>`, 1),
  ue = j(
    `<button type="button" class="inline-flex items-center justify-center rounded h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" title="Copy hash"><!></button>`,
  ),
  de = j(
    `<div class="mt-3 pt-3 border-t space-y-2"><div><div class="text-xs font-semibold text-muted-foreground mb-1">Full Hash</div> <div class="flex items-center gap-2"><code class="text-[11px] bg-muted px-2 py-1 rounded break-all"> </code> <!></div></div> <div><div class="text-xs font-semibold text-muted-foreground mb-1">Metadata</div> <pre class="text-[11px] bg-muted px-2 py-1.5 rounded overflow-x-auto whitespace-pre-wrap"> </pre></div></div>`,
  ),
  fe = j(
    `<div class="flex items-start justify-between gap-3"><div class="space-y-1.5"><div class="flex items-center gap-2 flex-wrap"><!> <!> <!> <span class="text-xs text-muted-foreground"> </span></div> <div class="text-sm font-medium"> </div> <div class="text-sm text-muted-foreground"> </div> <div class="text-xs text-muted-foreground"> </div></div> <div class="text-right shrink-0"><div class="text-xs text-muted-foreground">Confidence</div> <div class="text-sm font-semibold"> </div> <div class="flex items-center justify-end gap-1 mt-1"><span class="text-[11px] text-muted-foreground"> </span> <!></div></div></div> <!>`,
    1,
  ),
  pe = j(`<button type="button"> </button>`),
  me = j(
    `<div class="space-y-3"></div> <div class="flex items-center justify-between text-sm text-muted-foreground"><div class="flex items-center gap-3"><span> </span> <div class="flex items-center gap-1"><span class="text-xs">Per page:</span> <!></div></div> <div class="flex items-center gap-2"><!> <!></div></div>`,
    1,
  ),
  he = j(
    `<div class="space-y-6"><div><a href="/console/compliance" class="text-sm text-primary hover:underline">← Back to Compliance</a> <h1 class="text-2xl font-semibold tracking-tight">Evidence Activity Feed</h1> <p class="text-sm text-muted-foreground">Lifecycle operations mapped to compliance controls with evidence impact.</p></div> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"><!> <!> <!> <!> <!></div> <!> <!></div>`,
  );
function ge(j, ge) {
  A(ge, !1);
  let _e = _(),
    ve = _(),
    ye = _(),
    be = _(),
    xe = _(!0),
    H = _(null),
    U = _([]),
    W = _({
      totalEvidence: 0,
      frameworksCovered: 0,
      controlsCovered: 0,
      positiveCount: 0,
      detrimentalCount: 0,
    }),
    Se = _([]),
    Ce = [
      `access_grant`,
      `access_revoke`,
      `onboarding`,
      `offboarding`,
      `policy_change`,
      `config_change`,
      `adapter_pull`,
      `incident`,
      `review_complete`,
      `mfa_enforcement`,
      `sso_enforcement`,
    ],
    G = _(``),
    K = _(``),
    q = _(``),
    J = _(`all`),
    Y = _(``),
    X = _(50),
    Z = _(0),
    Q = _(0),
    we = _(null);
  function Te(e) {
    return e === `positive` ? `success` : e === `detrimental` ? `destructive` : `secondary`;
  }
  function Ee(e) {
    return typeof e != `number` || Number.isNaN(e) ? `--` : `${Math.round(e * 100)}%`;
  }
  function De(e) {
    return e ? (e.length <= 16 ? e : `${e.slice(0, 10)}...${e.slice(-6)}`) : `pending`;
  }
  async function Oe(e) {
    try {
      await navigator.clipboard.writeText(e);
    } catch {}
  }
  function ke() {
    let e = new URLSearchParams();
    return (
      e.set(`limit`, String(u(X))),
      e.set(`offset`, String(u(Z))),
      u(G).trim() && e.set(`framework`, u(G).trim()),
      u(K).trim() && e.set(`controlId`, u(K).trim()),
      u(q).trim() && e.set(`category`, u(q).trim()),
      u(J) !== `all` && e.set(`impact`, u(J)),
      u(Y).trim() && e.set(`since`, u(Y).trim()),
      e.toString()
    );
  }
  async function $() {
    (E(xe, !0), E(H, null));
    try {
      let e = await fetch(`/api/evidence-feed?${ke()}`);
      if (!e.ok) throw Error(`Failed to load evidence feed (${e.status})`);
      let t = await e.json();
      (E(U, Array.isArray(t?.feed) ? t.feed : []),
        E(Q, Number(t?.meta?.total ?? 0)),
        E(X, Number(t?.meta?.limit ?? u(X))),
        E(Z, Number(t?.meta?.offset ?? u(Z))),
        E(W, {
          totalEvidence: Number(t?.summary?.totalEvidence ?? 0),
          frameworksCovered: Number(t?.summary?.frameworksCovered ?? 0),
          controlsCovered: Number(t?.summary?.controlsCovered ?? 0),
          positiveCount: Number(t?.summary?.positiveCount ?? 0),
          detrimentalCount: Number(t?.summary?.detrimentalCount ?? 0),
        }));
    } catch (e) {
      (E(H, e?.message || `Failed to load evidence feed`), E(U, []), E(Q, 0));
    } finally {
      E(xe, !1);
    }
  }
  function Ae() {
    (E(Z, 0), $());
  }
  function je() {
    (E(G, ``), E(K, ``), E(q, ``), E(J, `all`), E(Y, ``), E(Z, 0), $());
  }
  function Me() {
    u(ye) && (E(Z, Math.max(0, u(Z) - u(X))), $());
  }
  function Ne() {
    u(be) && (E(Z, u(Z) + u(X)), $());
  }
  async function Pe() {
    try {
      let e = await fetch(`/api/tenant-compliance/controls`);
      e.ok && E(Se, (await e.json()).frameworks || []);
    } catch {}
  }
  (w(async () => {
    await Promise.all([Pe(), $()]);
  }),
    d(
      () => (u(Q), u(Z)),
      () => {
        E(_e, u(Q) === 0 ? 0 : u(Z) + 1);
      },
    ),
    d(
      () => (u(Z), u(X), u(Q)),
      () => {
        E(ve, Math.min(u(Z) + u(X), u(Q)));
      },
    ),
    d(
      () => u(Z),
      () => {
        E(ye, u(Z) > 0);
      },
    ),
    d(
      () => (u(Z), u(X), u(Q)),
      () => {
        E(be, u(Z) + u(X) < u(Q));
      },
    ),
    s(),
    b());
  var Fe = he(),
    Ie = T(p(Fe), 2),
    Le = p(Ie);
  N(Le, {
    children: (t, n) => {
      P(t, {
        class: `pt-5`,
        children: (t, n) => {
          var a = V(),
            o = T(x(a)),
            s = p(o, !0);
          (c(o), e(() => r(s, (u(W), C(() => u(W).totalEvidence)))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  });
  var Re = T(Le, 2);
  N(Re, {
    children: (t, n) => {
      P(t, {
        class: `pt-5`,
        children: (t, n) => {
          var a = te(),
            o = T(x(a)),
            s = p(o, !0);
          (c(o), e(() => r(s, (u(W), C(() => u(W).frameworksCovered)))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  });
  var ze = T(Re, 2);
  N(ze, {
    children: (t, n) => {
      P(t, {
        class: `pt-5`,
        children: (t, n) => {
          var a = ne(),
            o = T(x(a)),
            s = p(o, !0);
          (c(o), e(() => r(s, (u(W), C(() => u(W).controlsCovered)))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  });
  var Be = T(ze, 2);
  (N(Be, {
    children: (t, n) => {
      P(t, {
        class: `pt-5`,
        children: (t, n) => {
          var a = re(),
            o = T(x(a)),
            s = p(o, !0);
          (c(o), e(() => r(s, (u(W), C(() => u(W).positiveCount)))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  }),
    N(T(Be, 2), {
      children: (t, n) => {
        P(t, {
          class: `pt-5`,
          children: (t, n) => {
            var a = ie(),
              o = T(x(a)),
              s = p(o, !0);
            (c(o), e(() => r(s, (u(W), C(() => u(W).detrimentalCount)))), i(t, a));
          },
          $$slots: { default: !0 },
        });
      },
      $$slots: { default: !0 },
    }),
    c(Ie));
  var Ve = T(Ie, 2);
  N(Ve, {
    children: (t, n) => {
      P(t, {
        class: `pt-5`,
        children: (t, n) => {
          var s = se(),
            d = p(s),
            h = p(d);
          z(h, {
            children: (e, t) => {
              (k(), i(e, l(`Framework`)));
            },
            $$slots: { default: !0 },
          });
          var g = T(h, 2),
            _ = p(g);
          ((_.value = _.__value = ``),
            a(
              T(_),
              1,
              () => u(Se),
              o,
              (t, n) => {
                var a = ae(),
                  o = p(a, !0);
                c(a);
                var s = {};
                (e(() => {
                  (r(o, u(n)), s !== (s = u(n)) && (a.value = (a.__value = u(n)) ?? ``));
                }),
                  i(t, a));
              },
            ),
            c(g),
            c(d));
          var v = T(d, 2),
            b = p(v);
          (z(b, {
            children: (e, t) => {
              (k(), i(e, l(`Control ID`)));
            },
            $$slots: { default: !0 },
          }),
            R(T(b, 2), {
              placeholder: `e.g. CC6.1`,
              get value() {
                return u(K);
              },
              set value(e) {
                E(K, e);
              },
              $$legacy: !0,
            }),
            c(v));
          var x = T(v, 2),
            S = p(x);
          z(S, {
            children: (e, t) => {
              (k(), i(e, l(`Category`)));
            },
            $$slots: { default: !0 },
          });
          var w = T(S, 2),
            D = p(w);
          ((D.value = D.__value = ``),
            a(
              T(D),
              1,
              () => Ce,
              o,
              (t, n) => {
                var a = oe(),
                  o = p(a, !0);
                c(a);
                var s = {};
                (e(
                  (e) => {
                    (r(o, e), s !== (s = u(n)) && (a.value = (a.__value = u(n)) ?? ``));
                  },
                  [() => (u(n), C(() => u(n).replace(/_/g, ` `)))],
                ),
                  i(t, a));
              },
            ),
            c(w),
            c(x));
          var O = T(x, 2),
            A = p(O);
          z(A, {
            children: (e, t) => {
              (k(), i(e, l(`Impact`)));
            },
            $$slots: { default: !0 },
          });
          var j = T(A, 2),
            ee = p(j);
          ee.value = ee.__value = `all`;
          var M = T(ee);
          M.value = M.__value = `positive`;
          var N = T(M);
          N.value = N.__value = `detrimental`;
          var P = T(N);
          ((P.value = P.__value = `neutral`), c(j), c(O));
          var I = T(O, 2),
            L = p(I);
          z(L, {
            children: (e, t) => {
              (k(), i(e, l(`Since`)));
            },
            $$slots: { default: !0 },
          });
          var B = T(L, 2);
          (f(B), c(I));
          var V = T(I, 2),
            te = p(V);
          (F(te, {
            $$events: { click: Ae },
            children: (e, t) => {
              (k(), i(e, l(`Apply`)));
            },
            $$slots: { default: !0 },
          }),
            F(T(te, 2), {
              variant: `outline`,
              $$events: { click: je },
              children: (e, t) => {
                (k(), i(e, l(`Reset`)));
              },
              $$slots: { default: !0 },
            }),
            c(V),
            c(s),
            m(
              g,
              () => u(G),
              (e) => E(G, e),
            ),
            m(
              w,
              () => u(q),
              (e) => E(q, e),
            ),
            m(
              j,
              () => u(J),
              (e) => E(J, e),
            ),
            y(
              B,
              () => u(Y),
              (e) => E(Y, e),
            ),
            i(t, s));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  });
  var He = T(Ve, 2),
    Ue = (e) => {
      var t = ce();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          B(e, { class: `h-16 rounded-lg` });
        },
      ),
        c(t),
        i(e, t));
    },
    We = (t) => {
      L(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = le(),
            o = x(a);
          M(o, { class: `h-4 w-4` });
          var s = T(o, 2),
            l = p(s, !0);
          (c(s), e(() => r(l, u(H))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    Ge = (e) => {
      N(e, {
        class: `border-dashed`,
        children: (e, t) => {
          P(e, {
            class: `py-10 text-center text-sm text-muted-foreground`,
            children: (e, t) => {
              (k(), i(e, l(`No evidence activity matches your filters.`)));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    Ke = (s) => {
      var d = me(),
        f = x(d);
      (a(
        f,
        5,
        () => u(U),
        o,
        (a, o) => {
          N(a, {
            class: `cursor-pointer`,
            $$events: { click: () => E(we, u(we) === u(o).id ? null : u(o).id) },
            children: (a, s) => {
              P(a, {
                class: `pt-4`,
                children: (a, s) => {
                  var d = fe(),
                    f = x(d),
                    m = p(f),
                    h = p(m),
                    _ = p(h);
                  I(_, {
                    variant: `outline`,
                    children: (t, n) => {
                      k();
                      var a = l();
                      (e(() => r(a, (u(o), C(() => u(o).framework)))), i(t, a));
                    },
                    $$slots: { default: !0 },
                  });
                  var y = T(_, 2);
                  I(y, {
                    variant: `secondary`,
                    children: (t, n) => {
                      k();
                      var a = l();
                      (e(() => r(a, (u(o), C(() => u(o).controlId)))), i(t, a));
                    },
                    $$slots: { default: !0 },
                  });
                  var b = T(y, 2);
                  {
                    let t = S(() => (u(o), C(() => Te(u(o).impact))));
                    I(b, {
                      get variant() {
                        return u(t);
                      },
                      children: (t, n) => {
                        k();
                        var a = l();
                        (e(() => r(a, (u(o), C(() => u(o).impact)))), i(t, a));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  var w = T(b, 2),
                    E = p(w, !0);
                  (c(w), c(h));
                  var O = T(h, 2),
                    A = p(O, !0);
                  c(O);
                  var j = T(O, 2),
                    M = p(j, !0);
                  c(j);
                  var N = T(j, 2),
                    P = p(N);
                  (c(N), c(m));
                  var L = T(m, 2),
                    R = T(p(L), 2),
                    z = p(R, !0);
                  c(R);
                  var B = T(R, 2),
                    V = p(B),
                    te = p(V);
                  c(V);
                  var ne = T(V, 2),
                    re = (e) => {
                      var t = ue();
                      (ee(p(t), { class: `h-3 w-3` }),
                        c(t),
                        n(
                          `click`,
                          t,
                          v(() => Oe(u(o).contentHash)),
                        ),
                        i(e, t));
                    };
                  (t(ne, (e) => {
                    (u(o), C(() => u(o).contentHash) && e(re));
                  }),
                    c(B),
                    c(L),
                    c(f));
                  var ie = T(f, 2),
                    ae = (a) => {
                      var s = de(),
                        d = p(s),
                        f = T(p(d), 2),
                        m = p(f),
                        h = p(m, !0);
                      c(m);
                      var _ = T(m, 2),
                        y = (e) => {
                          F(e, {
                            size: `sm`,
                            variant: `outline`,
                            $$events: { click: () => Oe(u(o).contentHash) },
                            children: (e, t) => {
                              (k(), i(e, l(`Copy`)));
                            },
                            $$slots: { default: !0 },
                          });
                        };
                      (t(_, (e) => {
                        (u(o), C(() => u(o).contentHash) && e(y));
                      }),
                        c(f),
                        c(d));
                      var b = T(d, 2),
                        x = T(p(b), 2),
                        S = p(x, !0);
                      (c(x),
                        c(b),
                        c(s),
                        e(
                          (e) => {
                            (r(h, (u(o), C(() => u(o).contentHash || `--`))), r(S, e));
                          },
                          [
                            () => (
                              u(o),
                              C(() =>
                                JSON.stringify(
                                  {
                                    id: u(o).id,
                                    framework: u(o).framework,
                                    controlId: u(o).controlId,
                                    controlName: u(o).controlName,
                                    category: u(o).category,
                                    source: u(o).source,
                                    actor: u(o).actor,
                                    subject: u(o).subject,
                                    impact: u(o).impact,
                                    confidence: u(o).confidence,
                                    eventType: u(o).eventType,
                                    createdAt: u(o).createdAt,
                                  },
                                  null,
                                  2,
                                ),
                              )
                            ),
                          ],
                        ),
                        n(
                          `click`,
                          s,
                          v(function (e) {
                            g.call(this, ge, e);
                          }),
                        ),
                        i(a, s));
                    };
                  (t(ie, (e) => {
                    (u(we), u(o), C(() => u(we) === u(o).id) && e(ae));
                  }),
                    e(
                      (e, t, n, i) => {
                        (r(E, e),
                          r(A, (u(o), C(() => u(o).controlName))),
                          r(M, (u(o), C(() => u(o).reasoning))),
                          r(
                            P,
                            `${(u(o), C(() => u(o).eventType)) ?? ``} • ${(u(o), C(() => u(o).category)) ?? ``} • source: ${(u(o), C(() => u(o).source)) ?? ``} • actor: ${(u(o), C(() => u(o).actor || `system`)) ?? ``} • subject: ${t ?? ``}`,
                          ),
                          r(z, n),
                          D(V, `title`, (u(o), C(() => u(o).contentHash))),
                          r(te, `hash: ${i ?? ``}`));
                      },
                      [
                        () => (u(o), C(() => new Date(u(o).createdAt).toLocaleString())),
                        () => (
                          u(o),
                          C(() =>
                            typeof u(o).subject == `object`
                              ? JSON.stringify(u(o).subject)
                              : u(o).subject || `--`,
                          )
                        ),
                        () => (u(o), C(() => Ee(u(o).confidence))),
                        () => (u(o), C(() => De(u(o).contentHash))),
                      ],
                    ),
                    i(a, d));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        },
      ),
        c(f));
      var m = T(f, 2),
        h = p(m),
        _ = p(h),
        y = p(_);
      c(_);
      var b = T(_, 2);
      (a(
        T(p(b), 2),
        0,
        () => [25, 50, 100],
        o,
        (t, a) => {
          var o = pe(),
            s = p(o, !0);
          (c(o),
            e(() => {
              (O(
                o,
                1,
                `px-2 py-0.5 text-xs rounded border ${u(X) === a ? `bg-primary text-primary-foreground border-primary` : `border-input bg-background hover:bg-muted`}`,
              ),
                r(s, a));
            }),
            n(`click`, o, () => {
              (E(X, a), E(Z, 0), $());
            }),
            i(t, o));
        },
      ),
        c(b),
        c(h));
      var w = T(h, 2),
        A = p(w);
      {
        let e = S(() => !u(ye));
        F(A, {
          size: `sm`,
          variant: `outline`,
          get disabled() {
            return u(e);
          },
          $$events: { click: Me },
          children: (e, t) => {
            (k(), i(e, l(`Previous`)));
          },
          $$slots: { default: !0 },
        });
      }
      var j = T(A, 2);
      {
        let e = S(() => !u(be));
        F(j, {
          size: `sm`,
          variant: `outline`,
          get disabled() {
            return u(e);
          },
          $$events: { click: Ne },
          children: (e, t) => {
            (k(), i(e, l(`Next`)));
          },
          $$slots: { default: !0 },
        });
      }
      (c(w),
        c(m),
        e(() => r(y, `Showing ${u(_e) ?? ``}–${u(ve) ?? ``} of ${u(Q) ?? ``}`)),
        i(s, d));
    };
  (t(He, (e) => {
    u(xe) ? e(Ue) : u(H) ? e(We, 1) : (u(U), C(() => u(U).length === 0) ? e(Ge, 2) : e(Ke, -1));
  }),
    c(Fe),
    i(j, Fe),
    h());
}
export { ge as component };
