var cn = Object.defineProperty;
var ye = (t) => {
  throw TypeError(t);
};
var _n = (t, e, n) =>
  e in t
    ? cn(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n })
    : (t[e] = n);
var xt = (t, e, n) => _n(t, typeof e != "symbol" ? e + "" : e, n),
  Xt = (t, e, n) => e.has(t) || ye("Cannot " + n);
var h = (t, e, n) => (
    Xt(t, e, "read from private field"),
    n ? n.call(t) : e.get(t)
  ),
  R = (t, e, n) =>
    e.has(t)
      ? ye("Cannot add the same private member more than once")
      : e instanceof WeakSet
        ? e.add(t)
        : e.set(t, n),
  N = (t, e, n, r) => (
    Xt(t, e, "write to private field"),
    r ? r.call(t, n) : e.set(t, n),
    n
  ),
  X = (t, e, n) => (Xt(t, e, "access private method"), n);
var vn = Array.isArray,
  hn = Array.prototype.indexOf,
  _r = Array.from,
  me = Object.defineProperty,
  St = Object.getOwnPropertyDescriptor,
  dn = Object.getOwnPropertyDescriptors,
  pn = Object.prototype,
  wn = Array.prototype,
  Ie = Object.getPrototypeOf,
  ge = Object.isExtensible;
function vr(t) {
  return typeof t == "function";
}
const hr = () => {};
function dr(t) {
  return t();
}
function ke(t) {
  for (var e = 0; e < t.length; e++) t[e]();
}
function yn() {
  var t,
    e,
    n = new Promise((r, s) => {
      ((t = r), (e = s));
    });
  return { promise: n, resolve: t, reject: e };
}
const O = 2,
  se = 4,
  Vt = 8,
  Et = 16,
  j = 32,
  it = 64,
  Pe = 128,
  k = 256,
  qt = 512,
  g = 1024,
  D = 2048,
  q = 4096,
  K = 8192,
  Tt = 16384,
  ae = 32768,
  Ce = 65536,
  Ee = 1 << 17,
  mn = 1 << 18,
  Mt = 1 << 19,
  De = 1 << 20,
  Qt = 1 << 21,
  ie = 1 << 22,
  Q = 1 << 23,
  tt = Symbol("$state"),
  pr = Symbol("legacy props"),
  wr = Symbol(""),
  le = new (class extends Error {
    constructor() {
      super(...arguments);
      xt(this, "name", "StaleReactionError");
      xt(
        this,
        "message",
        "The reaction that called `getAbortSignal()` was re-run or destroyed",
      );
    }
  })(),
  fe = 3,
  Me = 8;
function gn() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function En(t) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Tn() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function bn(t) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function xn() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function An(t) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Rn() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function mr() {
  throw new Error("https://svelte.dev/e/get_abort_signal_outside_reaction");
}
function gr() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function Er(t) {
  throw new Error("https://svelte.dev/e/lifecycle_legacy_only");
}
function Tr(t) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function Sn() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function On() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Nn() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
const br = 1,
  xr = 2,
  Ar = 16,
  Rr = 1,
  Sr = 2,
  Or = 4,
  Nr = 8,
  Ir = 16,
  kr = 1,
  Pr = 2,
  Cr = 4,
  In = 1,
  kn = 2,
  Pn = "[",
  Cn = "[!",
  Dn = "]",
  ue = {},
  T = Symbol(),
  Dr = "http://www.w3.org/1999/xhtml";
function oe(t) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
function Mr() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
let P = !1;
function Fr(t) {
  P = t;
}
let E;
function ht(t) {
  if (t === null) throw (oe(), ue);
  return (E = t);
}
function Mn() {
  return ht(lt(E));
}
function Lr(t) {
  if (P) {
    if (lt(E) !== null) throw (oe(), ue);
    E = t;
  }
}
function jr(t = 1) {
  if (P) {
    for (var e = t, n = E; e--; ) n = lt(n);
    E = n;
  }
}
function qr() {
  for (var t = 0, e = E; ; ) {
    if (e.nodeType === Me) {
      var n = e.data;
      if (n === Dn) {
        if (t === 0) return e;
        t -= 1;
      } else (n === Pn || n === Cn) && (t += 1);
    }
    var r = lt(e);
    (e.remove(), (e = r));
  }
}
function Yr(t) {
  if (!t || t.nodeType !== Me) throw (oe(), ue);
  return t.data;
}
function Fe(t) {
  return t === this.v;
}
function Fn(t, e) {
  return t != t
    ? e == e
    : t !== e || (t !== null && typeof t == "object") || typeof t == "function";
}
function Le(t) {
  return !Fn(t, this.v);
}
let Gt = !1;
function Ur() {
  Gt = !0;
}
let w = null;
function Yt(t) {
  w = t;
}
function Hr(t) {
  return $t().get(t);
}
function Br(t, e) {
  return ($t().set(t, e), e);
}
function Vr(t) {
  return $t().has(t);
}
function Gr() {
  return $t();
}
function $r(t, e = !1, n) {
  w = {
    p: w,
    c: null,
    e: null,
    s: t,
    x: null,
    l: Gt && !e ? { s: null, u: null, $: [] } : null,
  };
}
function Kr(t) {
  var e = w,
    n = e.e;
  if (n !== null) {
    e.e = null;
    for (var r of n) Ze(r);
  }
  return ((w = e.p), {});
}
function Ft() {
  return !Gt || (w !== null && w.l === null);
}
function $t(t) {
  return (w === null && En(), w.c ?? (w.c = new Map(Ln(w) || void 0)));
}
function Ln(t) {
  let e = t.p;
  for (; e !== null; ) {
    const n = e.c;
    if (n !== null) return n;
    e = e.p;
  }
  return null;
}
const jn = new WeakMap();
function qn(t) {
  var e = v;
  if (e === null) return ((_.f |= Q), t);
  if ((e.f & ae) === 0) {
    if ((e.f & Pe) === 0) throw (!e.parent && t instanceof Error && je(t), t);
    e.b.error(t);
  } else ce(t, e);
}
function ce(t, e) {
  for (; e !== null; ) {
    if ((e.f & Pe) !== 0)
      try {
        e.b.error(t);
        return;
      } catch (n) {
        t = n;
      }
    e = e.parent;
  }
  throw (t instanceof Error && je(t), t);
}
function je(t) {
  const e = jn.get(t);
  e &&
    (me(t, "message", { value: e.message }),
    me(t, "stack", { value: e.stack }));
}
const Yn =
  typeof requestIdleCallback > "u"
    ? (t) => setTimeout(t, 1)
    : requestIdleCallback;
