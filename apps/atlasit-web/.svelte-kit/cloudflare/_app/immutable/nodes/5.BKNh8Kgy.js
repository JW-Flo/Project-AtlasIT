import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  aa as R,
  f as v,
  ad as t,
  ae as x,
  af as c,
  d as e,
  a as p,
  ag as S,
  ah as g,
  s as o,
  V as m,
  ai as _,
} from "../chunks/DLjC2_M2.js";
import { e as V, s as k } from "../chunks/39A_Ntu8.js";
import { i as b } from "../chunks/BHVF3NEQ.js";
import { r as j } from "../chunks/sxWjfql8.js";
import { b as q } from "../chunks/C2VxBUJ8.js";
import { p as z } from "../chunks/CWmzcjye.js";
import { i as B } from "../chunks/CLYubSJh.js";
import { C as E } from "../chunks/DXY25tU5.js";
var G = v('<p class="error svelte-12ongys"> </p>'),
  H = v("<p>Loading...</p>"),
  K = v('<h2>Results</h2> <pre class="svelte-12ongys"> </pre>', 1),
  M = v(
    '<h1>Policy Coverage</h1> <form class="form svelte-12ongys"><input placeholder="Framework (optional)" class="svelte-12ongys"/> <button class="svelte-12ongys">Load</button></form> <!> <!> <!>',
    1,
  );
function ea(w, L) {
  R(L, !1);
  let u = m(""),
    s = m(null),
    l = m(null),
    i = m(!1);
  async function P() {
    var a;
    (o(i, !0), o(l, null), o(s, null));
    try {
      o(s, await E.coverage(e(u) || void 0));
    } catch (r) {
      o(
        l,
        ((a = r == null ? void 0 : r.body) == null ? void 0 : a.error) ||
          "Coverage load failed",
      );
    } finally {
      o(i, !1);
    }
  }
  B();
  var h = M(),
    n = t(x(h), 2),
    d = g(n);
  j(d);
  var A = t(d, 2);
  _(n);
  var y = t(n, 2);
  {
    var D = (a) => {
      var r = G(),
        f = g(r, !0);
      (_(r), c(() => k(f, e(l))), p(a, r));
    };
    b(y, (a) => {
      e(l) && a(D);
    });
  }
  var C = t(y, 2);
  {
    var F = (a) => {
      var r = H();
      p(a, r);
    };
    b(C, (a) => {
      e(i) && a(F);
    });
  }
  var I = t(C, 2);
  {
    var J = (a) => {
      var r = K(),
        f = t(x(r), 2),
        N = g(f, !0);
      (_(f), c((O) => k(N, O), [() => JSON.stringify(e(s), null, 2)]), p(a, r));
    };
    b(I, (a) => {
      e(s) && a(J);
    });
  }
  (c(() => (A.disabled = e(i))),
    q(
      d,
      () => e(u),
      (a) => o(u, a),
    ),
    V("submit", n, z(P)),
    p(w, h),
    S());
}
export { ea as component };
//# sourceMappingURL=5.BKNh8Kgy.js.map
