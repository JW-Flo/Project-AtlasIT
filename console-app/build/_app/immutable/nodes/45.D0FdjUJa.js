import { n as e } from "../chunks/Bupu4aFx.js";
import {
  $ as t,
  C as n,
  F as r,
  H as i,
  I as a,
  L as o,
  N as s,
  P as c,
  Q as l,
  Tt as u,
  U as d,
  V as f,
  W as p,
  Z as m,
  at as h,
  bt as g,
  ct as _,
  d as v,
  l as y,
  o as b,
  ot as x,
  pt as S,
  q as C,
  r as w,
  st as T,
  u as E,
  ut as D,
  v as O,
  wt as k,
  xt as A,
  z as j,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as M } from "../chunks/D4lFFHu4.js";
import { t as ee } from "../chunks/BP-SjGWy.js";
import { t as N } from "../chunks/D_3pYtt4.js";
import { t as P } from "../chunks/CMGwYO6i2.js";
import { r as F, t as I } from "../chunks/BdUjKaVy2.js";
import { n as L, t as R } from "../chunks/BEJa09Kq2.js";
import { t as z } from "../chunks/Cue2Cs472.js";
import { t as B } from "../chunks/DmQt9wwK2.js";
import "../chunks/DOfJvt542.js";
import { t as te } from "../chunks/C8W1vu9i2.js";
import { t as V } from "../chunks/oRaErrij2.js";
import { n as ne } from "../chunks/C5Ue5gaR.js";
var H = e({ load: () => U }),
  U = async ({ fetch: e }) => {
    let [t, n] = await Promise.all([
      e(`/api/marketplace`)
        .then((e) => e.json())
        .catch(() => ({ status: `error`, data: [] })),
      e(`/api/marketplace/installs`)
        .then((e) => e.json())
        .catch(() => ({ status: `error`, data: [] })),
    ]);
    return { apps: t?.data ?? [], installs: n?.data ?? [] };
  },
  W = j(
    `<img class="w-10 h-10 rounded-lg object-contain" style="background: rgba(255,255,255,0.05);"/>`,
  ),
  G = j(
    `<div class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"> </div>`,
  ),
  K = j(
    `<span class="text-[10px] px-1.5 py-0.5 rounded" style="background: rgba(255,255,255,0.05); color: var(--color-text-dim);"> </span>`,
  ),
  q = j(
    `<span class="block w-full py-2 text-xs font-medium rounded text-center transition-colors group-hover:brightness-110" style="background: rgba(59,130,246,0.15); color: #3b82f6;">View Details</span>`,
  ),
  re = j(
    `<button type="button" class="w-full py-2 text-xs font-medium rounded text-white transition-colors disabled:opacity-50" style="background: var(--color-accent);"><!></button>`,
  ),
  J = j(
    `<a class="group block rounded-lg p-5 flex flex-col transition-all duration-200 hover:-translate-y-0.5"><div class="flex items-start justify-between mb-3"><div class="flex items-center gap-3"><!></div> <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"> </span></div> <h3 class="text-sm font-semibold mb-1" style="color: var(--color-text);"> </h3> <div class="flex items-center gap-1.5 mb-2"><span class="text-[10px] px-1.5 py-0.5 rounded font-medium"> </span> <!></div> <p class="text-xs line-clamp-2 mb-4 flex-1" style="color: var(--color-text-dim);"> </p> <div class="mt-auto"><!></div></a>`,
  );
