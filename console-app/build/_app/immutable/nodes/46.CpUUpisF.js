import { n as e } from "../chunks/Bupu4aFx.js";
import {
  $ as t,
  C as n,
  D as r,
  F as i,
  H as a,
  I as o,
  J as s,
  L as c,
  N as l,
  P as u,
  Q as d,
  R as f,
  Tt as p,
  U as m,
  V as h,
  W as g,
  Y as _,
  Z as v,
  _ as y,
  at as b,
  b as x,
  bt as S,
  ct as C,
  gt as w,
  h as T,
  ht as E,
  l as D,
  lt as O,
  o as k,
  ot as A,
  pt as j,
  q as M,
  rt as ee,
  st as N,
  u as P,
  ut as F,
  v as I,
  wt as L,
  xt as te,
  y as R,
  z,
} from "../chunks/CjbcrE1v.js";
import { t as B } from "../chunks/CkfEZRj5.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as ne } from "../chunks/BZ8YNDoC.js";
import { t as re } from "../chunks/BGY9DLPb.js";
import { r as ie } from "../chunks/BdUjKaVy2.js";
import "../chunks/CZkNuRnP2.js";
import { n as V, t as H } from "../chunks/BEJa09Kq2.js";
import { t as U } from "../chunks/Da7GIpgR2.js";
import { t as W } from "../chunks/B2LjsFjQ2.js";
import { t as G } from "../chunks/Cue2Cs472.js";
import { t as K } from "../chunks/DmQt9wwK2.js";
import { t as ae } from "../chunks/DOfJvt542.js";
import { i as oe, n as se, r as ce, t as le } from "../chunks/C5Ue5gaR.js";
var q = e({ load: () => J }),
  J = async ({ params: e, fetch: t }) => {
    let [n, r] = await Promise.all([
      t(`/api/marketplace/${e.appId}`)
        .then((e) => e.json())
        .catch(() => ({ status: `error`, data: null })),
      t(`/api/marketplace/installs`)
        .then((e) => e.json())
        .catch(() => ({ status: `error`, data: [] })),
    ]);
    return {
      app: n?.data ?? null,
      install:
        (r?.data ?? []).find((t) => t.app_id === e.appId && t.status !== `uninstalled`) ?? null,
    };
  },
  Y = z(`<span class="text-red-400">*</span>`),
  X = z(`<p class="text-[11px] mb-1.5" style="color: var(--color-text-dim);"> </p>`),
  Z = z(
    `<label class="relative inline-flex items-center cursor-pointer gap-2"><input type="checkbox" class="sr-only peer"/> <div class="w-9 h-5 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:rounded-full after:h-4 after:w-4 after:transition-all"><div class="absolute top-[2px] start-[2px] rounded-full h-4 w-4 transition-transform bg-white"></div></div> <span class="text-xs" style="color: var(--color-text-dim);"> </span></label>`,
  ),
  ue = z(`<option> </option>`),
  Q = z(
    `<select class="w-full px-3 py-2 rounded text-sm appearance-none"><option>Select...</option><!></select>`,
  ),
  de = z(
    `<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="rounded" style="accent-color: var(--color-accent);"/> <span class="text-xs" style="color: var(--color-text);"> </span></label>`,
  ),
  fe = z(`<div class="space-y-1.5"></div>`),
  $ = z(`<input class="w-full px-3 py-2 rounded text-sm"/>`),
  pe = z(`<p class="text-[11px] mt-1 text-red-400"> </p>`),
  me = z(
    `<div><label class="block text-sm mb-1.5 font-medium" style="color: var(--color-text);"> <!></label> <!> <!> <!></div>`,
  ),
  he = z(
    `<button type="submit" class="w-full py-2.5 text-sm font-medium rounded text-white transition-colors disabled:opacity-50" style="background: var(--color-accent);"><!></button>`,
  ),
  ge = z(`<form class="space-y-4"><!> <!></form>`);