let V = [],
  dt = [];
function qe() {
  var t = V;
  ((V = []), ke(t));
}
function Ye() {
  var t = dt;
  ((dt = []), ke(t));
}
function Un() {
  return V.length > 0 || dt.length > 0;
}
function Hn(t) {
  if (V.length === 0 && !Ot) {
    var e = V;
    queueMicrotask(() => {
      e === V && qe();
    });
  }
  V.push(t);
}
function Wr(t) {
  (dt.length === 0 && Yn(Ye), dt.push(t));
}
function Bn() {
  (V.length > 0 && qe(), dt.length > 0 && Ye());
}
function Vn() {
  const t = v.b;
  return (t === null && gn(), t);
}
function _e(t) {
  var e = O | D,
    n = _ !== null && (_.f & O) !== 0 ? _ : null;
  return (
    v === null || (n !== null && (n.f & k) !== 0) ? (e |= k) : (v.f |= Mt),
    {
      ctx: w,
      deps: null,
      effects: null,
      equals: Fe,
      f: e,
      fn: t,
      reactions: null,
      rv: 0,
      v: T,
      wv: 0,
      parent: n ?? v,
      ac: null,
    }
  );
}
function Gn(t, e) {
  let n = v;
  n === null && Tn();
  var r = n.b,
    s = void 0,
    a = he(T),
    l = null,
    u = !_;
  return (
    er(() => {
      try {
        var i = t();
        l && Promise.resolve(i).catch(() => {});
      } catch (d) {
        i = Promise.reject(d);
      }
      var f = () => i;
      ((s = (l == null ? void 0 : l.then(f, f)) ?? Promise.resolve(i)),
        (l = s));
      var o = m,
        c = r.is_pending();
      u && (r.update_pending_count(1), c || o.increment());
      const y = (d, p = void 0) => {
        ((l = null),
          c || o.activate(),
          p
            ? p !== le && ((a.f |= Q), Ut(a, p))
            : ((a.f & Q) !== 0 && (a.f ^= Q), Ut(a, d)),
          u && (r.update_pending_count(-1), c || o.decrement()),
          Be());
      };
      if ((s.then(y, (d) => y(null, d || "unknown")), o))
        return () => {
          queueMicrotask(() => o.neuter());
        };
    }),
    new Promise((i) => {
      function f(o) {
        function c() {
          o === s ? i(a) : f(s);
        }
        o.then(c, c);
      }
      f(s);
    })
  );
}
function Xr(t) {
  const e = _e(t);
  return (rn(e), e);
}
function $n(t) {
  const e = _e(t);
  return ((e.equals = Le), e);
}
function Ue(t) {
  var e = t.effects;
  if (e !== null) {
    t.effects = null;
    for (var n = 0; n < e.length; n += 1) at(e[n]);
  }
}
function Kn(t) {
  for (var e = t.parent; e !== null; ) {
    if ((e.f & O) === 0) return e;
    e = e.parent;
  }
  return null;
}
function ve(t) {
  var e,
    n = v;
  gt(Kn(t));
  try {
    (Ue(t), (e = fn(t)));
  } finally {
    gt(n);
  }
  return e;
}
function He(t) {
  var e = ve(t);
  if ((t.equals(e) || ((t.v = e), (t.wv = an())), !bt)) {
    var n = (G || (t.f & k) !== 0) && t.deps !== null ? q : g;
    A(t, n);
  }
}
function Wn(t, e, n) {
  const r = Ft() ? _e : $n;
  if (e.length === 0) {
    n(t.map(r));
    return;
  }
  var s = m,
    a = v,
    l = Xn(),
    u = Vn();
  Promise.all(e.map((i) => Gn(i)))
    .then((i) => {
      (s == null || s.activate(), l());
      try {
        n([...t.map(r), ...i]);
      } catch (f) {
        (a.f & Tt) === 0 && ce(f, a);
      }
      (s == null || s.deactivate(), Be());
    })
    .catch((i) => {
      u.error(i);
    });
}
function Xn() {
  var t = v,
    e = _,
    n = w,
    r = m;
  return function () {
    (gt(t), W(e), Yt(n), r == null || r.activate());
  };
}
function Be() {
  (gt(null), W(null), Yt(null));
}
const Zt = new Set();
let m = null,
  zt = null,
  Te = new Set(),
  st = [],
  Kt = null,
  te = !1,
  Ot = !1;
