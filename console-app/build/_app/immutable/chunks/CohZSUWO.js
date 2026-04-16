import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  Q as a,
  R as o,
  T as s,
  Tt as c,
  U as l,
  W as u,
  Z as d,
  at as f,
  bt as p,
  ct as m,
  f as h,
  it as g,
  j as _,
  l as v,
  n as y,
  o as b,
  ot as x,
  q as S,
  st as C,
  ut as w,
  w as T,
  xt as E,
  z as D,
} from "./CjbcrE1v.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
import { t as O } from "./DPj-wseU.js";
import { t as k } from "./B0pEiESM2.js";
var A = D(
    `<div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold"> </h3> <button type="button" class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Close"><!></button></div>`,
  ),
  j = D(
    `<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" tabindex="-1"><div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div> <div><!> <!></div></div>`,
  );
function M(D, M) {
  E(M, !1);
  let N = b(M, `open`, 8, !1),
    P = b(M, `onClose`, 8, () => {}),
    F = b(M, `title`, 8, ``),
    I = b(M, `class`, 8, ``),
    L = m(null);
  function R(e) {
    e.key === `Escape` && P()();
  }
  function z(e) {
    e.target === e.currentTarget && P()();
  }
  (y(() => {
    typeof document < `u` && (document.body.style.overflow = ``);
  }),
    d(
      () => l(N()),
      () => {
        typeof document < `u` &&
          (N() ? (document.body.style.overflow = `hidden`) : (document.body.style.overflow = ``));
      },
    ),
    a(),
    v());
  var B = o();
  n(`keydown`, g, function (...e) {
    (N() ? R : void 0)?.apply(this, e);
  });
  var V = x(B),
    H = (a) => {
      var o = j(),
        d = C(f(o), 2),
        p = f(d),
        m = (t) => {
          var a = A(),
            o = f(a),
            s = f(o, !0);
          c(o);
          var l = C(o, 2);
          (k(f(l), { class: `h-4 w-4` }),
            c(l),
            c(a),
            e(() => r(s, F())),
            n(`click`, l, function (...e) {
              P()?.apply(this, e);
            }),
            i(t, a));
        };
      (t(p, (e) => {
        F() && e(m);
      }),
        _(C(p, 2), M, `default`, {}, null),
        c(d),
        h(
          d,
          (e) => w(L, e),
          () => u(L),
        ),
        c(o),
        e(
          (e) => T(d, 1, e),
          [
            () =>
              s(
                (l(O),
                l(I()),
                S(() =>
                  O(
                    `relative z-50 w-full max-w-lg mx-3 sm:mx-4 rounded-lg border bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto`,
                    I(),
                  ),
                )),
              ),
          ],
        ),
        n(`click`, o, z),
        i(a, o));
    };
  (t(V, (e) => {
    N() && e(H);
  }),
    i(D, B),
    p());
}
export { M as t };