function _e(e, r) {
  te(r, !1);
  let d = k(r, `configFields`, 24, () => []),
    f = k(r, `values`, 28, () => ({})),
    _ = k(r, `onSubmit`, 8, void 0),
    v = k(r, `loading`, 8, !1),
    w = k(r, `submitLabel`, 8, `Save Configuration`),
    E = C({});
  function A() {
    F(E, {});
    for (let e of d()) {
      let t = f()[e.key];
      if (e.required && (t == null || t === ``)) {
        O(E, (g(E)[e.key] = `${e.label} is required`));
        continue;
      }
      if (!(t == null || t === ``)) {
        if (e.type === `number`) {
          let n = Number(t);
          if (isNaN(n)) {
            O(E, (g(E)[e.key] = `${e.label} must be a number`));
            continue;
          }
          (e.validation?.min !== void 0 &&
            n < e.validation.min &&
            O(E, (g(E)[e.key] = `Minimum value is ${e.validation.min}`)),
            e.validation?.max !== void 0 &&
              n > e.validation.max &&
              O(E, (g(E)[e.key] = `Maximum value is ${e.validation.max}`)));
        }
        if (e.type === `url` && typeof t == `string`)
          try {
            new URL(t);
          } catch {
            O(E, (g(E)[e.key] = `Must be a valid URL`));
          }
        (e.type === `email` &&
          typeof t == `string` &&
          (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ||
            O(E, (g(E)[e.key] = `Must be a valid email address`))),
          e.validation?.pattern &&
            typeof t == `string` &&
            !new RegExp(e.validation.pattern).test(t) &&
            O(E, (g(E)[e.key] = `Invalid format`)));
      }
    }
    return Object.keys(g(E)).length === 0;
  }
  function j() {
    A() && _()?.(f());
  }
  function ee(e) {
    switch (e.type) {
      case `number`:
        return `number`;
      case `url`:
        return `url`;
      case `email`:
        return `email`;
      case `secret`:
        return `password`;
      default:
        return `text`;
    }
  }
  function L(e, t) {
    let n = f()[e] || [];
    (n.includes(t)
      ? (f((f()[e] = n.filter((e) => e !== t)), !0),
        s(() => {
          (field, g(E));
        }))
      : (f((f()[e] = [...n, t]), !0),
        s(() => {
          (field, g(E));
        })),
      f(f()));
  }
  D();
  var z = ge(),
    B = b(z);
  l(B, 1, d, u, (e, r) => {
    var d = me(),
      h = b(d),
      _ = b(h),
      v = N(_),
      S = (e) => {
        c(e, Y());
      };
    (i(v, (e) => {
      (g(r), M(() => g(r).required) && e(S));
    }),
      p(h));
    var C = N(h, 2),
      w = (e) => {
        var n = X(),
          i = b(n, !0);
        (p(n), t(() => o(i, (g(r), M(() => g(r).description)))), c(e, n));
      };
    i(C, (e) => {
      (g(r), M(() => g(r).description) && e(w));
    });
    var D = N(C, 2),
      O = (e) => {
        var i = Z(),
          l = b(i);
        y(l);
        var u = N(l, 2),
          d = b(u);
        p(u);
        var h = N(u, 2),
          _ = b(h, !0);
        (p(h),
          p(i),
          t(() => {
            (I(i, `for`, `config-${(g(r), M(() => g(r).key)) ?? ``}`),
              I(l, `id`, `config-${(g(r), M(() => g(r).key)) ?? ``}`),
              R(l, (m(f()), g(r), M(() => !!f()[g(r).key]))),
              n(
                u,
                `background: ${(m(f()), g(r), M(() => (f()[g(r).key] ? `var(--color-accent)` : `var(--color-border)`))) ?? ``}; `,
              ),
              n(
                d,
                `transform: translateX(${(m(f()), g(r), M(() => (f()[g(r).key] ? `16px` : `0`))) ?? ``});`,
              ),
              o(_, (m(f()), g(r), M(() => (f()[g(r).key] ? `Enabled` : `Disabled`)))));
          }),
          a(`change`, l, (e) => {
            (f((f()[g(r).key] = e.currentTarget.checked), !0),
              s(() => {
                (g(r), g(E));
              }),
              f(f()));
          }),
          c(e, i));
      },
      k = (e) => {
        var i = Q(),
          a = b(i);
        ((a.value = a.__value = ``),
          l(
            N(a),
            1,
            () => (g(r), M(() => g(r).options || [])),
            u,
            (e, n) => {
              var r = ue(),
                i = b(r, !0);
              p(r);
              var a = {};
              (t(() => {
                (o(i, (g(n), M(() => g(n).label))),
                  a !== (a = (g(n), M(() => g(n).value))) &&
                    (r.value = (r.__value = (g(n), M(() => g(n).value))) ?? ``));
              }),
                c(e, r));
            },
          ),
          p(i),
          t(() => {
            (I(i, `id`, `config-${(g(r), M(() => g(r).key)) ?? ``}`),
              n(
                i,
                `background: var(--color-bg); border: 1px solid ${(g(E), g(r), M(() => (g(E)[g(r).key] ? `#ef4444` : `var(--color-border)`))) ?? ``}; color: var(--color-text);`,
              ));
          }),
          x(
            i,
            () => f()[g(r).key],
            (e) => (
              f((f()[g(r).key] = e), !0),
              s(() => {
                (g(r), g(E));
              })
            ),
          ),
          c(e, i));
      },
      A = (e) => {
        var n = fe();
        (l(
          n,
          5,
          () => (g(r), M(() => g(r).options || [])),
          u,
          (e, n) => {
            var i = de(),
              s = b(i);
            y(s);
            var l = N(s, 2),
              u = b(l, !0);
            (p(l),
              p(i),
              t(
                (e) => {
                  (R(s, e), o(u, (g(n), M(() => g(n).label))));
                },
                [() => (m(f()), g(r), g(n), M(() => (f()[g(r).key] || []).includes(g(n).value)))],
              ),
              a(`change`, s, () => L(g(r).key, g(n).value)),
              c(e, i));
          },
        ),
          p(n),
          c(e, n));
      },
      j = (e) => {
        var i = $();
        (y(i),
          t(
            (e) => {
              (I(i, `id`, `config-${(g(r), M(() => g(r).key)) ?? ``}`),
                I(i, `type`, e),
                I(i, `placeholder`, (g(r), M(() => g(r).placeholder || ``))),
                n(
                  i,
                  `background: var(--color-bg); border: 1px solid ${(g(E), g(r), M(() => (g(E)[g(r).key] ? `#ef4444` : `var(--color-border)`))) ?? ``}; color: var(--color-text);`,
                ),
                I(i, `min`, (g(r), M(() => g(r).validation?.min))),
                I(i, `max`, (g(r), M(() => g(r).validation?.max))));
            },
            [() => (g(r), M(() => ee(g(r))))],
          ),
          T(
            i,
            () => f()[g(r).key],
            (e) => (
              f((f()[g(r).key] = e), !0),
              s(() => {
                (g(r), g(E));
              })
            ),
          ),
          c(e, i));
      };
    i(D, (e) => {
      (g(r),
        M(() => g(r).type === `boolean`)
          ? e(O)
          : (g(r),
            M(() => g(r).type === `select`)
              ? e(k, 1)
              : (g(r), M(() => g(r).type === `multiselect`) ? e(A, 2) : e(j, -1))));
    });
    var P = N(D, 2),
      F = (e) => {
        var n = pe(),
          i = b(n, !0);
        (p(n), t(() => o(i, (g(E), g(r), M(() => g(E)[g(r).key])))), c(e, n));
      };
    (i(P, (e) => {
      (g(E), g(r), M(() => g(E)[g(r).key]) && e(F));
    }),
      p(d),
      t(() => {
        (I(h, `for`, `config-${(g(r), M(() => g(r).key)) ?? ``}`),
          o(_, `${(g(r), M(() => g(r).label)) ?? ``} `));
      }),
      c(e, d));
  });
  var ne = N(B, 2),
    re = (e) => {
      var n = he(),
        r = b(n),
        a = (e) => {
          c(e, h(`Saving...`));
        },
        s = (e) => {
          var n = h();
          (t(() => o(n, w())), c(e, n));
        };
      (i(r, (e) => {
        v() ? e(a) : e(s, -1);
      }),
        p(n),
        t(() => (n.disabled = v())),
        c(e, n));
    };
  (i(ne, (e) => {
    (m(d()), M(() => d().length > 0) && e(re));
  }),
    p(z),
    a(`submit`, z, P(j)),
    c(e, z),
    S());
}
var ve = z(
    `<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><h2 class="text-xl font-semibold">App not found</h2> <p class="mt-2 text-muted-foreground">This app may have been removed from the marketplace.</p> <!></div></div>`,
  ),
  ye = z(`<img class="w-16 h-16 rounded-xl object-cover"/>`),
  be = z(`<!> <!>`, 1),
  xe = z(`<!> <!>`, 1),
  Se = z(
    `<div class="flex items-start gap-6"><div class="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0"><!></div> <div class="flex-1 min-w-0"><div class="flex items-center gap-3"><h1 class="text-2xl font-bold"> </h1> <!></div> <p class="mt-1 text-sm text-muted-foreground"> </p> <p class="mt-3 text-foreground"> </p></div> <div class="flex flex-col gap-2 shrink-0"><!></div></div>`,
  ),
  Ce = z(`<p> </p>`),
  we = z(`<div class="flex flex-wrap gap-2"></div>`),
  Te = z(`<!> <!>`, 1),
  Ee = z(`<!> <!>`, 1),
  De = z(
    `<div><dt class="text-muted-foreground">Activated</dt> <dd class="font-medium"> </dd></div>`,
  ),
  Oe = z(
    `<dl class="grid grid-cols-2 gap-4 text-sm"><div><dt class="text-muted-foreground">Status</dt> <dd class="font-medium capitalize"> </dd></div> <div><dt class="text-muted-foreground">Installed</dt> <dd class="font-medium"> </dd></div> <!> <div><dt class="text-muted-foreground">Auth Model</dt> <dd class="font-medium uppercase"> </dd></div></dl>`,
  ),
  ke = z(`<!> <!>`, 1),
  Ae = z(
    `<div class="mt-6 text-center"><a target="_blank" rel="noopener noreferrer" class="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1">View Documentation <!></a></div>`,
  ),
  je = z(
    `<div class="max-w-4xl mx-auto"><button class="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><!> Back to Marketplace</button> <!> <!> <!> <!> <!> <!></div>`,
  );
