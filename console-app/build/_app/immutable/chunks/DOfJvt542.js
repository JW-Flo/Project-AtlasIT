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
var h = p(`<div role="alert"><!></div>`);
function g(p, g) {
  f(g, !1);
  let _ = l(g, `variant`, 8, `default`),
    v = l(g, `class`, 8, ``),
    y = {
      default: `bg-background text-foreground`,
      destructive: `border-destructive/50 text-destructive [&>svg]:text-destructive`,
      success: `border-success/50 text-success bg-success/5 [&>svg]:text-success`,
      warning: `border-warning/50 text-warning bg-warning/5 [&>svg]:text-warning`,
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
                `relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground`,
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
