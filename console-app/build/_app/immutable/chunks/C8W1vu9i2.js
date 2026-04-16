import {
  $ as e,
  H as t,
  L as n,
  T as r,
  U as i,
  _ as a,
  bt as o,
  c as s,
  h as c,
  l,
  o as u,
  q as d,
  v as f,
  w as p,
  xt as m,
  z as h,
} from "./CjbcrE1v.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
import { t as g } from "./DPj-wseU.js";
var _ = h(`<input/>`);
function v(h, v) {
  m(v, !1);
  let y = u(v, `value`, 12, ``),
    b = u(v, `type`, 8, `text`),
    x = u(v, `placeholder`, 8, ``),
    S = u(v, `disabled`, 8, !1),
    C = u(v, `id`, 8, ``),
    w = u(v, `class`, 8, ``);
  l();
  var T = _();
  (a(T),
    e(
      (e) => {
        (f(T, `id`, C()),
          f(T, `type`, b()),
          f(T, `placeholder`, x()),
          (T.disabled = S()),
          p(T, 1, e));
      },
      [
        () =>
          r(
            (i(g),
            i(w()),
            d(() =>
              g(
                `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`,
                w(),
              ),
            )),
          ),
      ],
    ),
    c(T, y),
    t(`input`, T, function (e) {
      s.call(this, v, e);
    }),
    t(`change`, T, function (e) {
      s.call(this, v, e);
    }),
    t(`blur`, T, function (e) {
      s.call(this, v, e);
    }),
    t(`focus`, T, function (e) {
      s.call(this, v, e);
    }),
    n(h, T),
    o());
}
export { v as t };
