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
  W as l,
  Z as u,
  _ as d,
  at as f,
  b as p,
  bt as m,
  ct as h,
  h as g,
  l as _,
  ot as v,
  q as y,
  r as b,
  st as x,
  ut as S,
  w as C,
  xt as w,
  z as T,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
var E = T(`<p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> </p>`),
  D = T(`<button> </button>`),
  ee = T(`<option> </option>`),
  te = T(`<p class="mt-3 text-sm text-red-600 dark:text-red-400"> </p>`),
  ne = T(
    `<div class="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"><h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">New Incident</h2> <div class="grid gap-4 sm:grid-cols-3"><div class="sm:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="inc-title">Title <span class="text-red-500">*</span></label> <input id="inc-title" type="text" placeholder="Brief description of the incident" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/></div> <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="inc-severity">Severity</label> <select id="inc-severity" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></select></div> <div class="sm:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="inc-source">Source <span class="text-gray-400 font-normal">(optional)</span></label> <input id="inc-source" type="text" placeholder="manual" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/></div></div> <!> <div class="mt-4 flex gap-2 justify-end"><button class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button> <button class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"> </button></div></div>`,
  ),
  O = T(`<div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`),
  k = T(`<div class="space-y-3"></div>`),
  re = T(
    `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><p class="text-red-800 dark:text-red-300"> </p> <button class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button></div>`,
  ),
  ie = T(
    `<div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center"><p class="text-gray-500 dark:text-gray-400 text-sm">No incidents</p> <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">Click "New Incident" to create one.</p></div>`,
  ),
  ae = T(
    `<tr class="bg-gray-50 dark:bg-gray-700/30"><td colspan="5" class="px-5 py-4"><dl class="flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-600 dark:text-gray-300"><div><dt class="font-semibold text-gray-400 uppercase">ID</dt><dd class="font-mono mt-0.5"> </dd></div> <div><dt class="font-semibold text-gray-400 uppercase">Created</dt><dd class="mt-0.5"> </dd></div> <div><dt class="font-semibold text-gray-400 uppercase">Resolved</dt><dd class="mt-0.5"> </dd></div> <div><dt class="font-semibold text-gray-400 uppercase">Source</dt><dd class="mt-0.5"> </dd></div></dl></td></tr>`,
  ),
  oe = T(
    `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"><td class="px-5 py-3 font-medium text-gray-900 dark:text-white"> </td><td class="px-5 py-3"><span> </span></td><td class="px-5 py-3"><span> </span></td><td class="px-5 py-3 text-gray-500 dark:text-gray-400"> </td><td class="px-5 py-3 text-gray-500 dark:text-gray-400"> </td></tr> <!>`,
    1,
  ),
  se = T(
    `<div class="border-t border-gray-200 dark:border-gray-700 px-5 py-3"><button class="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"> </button></div>`,
  ),
  ce = T(
    `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"><th class="px-5 py-3 font-medium">Title</th><th class="px-5 py-3 font-medium">Severity</th><th class="px-5 py-3 font-medium">Status</th><th class="px-5 py-3 font-medium">Source</th><th class="px-5 py-3 font-medium">Created</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"></tbody></table></div> <!></div>`,
  ),
  le = T(
    `<div class="p-8 max-w-7xl mx-auto"><div class="mb-6 flex items-start justify-between gap-4 flex-wrap"><div><h1 class="text-3xl font-bold text-gray-900 dark:text-white">Incidents</h1> <!></div> <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">New Incident</button></div> <div class="mb-5 flex flex-wrap items-center gap-3"><div class="flex gap-1"></div> <select class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"><option>All statuses</option><option>Open</option><option>Investigating</option><option>Resolved</option></select></div> <!> <!></div>`,
  );
