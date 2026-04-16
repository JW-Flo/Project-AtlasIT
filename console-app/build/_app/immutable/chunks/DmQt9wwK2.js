import {
  $ as e,
  L as t,
  T as n,
  Tt as r,
  U as i,
  at as a,
  bt as o,
  j as s,
  l as c,
  o as l,
  q as u,
  w as d,
  xt as f,
  z as p,
} from "./CjbcrE1v.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
import { t as m } from "./DPj-wseU.js";
var h = p(`<div><!></div>`);
function g(p, g) {
  f(g, !1);
  let _ = l(g, `variant`, 8, `default`),
    v = l(g, `class`, 8, ``),
    y = {
      default: `border-transparent bg-primary text-primary-foreground`,
      secondary: `border-transparent bg-secondary text-secondary-foreground`,
      destructive: `border-transparent bg-destructive text-destructive-foreground`,
      outline: `text-foreground`,
      success: `border-transparent bg-success/15 text-success`,
      warning: `border-transparent bg-warning/15 text-warning`,
      info: `border-transparent bg-blue-600 text-white`,
    };
  c();
  var b = h();
  (s(a(b), g, `default`, {}, null),
    r(b),
    e(
      (e) => d(b, 1, e),
      [
        () =>
          n(
            (i(m),
            i(_()),
            i(v()),
            u(() =>
              m(
                `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
                y[_()],
                v(),
              ),
            )),
          ),
      ],
    ),
    t(p, b),
    o());
}
export { g as t };
