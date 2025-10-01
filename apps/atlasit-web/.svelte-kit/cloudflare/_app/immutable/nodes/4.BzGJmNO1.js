import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  aa as pt,
  f as k,
  ad as s,
  ae as M,
  af as S,
  d as e,
  a as v,
  ag as ft,
  ah as o,
  s as r,
  V as i,
  ai as l,
  n as dt,
  at as mt,
} from "../chunks/DLjC2_M2.js";
import { e as Q, s as p } from "../chunks/39A_Ntu8.js";
import { i as E } from "../chunks/BHVF3NEQ.js";
import { e as ht, i as _t } from "../chunks/B36Hb1sH.js";
import { r as m } from "../chunks/sxWjfql8.js";
import { b as h } from "../chunks/C2VxBUJ8.js";
import { p as U } from "../chunks/CWmzcjye.js";
import { i as bt } from "../chunks/CLYubSJh.js";
import { C as W } from "../chunks/DXY25tU5.js";
var yt = k('<p class="error svelte-16ukkkz"> </p>'),
  zt = k("<p>Loading...</p>"),
  xt = k("<p>No results.</p>"),
  gt = k(
    '<tr><td class="mono svelte-16ukkkz"> </td><td class="svelte-16ukkkz"> </td><td class="svelte-16ukkkz"> </td><td class="svelte-16ukkkz"> </td></tr>',
  ),
  jt = k(
    '<table class="results svelte-16ukkkz"><thead><tr><th class="svelte-16ukkkz">Hash</th><th class="svelte-16ukkkz">Pack</th><th class="svelte-16ukkkz">Subject</th><th class="svelte-16ukkkz">Created</th></tr></thead><tbody></tbody></table>',
  ),
  St = k('<pre class="verify-out svelte-16ukkkz"> </pre>'),
  Et = k(
    '<h1 class="svelte-16ukkkz">Evidence</h1> <form class="search svelte-16ukkkz"><input placeholder="Tenant" class="svelte-16ukkkz"/> <input placeholder="Pack" class="svelte-16ukkkz"/> <input placeholder="Subject" class="svelte-16ukkkz"/> <input type="number" min="1" max="200" class="svelte-16ukkkz"/> <button class="svelte-16ukkkz">Search</button></form> <!> <!> <h2>Verify Evidence Hash</h2> <form class="verify svelte-16ukkkz"><input placeholder="Hash" class="wide svelte-16ukkkz"/> <button class="svelte-16ukkkz">Verify</button></form> <!>',
    1,
  );
function Lt(X, Y) {
  pt(Y, !1);
  let H = i(""),
    V = i(""),
    w = i(""),
    C = i(25),
    _ = i(!1),
    b = i([]),
    c = i(null),
    y = i(""),
    z = i(null);
  async function Z() {
    var t;
    (r(_, !0), r(c, null), r(b, []));
    try {
      const a = await W.searchEvidence({
        tenantId: e(H),
        pack: e(V),
        subject: e(w),
        limit: e(C),
      });
      r(b, a.items || []);
    } catch (a) {
      r(
        c,
        ((t = a == null ? void 0 : a.body) == null ? void 0 : t.error) ||
          "Search failed",
      );
    } finally {
      r(_, !1);
    }
  }
  async function $() {
    var t;
    if (e(y)) {
      (r(z, null), r(c, null));
      try {
        r(z, await W.verifyEvidence(e(y)));
      } catch (a) {
        r(
          c,
          ((t = a == null ? void 0 : a.body) == null ? void 0 : t.error) ||
            "Verify failed",
        );
      }
    }
  }
  bt();
  var R = Et(),
    x = s(M(R), 2),
    I = o(x);
  m(I);
  var P = s(I, 2);
  m(P);
  var A = s(P, 2);
  m(A);
  var N = s(A, 2);
  m(N);
  var tt = s(N, 2);
  l(x);
  var q = s(x, 2);
  {
    var et = (t) => {
      var a = yt(),
        f = o(a, !0);
      (l(a), S(() => p(f, e(c))), v(t, a));
    };
    E(q, (t) => {
      e(c) && t(et);
    });
  }
  var B = s(q, 2);
  {
    var at = (t) => {
        var a = zt();
        v(t, a);
      },
      rt = (t) => {
        var a = mt(),
          f = M(a);
        {
          var T = (n) => {
              var d = xt();
              v(n, d);
            },
            ot = (n) => {
              var d = jt(),
                G = s(o(d));
              (ht(
                G,
                5,
                () => e(b),
                _t,
                (it, j) => {
                  var D = gt(),
                    J = o(D),
                    vt = o(J);
                  l(J);
                  var L = s(J),
                    ut = o(L, !0);
                  l(L);
                  var O = s(L),
                    kt = o(O, !0);
                  l(O);
                  var K = s(O),
                    ct = o(K, !0);
                  (l(K),
                    l(D),
                    S(
                      (u, nt) => {
                        (p(vt, `${u ?? ""}…`),
                          p(ut, e(j).pack),
                          p(kt, e(j).subject),
                          p(ct, nt));
                      },
                      [
                        () => {
                          var u;
                          return (u = e(j).hash) == null
                            ? void 0
                            : u.slice(0, 12);
                        },
                        () => {
                          var u;
                          return (u = e(j).createdAt) == null
                            ? void 0
                            : u.slice(0, 19).replace("T", " ");
                        },
                      ],
                    ),
                    v(it, D));
                },
              ),
                l(G),
                l(d),
                v(n, d));
            };
          E(
            f,
            (n) => {
              e(b).length === 0 ? n(T) : n(ot, !1);
            },
            !0,
          );
        }
        v(t, a);
      };
    E(B, (t) => {
      e(_) ? t(at) : t(rt, !1);
    });
  }
  var g = s(B, 4),
    F = o(g);
  (m(F), dt(2), l(g));
  var st = s(g, 2);
  {
    var lt = (t) => {
      var a = St(),
        f = o(a, !0);
      (l(a), S((T) => p(f, T), [() => JSON.stringify(e(z), null, 2)]), v(t, a));
    };
    E(st, (t) => {
      e(z) && t(lt);
    });
  }
  (S(() => (tt.disabled = e(_))),
    h(
      I,
      () => e(H),
      (t) => r(H, t),
    ),
    h(
      P,
      () => e(V),
      (t) => r(V, t),
    ),
    h(
      A,
      () => e(w),
      (t) => r(w, t),
    ),
    h(
      N,
      () => e(C),
      (t) => r(C, t),
    ),
    Q("submit", x, U(Z)),
    h(
      F,
      () => e(y),
      (t) => r(y, t),
    ),
    Q("submit", g, U($)),
    v(X, R),
    ft());
}
export { Lt as component };
//# sourceMappingURL=4.BzGJmNO1.js.map