function ue(T, ue) {
  w(ue, !1);
  let de = h(),
    fe = h(),
    pe = h(),
    me = [`critical`, `high`, `medium`, `low`],
    A = h([]),
    j = h(null),
    M = h(!0),
    N = h(!1),
    P = h(null),
    F = h(`all`),
    I = h(`all`),
    L = h(null),
    R = h(!1),
    z = h(``),
    B = h(`medium`),
    V = h(``),
    H = h(null),
    U = h(!1);
  function he(e) {
    let t = new URLSearchParams({ limit: `20` });
    return (
      l(F) !== `all` && t.set(`severity`, l(F)),
      l(I) !== `all` && t.set(`status`, l(I)),
      e && t.set(`cursor`, e),
      `/api/compliance/api/v1/incidents?${t.toString()}`
    );
  }
  async function W() {
    (S(M, !0), S(P, null), S(A, []), S(j, null));
    try {
      let e = await fetch(he());
      if (!e.ok) throw Error(`Failed to load incidents (HTTP ${e.status})`);
      let t = await e.json();
      (S(A, t.data?.items ?? []), S(j, t.data?.nextCursor ?? null));
    } catch (e) {
      S(P, e.message);
    } finally {
      S(M, !1);
    }
  }
  async function ge() {
    if (!(!l(j) || l(N))) {
      S(N, !0);
      try {
        let e = await fetch(he(l(j)));
        if (!e.ok) throw Error(`HTTP ${e.status}`);
        let t = await e.json();
        (S(A, [...l(A), ...(t.data?.items ?? [])]), S(j, t.data?.nextCursor ?? null));
      } catch (e) {
        S(P, e.message);
      } finally {
        S(N, !1);
      }
    }
  }
  function _e() {
    (S(L, null), W());
  }
  async function ve() {
    if (l(z).trim()) {
      (S(U, !0), S(H, null));
      try {
        let e = { title: l(z).trim(), severity: l(B) };
        l(V).trim() && (e.source = l(V).trim());
        let t = await fetch(`/api/compliance/api/v1/incidents`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify(e),
        });
        if (!t.ok) {
          let e = await t.json().catch(() => ({}));
          throw Error(e.error ?? `HTTP ${t.status}`);
        }
        (S(z, ``), S(B, `medium`), S(V, ``), S(R, !1), await W());
      } catch (e) {
        S(H, e.message);
      } finally {
        S(U, !1);
      }
    }
  }
  function ye(e) {
    switch (e) {
      case `critical`:
        return `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
      case `high`:
        return `bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300`;
      case `medium`:
        return `bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300`;
      case `low`:
        return `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`;
      default:
        return `bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;
    }
  }
  function be(e) {
    switch (e?.toLowerCase()) {
      case `open`:
        return `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
      case `investigating`:
        return `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
      case `resolved`:
        return `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
      default:
        return `bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;
    }
  }
  function xe(e) {
    let t = Date.now() - new Date(e).getTime(),
      n = Math.floor(t / 864e5);
    if (n > 0) return `${n}d ago`;
    let r = Math.floor(t / 36e5);
    return r > 0 ? `${r}h ago` : `${Math.floor(t / 6e4)}m ago`;
  }
  (b(W),
    u(
      () => l(A),
      () => {
        S(de, l(A).length);
      },
    ),
    u(
      () => l(A),
      () => {
        S(fe, l(A).filter((e) => e.status === `open`).length);
      },
    ),
    u(
      () => l(A),
      () => {
        S(pe, l(A).filter((e) => e.status === `resolved`).length);
      },
    ),
    s(),
    _());
  var G = le(),
    K = f(G),
    q = f(K),
    Se = x(f(q), 2),
    Ce = (t) => {
      var n = E(),
        a = f(n);
      (c(n),
        e(() => r(a, `Total: ${l(de) ?? ``} · Open: ${l(fe) ?? ``} · Resolved: ${l(pe) ?? ``}`)),
        i(t, n));
    };
  (t(Se, (e) => {
    !l(M) && !l(P) && e(Ce);
  }),
    c(q));
  var we = x(q, 2);
  c(K);
  var J = x(K, 2),
    Y = f(J);
  (a(
    Y,
    5,
    () => y(() => [`all`, ...me]),
    o,
    (t, a) => {
      var o = D(),
        s = f(o, !0);
      (c(o),
        e(
          (e) => {
            (C(
              o,
              1,
              `px-3 py-1 text-xs font-medium rounded-full border transition-colors
            ${l(F) === l(a) ? `bg-blue-600 text-white border-blue-600` : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400`}`,
            ),
              r(s, e));
          },
          [
            () => (
              l(a),
              y(() => (l(a) === `all` ? `All` : l(a).charAt(0).toUpperCase() + l(a).slice(1)))
            ),
          ],
        ),
        n(`click`, o, () => {
          (S(F, l(a)), _e());
        }),
        i(t, o));
    },
  ),
    c(Y));
  var X = x(Y, 2),
    Z = f(X);
  Z.value = Z.__value = `all`;
  var Q = x(Z);
  Q.value = Q.__value = `open`;
  var $ = x(Q);
  $.value = $.__value = `investigating`;
  var Te = x($);
  ((Te.value = Te.__value = `resolved`), c(X), c(J));
  var Ee = x(J, 2),
    De = (s) => {
      var u = ne(),
        m = x(f(u), 2),
        h = f(m),
        _ = x(f(h), 2);
      (d(_), c(h));
      var v = x(h, 2),
        b = x(f(v), 2);
      (a(
        b,
        5,
        () => me,
        o,
        (t, n) => {
          var a = ee(),
            o = f(a, !0);
          c(a);
          var s = {};
          (e(
            (e) => {
              (r(o, e), s !== (s = l(n)) && (a.value = (a.__value = l(n)) ?? ``));
            },
            [() => (l(n), y(() => l(n).charAt(0).toUpperCase() + l(n).slice(1)))],
          ),
            i(t, a));
        },
      ),
        c(b),
        c(v));
      var C = x(v, 2),
        w = x(f(C), 2);
      (d(w), c(C), c(m));
      var T = x(m, 2),
        E = (t) => {
          var n = te(),
            a = f(n, !0);
          (c(n), e(() => r(a, l(H))), i(t, n));
        };
      t(T, (e) => {
        l(H) && e(E);
      });
      var D = x(T, 2),
        O = f(D),
        k = x(O, 2),
        re = f(k, !0);
      (c(k),
        c(D),
        c(u),
        e(
          (e) => {
            ((k.disabled = e), r(re, l(U) ? `Creating...` : `Create Incident`));
          },
          [() => (l(U), l(z), y(() => l(U) || !l(z).trim()))],
        ),
        g(
          _,
          () => l(z),
          (e) => S(z, e),
        ),
        p(
          b,
          () => l(B),
          (e) => S(B, e),
        ),
        g(
          w,
          () => l(V),
          (e) => S(V, e),
        ),
        n(`click`, O, () => {
          (S(R, !1), S(H, null));
        }),
        n(`click`, k, ve),
        i(s, u));
    };
  t(Ee, (e) => {
    l(R) && e(De);
  });
  var Oe = x(Ee, 2),
    ke = (e) => {
      var t = k();
      (a(
        t,
        4,
        () => [1, 2, 3, 4],
        o,
        (e, t) => {
          i(e, O());
        },
      ),
        c(t),
        i(e, t));
    },
    Ae = (t) => {
      var a = re(),
        o = f(a),
        s = f(o, !0);
      c(o);
      var u = x(o, 2);
      (c(a), e(() => r(s, l(P))), n(`click`, u, W), i(t, a));
    },
    je = (e) => {
      i(e, ie());
    },
    Me = (o) => {
      var s = ce(),
        u = f(s),
        d = f(u),
        p = x(f(d));
      (a(
        p,
        5,
        () => l(A),
        (e) => e.id,
        (a, o) => {
          var s = oe(),
            u = v(s),
            d = f(u),
            p = f(d, !0);
          c(d);
          var m = x(d),
            h = f(m),
            g = f(h, !0);
          (c(h), c(m));
          var _ = x(m),
            b = f(_),
            w = f(b, !0);
          (c(b), c(_));
          var T = x(_),
            E = f(T, !0);
          c(T);
          var D = x(T),
            ee = f(D, !0);
          (c(D), c(u));
          var te = x(u, 2),
            ne = (t) => {
              var n = ae(),
                a = f(n),
                s = f(a),
                u = f(s),
                d = x(f(u)),
                p = f(d, !0);
              (c(d), c(u));
              var m = x(u, 2),
                h = x(f(m)),
                g = f(h, !0);
              (c(h), c(m));
              var _ = x(m, 2),
                v = x(f(_)),
                b = f(v, !0);
              (c(v), c(_));
              var S = x(_, 2),
                C = x(f(S)),
                w = f(C, !0);
              (c(C),
                c(S),
                c(s),
                c(a),
                c(n),
                e(
                  (e, t) => {
                    (r(p, (l(o), y(() => l(o).id))),
                      r(g, e),
                      r(b, t),
                      r(w, (l(o), y(() => l(o).source ?? `—`))));
                  },
                  [
                    () => (l(o), y(() => new Date(l(o).createdAt).toLocaleString())),
                    () => (
                      l(o),
                      y(() => (l(o).resolvedAt ? new Date(l(o).resolvedAt).toLocaleString() : `—`))
                    ),
                  ],
                ),
                i(t, n));
            };
          (t(te, (e) => {
            (l(L), l(o), y(() => l(L) === l(o).id) && e(ne));
          }),
            e(
              (e, t, n) => {
                (r(p, (l(o), y(() => l(o).title))),
                  C(
                    h,
                    1,
                    `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${e ?? ``}`,
                  ),
                  r(g, (l(o), y(() => l(o).severity))),
                  C(
                    b,
                    1,
                    `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t ?? ``}`,
                  ),
                  r(w, (l(o), y(() => l(o).status))),
                  r(E, (l(o), y(() => l(o).source ?? `—`))),
                  r(ee, n));
              },
              [
                () => (l(o), y(() => ye(l(o).severity))),
                () => (l(o), y(() => be(l(o).status))),
                () => (l(o), y(() => xe(l(o).createdAt))),
              ],
            ),
            n(`click`, u, () => {
              S(L, l(L) === l(o).id ? null : l(o).id);
            }),
            i(a, s));
        },
      ),
        c(p),
        c(d),
        c(u));
      var m = x(u, 2),
        h = (t) => {
          var a = se(),
            o = f(a),
            s = f(o, !0);
          (c(o),
            c(a),
            e(() => {
              ((o.disabled = l(N)), r(s, l(N) ? `Loading...` : `Show more`));
            }),
            n(`click`, o, ge),
            i(t, a));
        };
      (t(m, (e) => {
        l(j) && e(h);
      }),
        c(s),
        i(o, s));
    };
  (t(Oe, (e) => {
    l(M) ? e(ke) : l(P) ? e(Ae, 1) : (l(A), y(() => l(A).length === 0) ? e(je, 2) : e(Me, -1));
  }),
    c(G),
    n(`click`, we, () => {
      (S(R, !l(R)), S(H, null));
    }),
    p(
      X,
      () => l(I),
      (e) => S(I, e),
    ),
    n(`change`, X, _e),
    i(T, G),
    m());
}
export { ue as component };
