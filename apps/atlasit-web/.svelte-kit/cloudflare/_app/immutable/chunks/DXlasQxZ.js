import {
  g as D,
  P as L,
  d as P,
  e as T,
  s as b,
  i as B,
  D as Y,
  j as x,
  k as M,
  m as N,
  o as U,
  v as h,
  S as w,
  w as z,
  x as $,
  u as j,
  y as q,
  z as y,
  A as C,
} from "./DLjC2_M2.js";
import { c as G } from "./BtMAuxYN.js";
function H(r, a, t, s) {
  var o;
  var f = !M || (t & N) !== 0,
    v = (t & U) !== 0,
    E = (t & C) !== 0,
    n = s,
    l = !0,
    g = () => (l && ((l = !1), (n = E ? j(s) : s)), n),
    u;
  if (v) {
    var O = w in r || z in r;
    u =
      ((o = D(r, a)) == null ? void 0 : o.set) ??
      (O && a in r ? (e) => (r[a] = e) : void 0);
  }
  var _,
    I = !1;
  (v ? ([_, I] = G(() => r[a])) : (_ = r[a]),
    _ === void 0 && s !== void 0 && ((_ = g()), u && (f && q(), u(_))));
  var i;
  if (
    (f
      ? (i = () => {
          var e = r[a];
          return e === void 0 ? g() : ((l = !0), e);
        })
      : (i = () => {
          var e = r[a];
          return (e !== void 0 && (n = void 0), e === void 0 ? n : e);
        }),
    f && (t & L) === 0)
  )
    return i;
  if (u) {
    var R = r.$$legacy;
    return function (e, S) {
      return arguments.length > 0
        ? ((!f || !S || R || I) && u(S ? i() : e), e)
        : i();
    };
  }
  var c = !1,
    d = ((t & y) !== 0 ? $ : x)(() => ((c = !1), i()));
  v && P(d);
  var m = B;
  return function (e, S) {
    if (arguments.length > 0) {
      const A = S ? P(d) : f && v ? T(e) : e;
      return (b(d, A), (c = !0), n !== void 0 && (n = A), e);
    }
    return (h && c) || (m.f & Y) !== 0 ? d.v : P(d);
  };
}
export { H as p };
//# sourceMappingURL=DXlasQxZ.js.map