var It, ct, H, kt, Pt, z, _t, J, B, vt, Ct, Dt, C, Ve, jt, ee;
const Bt = class Bt {
  constructor() {
    R(this, C);
    xt(this, "current", new Map());
    R(this, It, new Map());
    R(this, ct, new Set());
    R(this, H, 0);
    R(this, kt, null);
    R(this, Pt, !1);
    R(this, z, []);
    R(this, _t, []);
    R(this, J, []);
    R(this, B, []);
    R(this, vt, []);
    R(this, Ct, []);
    R(this, Dt, []);
    xt(this, "skipped_effects", new Set());
  }
  process(e) {
    var s;
    ((st = []), (zt = null));
    for (const a of e) X(this, C, Ve).call(this, a);
    if (h(this, z).length === 0 && h(this, H) === 0) {
      X(this, C, ee).call(this);
      var n = h(this, J),
        r = h(this, B);
      (N(this, J, []),
        N(this, B, []),
        N(this, vt, []),
        (zt = m),
        (m = null),
        be(n),
        be(r),
        m === null ? (m = this) : Zt.delete(this),
        (s = h(this, kt)) == null || s.resolve());
    } else
      (X(this, C, jt).call(this, h(this, J)),
        X(this, C, jt).call(this, h(this, B)),
        X(this, C, jt).call(this, h(this, vt)));
    for (const a of h(this, z)) nt(a);
    for (const a of h(this, _t)) nt(a);
    (N(this, z, []), N(this, _t, []));
  }
  capture(e, n) {
    (h(this, It).has(e) || h(this, It).set(e, n), this.current.set(e, e.v));
  }
  activate() {
    m = this;
  }
  deactivate() {
    ((m = null), (zt = null));
    for (const e of Te) if ((Te.delete(e), e(), m !== null)) break;
  }
  neuter() {
    N(this, Pt, !0);
  }
  flush() {
    (st.length > 0 ? ne() : X(this, C, ee).call(this),
      m === this && (h(this, H) === 0 && Zt.delete(this), this.deactivate()));
  }
  increment() {
    N(this, H, h(this, H) + 1);
  }
  decrement() {
    if ((N(this, H, h(this, H) - 1), h(this, H) === 0)) {
      for (const e of h(this, Ct)) (A(e, D), wt(e));
      for (const e of h(this, Dt)) (A(e, q), wt(e));
      (N(this, J, []), N(this, B, []), this.flush());
    } else this.deactivate();
  }
  add_callback(e) {
    h(this, ct).add(e);
  }
  settled() {
    return (h(this, kt) ?? N(this, kt, yn())).promise;
  }
  static ensure() {
    if (m === null) {
      const e = (m = new Bt());
      (Zt.add(m),
        Ot ||
          Bt.enqueue(() => {
            m === e && e.flush();
          }));
    }
    return m;
  }
  static enqueue(e) {
    Hn(e);
  }
};
((It = new WeakMap()),
  (ct = new WeakMap()),
  (H = new WeakMap()),
  (kt = new WeakMap()),
  (Pt = new WeakMap()),
  (z = new WeakMap()),
  (_t = new WeakMap()),
  (J = new WeakMap()),
  (B = new WeakMap()),
  (vt = new WeakMap()),
  (Ct = new WeakMap()),
  (Dt = new WeakMap()),
  (C = new WeakSet()),
  (Ve = function (e) {
    var o;
    e.f ^= g;
    for (var n = e.first; n !== null; ) {
      var r = n.f,
        s = (r & (j | it)) !== 0,
        a = s && (r & g) !== 0,
        l = a || (r & K) !== 0 || this.skipped_effects.has(n);
      if (!l && n.fn !== null) {
        if (s) n.f ^= g;
        else if ((r & se) !== 0) h(this, B).push(n);
        else if ((r & g) === 0)
          if ((r & ie) !== 0) {
            var u =
              (o = n.b) != null && o.is_pending() ? h(this, _t) : h(this, z);
            u.push(n);
          } else Lt(n) && ((n.f & Et) !== 0 && h(this, vt).push(n), nt(n));
        var i = n.first;
        if (i !== null) {
          n = i;
          continue;
        }
      }
      var f = n.parent;
      for (n = n.next; n === null && f !== null; )
        ((n = f.next), (f = f.parent));
    }
  }),
  (jt = function (e) {
    for (const n of e)
      (((n.f & D) !== 0 ? h(this, Ct) : h(this, Dt)).push(n), A(n, g));
    e.length = 0;
  }),
  (ee = function () {
    if (!h(this, Pt)) for (const e of h(this, ct)) e();
    h(this, ct).clear();
  }));