function ie(e, s) {
  A(s, !1);
  let c = _(),
    x = _(),
    S = _(),
    w = _(),
    k = b(s, `app`, 8),
    j = b(s, `install`, 8, null),
    M = b(s, `loading`, 8, !1),
    ee = b(s, `onInstall`, 8, void 0);
  function N(e) {
    return (
      {
        identity: `#8b5cf6`,
        security: `#ef4444`,
        productivity: `#3b82f6`,
        communication: `#06b6d4`,
        hr: `#f59e0b`,
        finance: `#10b981`,
        infrastructure: `#6366f1`,
      }[e] ?? `#6b7280`
    );
  }
  (m(
    () => d(j()),
    () => {
      D(c, j()?.status ?? `available`);
    },
  ),
    m(
      () => p(c),
      () => {
        D(
          x,
          p(c) === `active`
            ? `Active`
            : p(c) === `installed`
              ? `Installed`
              : p(c) === `configuring`
                ? `Configuring`
                : p(c) === `error`
                  ? `Error`
                  : `Available`,
        );
      },
    ),
    m(
      () => p(c),
      () => {
        D(
          S,
          p(c) === `active`
            ? `#22c55e`
            : p(c) === `installed`
              ? `#3b82f6`
              : p(c) === `configuring`
                ? `#eab308`
                : p(c) === `error`
                  ? `#ef4444`
                  : `var(--color-text-dim)`,
        );
      },
    ),
    m(
      () => p(c),
      () => {
        D(
          w,
          p(c) === `active`
            ? `rgba(34,197,94,0.15)`
            : p(c) === `installed`
              ? `rgba(59,130,246,0.15)`
              : p(c) === `configuring`
                ? `rgba(234,179,8,0.15)`
                : p(c) === `error`
                  ? `rgba(239,68,68,0.15)`
                  : `rgba(255,255,255,0.05)`,
        );
      },
    ),
    l(),
    y());
  var P = J(),
    F = h(P),
    I = h(F),
    L = h(I),
    R = (e) => {
      var n = W();
      (t(() => {
        (O(n, `src`, (d(k()), C(() => k().logo_url))),
          O(n, `alt`, `${(d(k()), C(() => k().name)) ?? ``} logo`));
      }),
        o(e, n));
    },
    z = (e) => {
      var r = G(),
        i = h(r, !0);
      (u(r),
        t(
          (e, t, o) => {
            (n(r, `background: ${e ?? ``}20; color: ${t ?? ``};`), a(i, o));
          },
          [
            () => (d(k()), C(() => N(k().category))),
            () => (d(k()), C(() => N(k().category))),
            () => (d(k()), C(() => k().name.charAt(0))),
          ],
        ),
        o(e, r));
    };
  (r(L, (e) => {
    (d(k()), C(() => k().logo_url) ? e(R) : e(z, -1));
  }),
    u(I));
  var B = T(I, 2),
    te = h(B, !0);
  (u(B), u(F));
  var V = T(F, 2),
    ne = h(V, !0);
  u(V);
  var H = T(V, 2),
    U = h(H),
    ie = h(U, !0);
  u(U);
  var Y = T(U, 2),
    X = (e) => {
      var n = K(),
        r = h(n, !0);
      (u(n), t(() => a(r, (d(k()), C(() => k().auth_model)))), o(e, n));
    };
  (r(Y, (e) => {
    (d(k()), C(() => k().auth_model) && e(X));
  }),
    u(H));
  var Z = T(H, 2),
    ae = h(Z, !0);
  u(Z);
  var Q = T(Z, 2),
    oe = h(Q),
    se = (e) => {
      o(e, q());
    },
    ce = (e) => {
      var n = re(),
        a = h(n),
        s = (e) => {
          o(e, f(`Installing...`));
        },
        c = (e) => {
          o(e, f(`Install`));
        };
      (r(a, (e) => {
        M() ? e(s) : e(c, -1);
      }),
        u(n),
        t(() => (n.disabled = M())),
        i(`click`, n, E(v(() => ee()?.(k())))),
        o(e, n));
    };
  (r(oe, (e) => {
    j() ? e(se) : e(ce, -1);
  }),
    u(Q),
    u(P),
    t(
      (e, t) => {
        (O(P, `href`, `/marketplace/${(d(k()), C(() => k().id)) ?? ``}`),
          n(
            P,
            `background: var(--color-surface); border: 1px solid ${j() ? `rgba(34,197,94,0.2)` : `var(--color-border)`};`,
          ),
          n(B, `background: ${p(w) ?? ``}; color: ${p(S) ?? ``};`),
          a(te, p(x)),
          a(ne, (d(k()), C(() => k().name))),
          n(U, `background: ${e ?? ``}15; color: ${t ?? ``};`),
          a(ie, (d(k()), C(() => k().category))),
          a(ae, (d(k()), C(() => k().description || `No description available`))));
      },
      [() => (d(k()), C(() => N(k().category))), () => (d(k()), C(() => N(k().category)))],
    ),
    o(e, P),
    g());
}
var Y = j(
    `<button type="button" class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize whitespace-nowrap"> </button>`,
  ),
  X = j(
    `<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"><button type="button" class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap">All</button> <!></div>`,
  );
