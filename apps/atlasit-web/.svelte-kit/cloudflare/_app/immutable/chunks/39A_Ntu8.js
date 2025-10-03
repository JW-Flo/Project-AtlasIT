import {
  aj as W,
  aI as Y,
  aJ as B,
  ak as C,
  aK as L,
  aL as M,
  Y as j,
  az as q,
  i as I,
  aM as b,
  F,
  O as R,
  aN as K,
  a4 as Q,
  aO as T,
  K as w,
  E as S,
  G as $,
  M as v,
  Q as z,
  aP as G,
  aQ as J,
  a6 as X,
  X as U,
  aR as Z,
  B as x,
  R as tt,
  h as m,
  aa as at,
  am as et,
  aw as rt,
  ag as st,
} from "./DLjC2_M2.js";
const it = ["touchstart", "touchmove"];
function nt(t) {
  return it.includes(t);
}
const ot = new Set(),
  D = new Set();
function ut(t, a, r, u = {}) {
  function i(e) {
    if ((u.capture || g.call(a, e), !e.cancelBubble))
      return B(() => (r == null ? void 0 : r.call(this, e)));
  }
  return (
    t.startsWith("pointer") || t.startsWith("touch") || t === "wheel"
      ? Y(() => {
          a.addEventListener(t, i, u);
        })
      : a.addEventListener(t, i, u),
    i
  );
}
function ft(t, a, r, u, i) {
  var e = { capture: u, passive: i },
    n = ut(t, a, r, e);
  (a === document.body ||
    a === window ||
    a === document ||
    a instanceof HTMLMediaElement) &&
    W(() => {
      a.removeEventListener(t, n, e);
    });
}
let k = null;
function g(t) {
  var O;
  var a = this,
    r = a.ownerDocument,
    u = t.type,
    i = ((O = t.composedPath) == null ? void 0 : O.call(t)) || [],
    e = i[0] || t.target;
  k = t;
  var n = 0,
    f = k === t && t.__root;
  if (f) {
    var d = i.indexOf(f);
    if (d !== -1 && (a === document || a === window)) {
      t.__root = a;
      return;
    }
    var h = i.indexOf(a);
    if (h === -1) return;
    d <= h && (n = d);
  }
  if (((e = i[n] || t.target), e !== a)) {
    C(t, "currentTarget", {
      configurable: !0,
      get() {
        return e || r;
      },
    });
    var E = q,
      l = I;
    (L(null), M(null));
    try {
      for (var s, o = []; e !== null; ) {
        var c = e.assignedSlot || e.parentNode || e.host || null;
        try {
          var _ = e["__" + u];
          if (_ != null && (!e.disabled || t.target === e))
            if (j(_)) {
              var [P, ...V] = _;
              P.apply(e, [t, ...V]);
            } else _.call(e, t);
        } catch (y) {
          s ? o.push(y) : (s = y);
        }
        if (t.cancelBubble || c === a || c === null) break;
        e = c;
      }
      if (s) {
        for (let y of o)
          queueMicrotask(() => {
            throw y;
          });
        throw s;
      }
    } finally {
      ((t.__root = a), delete t.currentTarget, L(E), M(l));
    }
  }
}
let A = !0;
function dt(t, a) {
  var r = a == null ? "" : typeof a == "object" ? a + "" : a;
  r !== (t.__t ?? (t.__t = t.nodeValue)) &&
    ((t.__t = r), (t.nodeValue = r + ""));
}
function lt(t, a) {
  return H(t, a);
}
function _t(t, a) {
  (b(), (a.intro = a.intro ?? !1));
  const r = a.target,
    u = m,
    i = v;
  try {
    for (var e = F(r); e && (e.nodeType !== R || e.data !== K); ) e = Q(e);
    if (!e) throw T;
    (w(!0), S(e), $());
    const n = H(t, { ...a, anchor: e });
    if (v === null || v.nodeType !== R || v.data !== z) throw (G(), T);
    return (w(!1), n);
  } catch (n) {
    if (
      n instanceof Error &&
      n.message
        .split(
          `
`,
        )
        .some((f) => f.startsWith("https://svelte.dev/e/"))
    )
      throw n;
    return (
      n !== T && console.warn("Failed to hydrate: ", n),
      a.recover === !1 && J(),
      b(),
      X(r),
      w(!1),
      lt(t, a)
    );
  } finally {
    (w(u), S(i));
  }
}
const p = new Map();
function H(
  t,
  { target: a, anchor: r, props: u = {}, events: i, context: e, intro: n = !0 },
) {
  b();
  var f = new Set(),
    d = (l) => {
      for (var s = 0; s < l.length; s++) {
        var o = l[s];
        if (!f.has(o)) {
          f.add(o);
          var c = nt(o);
          a.addEventListener(o, g, { passive: c });
          var _ = p.get(o);
          _ === void 0
            ? (document.addEventListener(o, g, { passive: c }), p.set(o, 1))
            : p.set(o, _ + 1);
        }
      }
    };
  (d(U(ot)), D.add(d));
  var h = void 0,
    E = Z(() => {
      var l = r ?? a.appendChild(x());
      return (
        tt(() => {
          if (e) {
            at({});
            var s = et;
            s.c = e;
          }
          (i && (u.$$events = i),
            m && rt(l, null),
            (A = n),
            (h = t(l, u) || {}),
            (A = !0),
            m && (I.nodes_end = v),
            e && st());
        }),
        () => {
          var c;
          for (var s of f) {
            a.removeEventListener(s, g);
            var o = p.get(s);
            --o === 0
              ? (document.removeEventListener(s, g), p.delete(s))
              : p.set(s, o);
          }
          (D.delete(d),
            l !== r && ((c = l.parentNode) == null || c.removeChild(l)));
        }
      );
    });
  return (N.set(h, E), h);
}
let N = new WeakMap();
function ht(t, a) {
  const r = N.get(t);
  return r ? (N.delete(t), r(a)) : Promise.resolve();
}
export { A as a, ft as e, _t as h, lt as m, dt as s, ht as u };
//# sourceMappingURL=39A_Ntu8.js.map
