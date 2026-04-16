import {
  $ as e,
  F as t,
  H as n,
  L as r,
  Q as i,
  R as a,
  T as o,
  Tt as s,
  U as c,
  W as l,
  Z as u,
  at as d,
  bt as f,
  c as p,
  ct as m,
  j as h,
  l as g,
  o as _,
  ot as v,
  ut as y,
  v as b,
  w as x,
  xt as S,
  z as C,
} from "./CjbcrE1v.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
import { t as w } from "./DPj-wseU.js";
var T = C(`<a><!></a>`),
  E = C(`<button><!></button>`);
function D(C, D) {
  S(D, !1);
  let O = m(),
    k = _(D, `variant`, 8, `default`),
    A = _(D, `size`, 8, `default`),
    j = _(D, `href`, 8, void 0),
    M = _(D, `disabled`, 8, !1),
    N = _(D, `type`, 8, `button`),
    P = _(D, `class`, 8, ``),
    F = {
      default: `bg-primary text-primary-foreground hover:bg-primary/90`,
      destructive: `bg-destructive text-destructive-foreground hover:bg-destructive/90`,
      outline: `border border-input bg-background hover:bg-accent hover:text-accent-foreground`,
      secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80`,
      ghost: `hover:bg-accent hover:text-accent-foreground`,
      link: `text-primary underline-offset-4 hover:underline`,
      success: `bg-success text-success-foreground hover:bg-success/90`,
    },
    I = {
      default: `h-10 px-4 py-2`,
      sm: `h-9 rounded-md px-3`,
      lg: `h-11 rounded-md px-8`,
      icon: `h-10 w-10`,
    };
  (u(
    () => (c(k()), c(A()), c(P())),
    () => {
      y(
        O,
        w(
          `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`,
          F[k()],
          I[A()],
          P(),
        ),
      );
    },
  ),
    i(),
    g());
  var L = a(),
    R = v(L),
    z = (t) => {
      var n = T();
      (h(d(n), D, `default`, {}, null),
        s(n),
        e(() => {
          (b(n, `href`, j()), x(n, 1, o(l(O))));
        }),
        r(t, n));
    },
    B = (t) => {
      var i = E();
      (h(d(i), D, `default`, {}, null),
        s(i),
        e(() => {
          (b(i, `type`, N()), (i.disabled = M()), x(i, 1, o(l(O))));
        }),
        n(`click`, i, function (e) {
          p.call(this, D, e);
        }),
        r(t, i));
    };
  (t(R, (e) => {
    j() ? e(z) : e(B, -1);
  }),
    r(C, L),
    f());
}
export { D as t };