function Z(e, r) {
  A(r, !1);
  let l = b(r, `categories`, 24, () => []),
    d = b(r, `active`, 12, `all`),
    f = b(r, `onChange`, 8, void 0);
  function m(e) {
    (d(e), f()?.(e));
  }
  y();
  var _ = X(),
    v = h(_);
  (s(T(v, 2), 1, l, c, (e, r) => {
    var s = Y(),
      c = h(s, !0);
    (u(s),
      t(() => {
        (n(
          s,
          `background: ${d() === p(r) ? `var(--color-accent)` : `var(--color-surface)`}; color: ${d() === p(r) ? `#fff` : `var(--color-text-dim)`};`,
        ),
          a(c, p(r)));
      }),
      i(`click`, s, () => m(p(r))),
      o(e, s));
  }),
    u(_),
    t(() =>
      n(
        v,
        `background: ${d() === `all` ? `var(--color-accent)` : `var(--color-surface)`}; color: ${d() === `all` ? `#fff` : `var(--color-text-dim)`};`,
      ),
    ),
    i(`click`, v, () => m(`all`)),
    o(e, _),
    g());
}
var ae = j(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></div>`),
  Q = j(`<!> Retry`, 1),
  oe = j(`<!> <p class="text-lg mb-2"> </p> <!>`, 1),
  se = j(
    `<!> <p class="text-lg mb-1">No apps available yet</p> <p class="text-sm text-muted-foreground">The marketplace catalog is being populated. Check back soon.</p>`,
    1,
  ),
  ce = j(
    `<div class="text-center py-12 text-muted-foreground"><p class="text-lg">No apps found</p> <p class="text-sm mt-1">Try a different search term or category</p></div>`,
  ),
  le = j(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></div>`),
  ue = j(
    `<div class="space-y-6 px-5 py-5 max-w-[1400px] mx-auto"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Marketplace</h1> <p class="text-sm text-muted-foreground">Browse and install apps to extend your IT automation platform</p></div> <div class="flex items-center gap-3"><!> <a href="/console"><!></a></div></div> <!> <div><!></div> <!></div>`,
  );
