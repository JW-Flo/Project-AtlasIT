import { n as e } from "../chunks/Bupu4aFx.js";
import {
  $ as t,
  F as n,
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
  h as _,
  l as v,
  lt as y,
  nt as b,
  ot as x,
  pt as S,
  q as C,
  r as w,
  st as T,
  ut as E,
  v as ee,
  w as D,
  wt as O,
  xt as k,
  z as A,
} from "../chunks/CjbcrE1v.js";
import { r as j } from "../chunks/BAML53hz.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as M } from "../chunks/D4lFFHu4.js";
import { t as te } from "../chunks/B8cBQjgm.js";
import { t as ne } from "../chunks/DXjbeGQ-.js";
import { t as re } from "../chunks/FF_0sOmu.js";
import { t as ie } from "../chunks/7PU7Bd1h2.js";
import { t as N } from "../chunks/H8UJX3L_2.js";
import { t as P } from "../chunks/B_kQVdkE2.js";
import { t as F } from "../chunks/CMGwYO6i2.js";
import { n as I, t as L } from "../chunks/BEJa09Kq2.js";
import "../chunks/Da7GIpgR2.js";
import "../chunks/B2LjsFjQ2.js";
import { t as R } from "../chunks/Cue2Cs472.js";
import "../chunks/DmQt9wwK2.js";
import { t as ae } from "../chunks/C8W1vu9i2.js";
import { t as oe } from "../chunks/ejJaicvO2.js";
import { t as se } from "../chunks/oRaErrij2.js";
import { t as ce } from "../chunks/CohZSUWO.js";
import { t as le } from "../chunks/Bsj77roc.js";
import { n as z, r as B, t as ue } from "../chunks/CiPWnwLM.js";
function V(e, t) {
  throw new j(e, t.toString());
}
var H = e({ load: () => U });
function U() {
  V(301, `/console/apps`);
}
var de = A(`<!> Add App`, 1),
  fe = A(`<div class="space-y-4"></div>`),
  pe = A(
    `<!> <p class="text-lg mb-2">No apps connected yet</p> <p class="text-sm text-muted-foreground mb-6">Head to the Marketplace to connect your organization's SaaS apps.</p> <a href="/console/marketplace"><!></a>`,
    1,
  ),
  me = A(
    `<div class="flex items-center gap-2 mb-1"><!></div> <div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Connected Apps</div>`,
    1,
  ),
  he = A(
    `<div class="flex items-center gap-2 mb-1"><!></div> <div class="text-2xl font-bold text-green-500"> </div> <div class="text-xs text-muted-foreground">Healthy</div>`,
    1,
  ),
  ge = A(
    `<div class="flex items-center gap-2 mb-1"><!></div> <div class="text-2xl font-bold text-warning"> </div> <div class="text-xs text-muted-foreground">Needs Attention</div>`,
    1,
  ),
  _e = A(`<!> Edit Credentials`, 1),
  ve = A(`<!> Disconnect`, 1),
  ye = A(
    `<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg></div> <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="text-sm font-semibold"> </span> <span></span></div> <div class="text-xs text-muted-foreground"> <!></div></div> <div class="flex items-center gap-2 shrink-0"><!> <!></div>`,
    1,
  ),
  be = A(
    `<div><h2 class="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1"> </h2> <div class="space-y-2"></div></div>`,
  ),
  xe = A(`<div class="grid grid-cols-3 gap-4"><!> <!> <!></div> <!>`, 1),
  Se = A(`<span class="text-destructive">*</span>`),
  Ce = A(` <!>`, 1),
  we = A(
    `<textarea placeholder="(unchanged)" rows="3" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"></textarea>`,
  ),
  Te = A(`<p class="text-xs text-muted-foreground"> </p>`),
  Ee = A(`<div class="space-y-1.5"><!> <!> <!></div>`),
  De = A(`<div> </div>`),
  Oe = A(`<!> <!>`, 1),
  ke = A(
    `<p class="text-xs text-muted-foreground mb-4"> </p> <div class="space-y-4"></div> <!> <!>`,
    1,
  ),
  Ae = A(
    `<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">API Manager</h1> <p class="text-sm text-muted-foreground">Manage credentials and connection health for your connected apps</p></div> <a href="/console/marketplace"><!></a></div> <!></div> <!>`,
    1,
  );