function Me(e, n) {
  te(n, !1);
  let s = () => w(ie, `$session`, m),
    [m, y] = E(),
    x = C(),
    T = C(),
    O = C(),
    P = C(),
    R = k(n, `data`, 8),
    z = R().app,
    q = C(R().install),
    J = C(!1),
    Y = C(null),
    X = C(g(q)?.config ?? {});
  function Z(e) {
    if (!e) return null;
    if (typeof e == `string`)
      try {
        return JSON.parse(e);
      } catch {
        return null;
      }
    return e;
  }
  async function ue() {
    if (!(!z || !s()?.tenantId)) {
      (F(J, !0), F(Y, null));
      try {
        F(q, await se(s().tenantId, z.id));
      } catch (e) {
        F(Y, e instanceof Error ? e.message : `Install failed`);
      } finally {
        F(J, !1);
      }
    }
  }
  async function Q() {
    if (g(q)) {
      (F(J, !0), F(Y, null));
      try {
        (await ce(g(q).id), F(q, null));
      } catch (e) {
        F(Y, e instanceof Error ? e.message : `Uninstall failed`);
      } finally {
        F(J, !1);
      }
    }
  }
  async function de() {
    if (g(q)) {
      (F(J, !0), F(Y, null));
      try {
        F(q, await le(g(q).id));
      } catch (e) {
        F(Y, e instanceof Error ? e.message : `Activation failed`);
      } finally {
        F(J, !1);
      }
    }
  }
  async function fe(e) {
    if (g(q)) {
      (F(J, !0), F(Y, null));
      try {
        (F(q, await oe(g(q).id, e)), F(X, g(q).config ?? {}));
      } catch (e) {
        F(Y, e instanceof Error ? e.message : `Config update failed`);
      } finally {
        F(J, !1);
      }
    }
  }
  (v(
    () => g(q),
    () => {
      F(x, !!(g(q) && g(q).status !== `uninstalled`));
    },
  ),
    v(
      () => g(q),
      () => {
        F(T, g(q)?.status === `active`);
      },
    ),
    v(
      () => {},
      () => {
        F(O, Z(z?.capabilities) ?? []);
      },
    ),
    v(
      () => {},
      () => {
        F(P, Z(z?.config_schema) ?? []);
      },
    ),
    d(),
    D());
  var $ = f();
  r(`69b3or`, (e) => {
    _(() => {
      ee.title = `${M(() => z?.name ?? `App`) ?? ``} - Marketplace - AtlasIT`;
    });
  });
  var pe = A($),
    me = (e) => {
      var t = ve(),
        n = b(t);
      (G(N(b(n), 4), {
        class: `mt-4`,
        $$events: { click: () => B(`/marketplace`) },
        children: (e, t) => {
          (L(), c(e, h(`Back to Marketplace`)));
        },
        $$slots: { default: !0 },
      }),
        p(n),
        p(t),
        c(e, t));
    },
    he = (e) => {
      var n = je(),
        r = b(n);
      (ne(b(r), { class: `h-4 w-4` }), L(), p(r));
      var s = N(r, 2);
      V(s, {
        children: (e, n) => {
          H(e, {
            class: `pt-6`,
            children: (e, n) => {
              var r = Se(),
                a = b(r),
                s = b(a),
                l = (e) => {
                  var n = ye();
                  (t(() => {
                    (I(
                      n,
                      `src`,
                      M(() => z.logo_url),
                    ),
                      I(
                        n,
                        `alt`,
                        M(() => z.name),
                      ));
                  }),
                    c(e, n));
                },
                u = (e) => {
                  var n = h();
                  (t((e) => o(n, e), [() => M(() => z.name.charAt(0))]), c(e, n));
                };
              (i(s, (e) => {
                M(() => z.logo_url) ? e(l) : e(u, -1);
              }),
                p(a));
              var d = N(a, 2),
                f = b(d),
                m = b(f),
                _ = b(m, !0);
              (p(m),
                K(N(m, 2), {
                  variant: `secondary`,
                  children: (e, n) => {
                    L();
                    var r = h();
                    (t(() =>
                      o(
                        r,
                        M(() => z.category),
                      ),
                    ),
                      c(e, r));
                  },
                  $$slots: { default: !0 },
                }),
                p(f));
              var v = N(f, 2),
                y = b(v);
              p(v);
              var S = N(v, 2),
                C = b(S, !0);
              (p(S), p(d));
              var w = N(d, 2),
                E = b(w),
                D = (e) => {
                  {
                    let n = j(() => (g(J), M(() => g(J) || z.status !== `active`)));
                    G(e, {
                      get disabled() {
                        return g(n);
                      },
                      $$events: { click: ue },
                      children: (e, n) => {
                        L();
                        var r = h();
                        (t(() => o(r, g(J) ? `Installing...` : `Install`)), c(e, r));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                },
                O = (e) => {
                  var n = be(),
                    r = A(n);
                  (G(r, {
                    variant: `success`,
                    get disabled() {
                      return g(J);
                    },
                    $$events: { click: de },
                    children: (e, n) => {
                      L();
                      var r = h();
                      (t(() => o(r, g(J) ? `Activating...` : `Activate`)), c(e, r));
                    },
                    $$slots: { default: !0 },
                  }),
                    G(N(r, 2), {
                      variant: `destructive`,
                      get disabled() {
                        return g(J);
                      },
                      $$events: { click: Q },
                      children: (e, t) => {
                        (L(), c(e, h(`Uninstall`)));
                      },
                      $$slots: { default: !0 },
                    }),
                    c(e, n));
                },
                k = (e) => {
                  var t = xe(),
                    n = A(t);
                  (K(n, {
                    variant: `success`,
                    class: `px-5 py-2 text-center`,
                    children: (e, t) => {
                      (L(), c(e, h(`Active`)));
                    },
                    $$slots: { default: !0 },
                  }),
                    G(N(n, 2), {
                      variant: `destructive`,
                      get disabled() {
                        return g(J);
                      },
                      $$events: { click: Q },
                      children: (e, t) => {
                        (L(), c(e, h(`Uninstall`)));
                      },
                      $$slots: { default: !0 },
                    }),
                    c(e, t));
                };
              (i(E, (e) => {
                g(x) ? (g(T) ? e(k, -1) : e(O, 1)) : e(D);
              }),
                p(w),
                p(r),
                t(() => {
                  (o(
                    _,
                    M(() => z.name),
                  ),
                    o(y, `by ${M(() => z.provider) ?? ``} · v${M(() => z.version) ?? ``}`),
                    o(
                      C,
                      M(() => z.description ?? `No description available.`),
                    ));
                }),
                c(e, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var d = N(s, 2),
        f = (e) => {
          ae(e, {
            variant: `destructive`,
            class: `mt-4`,
            children: (e, n) => {
              var r = Ce(),
                i = b(r, !0);
              (p(r), t(() => o(i, g(Y))), c(e, r));
            },
            $$slots: { default: !0 },
          });
        };
      i(d, (e) => {
        g(Y) && e(f);
      });
      var m = N(d, 2),
        _ = (e) => {
          V(e, {
            class: `mt-6`,
            children: (e, n) => {
              var r = Te(),
                i = A(r);
              (U(i, {
                children: (e, t) => {
                  W(e, {
                    children: (e, t) => {
                      (L(), c(e, h(`Capabilities`)));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              }),
                H(N(i, 2), {
                  children: (e, n) => {
                    var r = we();
                    (l(
                      r,
                      5,
                      () => g(O),
                      u,
                      (e, n) => {
                        K(e, {
                          variant: `secondary`,
                          children: (e, r) => {
                            L();
                            var i = h();
                            (t((e) => o(i, e), [() => (g(n), M(() => g(n).replace(/-/g, ` `)))]),
                              c(e, i));
                          },
                          $$slots: { default: !0 },
                        });
                      },
                    ),
                      p(r),
                      c(e, r));
                  },
                  $$slots: { default: !0 },
                }),
                c(e, r));
            },
            $$slots: { default: !0 },
          });
        };
      i(m, (e) => {
        (g(O), M(() => g(O).length > 0) && e(_));
      });
      var v = N(m, 2),
        y = (e) => {
          V(e, {
            class: `mt-6`,
            children: (e, t) => {
              var n = Ee(),
                r = A(n);
              (U(r, {
                children: (e, t) => {
                  W(e, {
                    children: (e, t) => {
                      (L(), c(e, h(`Configuration`)));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              }),
                H(N(r, 2), {
                  children: (e, t) => {
                    _e(e, {
                      get fields() {
                        return g(P);
                      },
                      get values() {
                        return g(X);
                      },
                      get loading() {
                        return g(J);
                      },
                      onSubmit: fe,
                    });
                  },
                  $$slots: { default: !0 },
                }),
                c(e, n));
            },
            $$slots: { default: !0 },
          });
        };
      i(v, (e) => {
        (g(x), g(P), M(() => g(x) && g(P).length > 0) && e(y));
      });
      var S = N(v, 2),
        C = (e) => {
          V(e, {
            class: `mt-6`,
            children: (e, n) => {
              var r = ke(),
                a = A(r);
              (U(a, {
                children: (e, t) => {
                  W(e, {
                    children: (e, t) => {
                      (L(), c(e, h(`Installation Details`)));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              }),
                H(N(a, 2), {
                  children: (e, n) => {
                    var r = Oe(),
                      a = b(r),
                      s = N(b(a), 2),
                      l = b(s, !0);
                    (p(s), p(a));
                    var u = N(a, 2),
                      d = N(b(u), 2),
                      f = b(d, !0);
                    (p(d), p(u));
                    var m = N(u, 2),
                      h = (e) => {
                        var n = De(),
                          r = N(b(n), 2),
                          i = b(r, !0);
                        (p(r),
                          p(n),
                          t(
                            (e) => o(i, e),
                            [
                              () => (
                                g(q),
                                M(() => new Date(g(q).activated_at).toLocaleDateString())
                              ),
                            ],
                          ),
                          c(e, n));
                      };
                    i(m, (e) => {
                      (g(q), M(() => g(q).activated_at) && e(h));
                    });
                    var _ = N(m, 2),
                      v = N(b(_), 2),
                      y = b(v, !0);
                    (p(v),
                      p(_),
                      p(r),
                      t(
                        (e) => {
                          (o(l, (g(q), M(() => g(q).status))),
                            o(f, e),
                            o(
                              y,
                              M(() => z.auth_model),
                            ));
                        },
                        [() => (g(q), M(() => new Date(g(q).installed_at).toLocaleDateString()))],
                      ),
                      c(e, r));
                  },
                  $$slots: { default: !0 },
                }),
                c(e, r));
            },
            $$slots: { default: !0 },
          });
        };
      i(S, (e) => {
        g(q) && e(C);
      });
      var w = N(S, 2),
        E = (e) => {
          var n = Ae(),
            r = b(n);
          (re(N(b(r)), { class: `h-3 w-3` }),
            p(r),
            p(n),
            t(() =>
              I(
                r,
                `href`,
                M(() => z.documentation_url),
              ),
            ),
            c(e, n));
        };
      (i(w, (e) => {
        M(() => z.documentation_url) && e(E);
      }),
        p(n),
        a(`click`, r, () => B(`/marketplace`)),
        c(e, n));
    };
  (i(pe, (e) => {
    z ? e(he, -1) : e(me);
  }),
    c(e, $),
    S(),
    y());
}
export { Me as component, q as universal };