function $(e, n) {
  A(n, !1);
  let i = _(),
    d = _(),
    v = _(),
    E = _(),
    O = b(n, `data`, 8),
    j = _(O().apps),
    H = _(O().installs),
    U = _(``),
    W = _(`all`),
    G = _(!1),
    K = _(null),
    q = _(null);
  w(async () => {
    if ((await I(), p(j).length === 0)) {
      D(G, !0);
      try {
        let e = await fetch(`/api/marketplace`);
        e.ok ? D(j, (await e.json()).data ?? []) : D(q, `Failed to load marketplace apps`);
      } catch {
        D(q, `Failed to connect to marketplace`);
      }
      try {
        let e = await fetch(`/api/marketplace/installs`);
        e.ok && D(H, (await e.json()).data ?? []);
      } catch {}
      D(G, !1);
    }
  });
  async function re(e) {
    let t;
    if ((F.subscribe((e) => (t = e?.tenantId))(), !t)) {
      M({ message: `No tenant found. Please log in.`, variant: `error` });
      return;
    }
    D(K, e.id);
    try {
      let n = await ne(t, e.id);
      (D(H, [...p(H), n]), M({ message: `${e.name} installed successfully`, variant: `success` }));
    } catch (t) {
      M({ message: t?.message || `Failed to install ${e.name}`, variant: `error` });
    }
    D(K, null);
  }
  (m(
    () => p(j),
    () => {
      D(
        i,
        [
          ...new Set(
            p(j)
              .map((e) => e.category)
              .filter(Boolean),
          ),
        ].sort(),
      );
    },
  ),
    m(
      () => p(H),
      () => {
        D(
          d,
          new Map(
            p(H)
              .filter((e) => e.status !== `uninstalled`)
              .map((e) => [e.app_id, e]),
          ),
        );
      },
    ),
    m(
      () => (p(j), p(W), p(U)),
      () => {
        D(
          v,
          p(j).filter(
            (e) =>
              !(
                (p(W) !== `all` && e.category !== p(W)) ||
                (p(U) &&
                  !e.name.toLowerCase().includes(p(U).toLowerCase()) &&
                  !(e.description ?? ``).toLowerCase().includes(p(U).toLowerCase()))
              ),
          ),
        );
      },
    ),
    m(
      () => p(H),
      () => {
        D(E, p(H).filter((e) => e.status === `active` || e.status === `installed`).length);
      },
    ),
    l(),
    y());
  var J = ue(),
    Y = h(J),
    X = T(h(Y), 2),
    $ = h(X),
    de = (e) => {
      B(e, {
        variant: `success`,
        children: (e, n) => {
          k();
          var r = f();
          (t(() => a(r, `${p(E) ?? ``} Installed`)), o(e, r));
        },
        $$slots: { default: !0 },
      });
    };
  r($, (e) => {
    p(E) > 0 && e(de);
  });
  var fe = T($, 2);
  (z(h(fe), {
    variant: `outline`,
    size: `sm`,
    children: (e, t) => {
      (k(), o(e, f(`Back to Dashboard`)));
    },
    $$slots: { default: !0 },
  }),
    u(fe),
    u(X),
    u(Y));
  var pe = T(Y, 2);
  te(pe, {
    type: `text`,
    placeholder: `Search apps...`,
    class: `max-w-md`,
    get value() {
      return p(U);
    },
    set value(e) {
      D(U, e);
    },
    $$legacy: !0,
  });
  var me = T(pe, 2);
  (Z(h(me), {
    get categories() {
      return p(i);
    },
    get active() {
      return p(W);
    },
    onChange: (e) => D(W, e),
  }),
    u(me));
  var he = T(me, 2),
    ge = (e) => {
      var t = ae();
      (s(
        t,
        4,
        () => Array(8),
        c,
        (e, t) => {
          V(e, { class: `h-56 rounded-lg` });
        },
      ),
        u(t),
        o(e, t));
    },
    _e = (e) => {
      L(e, {
        class: `py-16 text-center`,
        children: (e, n) => {
          R(e, {
            children: (e, n) => {
              var r = oe(),
                i = x(r);
              P(i, { class: `w-12 h-12 mx-auto mb-4 text-destructive/60` });
              var s = T(i, 2),
                c = h(s, !0);
              (u(s),
                z(T(s, 2), {
                  class: `mt-2`,
                  $$events: { click: () => location.reload() },
                  children: (e, t) => {
                    var n = Q();
                    (N(x(n), { class: `h-4 w-4 mr-1.5` }), k(), o(e, n));
                  },
                  $$slots: { default: !0 },
                }),
                t(() => a(c, p(q))),
                o(e, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    ve = (e) => {
      L(e, {
        class: `py-16 text-center`,
        children: (e, t) => {
          R(e, {
            children: (e, t) => {
              var n = se();
              (ee(x(n), { class: `w-12 h-12 mx-auto mb-4 text-muted-foreground/30` }),
                k(4),
                o(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    ye = (e) => {
      o(e, ce());
    },
    be = (e) => {
      var t = le();
      (s(
        t,
        5,
        () => p(v),
        (e) => e.id,
        (e, t) => {
          {
            let n = S(() => (p(d), p(t), C(() => p(d).get(p(t).id) ?? null))),
              r = S(() => (p(K), p(t), C(() => p(K) === p(t).id)));
            ie(e, {
              get app() {
                return p(t);
              },
              get install() {
                return p(n);
              },
              get loading() {
                return p(r);
              },
              onInstall: re,
            });
          }
        },
      ),
        u(t),
        o(e, t));
    };
  (r(he, (e) => {
    p(G)
      ? e(ge)
      : p(q)
        ? e(_e, 1)
        : (p(v),
          p(U),
          p(W),
          C(() => p(v).length === 0 && !p(U) && p(W) === `all`)
            ? e(ve, 2)
            : (p(v), C(() => p(v).length === 0) ? e(ye, 3) : e(be, -1)));
  }),
    u(J),
    o(e, J),
    g());
}
export { $ as component, H as universal };
