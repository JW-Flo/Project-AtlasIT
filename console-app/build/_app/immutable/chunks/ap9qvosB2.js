import {
  $ as e,
  C as t,
  L as n,
  Q as r,
  T as i,
  Tt as a,
  U as o,
  W as s,
  Z as c,
  at as l,
  bt as u,
  ct as d,
  l as f,
  o as p,
  q as m,
  ut as h,
  v as g,
  w as _,
  xt as v,
  z as y,
} from "./CjbcrE1v.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
import { t as b } from "./DPj-wseU.js";
var x = y(`<div role="progressbar"><div></div></div>`);
function S(y, S) {
  v(S, !1);
  let C = d(),
    w = p(S, `value`, 8, 0),
    T = p(S, `max`, 8, 100),
    E = p(S, `class`, 8, ``),
    D = p(S, `indicatorClass`, 8, ``);
  (c(
    () => (o(w()), o(T())),
    () => {
      h(C, Math.min(Math.max((w() / T()) * 100, 0), 100));
    },
  ),
    r(),
    f());
  var O = x();
  g(O, `aria-valuemin`, 0);
  var k = l(O);
  (a(O),
    e(
      (e, n) => {
        (g(O, `aria-valuenow`, w()),
          g(O, `aria-valuemax`, T()),
          _(O, 1, e),
          _(k, 1, n),
          t(k, `width: ${s(C) ?? ``}%`));
      },
      [
        () =>
          i(
            (o(b),
            o(E()),
            m(() => b(`relative h-3 w-full overflow-hidden rounded-full bg-secondary`, E()))),
          ),
        () =>
          i(
            (o(b),
            o(D()),
            m(() => b(`h-full rounded-full bg-primary transition-all duration-500`, D()))),
          ),
      ],
    ),
    n(y, O),
    u());
}
export { S as t };
