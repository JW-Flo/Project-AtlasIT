import {
  $ as e,
  D as t,
  F as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Q as s,
  R as c,
  Tt as l,
  V as u,
  W as d,
  X as f,
  Z as p,
  at as m,
  b as h,
  bt as g,
  ct as _,
  gt as v,
  ht as y,
  l as b,
  ot as x,
  pt as S,
  q as C,
  r as w,
  rt as T,
  st as E,
  ut as D,
  wt as O,
  xt as ee,
  z as k,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as A } from "../chunks/D4lFFHu4.js";
import { t as te } from "../chunks/DxdpJY9x.js";
import { t as ne } from "../chunks/BP-SjGWy.js";
import { t as re } from "../chunks/FF_0sOmu.js";
import { t as ie } from "../chunks/kq9QG3T02.js";
import { t as ae } from "../chunks/Cyprtw_22.js";
import { t as oe } from "../chunks/B_kQVdkE2.js";
import { r as se, t as ce } from "../chunks/BdUjKaVy2.js";
import { n as j, t as M } from "../chunks/BEJa09Kq2.js";
import { t as le } from "../chunks/Da7GIpgR2.js";
import { t as ue } from "../chunks/B2LjsFjQ2.js";
import { t as N } from "../chunks/Cue2Cs472.js";
import { t as P } from "../chunks/DmQt9wwK2.js";
import { t as de } from "../chunks/DOfJvt542.js";
import { t as F } from "../chunks/C8W1vu9i2.js";
import { t as I } from "../chunks/ejJaicvO2.js";
import { t as L } from "../chunks/oRaErrij2.js";
var fe = k(`<span class="font-medium"> </span>`),
  pe = k(`<!> Create Pack`, 1),
  me = k(
    `<!> <div class="grid gap-4 sm:grid-cols-2"><div class="space-y-1"><!> <!></div> <div class="space-y-1"><!> <!></div> <div class="space-y-1"><!> <!></div> <div class="space-y-1 sm:col-span-2"><!> <!></div></div> <div class="mt-4 flex gap-2"><!> <!></div>`,
    1,
  ),
  he = k(`<!> <!>`, 1),
  ge = k(`<option> </option>`),
  _e = k(`<!> <!> <!>`, 1),
  ve = k(`<!> <!>`, 1),
  ye = k(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>`),
  be = k(
    `<div class="text-muted-foreground flex flex-col items-center justify-center py-16 text-center"><!> <p class="text-base font-medium">No packs found</p> <p class="mt-1 text-sm"><!></p></div>`,
  ),
  xe = k(
    `<div class="flex items-start justify-between gap-2"><!> <div class="flex shrink-0 flex-wrap gap-1"><!> <!> <!></div></div>`,
  ),
  Se = k(`<p class="text-muted-foreground text-sm leading-relaxed"> </p>`),
  Ce = k(`<!> `, 1),
  we = k(`<!> `, 1),
  Te = k(
    `<div class="space-y-2"><!> <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span class="flex items-center gap-1"><!> </span> <span> </span> <span> </span></div> <p class="text-muted-foreground text-xs">By <span class="font-medium"> </span></p></div> <div class="flex gap-2"><!></div>`,
    1,
  ),
  Ee = k(`<!> <!>`, 1),
  De = k(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>`),
  Oe = k(
    `<div class="space-y-6 p-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold tracking-tight">Compliance Packs</h1> <p class="text-muted-foreground mt-1 text-sm">Browse and install third-party compliance packs to extend your coverage. <!></p></div> <!></div> <!> <div class="flex flex-col gap-3 sm:flex-row sm:items-center"><div class="relative flex-1"><!> <!></div> <div class="flex gap-2"><select class="border-input bg-background ring-offset-background focus:ring-ring h-9 rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"><option>All frameworks</option><!></select></div></div> <!></div>`,
  );
