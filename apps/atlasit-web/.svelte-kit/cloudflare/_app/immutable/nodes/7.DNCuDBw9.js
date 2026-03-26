import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  aa as O,
  f as h,
  ad as s,
  ae as z,
  af as y,
  d as t,
  a as d,
  ag as T,
  ah as _,
  s as r,
  V as i,
  ai as b,
} from "../chunks/DLjC2_M2.js";
import { e as V, s as G } from "../chunks/39A_Ntu8.js";
import { i as P } from "../chunks/BHVF3NEQ.js";
import { r as j } from "../chunks/sxWjfql8.js";
import { b as k } from "../chunks/C2VxBUJ8.js";
import { p as q } from "../chunks/CWmzcjye.js";
import { i as B } from "../chunks/CLYubSJh.js";
import { C as E } from "../chunks/DXY25tU5.js";
var F = h('<p class="error svelte-1xycszf"> </p>'),
  H = h('<h2>Generated Policy</h2> <pre class="svelte-1xycszf"> </pre>', 1),
  L = h(
    '<h1>Generate Policy</h1> <form class="form svelte-1xycszf"><input placeholder="Template key" class="svelte-1xycszf"/> <input placeholder="Subject / system" class="svelte-1xycszf"/> <button class="svelte-1xycszf">Generate</button></form> <!> <!>',
    1,
  );
function te(C, K) {
  O(K, !1);
  let l = i(""),
    m = i(""),
    c = i(!1),
    o = i(null),
    n = i(null);
  async function S() {
    var e;
    if (t(l)) {
      (r(c, !0), r(n, null), r(o, null));
      try {
        r(o, await E.generatePolicy({ templateKey: t(l), subject: t(m) }));
      } catch (a) {
        r(
          n,
          ((e = a == null ? void 0 : a.body) == null ? void 0 : e.error) ||
            "Generation failed",
        );
      } finally {
        r(c, !1);
      }
    }
  }
  B();
  var g = L(),
    f = s(z(g), 2),
    u = _(f);
  j(u);
  var v = s(u, 2);
  j(v);
  var w = s(v, 2);
  b(f);
  var x = s(f, 2);
  {
    var A = (e) => {
      var a = F(),
        p = _(a, !0);
      (b(a), y(() => G(p, t(n))), d(e, a));
    };
    P(x, (e) => {
      t(n) && e(A);
    });
  }
  var D = s(x, 2);
  {
    var I = (e) => {
      var a = H(),
        p = s(z(a), 2),
        J = _(p, !0);
      (b(p),
        y(
          (N) => G(J, N),
          [() => t(o).content || JSON.stringify(t(o), null, 2)],
        ),
        d(e, a));
    };
    P(D, (e) => {
      t(o) && e(I);
    });
  }
  (y(() => (w.disabled = !t(l) || t(c))),
    k(
      u,
      () => t(l),
      (e) => r(l, e),
    ),
    k(
      v,
      () => t(m),
      (e) => r(m, e),
    ),
    V("submit", f, q(S)),
    d(C, g),
    T());
}
export { te as component };
//# sourceMappingURL=7.DNCuDBw9.js.map
