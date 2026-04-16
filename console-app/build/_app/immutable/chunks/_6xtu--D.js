import {
  B as e,
  Et as t,
  L as n,
  N as r,
  O as i,
  P as a,
  R as o,
  Tt as s,
  U as c,
  W as l,
  a as u,
  at as d,
  bt as f,
  g as p,
  j as m,
  l as h,
  mt as g,
  o as _,
  ot as v,
  q as y,
  st as b,
  xt as x,
} from "./CjbcrE1v.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
var S = {
    xmlns: `http://www.w3.org/2000/svg`,
    width: 24,
    height: 24,
    viewBox: `0 0 24 24`,
    fill: `none`,
    stroke: `currentColor`,
    "stroke-width": 2,
    "stroke-linecap": `round`,
    "stroke-linejoin": `round`,
  },
  C = (e) => {
    for (let t in e) if (t.startsWith(`aria-`) || t === `role` || t === `title`) return !0;
    return !1;
  },
  w = (...e) =>
    e
      .filter((e, t, n) => !!e && e.trim() !== `` && n.indexOf(e) === t)
      .join(` `)
      .trim(),
  T = e(`<svg><!><!></svg>`);
function E(e, E) {
  let D = u(E, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    O = u(D, [`name`, `color`, `size`, `strokeWidth`, `absoluteStrokeWidth`, `iconNode`]);
  x(E, !1);
  let k = _(E, `name`, 8, void 0),
    A = _(E, `color`, 8, `currentColor`),
    j = _(E, `size`, 8, 24),
    M = _(E, `strokeWidth`, 8, 2),
    N = _(E, `absoluteStrokeWidth`, 8, !1),
    P = _(E, `iconNode`, 24, () => []);
  h();
  var F = T();
  p(
    F,
    (e, t, n) => ({
      ...S,
      ...e,
      ...O,
      width: j(),
      height: j(),
      stroke: A(),
      "stroke-width": t,
      class: n,
    }),
    [
      () => (C(O) ? void 0 : { "aria-hidden": `true` }),
      () => (c(N()), c(M()), c(j()), y(() => (N() ? (Number(M()) * 24) / Number(j()) : M()))),
      () => (
        c(w),
        c(k()),
        c(D),
        y(() => w(`lucide-icon`, `lucide`, k() ? `lucide-${k()}` : ``, D.class))
      ),
    ],
  );
  var I = d(F);
  (r(I, 1, P, a, (e, r) => {
    var a = g(() => t(l(r), 2));
    let s = () => l(a)[0],
      c = () => l(a)[1];
    var u = o();
    (i(v(u), s, !0, (e, t) => {
      p(e, () => ({ ...c() }));
    }),
      n(e, u));
  }),
    m(b(I), E, `default`, {}, null),
    s(F),
    n(e, F),
    f());
}
export { E as t };
