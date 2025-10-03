import { C as T } from "../chunks/DXY25tU5.js";
import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import {
  aa as w,
  f,
  ad as b,
  ae as z,
  a as v,
  ag as I,
  ar as A,
  u as l,
  ah as c,
  ai as o,
  af as P,
  d as t,
} from "../chunks/DLjC2_M2.js";
import { s as d } from "../chunks/39A_Ntu8.js";
import { i as M } from "../chunks/BHVF3NEQ.js";
import { e as N, i as B } from "../chunks/B36Hb1sH.js";
import { i as D } from "../chunks/CLYubSJh.js";
import { p as E } from "../chunks/DXlasQxZ.js";
const G = async ({ fetch: u, url: m }) => {
    var p;
    const e = Number(m.searchParams.get("limit") || 50);
    try {
      return { activity: await T.listActivity({ limit: e }, u) };
    } catch (r) {
      return {
        error:
          ((p = r == null ? void 0 : r.body) == null ? void 0 : p.error) ||
          "Failed to load activity",
      };
    }
  },
  aa = Object.freeze(
    Object.defineProperty({ __proto__: null, load: G }, Symbol.toStringTag, {
      value: "Module",
    }),
  );
var H = f('<p class="error svelte-n3q11l"> </p>'),
  J = f(
    '<li class="svelte-n3q11l"><code class="svelte-n3q11l"> </code> <span> </span> <time class="svelte-n3q11l"> </time></li>',
  ),
  K = f('<ul class="feed svelte-n3q11l"></ul>'),
  L = f('<h1 class="svelte-n3q11l">Activity Feed</h1> <!>', 1);
function ta(u, m) {
  var x;
  w(m, !1);
  let e = E(m, "data", 8),
    p = ((x = e().activity) == null ? void 0 : x.items) || [];
  D();
  var r = L(),
    j = b(z(r), 2);
  {
    var k = (i) => {
        var s = H(),
          _ = c(s, !0);
        (o(s), P(() => d(_, (A(e()), l(() => e().error)))), v(i, s));
      },
      C = (i) => {
        var s = K();
        (N(
          s,
          5,
          () => p,
          B,
          (_, a) => {
            var y = J(),
              g = c(y),
              F = c(g, !0);
            o(g);
            var h = b(g, 2),
              O = c(h, !0);
            o(h);
            var q = b(h, 2),
              S = c(q, !0);
            (o(q),
              o(y),
              P(
                (n) => {
                  (d(F, (t(a), l(() => t(a).type))),
                    d(
                      O,
                      (t(a),
                      l(() => t(a).message || t(a).summary || t(a).detail)),
                    ),
                    d(S, n));
                },
                [
                  () => (
                    t(a),
                    l(() => {
                      var n;
                      return (n = t(a).createdAt) == null
                        ? void 0
                        : n.slice(0, 19).replace("T", " ");
                    })
                  ),
                ],
              ),
              v(_, y));
          },
        ),
          o(s),
          v(i, s));
      };
    M(j, (i) => {
      (A(e()), l(() => e().error) ? i(k) : i(C, !1));
    });
  }
  (v(u, r), I());
}
export { ta as component, aa as universal };
//# sourceMappingURL=10.B2CtQ7J4.js.map