let pt = Bt;
function Zn(t) {
  var e = Ot;
  Ot = !0;
  try {
    var n;
    for (t && (ne(), (n = t())); ; ) {
      if (
        (Bn(),
        st.length === 0 && !Un() && (m == null || m.flush(), st.length === 0))
      )
        return ((Kt = null), n);
      ne();
    }
  } finally {
    Ot = e;
  }
}
function ne() {
  var t = ot;
  te = !0;
  try {
    var e = 0;
    for (Se(!0); st.length > 0; ) {
      var n = pt.ensure();
      if (e++ > 1e3) {
        var r, s;
        zn();
      }
      (n.process(st), $.clear());
    }
  } finally {
    ((te = !1), Se(t), (Kt = null));
  }
}
function zn() {
  try {
    Rn();
  } catch (t) {
    ce(t, Kt);
  }
}
let L = null;
function be(t) {
  var e = t.length;
  if (e !== 0) {
    for (var n = 0; n < e; ) {
      var r = t[n++];
      if (
        (r.f & (Tt | K)) === 0 &&
        Lt(r) &&
        ((L = []),
        nt(r),
        r.deps === null &&
          r.first === null &&
          r.nodes_start === null &&
          (r.teardown === null && r.ac === null ? tn(r) : (r.fn = null)),
        (L == null ? void 0 : L.length) > 0)
      ) {
        $.clear();
        for (const s of L) nt(s);
        L = [];
      }
    }
    L = null;
  }
}
function wt(t) {
  for (var e = (Kt = t); e.parent !== null; ) {
    e = e.parent;
    var n = e.f;
    if (te && e === v && (n & Et) !== 0) return;
    if ((n & (it | j)) !== 0) {
      if ((n & g) === 0) return;
      e.f ^= g;
    }
  }
  st.push(e);
}
const $ = new Map();
function he(t, e) {
  var n = { f: 0, v: t, reactions: null, equals: Fe, rv: 0, wv: 0 };
  return n;
}
function Y(t, e) {
  const n = he(t);
  return (rn(n), n);
}
function Zr(t, e = !1, n = !0) {
  var s;
  const r = he(t);
  return (
    e || (r.equals = Le),
    Gt &&
      n &&
      w !== null &&
      w.l !== null &&
      ((s = w.l).s ?? (s.s = [])).push(r),
    r
  );
}
function Z(t, e, n = !1) {
  _ !== null &&
    (!M || (_.f & Ee) !== 0) &&
    Ft() &&
    (_.f & (O | Et | ie | Ee)) !== 0 &&
    !(x != null && x.includes(t)) &&
    Nn();
  let r = n ? At(e) : e;
  return Ut(t, r);
}
function Ut(t, e) {
  if (!t.equals(e)) {
    var n = t.v;
    (bt ? $.set(t, e) : $.set(t, n), (t.v = e));
    var r = pt.ensure();
    (r.capture(t, n),
      (t.f & O) !== 0 &&
        ((t.f & D) !== 0 && ve(t), A(t, (t.f & k) === 0 ? g : q)),
      (t.wv = an()),
      Ge(t, D),
      Ft() &&
        v !== null &&
        (v.f & g) !== 0 &&
        (v.f & (j | it)) === 0 &&
        (I === null ? lr([t]) : I.push(t)));
  }
  return e;
}
function Jt(t) {
  Z(t, t.v + 1);
}
function Ge(t, e) {
  var n = t.reactions;
  if (n !== null)
    for (var r = Ft(), s = n.length, a = 0; a < s; a++) {
      var l = n[a],
        u = l.f;
      if (!(!r && l === v)) {
        var i = (u & D) === 0;
        (i && A(l, e),
          (u & O) !== 0
            ? Ge(l, q)
            : i && ((u & Et) !== 0 && L !== null && L.push(l), wt(l)));
      }
    }
}
function At(t) {
  if (typeof t != "object" || t === null || tt in t) return t;
  const e = Ie(t);
  if (e !== pn && e !== wn) return t;
  var n = new Map(),
    r = vn(t),
    s = Y(0),
    a = et,
    l = (u) => {
      if (et === a) return u();
      var i = _,
        f = et;
      (W(null), Ne(a));
      var o = u();
      return (W(i), Ne(f), o);
    };
  return (
    r && n.set("length", Y(t.length)),
    new Proxy(t, {
      defineProperty(u, i, f) {
        (!("value" in f) ||
          f.configurable === !1 ||
          f.enumerable === !1 ||
          f.writable === !1) &&
          Sn();
        var o = n.get(i);
        return (
          o === void 0
            ? (o = l(() => {
                var c = Y(f.value);
                return (n.set(i, c), c);
              }))
            : Z(o, f.value, !0),
          !0
        );
      },
      deleteProperty(u, i) {
        var f = n.get(i);
        if (f === void 0) {
          if (i in u) {
            const o = l(() => Y(T));
            (n.set(i, o), Jt(s));
          }
        } else (Z(f, T), Jt(s));
        return !0;
      },
      get(u, i, f) {
        var d;
        if (i === tt) return t;
        var o = n.get(i),
          c = i in u;
        if (
          (o === void 0 &&
            (!c || ((d = St(u, i)) != null && d.writable)) &&
            ((o = l(() => {
              var p = At(c ? u[i] : T),
                ft = Y(p);
              return ft;
            })),
            n.set(i, o)),
          o !== void 0)
        ) {
          var y = Rt(o);
          return y === T ? void 0 : y;
        }
        return Reflect.get(u, i, f);
      },
      getOwnPropertyDescriptor(u, i) {
        var f = Reflect.getOwnPropertyDescriptor(u, i);
        if (f && "value" in f) {
          var o = n.get(i);
          o && (f.value = Rt(o));
        } else if (f === void 0) {
          var c = n.get(i),
            y = c == null ? void 0 : c.v;
          if (c !== void 0 && y !== T)
            return { enumerable: !0, configurable: !0, value: y, writable: !0 };
        }
        return f;
      },
      has(u, i) {
        var y;
        if (i === tt) return !0;
        var f = n.get(i),
          o = (f !== void 0 && f.v !== T) || Reflect.has(u, i);
        if (
          f !== void 0 ||
          (v !== null && (!o || ((y = St(u, i)) != null && y.writable)))
        ) {
          f === void 0 &&
            ((f = l(() => {
              var d = o ? At(u[i]) : T,
                p = Y(d);
              return p;
            })),
            n.set(i, f));
          var c = Rt(f);
          if (c === T) return !1;
        }
        return o;
      },
      set(u, i, f, o) {
        var we;
        var c = n.get(i),
          y = i in u;
        if (r && i === "length")
          for (var d = f; d < c.v; d += 1) {
            var p = n.get(d + "");
            p !== void 0
              ? Z(p, T)
              : d in u && ((p = l(() => Y(T))), n.set(d + "", p));
          }
        if (c === void 0)
          (!y || ((we = St(u, i)) != null && we.writable)) &&
            ((c = l(() => Y(void 0))), Z(c, At(f)), n.set(i, c));
        else {
          y = c.v !== T;
          var ft = l(() => At(f));
          Z(c, ft);
        }
        var ut = Reflect.getOwnPropertyDescriptor(u, i);
        if ((ut != null && ut.set && ut.set.call(o, f), !y)) {
          if (r && typeof i == "string") {
            var pe = n.get("length"),
              Wt = Number(i);
            Number.isInteger(Wt) && Wt >= pe.v && Z(pe, Wt + 1);
          }
          Jt(s);
        }
        return !0;
      },
      ownKeys(u) {
        Rt(s);
        var i = Reflect.ownKeys(u).filter((c) => {
          var y = n.get(c);
          return y === void 0 || y.v !== T;
        });
        for (var [f, o] of n) o.v !== T && !(f in u) && i.push(f);
        return i;
      },
      setPrototypeOf() {
        On();
      },
    })
  );
}
function xe(t) {
  try {
    if (t !== null && typeof t == "object" && tt in t) return t[tt];
  } catch {}
  return t;
}
function zr(t, e) {
  return Object.is(xe(t), xe(e));
}
var Ae, $e, Ke, We;
function Jr() {
  if (Ae === void 0) {
    ((Ae = window), ($e = /Firefox/.test(navigator.userAgent)));
    var t = Element.prototype,
      e = Node.prototype,
      n = Text.prototype;
    ((Ke = St(e, "firstChild").get),
      (We = St(e, "nextSibling").get),
      ge(t) &&
        ((t.__click = void 0),
        (t.__className = void 0),
        (t.__attributes = null),
        (t.__style = void 0),
        (t.__e = void 0)),
      ge(n) && (n.__t = void 0));
  }
}
function yt(t = "") {
  return document.createTextNode(t);
}
function mt(t) {
  return Ke.call(t);
}
function lt(t) {
  return We.call(t);
}
function Qr(t, e) {
  if (!P) return mt(t);
  var n = mt(E);
  if (n === null) n = E.appendChild(yt());
  else if (e && n.nodeType !== fe) {
    var r = yt();
    return (n == null || n.before(r), ht(r), r);
  }
  return (ht(n), n);
}
function ts(t, e) {
  if (!P) {
    var n = mt(t);
    return n instanceof Comment && n.data === "" ? lt(n) : n;
  }
  return E;
}
function es(t, e = 1, n = !1) {
  let r = P ? E : t;
  for (var s; e--; ) ((s = r), (r = lt(r)));
  if (!P) return r;
  if (n && (r == null ? void 0 : r.nodeType) !== fe) {
    var a = yt();
    return (r === null ? s == null || s.after(a) : r.before(a), ht(a), a);
  }
  return (ht(r), r);
}
function Jn(t) {
  t.textContent = "";
}
function ns() {
  return !1;
}
function rs(t) {
  P && mt(t) !== null && Jn(t);
}
let Re = !1;
function Qn() {
  Re ||
    ((Re = !0),
    document.addEventListener(
      "reset",
      (t) => {
        Promise.resolve().then(() => {
          var e;
          if (!t.defaultPrevented)
            for (const n of t.target.elements)
              (e = n.__on_r) == null || e.call(n);
        });
      },
      { capture: !0 },
    ));
}
function de(t) {
  var e = _,
    n = v;
  (W(null), gt(null));
  try {
    return t();
  } finally {
    (W(e), gt(n));
  }
}
function ss(t, e, n, r = n) {
  t.addEventListener(e, () => de(n));
  const s = t.__on_r;
  (s
    ? (t.__on_r = () => {
        (s(), r(!0));
      })
    : (t.__on_r = () => r(!0)),
    Qn());
}
function Xe(t) {
  (v === null && _ === null && An(),
    _ !== null && (_.f & k) !== 0 && v === null && xn(),
    bt && bn());
}
function tr(t, e) {
  var n = e.last;
  n === null
    ? (e.last = e.first = t)
    : ((n.next = t), (t.prev = n), (e.last = t));
}
function F(t, e, n, r = !0) {
  var s = v;
  s !== null && (s.f & K) !== 0 && (t |= K);
  var a = {
    ctx: w,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: t | D,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: s,
    b: s && s.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null,
  };
  if (n)
    try {
      (nt(a), (a.f |= ae));
    } catch (i) {
      throw (at(a), i);
    }
  else e !== null && wt(a);
  if (r) {
    var l = a;
    if (
      (n &&
        l.deps === null &&
        l.teardown === null &&
        l.nodes_start === null &&
        l.first === l.last &&
        (l.f & Mt) === 0 &&
        (l = l.first),
      l !== null &&
        ((l.parent = s),
        s !== null && tr(l, s),
        _ !== null && (_.f & O) !== 0 && (t & it) === 0))
    ) {
      var u = _;
      (u.effects ?? (u.effects = [])).push(l);
    }
  }
  return a;
}
function as(t) {
  const e = F(Vt, null, !1);
  return (A(e, g), (e.teardown = t), e);
}
function is(t) {
  Xe();
  var e = v.f,
    n = !_ && (e & j) !== 0 && (e & ae) === 0;
  if (n) {
    var r = w;
    (r.e ?? (r.e = [])).push(t);
  } else return Ze(t);
}
function Ze(t) {
  return F(se | De, t, !1);
}
function ls(t) {
  return (Xe(), F(Vt | De, t, !0));
}
function fs(t) {
  pt.ensure();
  const e = F(it | Mt, t, !0);
  return (n = {}) =>
    new Promise((r) => {
      n.outro
        ? sr(e, () => {
            (at(e), r(void 0));
          })
        : (at(e), r(void 0));
    });
}
function us(t) {
  return F(se, t, !1);
}
function os(t, e) {
  var n = w,
    r = { effect: null, ran: !1, deps: t };
  (n.l.$.push(r),
    (r.effect = ze(() => {
      (t(), !r.ran && ((r.ran = !0), on(e)));
    })));
}
function cs() {
  var t = w;
  ze(() => {
    for (var e of t.l.$) {
      e.deps();
      var n = e.effect;
      ((n.f & g) !== 0 && A(n, q), Lt(n) && nt(n), (e.ran = !1));
    }
  });
}
function er(t) {
  return F(ie | Mt, t, !0);
}
function ze(t, e = 0) {
  return F(Vt | e, t, !0);
}
function _s(t, e = [], n = []) {
  Wn(e, n, (r) => {
    F(Vt, () => t(...r.map(Rt)), !0);
  });
}
function vs(t, e = 0) {
  var n = F(Et | e, t, !0);
  return n;
}
function hs(t, e = !0) {
  return F(j | Mt, t, !0, e);
}
function Je(t) {
  var e = t.teardown;
  if (e !== null) {
    const n = bt,
      r = _;
    (Oe(!0), W(null));
    try {
      e.call(null);
    } finally {
      (Oe(n), W(r));
    }
  }
}
function Qe(t, e = !1) {
  var n = t.first;
  for (t.first = t.last = null; n !== null; ) {
    const s = n.ac;
    s !== null &&
      de(() => {
        s.abort(le);
      });
    var r = n.next;
    ((n.f & it) !== 0 ? (n.parent = null) : at(n, e), (n = r));
  }
}
function nr(t) {
  for (var e = t.first; e !== null; ) {
    var n = e.next;
    ((e.f & j) === 0 && at(e), (e = n));
  }
}
function at(t, e = !0) {
  var n = !1;
  ((e || (t.f & mn) !== 0) &&
    t.nodes_start !== null &&
    t.nodes_end !== null &&
    (rr(t.nodes_start, t.nodes_end), (n = !0)),
    Qe(t, e && !n),
    Ht(t, 0),
    A(t, Tt));
  var r = t.transitions;
  if (r !== null) for (const a of r) a.stop();
  Je(t);
  var s = t.parent;
  (s !== null && s.first !== null && tn(t),
    (t.next =
      t.prev =
      t.teardown =
      t.ctx =
      t.deps =
      t.fn =
      t.nodes_start =
      t.nodes_end =
      t.ac =
        null));
}
function rr(t, e) {
  for (; t !== null; ) {
    var n = t === e ? null : lt(t);
    (t.remove(), (t = n));
  }
}
function tn(t) {
  var e = t.parent,
    n = t.prev,
    r = t.next;
  (n !== null && (n.next = r),
    r !== null && (r.prev = n),
    e !== null &&
      (e.first === t && (e.first = r), e.last === t && (e.last = n)));
}
function sr(t, e) {
  var n = [];
  (en(t, n, !0),
    ar(n, () => {
      (at(t), e && e());
    }));
}
function ar(t, e) {
  var n = t.length;
  if (n > 0) {
    var r = () => --n || e();
    for (var s of t) s.out(r);
  } else e();
}
function en(t, e, n) {
  if ((t.f & K) === 0) {
    if (((t.f ^= K), t.transitions !== null))
      for (const l of t.transitions) (l.is_global || n) && e.push(l);
    for (var r = t.first; r !== null; ) {
      var s = r.next,
        a = (r.f & Ce) !== 0 || (r.f & j) !== 0;
      (en(r, e, a ? n : !1), (r = s));
    }
  }
}
function ds(t) {
  nn(t, !0);
}
function nn(t, e) {
  if ((t.f & K) !== 0) {
    ((t.f ^= K), (t.f & g) === 0 && (A(t, D), wt(t)));
    for (var n = t.first; n !== null; ) {
      var r = n.next,
        s = (n.f & Ce) !== 0 || (n.f & j) !== 0;
      (nn(n, s ? e : !1), (n = r));
    }
    if (t.transitions !== null)
      for (const a of t.transitions) (a.is_global || e) && a.in();
  }
}
let U = null;
function ir(t) {
  var e = U;
  try {
    if (((U = new Set()), on(t), e !== null)) for (var n of U) e.add(n);
    return U;
  } finally {
    U = e;
  }
}
function ps(t) {
  for (var e of ir(t)) Ut(e, e.v);
}
let ot = !1;
function Se(t) {
  ot = t;
}
let bt = !1;
function Oe(t) {
  bt = t;
}
let _ = null,
  M = !1;
