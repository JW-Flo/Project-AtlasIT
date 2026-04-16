import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Tt as s,
  W as c,
  at as l,
  bt as u,
  ct as d,
  l as f,
  ot as p,
  r as m,
  st as h,
  ut as g,
  w as _,
  xt as v,
  z as y,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
var ee = y(
    `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"> </span>`,
  ),
  b = y(`<div class="h-36 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`),
  x = y(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"></div>`),
  S = y(
    `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8"><p class="text-red-800 dark:text-red-300"> </p> <button class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button></div>`,
  ),
  C = y(
    `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 text-sm text-gray-500 dark:text-gray-400">No framework data found. Ingest evidence to see compliance scores.</div>`,
  ),
  w = y(
    `<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"><div class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"> </div> <div> </div> <div class="text-sm text-gray-600 dark:text-gray-400"> </div> <div class="mt-1 text-xs text-gray-500 dark:text-gray-500"> </div></div>`,
  ),
  te = y(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"></div>`),
  T = y(
    `<div class="px-6 py-4 flex gap-4"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-20"></div> <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-32"></div> <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-24"></div> <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-16 ml-auto"></div></div>`,
  ),
  E = y(`<div class="divide-y divide-gray-200 dark:divide-gray-700"></div>`),
  ne = y(
    `<div class="p-6"><p class="text-red-700 dark:text-red-400 text-sm"> </p> <button class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button></div>`,
  ),
  D = y(
    `<div class="p-6 text-sm text-gray-500 dark:text-gray-400">No evidence records found.</div>`,
  ),
  O = y(
    `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"> </td><td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate"><span class="font-mono text-xs text-gray-500 dark:text-gray-500 mr-1"> </span> </td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400"> </td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-500"> </td></tr>`,
  ),
  k = y(
    `<div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700"><button class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"> </button></div>`,
  ),
  A = y(
    `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead class="bg-gray-50 dark:bg-gray-900/50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Framework</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Control</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Collected</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"></tbody></table></div> <!>`,
    1,
  ),
  j = y(
    `<div class="p-8 max-w-7xl mx-auto"><div class="mb-8 flex items-center justify-between"><div class="flex items-center gap-4"><h1 class="text-3xl font-bold text-gray-900 dark:text-white">Compliance</h1> <!></div> <button class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Refresh</button></div> <!> <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"><div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Evidence</h2></div> <!></div></div>`,
  );
function M(y, M) {
  v(M, !1);
  let N = d(!0),
    P = d(null),
    F = d(null),
    I = d(!0),
    L = d(null),
    R = d([]),
    z = d(null),
    B = d(!1);
  function V(e) {
    let t = Date.now() - new Date(e).getTime(),
      n = Math.floor(t / 864e5);
    if (n > 0) return `${n}d ago`;
    let r = Math.floor(t / 36e5);
    return r > 0 ? `${r}h ago` : `${Math.floor(t / 6e4)}m ago`;
  }
  function H(e) {
    return e >= 80
      ? `text-green-600 dark:text-green-400`
      : e >= 60
        ? `text-amber-500 dark:text-amber-400`
        : `text-red-600 dark:text-red-400`;
  }
  async function U() {
    (g(N, !0), g(P, null));
    try {
      let e = await fetch(`/api/compliance/api/v1/compliance/summary`);
      if (!e.ok) {
        g(P, `Failed to load compliance summary (HTTP ${e.status})`);
        return;
      }
      let t = await e.json();
      t.data ? g(F, t.data) : g(P, `No summary data returned`);
    } catch (e) {
      g(P, e.message);
    } finally {
      g(N, !1);
    }
  }
  async function W(e) {
    e ? g(B, !0) : (g(I, !0), g(L, null));
    try {
      let t = e
          ? `/api/compliance/api/v1/evidence?limit=25&cursor=${encodeURIComponent(e)}`
          : `/api/compliance/api/v1/evidence?limit=25`,
        n = await fetch(t);
      if (!n.ok) {
        g(L, `Failed to load evidence (HTTP ${n.status})`);
        return;
      }
      let r = await n.json();
      r.data
        ? (e ? g(R, [...c(R), ...r.data.items]) : g(R, r.data.items),
          g(z, r.data.nextCursor ?? null))
        : g(L, `No evidence data returned`);
    } catch (e) {
      g(L, e.message);
    } finally {
      (g(I, !1), g(B, !1));
    }
  }
  function G() {
    (U(), W());
  }
  (m(() => {
    (U(), W());
  }),
    f());
  var K = j(),
    q = l(K),
    J = l(q),
    Y = h(l(J), 2),
    X = (t) => {
      var n = ee(),
        a = l(n);
      (s(n),
        e((e) => r(a, `${e ?? ``} evidence records`), [() => c(F).totalEvidence.toLocaleString()]),
        i(t, n));
    };
  (t(Y, (e) => {
    c(F) && e(X);
  }),
    s(J));
  var re = h(J, 2);
  s(q);
  var Z = h(q, 2),
    ie = (e) => {
      var t = x();
      (a(
        t,
        4,
        () => [, , , , ,],
        o,
        (e, t) => {
          i(e, b());
        },
      ),
        s(t),
        i(e, t));
    },
    ae = (t) => {
      var a = S(),
        o = l(a),
        u = l(o, !0);
      s(o);
      var d = h(o, 2);
      (s(a), e(() => r(u, c(P))), n(`click`, d, U), i(t, a));
    },
    oe = (e) => {
      i(e, C());
    },
    se = (t) => {
      var n = te();
      (a(
        n,
        5,
        () => c(F).frameworks,
        o,
        (t, n) => {
          var a = w(),
            o = l(a),
            u = l(o, !0);
          s(o);
          var d = h(o, 2),
            f = l(d);
          s(d);
          var p = h(d, 2),
            m = l(p);
          s(p);
          var g = h(p, 2),
            v = l(g);
          (s(g),
            s(a),
            e(
              (e, t) => {
                (r(u, c(n).framework),
                  _(d, 1, `text-5xl font-bold ${e ?? ``} mb-3`),
                  r(f, `${c(n).score ?? ``}%`),
                  r(
                    m,
                    `${c(n).controlsPassing ?? ``} of ${c(n).controlsTotal ?? ``} controls passing`,
                  ),
                  r(v, `${t ?? ``} evidence records`));
              },
              [() => H(c(n).score), () => c(n).evidenceCount.toLocaleString()],
            ),
            i(t, a));
        },
      ),
        s(n),
        i(t, n));
    };
  t(Z, (e) => {
    c(N)
      ? e(ie)
      : c(P)
        ? e(ae, 1)
        : c(F) && c(F).frameworks.length === 0
          ? e(oe, 2)
          : c(F) && e(se, 3);
  });
  var Q = h(Z, 2),
    $ = h(l(Q), 2),
    ce = (e) => {
      var t = E();
      (a(
        t,
        4,
        () => [, , , , ,],
        o,
        (e, t) => {
          i(e, T());
        },
      ),
        s(t),
        i(e, t));
    },
    le = (t) => {
      var a = ne(),
        o = l(a),
        u = l(o, !0);
      s(o);
      var d = h(o, 2);
      (s(a), e(() => r(u, c(L))), n(`click`, d, () => W()), i(t, a));
    },
    ue = (e) => {
      i(e, D());
    },
    de = (o) => {
      var u = A(),
        d = p(u),
        f = l(d),
        m = h(l(f));
      (a(
        m,
        5,
        () => c(R),
        (e) => e.id,
        (t, n) => {
          var a = O(),
            o = l(a),
            u = l(o, !0);
          s(o);
          var d = h(o),
            f = l(d),
            p = l(f, !0);
          s(f);
          var m = h(f);
          s(d);
          var g = h(d),
            _ = l(g, !0);
          s(g);
          var v = h(g),
            y = l(v, !0);
          (s(v),
            s(a),
            e(
              (e) => {
                (r(u, c(n).framework ?? `—`),
                  r(p, c(n).controlId),
                  r(m, ` ${c(n).controlName ?? `` ?? ``}`),
                  r(_, c(n).source ?? `—`),
                  r(y, e));
              },
              [() => V(c(n).createdAt)],
            ),
            i(t, a));
        },
      ),
        s(m),
        s(f),
        s(d));
      var g = h(d, 2),
        _ = (t) => {
          var a = k(),
            o = l(a),
            u = l(o, !0);
          (s(o),
            s(a),
            e(() => {
              ((o.disabled = c(B)), r(u, c(B) ? `Loading…` : `Show more`));
            }),
            n(`click`, o, () => W(c(z) ?? void 0)),
            i(t, a));
        };
      (t(g, (e) => {
        c(z) && e(_);
      }),
        i(o, u));
    };
  (t($, (e) => {
    c(I) ? e(ce) : c(L) ? e(le, 1) : c(R).length === 0 ? e(ue, 2) : e(de, -1);
  }),
    s(Q),
    s(K),
    n(`click`, re, G),
    i(y, K),
    u());
}
export { M as component };
