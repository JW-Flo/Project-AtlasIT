import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  Tt as a,
  W as o,
  _ as s,
  at as c,
  bt as l,
  dt as u,
  h as d,
  st as f,
  u as p,
  ut as m,
  xt as h,
  z as g,
} from "../chunks/CjbcrE1v.js";
import { t as _ } from "../chunks/CkfEZRj5.js";
import "../chunks/C8H49NTu.js";
import "../chunks/CZkNuRnP2.js";
var v = g(
    `<div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm"> </div>`,
  ),
  y = g(
    `<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div class="w-full max-w-sm p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md"><h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">AtlasIT</h1> <!> <form class="space-y-4"><div><label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label> <input id="email" type="email" required="" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="you@company.com"/></div> <div><label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label> <input id="password" type="password" required="" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <button type="submit" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"> </button></form></div></div>`,
  );
function b(g, b) {
  h(b, !0);
  let x = u(``),
    S = u(``),
    C = u(``),
    w = u(!1);
  async function T() {
    (m(C, ``), m(w, !0));
    try {
      let e = await fetch(
        `https://ahjoepuw96.execute-api.us-east-1.amazonaws.com/api/v1/auth/token`,
        {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({ email: o(x), password: o(S) }),
        },
      );
      if (!e.ok) {
        m(C, (await e.json().catch(() => ({}))).message ?? `Login failed (${e.status})`, !0);
        return;
      }
      let t = await e.json();
      t.token
        ? (sessionStorage.setItem(`atlasit_token`, t.token),
          sessionStorage.setItem(
            `atlasit_user`,
            JSON.stringify({ userId: t.userId, email: o(x), tenantId: t.tenantId, role: t.role }),
          ),
          await _(`/console`))
        : m(C, `No token received`);
    } catch (e) {
      m(C, e.message, !0);
    } finally {
      m(w, !1);
    }
  }
  var E = y(),
    D = c(E),
    O = f(c(D), 2),
    k = (t) => {
      var n = v(),
        s = c(n, !0);
      (a(n), e(() => r(s, o(C))), i(t, n));
    };
  t(O, (e) => {
    o(C) && e(k);
  });
  var A = f(O, 2),
    j = c(A),
    M = f(c(j), 2);
  (s(M), a(j));
  var N = f(j, 2),
    P = f(c(N), 2);
  (s(P), a(N));
  var F = f(N, 2),
    I = c(F, !0);
  (a(F),
    a(A),
    a(D),
    a(E),
    e(() => {
      ((F.disabled = o(w)), r(I, o(w) ? `Signing in...` : `Sign in`));
    }),
    d(
      M,
      () => o(x),
      (e) => m(x, e),
    ),
    d(
      P,
      () => o(S),
      (e) => m(S, e),
    ),
    n(`submit`, A, p(T)),
    i(g, E),
    l());
}
export { b as component };
