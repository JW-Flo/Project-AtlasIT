import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  aa as H,
  s as u,
  V as d,
  f as i,
  ad as C,
  ae as h,
  a as e,
  ag as J,
  d as r,
  at as T,
  ah as b,
  ai as m,
  af as w,
} from "../chunks/DLjC2_M2.js";
import { s as y } from "../chunks/39A_Ntu8.js";
import { i as x } from "../chunks/BHVF3NEQ.js";
import { e as K, i as M } from "../chunks/B36Hb1sH.js";
import { i as O } from "../chunks/CLYubSJh.js";
import { C as Q } from "../chunks/DXY25tU5.js";
var R = i("<p>Loading...</p>"),
  S = i('<p class="error svelte-ci0obv"> </p>'),
  U = i("<p>No templates.</p>"),
  W = i('<li class="svelte-ci0obv"><strong> </strong> </li>'),
  X = i('<ul class="list svelte-ci0obv"></ul>'),
  Y = i("<h1>Policy Templates</h1> <!>", 1);
function la(A, F) {
  H(F, !1);
  let p = d([]),
    f = d(null),
    P = d(!0);
  ((async () => {
    var a;
    try {
      u(p, (await Q.listPolicyTemplates()).items || []);
    } catch (t) {
      u(
        f,
        ((a = t == null ? void 0 : t.body) == null ? void 0 : a.error) ||
          "Failed to load templates",
      );
    } finally {
      u(P, !1);
    }
  })(),
    O());
  var k = Y(),
    I = C(h(k), 2);
  {
    var L = (a) => {
        var t = R();
        e(a, t);
      },
      N = (a) => {
        var t = T(),
          V = h(t);
        {
          var j = (s) => {
              var o = S(),
                n = b(o, !0);
              (m(o), w(() => y(n, r(f))), e(s, o));
            },
            q = (s) => {
              var o = T(),
                n = h(o);
              {
                var z = (l) => {
                    var v = U();
                    e(l, v);
                  },
                  B = (l) => {
                    var v = X();
                    (K(
                      v,
                      5,
                      () => r(p),
                      M,
                      (D, c) => {
                        var _ = W(),
                          g = b(_),
                          E = b(g, !0);
                        m(g);
                        var G = C(g);
                        (m(_),
                          w(() => {
                            (y(E, r(c).key),
                              y(G, ` — ${(r(c).name || r(c).title) ?? ""}`));
                          }),
                          e(D, _));
                      },
                    ),
                      m(v),
                      e(l, v));
                  };
                x(
                  n,
                  (l) => {
                    r(p).length === 0 ? l(z) : l(B, !1);
                  },
                  !0,
                );
              }
              e(s, o);
            };
          x(
            V,
            (s) => {
              r(f) ? s(j) : s(q, !1);
            },
            !0,
          );
        }
        e(a, t);
      };
    x(I, (a) => {
      r(P) ? a(L) : a(N, !1);
    });
  }
  (e(A, k), J());
}
export { la as component };
//# sourceMappingURL=8.DmvTBjD9.js.map