function W(t) {
  _ = t;
}
let v = null;
function gt(t) {
  v = t;
}
let x = null;
function rn(t) {
  _ !== null && (x === null ? (x = [t]) : x.push(t));
}
let b = null,
  S = 0,
  I = null;
function lr(t) {
  I = t;
}
let sn = 1,
  Nt = 0,
  et = Nt;
function Ne(t) {
  et = t;
}
let G = !1;
function an() {
  return ++sn;
}
function Lt(t) {
  var c;
  var e = t.f;
  if ((e & D) !== 0) return !0;
  if ((e & q) !== 0) {
    var n = t.deps,
      r = (e & k) !== 0;
    if (n !== null) {
      var s,
        a,
        l = (e & qt) !== 0,
        u = r && v !== null && !G,
        i = n.length;
      if ((l || u) && (v === null || (v.f & Tt) === 0)) {
        var f = t,
          o = f.parent;
        for (s = 0; s < i; s++)
          ((a = n[s]),
            (l ||
              !(
                (c = a == null ? void 0 : a.reactions) != null && c.includes(f)
              )) &&
              (a.reactions ?? (a.reactions = [])).push(f));
        (l && (f.f ^= qt), u && o !== null && (o.f & k) === 0 && (f.f ^= k));
      }
      for (s = 0; s < i; s++)
        if (((a = n[s]), Lt(a) && He(a), a.wv > t.wv)) return !0;
    }
    (!r || (v !== null && !G)) && A(t, g);
  }
  return !1;
}
function ln(t, e, n = !0) {
  var r = t.reactions;
  if (r !== null && !(x != null && x.includes(t)))
    for (var s = 0; s < r.length; s++) {
      var a = r[s];
      (a.f & O) !== 0
        ? ln(a, e, !1)
        : e === a && (n ? A(a, D) : (a.f & g) !== 0 && A(a, q), wt(a));
    }
}
function fn(t) {
  var ft;
  var e = b,
    n = S,
    r = I,
    s = _,
    a = G,
    l = x,
    u = w,
    i = M,
    f = et,
    o = t.f;
  ((b = null),
    (S = 0),
    (I = null),
    (G = (o & k) !== 0 && (M || !ot || _ === null)),
    (_ = (o & (j | it)) === 0 ? t : null),
    (x = null),
    Yt(t.ctx),
    (M = !1),
    (et = ++Nt),
    t.ac !== null &&
      (de(() => {
        t.ac.abort(le);
      }),
      (t.ac = null)));
  try {
    t.f |= Qt;
    var c = t.fn,
      y = c(),
      d = t.deps;
    if (b !== null) {
      var p;
      if ((Ht(t, S), d !== null && S > 0))
        for (d.length = S + b.length, p = 0; p < b.length; p++) d[S + p] = b[p];
      else t.deps = d = b;
      if (!G || ((o & O) !== 0 && t.reactions !== null))
        for (p = S; p < d.length; p++)
          ((ft = d[p]).reactions ?? (ft.reactions = [])).push(t);
    } else d !== null && S < d.length && (Ht(t, S), (d.length = S));
    if (Ft() && I !== null && !M && d !== null && (t.f & (O | q | D)) === 0)
      for (p = 0; p < I.length; p++) ln(I[p], t);
    return (
      s !== null &&
        s !== t &&
        (Nt++, I !== null && (r === null ? (r = I) : r.push(...I))),
      (t.f & Q) !== 0 && (t.f ^= Q),
      y
    );
  } catch (ut) {
    return qn(ut);
  } finally {
    ((t.f ^= Qt),
      (b = e),
      (S = n),
      (I = r),
      (_ = s),
      (G = a),
      (x = l),
      Yt(u),
      (M = i),
      (et = f));
  }
}
function fr(t, e) {
  let n = e.reactions;
  if (n !== null) {
    var r = hn.call(n, t);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? (n = e.reactions = null) : ((n[r] = n[s]), n.pop());
    }
  }
  n === null &&
    (e.f & O) !== 0 &&
    (b === null || !b.includes(e)) &&
    (A(e, q), (e.f & (k | qt)) === 0 && (e.f ^= qt), Ue(e), Ht(e, 0));
}
function Ht(t, e) {
  var n = t.deps;
  if (n !== null) for (var r = e; r < n.length; r++) fr(t, n[r]);
}
function nt(t) {
  var e = t.f;
  if ((e & Tt) === 0) {
    A(t, g);
    var n = v,
      r = ot;
    ((v = t), (ot = !0));
    try {
      ((e & Et) !== 0 ? nr(t) : Qe(t), Je(t));
      var s = fn(t);
      ((t.teardown = typeof s == "function" ? s : null), (t.wv = sn));
      var a;
    } finally {
      ((ot = r), (v = n));
    }
  }
}
async function ws() {
  (await Promise.resolve(), Zn());
}
function ys() {
  return pt.ensure().settled();
}
function Rt(t) {
  var e = t.f,
    n = (e & O) !== 0;
  if ((U == null || U.add(t), _ !== null && !M)) {
    var r = v !== null && (v.f & Tt) !== 0;
    if (!r && !(x != null && x.includes(t))) {
      var s = _.deps;
      if ((_.f & Qt) !== 0)
        t.rv < Nt &&
          ((t.rv = Nt),
          b === null && s !== null && s[S] === t
            ? S++
            : b === null
              ? (b = [t])
              : (!G || !b.includes(t)) && b.push(t));
      else {
        (_.deps ?? (_.deps = [])).push(t);
        var a = t.reactions;
        a === null ? (t.reactions = [_]) : a.includes(_) || a.push(_);
      }
    }
  } else if (n && t.deps === null && t.effects === null) {
    var l = t,
      u = l.parent;
    u !== null && (u.f & k) === 0 && (l.f ^= k);
  }
  if (bt) {
    if ($.has(t)) return $.get(t);
    if (n) {
      l = t;
      var i = l.v;
      return (
        (((l.f & g) === 0 && l.reactions !== null) || un(l)) && (i = ve(l)),
        $.set(l, i),
        i
      );
    }
  } else n && ((l = t), Lt(l) && He(l));
  if ((t.f & Q) !== 0) throw t.v;
  return t.v;
}
function un(t) {
  if (t.v === T) return !0;
  if (t.deps === null) return !1;
  for (const e of t.deps) if ($.has(e) || ((e.f & O) !== 0 && un(e))) return !0;
  return !1;
}
function on(t) {
  var e = M;
  try {
    return ((M = !0), t());
  } finally {
    M = e;
  }
}
const ur = -7169;
function A(t, e) {
  t.f = (t.f & ur) | e;
}
function ms(t) {
  if (!(typeof t != "object" || !t || t instanceof EventTarget)) {
    if (tt in t) re(t);
    else if (!Array.isArray(t))
      for (let e in t) {
        const n = t[e];
        typeof n == "object" && n && tt in n && re(n);
      }
  }
}
function re(t, e = new Set()) {
  if (
    typeof t == "object" &&
    t !== null &&
    !(t instanceof EventTarget) &&
    !e.has(t)
  ) {
    (e.add(t), t instanceof Date && t.getTime());
    for (let r in t)
      try {
        re(t[r], e);
      } catch {}
    const n = Ie(t);
    if (
      n !== Object.prototype &&
      n !== Array.prototype &&
      n !== Map.prototype &&
      n !== Set.prototype &&
      n !== Date.prototype
    ) {
      const r = dn(n);
      for (let s in r) {
        const a = r[s].get;
        if (a)
          try {
            a.call(t);
          } catch {}
      }
    }
  }
}
function or(t) {
  var e = document.createElement("template");
  return ((e.innerHTML = t.replaceAll("<!>", "<!---->")), e.content);
}
function rt(t, e) {
  var n = v;
  n.nodes_start === null && ((n.nodes_start = t), (n.nodes_end = e));
}
function gs(t, e) {
  var n = (e & In) !== 0,
    r = (e & kn) !== 0,
    s,
    a = !t.startsWith("<!>");
  return () => {
    if (P) return (rt(E, null), E);
    s === void 0 && ((s = or(a ? t : "<!>" + t)), n || (s = mt(s)));
    var l = r || $e ? document.importNode(s, !0) : s.cloneNode(!0);
    if (n) {
      var u = mt(l),
        i = l.lastChild;
      rt(u, i);
    } else rt(l, l);
    return l;
  };
}
function Es(t = "") {
  if (!P) {
    var e = yt(t + "");
    return (rt(e, e), e);
  }
  var n = E;
  return (n.nodeType !== fe && (n.before((n = yt())), ht(n)), rt(n, n), n);
}
function Ts() {
  if (P) return (rt(E, null), E);
  var t = document.createDocumentFragment(),
    e = document.createComment(""),
    n = yt();
  return (t.append(e, n), rt(e, n), t);
}
function bs(t, e) {
  if (P) {
    ((v.nodes_end = E), Mn());
    return;
  }
  t !== null && t.before(e);
}
export {
  sr as $,
  Ir as A,
  yt as B,
  vs as C,
  Tt as D,
  ht as E,
  mt as F,
  Mn as G,
  Yr as H,
  Cn as I,
  qr as J,
  Fr as K,
  wr as L,
  E as M,
  Dr as N,
  Me as O,
  Or as P,
  Dn as Q,
  hs as R,
  tt as S,
  ns as T,
  Ut as U,
  Zr as V,
  he as W,
  _r as X,
  vn as Y,
  xr as Z,
  ds as _,
  bs as a,
  Cr as a$,
  br as a0,
  Ar as a1,
  K as a2,
  at as a3,
  lt as a4,
  en as a5,
  Jn as a6,
  ar as a7,
  Ce as a8,
  T as a9,
  Er as aA,
  Zn as aB,
  Gr as aC,
  Hr as aD,
  Vr as aE,
  Br as aF,
  ys as aG,
  Fn as aH,
  Hn as aI,
  de as aJ,
  W as aK,
  gt as aL,
  Jr as aM,
  Pn as aN,
  ue as aO,
  oe as aP,
  gr as aQ,
  fs as aR,
  us as aS,
  Mr as aT,
  zr as aU,
  ps as aV,
  Y as aW,
  Xr as aX,
  Es as aY,
  Et as aZ,
  ae as a_,
  $r as aa,
  os as ab,
  cs as ac,
  es as ad,
  ts as ae,
  _s as af,
  Kr as ag,
  Qr as ah,
  Lr as ai,
  as as aj,
  me as ak,
  hr as al,
  w as am,
  ls as an,
  is as ao,
  ke as ap,
  dr as aq,
  ms as ar,
  Ur as as,
  Ts as at,
  rs as au,
  or as av,
  rt as aw,
  En as ax,
  mr as ay,
  _ as az,
  Qn as b,
  kr as b0,
  Pr as b1,
  vr as b2,
  m as c,
  Rt as d,
  At as e,
  gs as f,
  St as g,
  P as h,
  v as i,
  $n as j,
  Gt as k,
  ss as l,
  Sr as m,
  jr as n,
  Nr as o,
  zt as p,
  Wr as q,
  ze as r,
  Z as s,
  ws as t,
  on as u,
  bt as v,
  pr as w,
  _e as x,
  Tr as y,
  Rr as z,
};
//# sourceMappingURL=DLjC2_M2.js.map
