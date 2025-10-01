import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  aa as N,
  f as x,
  ad as o,
  ae as y,
  af as u,
  d as t,
  a as c,
  ag as O,
  ah as d,
  s as r,
  V as n,
  au as R,
  ai as _,
} from "../chunks/DLjC2_M2.js";
import { e as S, s as g } from "../chunks/39A_Ntu8.js";
import { i as j } from "../chunks/BHVF3NEQ.js";
import { b as T } from "../chunks/C2VxBUJ8.js";
import { p as V } from "../chunks/CWmzcjye.js";
import { i as q } from "../chunks/CLYubSJh.js";
import { C as z } from "../chunks/DXY25tU5.js";
var B = x('<p class="error svelte-1mfxj0f"> </p>'),
  F = x('<h2>Evaluation Result</h2> <pre class="svelte-1mfxj0f"> </pre>', 1),
  G = x(
    '<h1>Evaluate Policy</h1> <form class="form svelte-1mfxj0f"><textarea placeholder="Paste policy body" class="svelte-1mfxj0f"></textarea> <button class="svelte-1mfxj0f">Evaluate</button></form> <!> <!>',
    1,
  );
function Z(E, P) {
  N(P, !1);
  let l = n(""),
    v = n(!1),
    s = n(null),
    i = n(null);
  async function C() {
    var a;
    if (t(l)) {
      (r(v, !0), r(i, null), r(s, null));
      try {
        r(s, await z.evaluatePolicy({ policy: t(l) }));
      } catch (e) {
        r(
          i,
          ((a = e == null ? void 0 : e.body) == null ? void 0 : a.error) ||
            "Evaluation failed",
        );
      } finally {
        r(v, !1);
      }
    }
  }
  q();
  var b = G(),
    f = o(y(b), 2),
    p = d(f);
  R(p);
  var k = o(p, 2);
  _(f);
  var h = o(f, 2);
  {
    var w = (a) => {
      var e = B(),
        m = d(e, !0);
      (_(e), u(() => g(m, t(i))), c(a, e));
    };
    j(h, (a) => {
      t(i) && a(w);
    });
  }
  var A = o(h, 2);
  {
    var D = (a) => {
      var e = F(),
        m = o(y(e), 2),
        I = d(m, !0);
      (_(m), u((J) => g(I, J), [() => JSON.stringify(t(s), null, 2)]), c(a, e));
    };
    j(A, (a) => {
      t(s) && a(D);
    });
  }
  (u(() => (k.disabled = !t(l) || t(v))),
    T(
      p,
      () => t(l),
      (a) => r(l, a),
    ),
    S("submit", f, V(C)),
    c(E, b),
    O());
}
export { Z as component };
//# sourceMappingURL=6.DjdVN4v5.js.map
