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
  wt as v,
  xt as y,
  z as b,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
var x = b(`<p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> </p>`),
  S = b(`<div class="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`),
  C = b(
    `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"></div> <div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>`,
    1,
  ),
  w = b(
    `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><p class="text-red-800 dark:text-red-300"> </p> <button class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button></div>`,
  ),
  T = b(`<div class="p-6 text-sm text-gray-500 dark:text-gray-400">No recent events</div>`),
  E = b(
    `<div class="px-6 py-4 flex items-center justify-between"><div><div class="font-medium text-gray-900 dark:text-white"> </div> <div class="text-sm text-gray-500 dark:text-gray-400"> </div></div> <div class="text-right"><span> </span> <div class="mt-1 text-xs text-gray-500 dark:text-gray-400"> </div></div></div>`,
  ),
  D = b(`<div class="divide-y divide-gray-200 dark:divide-gray-700"></div>`),
  O = b(
    `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"><div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"><div class="text-sm text-gray-500 dark:text-gray-400">Compliance Evidence</div> <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white"> </div> <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">Records collected</div></div> <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"><div class="text-sm text-gray-500 dark:text-gray-400">Automation Rules</div> <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white"> </div> <div class="mt-2 text-xs text-gray-500 dark:text-gray-400"> </div></div> <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"><div class="text-sm text-gray-500 dark:text-gray-400">Open Incidents</div> <div> </div> <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">Needs attention</div></div> <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"><div class="text-sm text-gray-500 dark:text-gray-400">Tenant Status</div> <div class="mt-1 text-xl font-bold text-green-600 capitalize"> </div> <div class="mt-2 text-xs text-gray-500 dark:text-gray-400"> </div></div></div> <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"><div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2></div> <!></div> <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3"><a href="/console/compliance" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors"><div class="font-medium text-gray-900 dark:text-white">Compliance</div> <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">View controls & evidence</div></a> <a href="/console/directory" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors"><div class="font-medium text-gray-900 dark:text-white">Directory</div> <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Users & groups</div></a> <a href="/console/automation" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors"><div class="font-medium text-gray-900 dark:text-white">Automation</div> <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Rules & workflows</div></a> <a href="/console/incidents" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors"><div class="font-medium text-gray-900 dark:text-white">Incidents</div> <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Investigate & resolve</div></a></div>`,
    1,
  ),
  k = b(
    `<div class="p-8 max-w-7xl mx-auto"><div class="mb-8"><h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1> <!></div> <!></div>`,
  );
function A(b, A) {
  y(A, !1);
  let j = d(null),
    M = d(!0),
    N = d(null);
  async function P() {
    (g(M, !0), g(N, null));
    try {
      let e = await fetch(`/api/v1/dashboard`);
      if (!e.ok) {
        g(N, `Failed to load dashboard (HTTP ${e.status})`);
        return;
      }
      let t = await e.json();
      t.data ? g(j, t.data) : g(N, `Dashboard returned no data`);
    } catch (e) {
      g(N, e.message);
    } finally {
      g(M, !1);
    }
  }
  m(() => {
    P();
  });
  function F(e) {
    let t = Date.now() - new Date(e).getTime(),
      n = Math.floor(t / 864e5);
    if (n > 0) return `${n}d ago`;
    let r = Math.floor(t / 36e5);
    return r > 0 ? `${r}h ago` : `${Math.floor(t / 6e4)}m ago`;
  }
  f();
  var I = k(),
    L = l(I),
    R = h(l(L), 2),
    z = (t) => {
      var n = x(),
        a = l(n);
      (s(n),
        e(() =>
          r(
            a,
            `${c(j).tenant.name ?? ``} · ${c(j).tenant.tier ?? ``} tier · logged in as ${c(j).user.email ?? ``}`,
          ),
        ),
        i(t, n));
    };
  (t(R, (e) => {
    c(j)?.tenant && e(z);
  }),
    s(L));
  var B = h(L, 2),
    V = (e) => {
      var t = C(),
        n = p(t);
      (a(
        n,
        4,
        () => [, , , ,],
        o,
        (e, t) => {
          i(e, S());
        },
      ),
        s(n),
        v(2),
        i(e, t));
    },
    H = (t) => {
      var a = w(),
        o = l(a),
        u = l(o, !0);
      s(o);
      var d = h(o, 2);
      (s(a), e(() => r(u, c(N))), n(`click`, d, P), i(t, a));
    },
    U = (n) => {
      var u = O(),
        d = p(u),
        f = l(d),
        m = h(l(f), 2),
        g = l(m, !0);
      (s(m), v(2), s(f));
      var y = h(f, 2),
        b = h(l(y), 2),
        x = l(b, !0);
      s(b);
      var S = h(b, 2),
        C = l(S);
      (s(S), s(y));
      var w = h(y, 2),
        k = h(l(w), 2),
        A = l(k, !0);
      (s(k), v(2), s(w));
      var M = h(w, 2),
        N = h(l(M), 2),
        P = l(N, !0);
      s(N);
      var I = h(N, 2),
        L = l(I);
      (s(I), s(M), s(d));
      var R = h(d, 2),
        z = h(l(R), 2),
        B = (e) => {
          i(e, T());
        },
        V = (t) => {
          var n = D();
          (a(
            n,
            5,
            () => c(j).recentEvents,
            o,
            (t, n) => {
              var a = E(),
                o = l(a),
                u = l(o),
                d = l(u, !0);
              s(u);
              var f = h(u, 2),
                p = l(f);
              (s(f), s(o));
              var m = h(o, 2),
                g = l(m),
                v = l(g, !0);
              s(g);
              var y = h(g, 2),
                b = l(y, !0);
              (s(y),
                s(m),
                s(a),
                e(
                  (e) => {
                    (r(d, c(n).type),
                      r(p, `from ${c(n).source ?? ``}`),
                      _(
                        g,
                        1,
                        `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${c(n).status === `pending` ? `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300` : ``}
                  ${c(n).status === `processing` ? `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300` : ``}
                  ${c(n).status === `completed` ? `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300` : ``}
                  ${c(n).status === `failed` ? `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300` : ``}`,
                      ),
                      r(v, c(n).status),
                      r(b, e));
                  },
                  [() => F(c(n).created_at)],
                ),
                i(t, a));
            },
          ),
            s(n),
            i(t, n));
        };
      (t(z, (e) => {
        c(j).recentEvents.length === 0 ? e(B) : e(V, -1);
      }),
        s(R),
        v(2),
        e(
          (e) => {
            (r(g, e),
              r(x, c(j).stats.automationRulesEnabled),
              r(
                C,
                `${c(j).stats.automationRulesEnabled ?? ``} of ${c(j).stats.automationRulesTotal ?? ``} enabled`,
              ),
              _(
                k,
                1,
                `mt-1 text-3xl font-bold ${c(j).stats.openIncidents > 0 ? `text-amber-600` : `text-gray-900 dark:text-white`}`,
              ),
              r(A, c(j).stats.openIncidents),
              r(P, c(j).tenant?.status ?? `—`),
              r(L, `${c(j).tenant?.tier ?? `` ?? ``} plan`));
          },
          [() => c(j).stats.evidenceCount.toLocaleString()],
        ),
        i(n, u));
    };
  (t(B, (e) => {
    c(M) ? e(V) : c(N) ? e(H, 1) : c(j) && e(U, 2);
  }),
    s(I),
    i(b, I),
    u());
}
export { A as component };
