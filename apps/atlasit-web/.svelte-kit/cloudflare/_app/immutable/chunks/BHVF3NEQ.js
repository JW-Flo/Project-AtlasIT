import {
  C as A,
  h as _,
  G as N,
  a8 as R,
  H as x,
  I as C,
  J as D,
  E as F,
  K as p,
  B as S,
  R as T,
  c as H,
  a9 as L,
  T as q,
  _ as B,
  $ as G,
  M as J,
} from "./DLjC2_M2.js";
function M(b, E, g = !1) {
  _ && N();
  var r = b,
    t = null,
    s = null,
    e = L,
    y = g ? R : 0,
    l = !1;
  const I = (n, a = !0) => {
    ((l = !0), d(a, n));
  };
  var f = null;
  function o() {
    f !== null && (f.lastChild.remove(), r.before(f), (f = null));
    var n = e ? t : s,
      a = e ? s : t;
    (n && B(n),
      a &&
        G(a, () => {
          e ? (s = null) : (t = null);
        }));
  }
  const d = (n, a) => {
    if (e === (e = n)) return;
    let u = !1;
    if (_) {
      const k = x(r) === C;
      !!e === k && ((r = D()), F(r), p(!1), (u = !0));
    }
    var v = q(),
      i = r;
    if (
      (v && ((f = document.createDocumentFragment()), f.append((i = S()))),
      e ? (t ?? (t = a && T(() => a(i)))) : (s ?? (s = a && T(() => a(i)))),
      v)
    ) {
      var c = H,
        h = e ? t : s,
        m = e ? s : t;
      (h && c.skipped_effects.delete(h),
        m && c.skipped_effects.add(m),
        c.add_callback(o));
    } else o();
    u && p(!0);
  };
  (A(() => {
    ((l = !1), E(I), l || d(null, null));
  }, y),
    _ && (r = J));
}
export { M as i };
//# sourceMappingURL=BHVF3NEQ.js.map