function ke(k, ke) {
  ee(ke, !1);
  let R = () => v(se, `$session`, Ae),
    [Ae, je] = y(),
    Me = _(),
    Ne = _(),
    z = _(),
    B = _(),
    V = _(!0),
    H = _(null),
    U = _([]),
    W = _(``),
    G = _(`all`),
    K = _(!1),
    q = _(!1),
    J = _(null),
    Y = _(``),
    X = _(``),
    Z = _(``),
    Q = _(``),
    $ = _(null);
  async function Pe() {
    (D(V, !0), D(H, null));
    try {
      let e = await fetch(`/api/compliance-packs`);
      if (!e.ok) {
        let t = await e.json().catch(() => ({}));
        throw Error(t.error ?? `Failed to load packs (${e.status})`);
      }
      D(U, (await e.json()).packs ?? []);
    } catch (e) {
      D(H, e.message ?? `Failed to load compliance packs`);
    } finally {
      D(V, !1);
    }
  }
  async function Fe(e) {
    D(J, e.id);
    try {
      let t = await fetch(`/api/compliance-packs/install`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({ packId: e.id }),
        }),
        n = await t.json().catch(() => ({}));
      if (!t.ok) throw Error(n.error ?? `Install failed`);
      (D(
        U,
        d(U).map((t) => (t.id === e.id ? { ...t, installed: !0 } : t)),
      ),
        A({ variant: `success`, message: `"${e.name}" installed successfully` }));
    } catch (e) {
      A({ variant: `error`, message: e.message ?? `Failed to install pack` });
    } finally {
      D(J, null);
    }
  }
  async function Ie(e) {
    D(J, e.id);
    try {
      let t = await fetch(`/api/compliance-packs/install`, {
          method: `DELETE`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({ packId: e.id }),
        }),
        n = await t.json().catch(() => ({}));
      if (!t.ok) throw Error(n.error ?? `Uninstall failed`);
      (D(
        U,
        d(U).map((t) => (t.id === e.id ? { ...t, installed: !1 } : t)),
      ),
        A({ variant: `success`, message: `"${e.name}" uninstalled` }));
    } catch (e) {
      A({ variant: `error`, message: e.message ?? `Failed to uninstall pack` });
    } finally {
      D(J, null);
    }
  }
  async function Le() {
    if ((D($, null), !d(Y).trim() || !d(X).trim() || !d(Q).trim())) {
      D($, `Name, slug, and framework are required`);
      return;
    }
    D(q, !0);
    try {
      let e = await fetch(`/api/compliance-packs`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({
            name: d(Y).trim(),
            slug: d(X).trim(),
            description: d(Z).trim() || void 0,
            frameworkId: d(Q).trim(),
            controls: [],
          }),
        }),
        t = await e.json().catch(() => ({}));
      if (!e.ok) throw Error(t.error ?? `Create failed`);
      (A({ variant: `success`, message: `"${d(Y)}" pack created` }), Re(), await Pe());
    } catch (e) {
      D($, e.message ?? `Failed to create pack`);
    } finally {
      D(q, !1);
    }
  }
  function Re() {
    (D(Y, ``), D(X, ``), D(Z, ``), D(Q, ``), D($, null), D(K, !1));
  }
  function ze(e) {
    return e
      .toLowerCase()
      .replace(/\s+/g, `-`)
      .replace(/[^a-z0-9-]/g, ``)
      .replace(/-+/g, `-`);
  }
  function Be() {
    (!d(X) || d(X) === ze(d(Y).slice(0, -1))) && D(X, ze(d(Y)));
  }
  (w(async () => {
    (await ce(), await Pe());
  }),
    p(
      () => R(),
      () => {
        D(
          Me,
          R()?.superAdmin || R()?.roles?.includes(`owner`) || R()?.roles?.includes(`admin`) || !1,
        );
      },
    ),
    p(
      () => d(U),
      () => {
        D(Ne, [...new Set(d(U).map((e) => e.framework_id))].sort());
      },
    ),
    p(
      () => (d(U), d(W), d(G)),
      () => {
        D(
          z,
          d(U).filter((e) => {
            let t =
                !d(W) ||
                e.name.toLowerCase().includes(d(W).toLowerCase()) ||
                (e.description ?? ``).toLowerCase().includes(d(W).toLowerCase()) ||
                e.author.toLowerCase().includes(d(W).toLowerCase()),
              n = d(G) === `all` || e.framework_id === d(G);
            return t && n;
          }),
        );
      },
    ),
    p(
      () => d(U),
      () => {
        D(B, d(U).filter((e) => e.installed).length);
      },
    ),
    s(),
    b());
  var Ve = Oe();
  t(`373wlh`, (e) => {
    f(() => {
      T.title = `Compliance Packs — AtlasIT`;
    });
  });
  var He = m(Ve),
    Ue = m(He),
    We = E(m(Ue), 2),
    Ge = E(m(We)),
    Ke = (t) => {
      var n = fe(),
        a = m(n);
      (l(n), e(() => r(a, `${d(B) ?? ``} installed.`)), i(t, n));
    };
  (n(Ge, (e) => {
    d(B) > 0 && e(Ke);
  }),
    l(We),
    l(Ue));
  var qe = E(Ue, 2),
    Je = (e) => {
      N(e, {
        variant: `default`,
        $$events: { click: () => D(K, !d(K)) },
        children: (e, t) => {
          var n = pe();
          (re(x(n), { class: `mr-2 h-4 w-4` }), O(), i(e, n));
        },
        $$slots: { default: !0 },
      });
    };
  (n(qe, (e) => {
    d(Me) && e(Je);
  }),
    l(He));
  var Ye = E(He, 2),
    Xe = (t) => {
      j(t, {
        children: (t, a) => {
          var o = he(),
            s = x(o);
          (le(s, {
            children: (e, t) => {
              ue(e, {
                children: (e, t) => {
                  (O(), i(e, u(`New Compliance Pack`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            M(E(s, 2), {
              children: (t, a) => {
                var o = me(),
                  s = x(o),
                  f = (t) => {
                    de(t, {
                      variant: `destructive`,
                      class: `mb-4`,
                      children: (t, n) => {
                        O();
                        var a = u();
                        (e(() => r(a, d($))), i(t, a));
                      },
                      $$slots: { default: !0 },
                    });
                  };
                n(s, (e) => {
                  d($) && e(f);
                });
                var p = E(s, 2),
                  h = m(p),
                  g = m(h);
                (I(g, {
                  for: `pack-name`,
                  children: (e, t) => {
                    (O(), i(e, u(`Name`)));
                  },
                  $$slots: { default: !0 },
                }),
                  F(E(g, 2), {
                    id: `pack-name`,
                    placeholder: `My Custom Pack`,
                    get value() {
                      return d(Y);
                    },
                    set value(e) {
                      D(Y, e);
                    },
                    $$events: { input: Be },
                    $$legacy: !0,
                  }),
                  l(h));
                var _ = E(h, 2),
                  v = m(_);
                (I(v, {
                  for: `pack-slug`,
                  children: (e, t) => {
                    (O(), i(e, u(`Slug`)));
                  },
                  $$slots: { default: !0 },
                }),
                  F(E(v, 2), {
                    id: `pack-slug`,
                    placeholder: `my-custom-pack`,
                    get value() {
                      return d(X);
                    },
                    set value(e) {
                      D(X, e);
                    },
                    $$legacy: !0,
                  }),
                  l(_));
                var y = E(_, 2),
                  b = m(y);
                (I(b, {
                  for: `pack-framework`,
                  children: (e, t) => {
                    (O(), i(e, u(`Framework ID`)));
                  },
                  $$slots: { default: !0 },
                }),
                  F(E(b, 2), {
                    id: `pack-framework`,
                    placeholder: `SOC2, ISO27001, NIST-CSF…`,
                    get value() {
                      return d(Q);
                    },
                    set value(e) {
                      D(Q, e);
                    },
                    $$legacy: !0,
                  }),
                  l(y));
                var S = E(y, 2),
                  C = m(S);
                (I(C, {
                  for: `pack-description`,
                  children: (e, t) => {
                    (O(), i(e, u(`Description (optional)`)));
                  },
                  $$slots: { default: !0 },
                }),
                  F(E(C, 2), {
                    id: `pack-description`,
                    placeholder: `Brief description of this pack`,
                    get value() {
                      return d(Z);
                    },
                    set value(e) {
                      D(Z, e);
                    },
                    $$legacy: !0,
                  }),
                  l(S),
                  l(p));
                var w = E(p, 2),
                  T = m(w);
                (N(T, {
                  get disabled() {
                    return d(q);
                  },
                  $$events: { click: Le },
                  children: (e, t) => {
                    var r = c(),
                      a = x(r),
                      o = (e) => {
                        i(e, u(`Creating…`));
                      },
                      s = (e) => {
                        i(e, u(`Create Pack`));
                      };
                    (n(a, (e) => {
                      d(q) ? e(o) : e(s, -1);
                    }),
                      i(e, r));
                  },
                  $$slots: { default: !0 },
                }),
                  N(E(T, 2), {
                    variant: `outline`,
                    get disabled() {
                      return d(q);
                    },
                    $$events: { click: Re },
                    children: (e, t) => {
                      (O(), i(e, u(`Cancel`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  l(w),
                  i(t, o));
              },
              $$slots: { default: !0 },
            }),
            i(t, o));
        },
        $$slots: { default: !0 },
      });
    };
  n(Ye, (e) => {
    d(K) && d(Me) && e(Xe);
  });
  var Ze = E(Ye, 2),
    Qe = m(Ze),
    $e = m(Qe);
  (ie($e, { class: `text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2` }),
    F(E($e, 2), {
      placeholder: `Search packs…`,
      class: `pl-9`,
      get value() {
        return d(W);
      },
      set value(e) {
        D(W, e);
      },
      $$legacy: !0,
    }),
    l(Qe));
  var et = E(Qe, 2),
    tt = m(et),
    nt = m(tt);
  ((nt.value = nt.__value = `all`),
    a(
      E(nt),
      1,
      () => d(Ne),
      o,
      (t, n) => {
        var a = ge(),
          o = m(a, !0);
        l(a);
        var s = {};
        (e(() => {
          (r(o, d(n)), s !== (s = d(n)) && (a.value = (a.__value = d(n)) ?? ``));
        }),
          i(t, a));
      },
    ),
    l(tt),
    l(et),
    l(Ze));
  var rt = E(Ze, 2),
    it = (e) => {
      var t = ye();
      (a(
        t,
        4,
        () => [, , , , , ,],
        o,
        (e, t) => {
          j(e, {
            children: (e, t) => {
              var n = ve(),
                r = x(n);
              (le(r, {
                children: (e, t) => {
                  L(e, { class: `h-5 w-2/3` });
                },
                $$slots: { default: !0 },
              }),
                M(E(r, 2), {
                  class: `space-y-2`,
                  children: (e, t) => {
                    var n = _e(),
                      r = x(n);
                    L(r, { class: `h-4 w-full` });
                    var a = E(r, 2);
                    (L(a, { class: `h-4 w-4/5` }), L(E(a, 2), { class: `mt-4 h-8 w-24` }), i(e, n));
                  },
                  $$slots: { default: !0 },
                }),
                i(e, n));
            },
            $$slots: { default: !0 },
          });
        },
      ),
        l(t),
        i(e, t));
    },
    at = (t) => {
      de(t, {
        variant: `destructive`,
        children: (t, n) => {
          O();
          var a = u();
          (e(() => r(a, d(H))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    ot = (e) => {
      var t = be(),
        r = m(t);
      ne(r, { class: `mb-3 h-10 w-10 opacity-40` });
      var a = E(r, 4),
        o = m(a),
        s = (e) => {
          i(e, u(`Try adjusting your search or filter.`));
        },
        c = (e) => {
          i(e, u(`No compliance packs are available yet.`));
        };
      (n(o, (e) => {
        d(W) || d(G) !== `all` ? e(s) : e(c, -1);
      }),
        l(a),
        l(t),
        i(e, t));
    },
    st = (t) => {
      var o = De();
      (a(
        o,
        5,
        () => d(z),
        (e) => e.id,
        (t, a) => {
          j(t, {
            class: `flex flex-col`,
            children: (t, o) => {
              var s = Ee(),
                c = x(s);
              (le(c, {
                class: `pb-2`,
                children: (t, o) => {
                  var s = xe(),
                    c = m(s);
                  ue(c, {
                    class: `text-base leading-tight`,
                    children: (t, n) => {
                      O();
                      var o = u();
                      (e(() => r(o, (d(a), C(() => d(a).name)))), i(t, o));
                    },
                    $$slots: { default: !0 },
                  });
                  var f = E(c, 2),
                    p = m(f),
                    h = (e) => {
                      P(e, {
                        variant: `success`,
                        children: (e, t) => {
                          (O(), i(e, u(`Installed`)));
                        },
                        $$slots: { default: !0 },
                      });
                    };
                  n(p, (e) => {
                    (d(a), C(() => d(a).installed) && e(h));
                  });
                  var g = E(p, 2),
                    _ = (e) => {
                      P(e, {
                        variant: `secondary`,
                        children: (e, t) => {
                          (O(), i(e, u(`Built-in`)));
                        },
                        $$slots: { default: !0 },
                      });
                    };
                  n(g, (e) => {
                    (d(a), C(() => d(a).is_builtin) && e(_));
                  });
                  var v = E(g, 2),
                    y = (e) => {
                      P(e, {
                        variant: `destructive`,
                        children: (e, t) => {
                          (O(), i(e, u(`Deprecated`)));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    b = (e) => {
                      P(e, {
                        variant: `outline`,
                        children: (e, t) => {
                          (O(), i(e, u(`Draft`)));
                        },
                        $$slots: { default: !0 },
                      });
                    };
                  (n(v, (e) => {
                    (d(a),
                      C(() => d(a).status === `deprecated`)
                        ? e(y)
                        : (d(a), C(() => d(a).status === `draft`) && e(b, 1)));
                  }),
                    l(f),
                    l(s),
                    i(t, s));
                },
                $$slots: { default: !0 },
              }),
                M(E(c, 2), {
                  class: `flex flex-1 flex-col justify-between gap-4`,
                  children: (t, o) => {
                    var s = Te(),
                      c = x(s),
                      u = m(c),
                      f = (t) => {
                        var n = Se(),
                          o = m(n, !0);
                        (l(n), e(() => r(o, (d(a), C(() => d(a).description)))), i(t, n));
                      };
                    n(u, (e) => {
                      (d(a), C(() => d(a).description) && e(f));
                    });
                    var p = E(u, 2),
                      h = m(p),
                      g = m(h);
                    ae(g, { class: `h-3.5 w-3.5` });
                    var _ = E(g);
                    l(h);
                    var v = E(h, 2),
                      y = m(v);
                    l(v);
                    var b = E(v, 2),
                      w = m(b);
                    (l(b), l(p));
                    var T = E(p, 2),
                      D = E(m(T)),
                      O = m(D, !0);
                    (l(D), l(T), l(c));
                    var ee = E(c, 2),
                      k = m(ee),
                      A = (t) => {
                        {
                          let n = S(() => (d(J), d(a), C(() => d(J) === d(a).id)));
                          N(t, {
                            variant: `outline`,
                            size: `sm`,
                            get disabled() {
                              return d(n);
                            },
                            $$events: { click: () => Ie(d(a)) },
                            children: (t, n) => {
                              var o = Ce(),
                                s = x(o);
                              oe(s, { class: `mr-1.5 h-3.5 w-3.5` });
                              var c = E(s);
                              (e(() =>
                                r(
                                  c,
                                  ` ${(d(J), d(a), C(() => (d(J) === d(a).id ? `Removing…` : `Uninstall`))) ?? ``}`,
                                ),
                              ),
                                i(t, o));
                            },
                            $$slots: { default: !0 },
                          });
                        }
                      },
                      ne = (t) => {
                        {
                          let n = S(
                            () => (
                              d(J),
                              d(a),
                              C(() => d(J) === d(a).id || d(a).status !== `published`)
                            ),
                          );
                          N(t, {
                            variant: `default`,
                            size: `sm`,
                            get disabled() {
                              return d(n);
                            },
                            $$events: { click: () => Fe(d(a)) },
                            children: (t, n) => {
                              var o = we(),
                                s = x(o);
                              te(s, { class: `mr-1.5 h-3.5 w-3.5` });
                              var c = E(s);
                              (e(() =>
                                r(
                                  c,
                                  ` ${(d(J), d(a), C(() => (d(J) === d(a).id ? `Installing…` : `Install`))) ?? ``}`,
                                ),
                              ),
                                i(t, o));
                            },
                            $$slots: { default: !0 },
                          });
                        }
                      };
                    (n(k, (e) => {
                      (d(a), C(() => d(a).installed) ? e(A) : e(ne, -1));
                    }),
                      l(ee),
                      e(() => {
                        (r(_, ` ${(d(a), C(() => d(a).framework_id)) ?? ``}`),
                          r(
                            y,
                            `${(d(a), C(() => d(a).controls_count)) ?? ``} control${(d(a), C(() => (d(a).controls_count === 1 ? `` : `s`))) ?? ``}`,
                          ),
                          r(w, `v${(d(a), C(() => d(a).version)) ?? ``}`),
                          r(O, (d(a), C(() => d(a).author))));
                      }),
                      i(t, s));
                  },
                  $$slots: { default: !0 },
                }),
                i(t, s));
            },
            $$slots: { default: !0 },
          });
        },
      ),
        l(o),
        i(t, o));
    };
  (n(rt, (e) => {
    d(V) ? e(it) : d(H) ? e(at, 1) : (d(z), C(() => d(z).length === 0) ? e(ot, 2) : e(st, -1));
  }),
    l(Ve),
    h(
      tt,
      () => d(G),
      (e) => D(G, e),
    ),
    i(k, Ve),
    g(),
    je());
}
export { ke as component };
