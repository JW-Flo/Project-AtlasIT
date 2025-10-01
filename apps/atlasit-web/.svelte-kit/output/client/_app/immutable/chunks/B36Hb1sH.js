import {
  B as X,
  C as $,
  E as O,
  h as N,
  F as z,
  G as P,
  d as F,
  j as k,
  H as j,
  I as ee,
  J as L,
  K as b,
  M as y,
  O as ae,
  Q as re,
  R as Y,
  T as ne,
  c as le,
  U as se,
  V as fe,
  W as U,
  X as q,
  Y as te,
  Z as ie,
  _ as G,
  $ as ue,
  a0 as ve,
  a1 as de,
  a2 as S,
  a3 as J,
  a4 as _e,
  a5 as oe,
  a6 as ce,
  a7 as he,
  i as pe,
} from "./DLjC2_M2.js";
function Ie(l, a) {
  return a;
}
function Ee(l, a, e) {
  for (var t = l.items, v = [], d = a.length, u = 0; u < d; u++)
    oe(a[u].e, v, !0);
  var h = d > 0 && v.length === 0 && e !== null;
  if (h) {
    var m = e.parentNode;
    (ce(m), m.append(e), t.clear(), x(l, a[0].prev, a[d - 1].next));
  }
  he(v, () => {
    for (var c = 0; c < d; c++) {
      var E = a[c];
      (h || (t.delete(E.k), x(l, E.prev, E.next)), J(E.e, !h));
    }
  });
}
function ge(l, a, e, t, v, d = null) {
  var u = l,
    h = { flags: a, items: new Map(), first: null };
  {
    var m = l;
    u = N ? O(z(m)) : m.appendChild(X());
  }
  N && P();
  var c = null,
    E = !1,
    w = new Map(),
    r = k(() => {
      var f = e();
      return te(f) ? f : f == null ? [] : q(f);
    }),
    o,
    n;
  function s() {
    (me(n, o, h, w, u, v, a, t, e),
      d !== null &&
        (o.length === 0
          ? c
            ? G(c)
            : (c = Y(() => d(u)))
          : c !== null &&
            ue(c, () => {
              c = null;
            })));
  }
  ($(() => {
    (n ?? (n = pe), (o = F(r)));
    var f = o.length;
    if (E && f === 0) return;
    E = f === 0;
    let M = !1;
    if (N) {
      var I = j(u) === ee;
      I !== (f === 0) && ((u = L()), O(u), b(!1), (M = !0));
    }
    if (N) {
      for (var i = null, p, _ = 0; _ < f; _++) {
        if (y.nodeType === ae && y.data === re) {
          ((u = y), (M = !0), b(!1));
          break;
        }
        var A = o[_],
          g = t(A, _);
        ((p = B(y, h, i, null, A, g, _, v, a, e)), h.items.set(g, p), (i = p));
      }
      f > 0 && O(L());
    }
    if (N) f === 0 && d && (c = Y(() => d(u)));
    else if (ne()) {
      var C = new Set(),
        T = le;
      for (_ = 0; _ < f; _ += 1) {
        ((A = o[_]), (g = t(A, _)));
        var R = h.items.get(g) ?? w.get(g);
        (R
          ? K(R, A, _)
          : ((p = B(null, h, null, null, A, g, _, v, a, e, !0)), w.set(g, p)),
          C.add(g));
      }
      for (const [D, H] of h.items) C.has(D) || T.skipped_effects.add(H.e);
      T.add_callback(s);
    } else s();
    (M && b(!0), F(r));
  }),
    N && (u = y));
}
function me(l, a, e, t, v, d, u, h, m) {
  var c = a.length,
    E = e.items,
    w = e.first,
    r = w,
    o,
    n = null,
    s = [],
    f = [],
    M,
    I,
    i,
    p;
  for (p = 0; p < c; p += 1) {
    if (((M = a[p]), (I = h(M, p)), (i = E.get(I)), i === void 0)) {
      var _ = t.get(I);
      if (_ !== void 0) {
        (t.delete(I), E.set(I, _));
        var A = n ? n.next : r;
        (x(e, n, _), x(e, _, A), V(_, A, v), (n = _));
      } else {
        var g = r ? r.e.nodes_start : v;
        n = B(g, e, n, n === null ? e.first : n.next, M, I, p, d, u, m);
      }
      (E.set(I, n), (s = []), (f = []), (r = n.next));
      continue;
    }
    if ((K(i, M, p), (i.e.f & S) !== 0 && G(i.e), i !== r)) {
      if (o !== void 0 && o.has(i)) {
        if (s.length < f.length) {
          var C = f[0],
            T;
          n = C.prev;
          var R = s[0],
            D = s[s.length - 1];
          for (T = 0; T < s.length; T += 1) V(s[T], C, v);
          for (T = 0; T < f.length; T += 1) o.delete(f[T]);
          (x(e, R.prev, D.next),
            x(e, n, R),
            x(e, D, C),
            (r = C),
            (n = D),
            (p -= 1),
            (s = []),
            (f = []));
        } else
          (o.delete(i),
            V(i, r, v),
            x(e, i.prev, i.next),
            x(e, i, n === null ? e.first : n.next),
            x(e, n, i),
            (n = i));
        continue;
      }
      for (s = [], f = []; r !== null && r.k !== I; )
        ((r.e.f & S) === 0 && (o ?? (o = new Set())).add(r),
          f.push(r),
          (r = r.next));
      if (r === null) continue;
      i = r;
    }
    (s.push(i), (n = i), (r = i.next));
  }
  if (r !== null || o !== void 0) {
    for (var H = o === void 0 ? [] : q(o); r !== null; )
      ((r.e.f & S) === 0 && H.push(r), (r = r.next));
    var Q = H.length;
    if (Q > 0) {
      var W = c === 0 ? v : null;
      Ee(e, H, W);
    }
  }
  ((l.first = e.first && e.first.e), (l.last = n && n.e));
  for (var Z of t.values()) J(Z.e);
  t.clear();
}
function K(l, a, e, t) {
  (se(l.v, a), (l.i = e));
}
function B(l, a, e, t, v, d, u, h, m, c, E) {
  var w = (m & ve) !== 0,
    r = (m & de) === 0,
    o = w ? (r ? fe(v, !1, !1) : U(v)) : v,
    n = (m & ie) === 0 ? u : U(u),
    s = { i: n, v: o, k: d, a: null, e: null, prev: e, next: t };
  try {
    if (l === null) {
      var f = document.createDocumentFragment();
      f.append((l = X()));
    }
    return (
      (s.e = Y(() => h(l, o, n, c), N)),
      (s.e.prev = e && e.e),
      (s.e.next = t && t.e),
      e === null ? E || (a.first = s) : ((e.next = s), (e.e.next = s.e)),
      t !== null && ((t.prev = s), (t.e.prev = s.e)),
      s
    );
  } finally {
  }
}
function V(l, a, e) {
  for (
    var t = l.next ? l.next.e.nodes_start : e,
      v = a ? a.e.nodes_start : e,
      d = l.e.nodes_start;
    d !== null && d !== t;

  ) {
    var u = _e(d);
    (v.before(d), (d = u));
  }
}
function x(l, a, e) {
  (a === null ? (l.first = e) : ((a.next = e), (a.e.next = e && e.e)),
    e !== null && ((e.prev = a), (e.e.prev = a && a.e)));
}
export { ge as e, Ie as i };
//# sourceMappingURL=B36Hb1sH.js.map