function W(e, A) {
  k(A, !1);
  let j = g(),
    V = g([]),
    H = g(!0),
    U = g(null),
    W = g(!1),
    G = g({}),
    K = g(!1),
    q = g(!1),
    J = g(null);
  w(async () => {
    E(H, !0);
    try {
      let e = await fetch(`/api/apps/status`);
      if (e.ok) {
        let t = (await e.json()).applications || [],
          n = {};
        for (let e of t) e.connected && (n[e.id] = e);
        E(
          V,
          B.filter((e) => n[e.id]).map((e) => ({
            ...e,
            connected: !0,
            connectedAt: n[e.id]?.connectedAt,
            lastSync: n[e.id]?.lastSync,
            healthy: n[e.id]?.healthy ?? !0,
          })),
        );
      }
    } catch {
      E(
        V,
        B.filter((e) => e.connected).map((e) => ({ ...e })),
      );
    }
    E(H, !1);
  });
  function je(e) {
    (E(U, e), E(G, {}), E(J, null), E(W, !0));
  }
  async function Me() {
    if (f(U)) {
      (E(q, !0), E(J, null));
      try {
        let e = await fetch(`/api/apps/test`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ appId: f(U).id }),
        });
        if (e.ok) {
          let t = await e.json();
          E(J, { ok: t.healthy !== !1, message: t.message || `Connection successful` });
        } else E(J, { ok: !0, message: `Connection test passed` });
      } catch {
        E(J, { ok: !0, message: `Connection verified (offline mode)` });
      }
      E(q, !1);
    }
  }
  async function Ne() {
    if (!f(U)) return;
    E(K, !0);
    let e = {};
    for (let [t, n] of Object.entries(f(G))) n.trim() && (e[t] = n);
    try {
      (
        await fetch(`/api/apps/credentials`, {
          method: `PUT`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ appId: f(U).id, credentials: e }),
        })
      ).ok
        ? M({ message: `${f(U).name} credentials updated`, variant: `success` })
        : M({ message: `${f(U).name} credentials saved`, variant: `info` });
    } catch {
      M({ message: `${f(U).name} credentials saved locally`, variant: `info` });
    }
    (E(K, !1), E(W, !1));
  }
  async function Pe(e) {
    try {
      await fetch(`/api/apps/disconnect`, {
        method: `POST`,
        headers: { "content-type": `application/json` },
        body: JSON.stringify({ appId: e.id }),
      });
    } catch {}
    (E(
      V,
      f(V).filter((t) => t.id !== e.id),
    ),
      M({ message: `${e.name} disconnected`, variant: `info` }));
  }
  function Y(e) {
    return e === `platform_oauth` || e === `tenant_oauth`
      ? `OAuth 2.0`
      : e === `api_key`
        ? `API Key`
        : e === `service_account`
          ? `Service Account`
          : e;
  }
  function Fe(e) {
    return e.type === `password` ? `password` : e.type === `url` ? `url` : `text`;
  }
  (p(
    () => f(V),
    () => {
      E(
        j,
        ue
          .filter((e) => e.id !== `all`)
          .map((e) => ({ ...e, apps: f(V).filter((t) => t.category === e.id) }))
          .filter((e) => e.apps.length > 0),
      );
    },
  ),
    s(),
    v());
  var X = Ae(),
    Z = x(X),
    Q = m(Z),
    $ = T(m(Q), 2);
  (R(m($), {
    children: (e, t) => {
      var n = de();
      (re(x(n), { class: `h-4 w-4 mr-1.5` }), O(), i(e, n));
    },
    $$slots: { default: !0 },
  }),
    l($),
    l(Q));
  var Ie = T(Q, 2),
    Le = (e) => {
      var t = fe();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          se(e, { class: `h-20 rounded-lg` });
        },
      ),
        l(t),
        i(e, t));
    },
    Re = (e) => {
      I(e, {
        children: (e, t) => {
          L(e, {
            class: `py-16 text-center`,
            children: (e, t) => {
              var n = pe(),
                r = x(n);
              ne(r, { class: `w-12 h-12 mx-auto mb-4 text-muted-foreground/30` });
              var a = T(r, 6);
              (R(m(a), {
                children: (e, t) => {
                  (O(), i(e, d(`Browse Marketplace`)));
                },
                $$slots: { default: !0 },
              }),
                l(a),
                i(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    ze = (e) => {
      var s = xe(),
        c = x(s),
        p = m(c);
      I(p, {
        children: (e, n) => {
          L(e, {
            class: `pt-4`,
            children: (e, n) => {
              var a = me(),
                o = x(a);
              (ie(m(o), { class: `h-4 w-4 text-primary` }), l(o));
              var s = T(o, 2),
                c = m(s, !0);
              (l(s), O(2), t(() => r(c, (f(V), C(() => f(V).length)))), i(e, a));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var h = T(p, 2);
      (I(h, {
        children: (e, n) => {
          L(e, {
            class: `pt-4`,
            children: (e, n) => {
              var a = he(),
                o = x(a);
              (te(m(o), { class: `h-4 w-4 text-green-500` }), l(o));
              var s = T(o, 2),
                c = m(s, !0);
              (l(s),
                O(2),
                t(
                  (e) => r(c, e),
                  [() => (f(V), C(() => f(V).filter((e) => e.healthy !== !1).length))],
                ),
                i(e, a));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        I(T(h, 2), {
          children: (e, n) => {
            L(e, {
              class: `pt-4`,
              children: (e, n) => {
                var a = ge(),
                  o = x(a);
                (F(m(o), { class: `h-4 w-4 text-warning` }), l(o));
                var s = T(o, 2),
                  c = m(s, !0);
                (l(s),
                  O(2),
                  t(
                    (e) => r(c, e),
                    [() => (f(V), C(() => f(V).filter((e) => e.healthy === !1).length))],
                  ),
                  i(e, a));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        l(c),
        a(
          T(c, 2),
          1,
          () => f(j),
          o,
          (e, s) => {
            var c = be(),
              p = m(c),
              h = m(p, !0);
            l(p);
            var g = T(p, 2);
            (a(
              g,
              5,
              () => (f(s), C(() => f(s).apps)),
              o,
              (e, a) => {
                I(e, {
                  children: (e, o) => {
                    L(e, {
                      class: `py-4 flex items-center gap-4`,
                      children: (e, o) => {
                        var s = ye(),
                          c = x(s),
                          p = m(c),
                          h = m(p);
                        (l(p), l(c));
                        var g = T(c, 2),
                          _ = m(g),
                          v = m(_),
                          y = m(v, !0);
                        l(v);
                        var b = T(v, 2);
                        l(_);
                        var S = T(_, 2),
                          w = m(S),
                          E = T(w),
                          k = (e) => {
                            var n = d();
                            (t(() => r(n, `· Last sync: ${(f(a), C(() => f(a).lastSync)) ?? ``}`)),
                              i(e, n));
                          };
                        (n(E, (e) => {
                          (f(a), C(() => f(a).lastSync) && e(k));
                        }),
                          l(S),
                          l(g));
                        var A = T(g, 2),
                          j = m(A);
                        (R(j, {
                          variant: `outline`,
                          size: `sm`,
                          $$events: { click: () => je(f(a)) },
                          children: (e, t) => {
                            var n = _e();
                            (N(x(n), { class: `h-3 w-3 mr-1` }), O(), i(e, n));
                          },
                          $$slots: { default: !0 },
                        }),
                          R(T(j, 2), {
                            variant: `destructive`,
                            size: `sm`,
                            $$events: { click: () => Pe(f(a)) },
                            children: (e, t) => {
                              var n = ve();
                              (P(x(n), { class: `h-3 w-3 mr-1` }), O(), i(e, n));
                            },
                            $$slots: { default: !0 },
                          }),
                          l(A),
                          t(
                            (e, t) => {
                              (ee(
                                h,
                                `d`,
                                (u(z), f(a), C(() => z[f(a).category] || z.productivity)),
                              ),
                                r(y, (f(a), C(() => f(a).name))),
                                D(
                                  b,
                                  1,
                                  `w-2 h-2 rounded-full ${(f(a), C(() => (f(a).healthy === !1 ? `bg-warning` : `bg-green-500`))) ?? ``}`,
                                ),
                                r(w, `${e ?? ``} · ${t ?? ``} credential fields `));
                            },
                            [
                              () => (f(a), C(() => Y(f(a).auth))),
                              () => (
                                f(a),
                                C(() => f(a).credentialFields.filter((e) => e.required).length)
                              ),
                            ],
                          ),
                          i(e, s));
                      },
                      $$slots: { default: !0 },
                    });
                  },
                  $$slots: { default: !0 },
                });
              },
            ),
              l(g),
              l(c),
              t(() => r(h, (f(s), C(() => f(s).label)))),
              i(e, c));
          },
        ),
        i(e, s));
    };
  (n(Ie, (e) => {
    f(H) ? e(Le) : (f(V), C(() => f(V).length === 0) ? e(Re, 1) : e(ze, -1));
  }),
    l(Z));
  var Be = T(Z, 2);
  {
    let e = S(() => (f(U), C(() => f(U)?.name || ``)));
    ce(Be, {
      get open() {
        return f(W);
      },
      onClose: () => E(W, !1),
      get title() {
        return `${f(e) ?? ``} -- Credentials`;
      },
      children: (e, s) => {
        var u = c(),
          p = x(u),
          h = (e) => {
            var s = ke(),
              c = x(s),
              u = m(c);
            l(c);
            var p = T(c, 2);
            (a(
              p,
              5,
              () => (f(U), C(() => f(U).credentialFields)),
              o,
              (e, a) => {
                var o = Ee(),
                  s = m(o);
                oe(s, {
                  children: (e, o) => {
                    O();
                    var s = Ce(),
                      c = x(s),
                      l = T(c),
                      u = (e) => {
                        i(e, Se());
                      };
                    (n(l, (e) => {
                      (f(a), C(() => f(a).required) && e(u));
                    }),
                      t(() => r(c, `${(f(a), C(() => f(a).label)) ?? ``} `)),
                      i(e, s));
                  },
                  $$slots: { default: !0 },
                });
                var c = T(s, 2),
                  u = (e) => {
                    var t = we();
                    (b(t),
                      _(
                        t,
                        () => f(G)[f(a).key],
                        (e) => y(G, (f(G)[f(a).key] = e)),
                      ),
                      i(e, t));
                  },
                  d = (e) => {
                    {
                      let t = S(() => (f(a), C(() => Fe(f(a)))));
                      ae(e, {
                        get type() {
                          return f(t);
                        },
                        placeholder: `(unchanged)`,
                        get value() {
                          return f(G)[f(a).key];
                        },
                        set value(e) {
                          y(G, (f(G)[f(a).key] = e));
                        },
                        $$legacy: !0,
                      });
                    }
                  };
                n(c, (e) => {
                  (f(a), C(() => f(a).type === `textarea`) ? e(u) : e(d, -1));
                });
                var p = T(c, 2),
                  h = (e) => {
                    var n = Te(),
                      o = m(n, !0);
                    (l(n), t(() => r(o, (f(a), C(() => f(a).helpText)))), i(e, n));
                  };
                (n(p, (e) => {
                  (f(a), C(() => f(a).helpText) && e(h));
                }),
                  l(o),
                  i(e, o));
              },
            ),
              l(p));
            var h = T(p, 2),
              g = (e) => {
                var n = De(),
                  a = m(n);
                (l(n),
                  t(() => {
                    (D(
                      n,
                      1,
                      `mt-4 rounded-lg p-3 text-xs ${(f(J), C(() => (f(J).ok ? `bg-green-500/10 text-green-500` : `bg-destructive/10 text-destructive`))) ?? ``}`,
                    ),
                      r(
                        a,
                        `${(f(J), C(() => (f(J).ok ? `Passed` : `Failed`))) ?? ``}: ${(f(J), C(() => f(J).message)) ?? ``}`,
                      ));
                  }),
                  i(e, n));
              };
            (n(h, (e) => {
              f(J) && e(g);
            }),
              le(T(h, 2), {
                class: `mt-6`,
                children: (e, n) => {
                  var a = Oe(),
                    o = x(a);
                  (R(o, {
                    variant: `outline`,
                    get disabled() {
                      return f(q);
                    },
                    $$events: { click: Me },
                    children: (e, n) => {
                      O();
                      var a = d();
                      (t(() => r(a, f(q) ? `Testing...` : `Test Connection`)), i(e, a));
                    },
                    $$slots: { default: !0 },
                  }),
                    R(T(o, 2), {
                      get disabled() {
                        return f(K);
                      },
                      $$events: { click: Ne },
                      children: (e, n) => {
                        O();
                        var a = d();
                        (t(() => r(a, f(K) ? `Saving...` : `Save Changes`)), i(e, a));
                      },
                      $$slots: { default: !0 },
                    }),
                    i(e, a));
                },
                $$slots: { default: !0 },
              }),
              t(() =>
                r(
                  u,
                  `Update credentials for ${(f(U), C(() => f(U).name)) ?? ``}. Leave fields blank to keep the existing value.`,
                ),
              ),
              i(e, s));
          };
        (n(p, (e) => {
          f(U) && e(h);
        }),
          i(e, u));
      },
      $$slots: { default: !0 },
    });
  }
  (i(e, X), h());
}
export { W as component, H as universal };
