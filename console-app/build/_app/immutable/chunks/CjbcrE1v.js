import { n as e } from "./Bupu4aFx.js";
var t = Array.isArray,
  n = Array.prototype.indexOf,
  r = Array.prototype.includes,
  i = Array.from,
  a = Object.defineProperty,
  o = Object.getOwnPropertyDescriptor,
  s = Object.getOwnPropertyDescriptors,
  c = Object.prototype,
  l = Array.prototype,
  u = Object.getPrototypeOf,
  d = Object.isExtensible;
function f(e) {
  return typeof e == `function`;
}
var p = () => {};
function m(e) {
  return e();
}
function h(e) {
  for (var t = 0; t < e.length; t++) e[t]();
}
function g() {
  var e, t;
  return {
    promise: new Promise((n, r) => {
      ((e = n), (t = r));
    }),
    resolve: e,
    reject: t,
  };
}
function _(e, t) {
  if (Array.isArray(e)) return e;
  if (t === void 0 || !(Symbol.iterator in e)) return Array.from(e);
  let n = [];
  for (let r of e) if ((n.push(r), n.length === t)) break;
  return n;
}
var v = 1 << 24,
  y = 1024,
  b = 2048,
  x = 4096,
  S = 8192,
  ee = 16384,
  te = 32768,
  ne = 1 << 25,
  re = 65536,
  ie = 1 << 18,
  ae = 1 << 19,
  oe = 1 << 20,
  se = 1 << 25,
  ce = 65536,
  le = 1 << 21,
  ue = 1 << 22,
  de = 1 << 23,
  fe = Symbol(`$state`),
  pe = Symbol(`legacy props`),
  me = Symbol(``),
  he = new (class extends Error {
    name = `StaleReactionError`;
    message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
  })(),
  ge = !!globalThis.document?.contentType && globalThis.document.contentType.includes(`xml`);
function _e(e) {
  throw Error(`https://svelte.dev/e/experimental_async_required`);
}
function ve(e) {
  throw Error(`https://svelte.dev/e/lifecycle_outside_component`);
}
function ye() {
  throw Error(`https://svelte.dev/e/missing_context`);
}
function be() {
  throw Error(`https://svelte.dev/e/async_derived_orphan`);
}
function xe(e, t, n) {
  throw Error(`https://svelte.dev/e/each_key_duplicate`);
}
function Se(e) {
  throw Error(`https://svelte.dev/e/effect_in_teardown`);
}
function Ce() {
  throw Error(`https://svelte.dev/e/effect_in_unowned_derived`);
}
function we(e) {
  throw Error(`https://svelte.dev/e/effect_orphan`);
}
function Te() {
  throw Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
}
function Ee() {
  throw Error(`https://svelte.dev/e/fork_discarded`);
}
function De() {
  throw Error(`https://svelte.dev/e/fork_timing`);
}
function Oe() {
  throw Error(`https://svelte.dev/e/get_abort_signal_outside_reaction`);
}
function ke() {
  throw Error(`https://svelte.dev/e/hydration_failed`);
}
function Ae(e) {
  throw Error(`https://svelte.dev/e/lifecycle_legacy_only`);
}
function je(e) {
  throw Error(`https://svelte.dev/e/props_invalid_value`);
}
function Me() {
  throw Error(`https://svelte.dev/e/set_context_after_init`);
}
function Ne() {
  throw Error(`https://svelte.dev/e/state_descriptors_fixed`);
}
function Pe() {
  throw Error(`https://svelte.dev/e/state_prototype_fixed`);
}
function Fe() {
  throw Error(`https://svelte.dev/e/state_unsafe_mutation`);
}
function Ie() {
  throw Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
}
var Le = {},
  C = Symbol(),
  Re = `http://www.w3.org/1999/xhtml`,
  ze = `http://www.w3.org/2000/svg`,
  Be = `http://www.w3.org/1998/Math/MathML`;
function Ve(e) {
  console.warn(`https://svelte.dev/e/hydratable_missing_but_expected`);
}
function He(e) {
  console.warn(`https://svelte.dev/e/hydration_mismatch`);
}
function Ue() {
  console.warn(`https://svelte.dev/e/select_multiple_invalid_value`);
}
function We() {
  console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
}
var w = !1;
function T(e) {
  w = e;
}
var E;
function D(e) {
  if (e === null) throw (He(), Le);
  return (E = e);
}
function O() {
  return D(z(E));
}
function Ge(e) {
  if (w) {
    if (z(E) !== null) throw (He(), Le);
    E = e;
  }
}
function Ke(e = 1) {
  if (w) {
    for (var t = e, n = E; t--; ) n = z(n);
    E = n;
  }
}
function qe(e = !0) {
  for (var t = 0, n = E; ; ) {
    if (n.nodeType === 8) {
      var r = n.data;
      if (r === `]`) {
        if (t === 0) return n;
        --t;
      } else (r === `[` || r === `[!` || (r[0] === `[` && !isNaN(Number(r.slice(1))))) && (t += 1);
    }
    var i = z(n);
    (e && n.remove(), (n = i));
  }
}
function Je(e) {
  if (!e || e.nodeType !== 8) throw (He(), Le);
  return e.data;
}
function Ye(e) {
  return e === this.v;
}
function Xe(e, t) {
  return e == e ? e !== t || (typeof e == `object` && !!e) || typeof e == `function` : t == t;
}
function Ze(e) {
  return !Xe(e, this.v);
}
var k = !1,
  Qe = !1;
function $e() {
  Qe = !0;
}
var A = null;
function et(e) {
  A = e;
}
function tt() {
  let e = {};
  return [() => (it(e) || ye(), nt(e)), (t) => rt(e, t)];
}
function nt(e) {
  return lt(`getContext`).get(e);
}
function rt(e, t) {
  let n = lt(`setContext`);
  if (k) {
    var r = G.f;
    (!U && r & 32 && !A.i) || Me();
  }
  return (n.set(e, t), t);
}
function it(e) {
  return lt(`hasContext`).has(e);
}
function at() {
  return lt(`getAllContexts`);
}
function ot(e, t = !1, n) {
  A = {
    p: A,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: G,
    l: Qe && !t ? { s: null, u: null, $: [] } : null,
  };
}
function st(e) {
  var t = A,
    n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n) tr(r);
  }
  return (e !== void 0 && (t.x = e), (t.i = !0), (A = t.p), e ?? {});
}
function ct() {
  return !Qe || (A !== null && A.l === null);
}
function lt(e) {
  return (A === null && ve(e), (A.c ??= new Map(ut(A) || void 0)));
}
function ut(e) {
  let t = e.p;
  for (; t !== null; ) {
    let e = t.c;
    if (e !== null) return e;
    t = t.p;
  }
  return null;
}
var dt = [];
function ft() {
  var e = dt;
  ((dt = []), h(e));
}
function j(e) {
  if (dt.length === 0 && !Mt) {
    var t = dt;
    queueMicrotask(() => {
      t === dt && ft();
    });
  }
  dt.push(e);
}
function pt() {
  for (; dt.length > 0; ) ft();
}
function mt(e) {
  var t = G;
  if (t === null) return ((U.f |= de), e);
  if (!(t.f & 32768) && !(t.f & 4)) throw e;
  ht(e, t);
}
function ht(e, t) {
  for (; t !== null; ) {
    if (t.f & 128) {
      if (!(t.f & 32768)) throw e;
      try {
        t.b.error(e);
        return;
      } catch (t) {
        e = t;
      }
    }
    t = t.parent;
  }
  throw e;
}
var gt = ~(b | x | y);
function M(e, t) {
  e.f = (e.f & gt) | t;
}
function _t(e) {
  e.f & 512 || e.deps === null ? M(e, y) : M(e, x);
}
function vt(e) {
  if (e !== null) for (let t of e) !(t.f & 2) || !(t.f & 65536) || ((t.f ^= ce), vt(t.deps));
}
function yt(e, t, n) {
  (e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), vt(e.deps), M(e, y));
}
function bt(e, t, n) {
  if (e == null) return (t(void 0), n && n(void 0), p);
  let r = Q(() => e.subscribe(t, n));
  return r.unsubscribe ? () => r.unsubscribe() : r;
}
var xt = [];
function St(e, t = p) {
  let n = null,
    r = new Set();
  function i(t) {
    if (Xe(e, t) && ((e = t), n)) {
      let t = !xt.length;
      for (let t of r) (t[1](), xt.push(t, e));
      if (t) {
        for (let e = 0; e < xt.length; e += 2) xt[e][0](xt[e + 1]);
        xt.length = 0;
      }
    }
  }
  function a(t) {
    i(t(e));
  }
  function o(o, s = p) {
    let c = [o, s];
    return (
      r.add(c),
      r.size === 1 && (n = t(i, a) || p),
      o(e),
      () => {
        (r.delete(c), r.size === 0 && n && (n(), (n = null)));
      }
    );
  }
  return { set: i, update: a, subscribe: o };
}
function Ct(e) {
  let t;
  return (bt(e, (e) => (t = e))(), t);
}
var wt = !1,
  Tt = !1,
  Et = Symbol();
function Dt(e, t, n) {
  let r = (n[t] ??= { store: null, source: xn(void 0), unsubscribe: p });
  if (r.store !== e && !(Et in n))
    if ((r.unsubscribe(), (r.store = e ?? null), e == null))
      ((r.source.v = void 0), (r.unsubscribe = p));
    else {
      var i = !0;
      ((r.unsubscribe = bt(e, (e) => {
        i ? (r.source.v = e) : I(r.source, e);
      })),
        (i = !1));
    }
  return e && Et in n ? Ct(e) : Z(r.source);
}
function Ot() {
  let e = {};
  function t() {
    $n(() => {
      for (var t in e) e[t].unsubscribe();
      a(e, Et, { enumerable: !1, value: !0 });
    });
  }
  return [e, t];
}
function kt(e) {
  var t = Tt;
  try {
    return ((Tt = !1), [e(), Tt]);
  } finally {
    Tt = t;
  }
}
var N = new Set(),
  P = null,
  At = null,
  F = null,
  jt = null,
  Mt = !1,
  Nt = !1,
  Pt = null,
  Ft = null,
  It = 0,
  Lt = 1,
  Rt = class e {
    id = Lt++;
    current = new Map();
    previous = new Map();
    #e = new Set();
    #t = new Set();
    #n = new Map();
    #r = new Map();
    #i = null;
    #a = [];
    #o = [];
    #s = new Set();
    #c = new Set();
    #l = new Map();
    is_fork = !1;
    #u = !1;
    #d = new Set();
    #f() {
      return this.is_fork || this.#r.size > 0;
    }
    #p() {
      for (let n of this.#d)
        for (let r of n.#r.keys()) {
          for (var e = !1, t = r; t.parent !== null; ) {
            if (this.#l.has(t)) {
              e = !0;
              break;
            }
            t = t.parent;
          }
          if (!e) return !0;
        }
      return !1;
    }
    skip_effect(e) {
      this.#l.has(e) || this.#l.set(e, { d: [], m: [] });
    }
    unskip_effect(e) {
      var t = this.#l.get(e);
      if (t) {
        this.#l.delete(e);
        for (var n of t.d) (M(n, b), this.schedule(n));
        for (n of t.m) (M(n, x), this.schedule(n));
      }
    }
    #m() {
      if ((It++ > 1e3 && (N.delete(this), Bt()), !this.#f())) {
        for (let e of this.#s) (this.#c.delete(e), M(e, b), this.schedule(e));
        for (let e of this.#c) (M(e, x), this.schedule(e));
      }
      let t = this.#a;
      ((this.#a = []), this.apply());
      var n = (Pt = []),
        r = [],
        i = (Ft = []);
      for (let e of t)
        try {
          this.#h(e, n, r);
        } catch (t) {
          throw (Jt(e), t);
        }
      if (((P = null), i.length > 0)) {
        var a = e.ensure();
        for (let e of i) a.schedule(e);
      }
      if (((Pt = null), (Ft = null), this.#f() || this.#p())) {
        (this.#g(r), this.#g(n));
        for (let [e, t] of this.#l) qt(e, t);
      } else {
        (this.#n.size === 0 && N.delete(this), this.#s.clear(), this.#c.clear());
        for (let e of this.#e) e(this);
        (this.#e.clear(), (At = this), Ht(r), Ht(n), (At = null), this.#i?.resolve());
      }
      var o = P;
      if (this.#a.length > 0) {
        let e = (o ??= this);
        e.#a.push(...this.#a.filter((t) => !e.#a.includes(t)));
      }
      (o !== null && (N.add(o), o.#m()), N.has(this) || this.#_());
    }
    #h(e, t, n) {
      e.f ^= y;
      for (var r = e.first; r !== null; ) {
        var i = r.f,
          a = (i & 96) != 0;
        if (!((a && i & 1024) || i & 8192 || this.#l.has(r)) && r.fn !== null) {
          a
            ? (r.f ^= y)
            : i & 4
              ? t.push(r)
              : k && i & 16777224
                ? n.push(r)
                : Lr(r) && (i & 16 && this.#c.add(r), Hr(r));
          var o = r.first;
          if (o !== null) {
            r = o;
            continue;
          }
        }
        for (; r !== null; ) {
          var s = r.next;
          if (s !== null) {
            r = s;
            break;
          }
          r = r.parent;
        }
      }
    }
    #g(e) {
      for (var t = 0; t < e.length; t += 1) yt(e[t], this.#s, this.#c);
    }
    capture(e, t, n = !1) {
      (t !== C && !this.previous.has(e) && this.previous.set(e, t),
        e.f & 8388608 || (this.current.set(e, [e.v, n]), F?.set(e, e.v)));
    }
    activate() {
      P = this;
    }
    deactivate() {
      ((P = null), (F = null));
    }
    flush() {
      try {
        ((Nt = !0), (P = this), this.#m());
      } finally {
        ((It = 0),
          (jt = null),
          (Pt = null),
          (Ft = null),
          (Nt = !1),
          (P = null),
          (F = null),
          gn.clear());
      }
    }
    discard() {
      for (let e of this.#t) e(this);
      (this.#t.clear(), N.delete(this));
    }
    register_created_effect(e) {
      this.#o.push(e);
    }
    #_() {
      for (let l of N) {
        var e = l.id < this.id,
          t = [];
        for (let [r, [i, a]] of this.current) {
          if (l.current.has(r)) {
            var n = l.current.get(r)[0];
            if (e && i !== n) l.current.set(r, [i, a]);
            else continue;
          }
          t.push(r);
        }
        var r = [...l.current.keys()].filter((e) => !this.current.has(e));
        if (r.length === 0) e && l.discard();
        else if (t.length > 0) {
          l.activate();
          var i = new Set(),
            a = new Map();
          for (var o of t) Ut(o, r, i, a);
          a = new Map();
          var s = [...l.current.keys()].filter((e) =>
            this.current.has(e) ? this.current.get(e)[0] !== e : !0,
          );
          for (let e of this.#o)
            !(e.f & 155648) &&
              Gt(e, s, a) &&
              (e.f & 4194320 ? (M(e, b), l.schedule(e)) : l.#s.add(e));
          if (l.#a.length > 0) {
            l.apply();
            for (var c of l.#a) l.#h(c, [], []);
            l.#a = [];
          }
          l.deactivate();
        }
      }
      for (let e of N)
        e.#d.has(this) && (e.#d.delete(this), e.#d.size === 0 && !e.#f() && (e.activate(), e.#m()));
    }
    increment(e, t) {
      let n = this.#n.get(t) ?? 0;
      if ((this.#n.set(t, n + 1), e)) {
        let e = this.#r.get(t) ?? 0;
        this.#r.set(t, e + 1);
      }
    }
    decrement(e, t, n) {
      let r = this.#n.get(t) ?? 0;
      if ((r === 1 ? this.#n.delete(t) : this.#n.set(t, r - 1), e)) {
        let e = this.#r.get(t) ?? 0;
        e === 1 ? this.#r.delete(t) : this.#r.set(t, e - 1);
      }
      this.#u ||
        n ||
        ((this.#u = !0),
        j(() => {
          ((this.#u = !1), this.flush());
        }));
    }
    transfer_effects(e, t) {
      for (let t of e) this.#s.add(t);
      for (let e of t) this.#c.add(e);
      (e.clear(), t.clear());
    }
    oncommit(e) {
      this.#e.add(e);
    }
    ondiscard(e) {
      this.#t.add(e);
    }
    settled() {
      return (this.#i ??= g()).promise;
    }
    static ensure() {
      if (P === null) {
        let t = (P = new e());
        Nt ||
          (N.add(P),
          Mt ||
            j(() => {
              P === t && t.flush();
            }));
      }
      return P;
    }
    apply() {
      if (!k || (!this.is_fork && N.size === 1)) {
        F = null;
        return;
      }
      F = new Map();
      for (let [e, [t]] of this.current) F.set(e, t);
      for (let n of N)
        if (!(n === this || n.is_fork)) {
          var e = !1,
            t = !1;
          if (n.id < this.id)
            for (let [r, [, i]] of n.current)
              i || ((e ||= this.current.has(r)), (t ||= !this.current.has(r)));
          if (e && t) this.#d.add(n);
          else for (let [e, t] of n.previous) F.has(e) || F.set(e, t);
        }
    }
    schedule(e) {
      if (((jt = e), e.b?.is_pending && e.f & 16777228 && !(e.f & 32768))) {
        e.b.defer_effect(e);
        return;
      }
      for (var t = e; t.parent !== null; ) {
        t = t.parent;
        var n = t.f;
        if (Pt !== null && t === G && (k || ((U === null || !(U.f & 2)) && !wt))) return;
        if (n & 96) {
          if (!(n & 1024)) return;
          t.f ^= y;
        }
      }
      this.#a.push(t);
    }
  };
function zt(e) {
  var t = Mt;
  Mt = !0;
  try {
    var n;
    for (e && (P !== null && !P.is_fork && P.flush(), (n = e())); ; ) {
      if ((pt(), P === null)) return n;
      P.flush();
    }
  } finally {
    Mt = t;
  }
}
function Bt() {
  try {
    Te();
  } catch (e) {
    ht(e, jt);
  }
}
var Vt = null;
function Ht(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if (
        !(r.f & 24576) &&
        Lr(r) &&
        ((Vt = new Set()),
        Hr(r),
        r.deps === null &&
          r.first === null &&
          r.nodes === null &&
          r.teardown === null &&
          r.ac === null &&
          _r(r),
        Vt?.size > 0)
      ) {
        gn.clear();
        for (let e of Vt) {
          if (e.f & 24576) continue;
          let t = [e],
            n = e.parent;
          for (; n !== null; ) (Vt.has(n) && (Vt.delete(n), t.push(n)), (n = n.parent));
          for (let e = t.length - 1; e >= 0; e--) {
            let n = t[e];
            n.f & 24576 || Hr(n);
          }
        }
        Vt.clear();
      }
    }
    Vt = null;
  }
}
function Ut(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (let i of e.reactions) {
      let e = i.f;
      e & 2 ? Ut(i, t, n, r) : e & 4194320 && !(e & 2048) && Gt(i, t, r) && (M(i, b), Kt(i));
    }
}
function Wt(e, t) {
  if (e.reactions !== null)
    for (let n of e.reactions) {
      let e = n.f;
      e & 2 ? Wt(n, t) : e & 131072 && (M(n, b), t.add(n));
    }
}
function Gt(e, t, n) {
  let i = n.get(e);
  if (i !== void 0) return i;
  if (e.deps !== null)
    for (let i of e.deps) {
      if (r.call(t, i)) return !0;
      if (i.f & 2 && Gt(i, t, n)) return (n.set(i, !0), !0);
    }
  return (n.set(e, !1), !1);
}
function Kt(e) {
  P.schedule(e);
}
function qt(e, t) {
  if (!(e.f & 32 && e.f & 1024)) {
    (e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), M(e, y));
    for (var n = e.first; n !== null; ) (qt(n, t), (n = n.next));
  }
}
function Jt(e) {
  M(e, y);
  for (var t = e.first; t !== null; ) (Jt(t), (t = t.next));
}
function Yt(e) {
  (k || _e(`fork`), P !== null && De());
  var t = Rt.ensure();
  ((t.is_fork = !0), (F = new Map()));
  var n = !1,
    r = t.settled();
  zt(e);
  for (var [i, a] of t.previous) i.v = a;
  return {
    commit: async () => {
      if (n) {
        await r;
        return;
      }
      (N.has(t) || Ee(), (n = !0), (t.is_fork = !1));
      for (var [e, [i]] of t.current) ((e.v = i), (e.wv = Ir()));
      (zt(() => {
        var e = new Set();
        for (var n of t.current.keys()) Wt(n, e);
        (_n(e), wn());
      }),
        t.flush(),
        await r);
    },
    discard: () => {
      for (var e of t.current.keys()) e.wv = Ir();
      !n && N.has(t) && t.discard();
    },
  };
}
function Xt(e) {
  let t = 0,
    n = yn(0),
    r;
  return () => {
    Qn() &&
      (Z(n),
      cr(
        () => (
          t === 0 && (r = Q(() => e(() => En(n)))),
          (t += 1),
          () => {
            j(() => {
              (--t, t === 0 && (r?.(), (r = void 0), En(n)));
            });
          }
        ),
      ));
  };
}
var Zt = re | ae;
function Qt(e, t, n, r) {
  new $t(e, t, n, r);
}
var $t = class {
  parent;
  is_pending = !1;
  transform_error;
  #e;
  #t = w ? E : null;
  #n;
  #r;
  #i;
  #a = null;
  #o = null;
  #s = null;
  #c = null;
  #l = 0;
  #u = 0;
  #d = !1;
  #f = new Set();
  #p = new Set();
  #m = null;
  #h = Xt(
    () => (
      (this.#m = yn(this.#l)),
      () => {
        this.#m = null;
      }
    ),
  );
  constructor(e, t, n, r) {
    ((this.#e = e),
      (this.#n = t),
      (this.#r = (e) => {
        var t = G;
        ((t.b = this), (t.f |= 128), n(e));
      }),
      (this.parent = G.b),
      (this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e)),
      (this.#i = dr(() => {
        if (w) {
          let e = this.#t;
          O();
          let t = e.data === `[!`;
          if (e.data.startsWith(`[?`)) {
            let t = JSON.parse(e.data.slice(2));
            this.#_(t);
          } else t ? this.#v() : this.#g();
        } else this.#y();
      }, Zt)),
      w && (this.#e = E));
  }
  #g() {
    try {
      this.#a = V(() => this.#r(this.#e));
    } catch (e) {
      this.error(e);
    }
  }
  #_(e) {
    let t = this.#n.failed;
    t &&
      (this.#s = V(() => {
        t(
          this.#e,
          () => e,
          () => () => {},
        );
      }));
  }
  #v() {
    let e = this.#n.pending;
    e &&
      ((this.is_pending = !0),
      (this.#o = V(() => e(this.#e))),
      j(() => {
        var e = (this.#c = document.createDocumentFragment()),
          t = L();
        (e.append(t),
          (this.#a = this.#x(() => V(() => this.#r(t)))),
          this.#u === 0 &&
            (this.#e.before(e),
            (this.#c = null),
            vr(this.#o, () => {
              this.#o = null;
            }),
            this.#b(P)));
      }));
  }
  #y() {
    try {
      if (
        ((this.is_pending = this.has_pending_snippet()),
        (this.#u = 0),
        (this.#l = 0),
        (this.#a = V(() => {
          this.#r(this.#e);
        })),
        this.#u > 0)
      ) {
        var e = (this.#c = document.createDocumentFragment());
        Sr(this.#a, e);
        let t = this.#n.pending;
        this.#o = V(() => t(this.#e));
      } else this.#b(P);
    } catch (e) {
      this.error(e);
    }
  }
  #b(e) {
    ((this.is_pending = !1), e.transfer_effects(this.#f, this.#p));
  }
  defer_effect(e) {
    yt(e, this.#f, this.#p);
  }
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!this.#n.pending;
  }
  #x(e) {
    var t = G,
      n = U,
      r = A;
    (K(this.#i), W(this.#i), et(this.#i.ctx));
    try {
      return (Rt.ensure(), e());
    } catch (e) {
      return (mt(e), null);
    } finally {
      (K(t), W(n), et(r));
    }
  }
  #S(e, t) {
    if (!this.has_pending_snippet()) {
      this.parent && this.parent.#S(e, t);
      return;
    }
    ((this.#u += e),
      this.#u === 0 &&
        (this.#b(t),
        this.#o &&
          vr(this.#o, () => {
            this.#o = null;
          }),
        (this.#c &&= (this.#e.before(this.#c), null))));
  }
  update_pending_count(e, t) {
    (this.#S(e, t),
      (this.#l += e),
      !(!this.#m || this.#d) &&
        ((this.#d = !0),
        j(() => {
          ((this.#d = !1), this.#m && Cn(this.#m, this.#l));
        })));
  }
  get_effect_pending() {
    return (this.#h(), Z(this.#m));
  }
  error(e) {
    var t = this.#n.onerror;
    let n = this.#n.failed;
    if (!t && !n) throw e;
    ((this.#a &&= (H(this.#a), null)),
      (this.#o &&= (H(this.#o), null)),
      (this.#s &&= (H(this.#s), null)),
      w && (D(this.#t), Ke(), D(qe())));
    var r = !1,
      i = !1;
    let a = () => {
        if (r) {
          We();
          return;
        }
        ((r = !0),
          i && Ie(),
          this.#s !== null &&
            vr(this.#s, () => {
              this.#s = null;
            }),
          this.#x(() => {
            this.#y();
          }));
      },
      o = (e) => {
        try {
          ((i = !0), t?.(e, a), (i = !1));
        } catch (e) {
          ht(e, this.#i && this.#i.parent);
        }
        n &&
          (this.#s = this.#x(() => {
            try {
              return V(() => {
                var t = G;
                ((t.b = this),
                  (t.f |= 128),
                  n(
                    this.#e,
                    () => e,
                    () => a,
                  ));
              });
            } catch (e) {
              return (ht(e, this.#i.parent), null);
            }
          }));
      };
    j(() => {
      var t;
      try {
        t = this.transform_error(e);
      } catch (e) {
        ht(e, this.#i && this.#i.parent);
        return;
      }
      typeof t == `object` && t && typeof t.then == `function`
        ? t.then(o, (e) => ht(e, this.#i && this.#i.parent))
        : o(t);
    });
  }
};
function en(e, t, n, r) {
  let i = ct() ? an : cn;
  var a = e.filter((e) => !e.settled);
  if (n.length === 0 && a.length === 0) {
    r(t.map(i));
    return;
  }
  var o = G,
    s = tn(),
    c = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
  function l(e) {
    s();
    try {
      r(e);
    } catch (e) {
      o.f & 16384 || ht(e, o);
    }
    nn();
  }
  if (n.length === 0) {
    c.then(() => l(t.map(i)));
    return;
  }
  var u = rn();
  function d() {
    Promise.all(n.map((e) => on(e)))
      .then((e) => l([...t.map(i), ...e]))
      .catch((e) => ht(e, o))
      .finally(() => u());
  }
  c
    ? c.then(() => {
        (s(), d(), nn());
      })
    : d();
}
function tn() {
  var e = G,
    t = U,
    n = A,
    r = P;
  return function (i = !0) {
    (K(e), W(t), et(n), i && !(e.f & 16384) && (r?.activate(), r?.apply()));
  };
}
function nn(e = !0) {
  (K(null), W(null), et(null), e && P?.deactivate());
}
function rn() {
  var e = G,
    t = e.b,
    n = P,
    r = t.is_rendered();
  return (
    t.update_pending_count(1, n),
    n.increment(r, e),
    (i = !1) => {
      (t.update_pending_count(-1, n), n.decrement(r, e, i));
    }
  );
}
function an(e) {
  var t = 2 | b,
    n = U !== null && U.f & 2 ? U : null;
  return (
    G !== null && (G.f |= ae),
    {
      ctx: A,
      deps: null,
      effects: null,
      equals: Ye,
      f: t,
      fn: e,
      reactions: null,
      rv: 0,
      v: C,
      wv: 0,
      parent: n ?? G,
      ac: null,
    }
  );
}
function on(e, t, n) {
  let r = G;
  r === null && be();
  var i = void 0,
    a = yn(C),
    o = !U,
    s = new Map();
  return (
    sr(() => {
      var t = G,
        n = g();
      i = n.promise;
      try {
        Promise.resolve(e()).then(n.resolve, n.reject).finally(nn);
      } catch (e) {
        (n.reject(e), nn());
      }
      var c = P;
      if (o) {
        if (t.f & 32768) var l = rn();
        if (r.b.is_rendered()) (s.get(c)?.reject(he), s.delete(c));
        else {
          for (let e of s.values()) e.reject(he);
          s.clear();
        }
        s.set(c, n);
      }
      let u = (e, n = void 0) => {
        if ((l && l(n === he), !(n === he || t.f & 16384))) {
          if ((c.activate(), n)) ((a.f |= de), Cn(a, n));
          else {
            (a.f & 8388608 && (a.f ^= de), Cn(a, e));
            for (let [e, t] of s) {
              if ((s.delete(e), e === c)) break;
              t.reject(he);
            }
          }
          c.deactivate();
        }
      };
      n.promise.then(u, (e) => u(null, e || `unknown`));
    }),
    $n(() => {
      for (let e of s.values()) e.reject(he);
    }),
    new Promise((e) => {
      function t(n) {
        function r() {
          n === i ? e(a) : t(i);
        }
        n.then(r, r);
      }
      t(i);
    })
  );
}
function sn(e) {
  let t = an(e);
  return (k || Ar(t), t);
}
function cn(e) {
  let t = an(e);
  return ((t.equals = Ze), t);
}
function ln(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1) H(t[n]);
  }
}
function un(e) {
  for (var t = e.parent; t !== null; ) {
    if (!(t.f & 2)) return t.f & 16384 ? null : t;
    t = t.parent;
  }
  return null;
}
function dn(e) {
  var t,
    n = G;
  K(un(e));
  try {
    ((e.f &= ~ce), ln(e), (t = zr(e)));
  } finally {
    K(n);
  }
  return t;
}
function fn(e) {
  var t = e.v,
    n = dn(e);
  if (
    !e.equals(n) &&
    ((e.wv = Ir()),
    (!P?.is_fork || e.deps === null) && ((e.v = n), P?.capture(e, t, !0), e.deps === null))
  ) {
    M(e, y);
    return;
  }
  Dr || (F === null ? _t(e) : (Qn() || P?.is_fork) && F.set(e, n));
}
function pn(e) {
  if (e.effects !== null)
    for (let t of e.effects)
      (t.teardown || t.ac) &&
        (t.teardown?.(), t.ac?.abort(he), (t.teardown = p), (t.ac = null), Vr(t, 0), mr(t));
}
function mn(e) {
  if (e.effects !== null) for (let t of e.effects) t.teardown && Hr(t);
}
var hn = new Set(),
  gn = new Map();
function _n(e) {
  hn = e;
}
var vn = !1;
function yn(e, t) {
  return { f: 0, v: e, reactions: null, equals: Ye, rv: 0, wv: 0 };
}
function bn(e, t) {
  let n = yn(e, t);
  return (Ar(n), n);
}
function xn(e, t = !1, n = !0) {
  let r = yn(e);
  return (t || (r.equals = Ze), Qe && n && A !== null && A.l !== null && (A.l.s ??= []).push(r), r);
}
function Sn(e, t) {
  return (
    I(
      e,
      Q(() => Z(e)),
    ),
    t
  );
}
function I(e, t, n = !1) {
  return (
    U !== null &&
      (!kr || U.f & 131072) &&
      ct() &&
      U.f & 4325394 &&
      (q === null || !r.call(q, e)) &&
      Fe(),
    Cn(e, n ? On(t) : t, Ft)
  );
}
function Cn(e, t, n = null) {
  if (!e.equals(t)) {
    var r = e.v;
    (Dr ? gn.set(e, t) : gn.set(e, r), (e.v = t));
    var i = Rt.ensure();
    if ((i.capture(e, r), e.f & 2)) {
      let t = e;
      (e.f & 2048 && dn(t), F === null && _t(t));
    }
    ((e.wv = Ir()),
      Dn(e, b, n),
      ct() && G !== null && G.f & 1024 && !(G.f & 96) && (X === null ? jr([e]) : X.push(e)),
      !i.is_fork && hn.size > 0 && !vn && wn());
  }
  return t;
}
function wn() {
  vn = !1;
  for (let e of hn) (e.f & 1024 && M(e, x), Lr(e) && Hr(e));
  hn.clear();
}
function Tn(e, t = 1) {
  var n = Z(e),
    r = t === 1 ? n++ : n--;
  return (I(e, n), r);
}
function En(e) {
  I(e, e.v + 1);
}
function Dn(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var i = ct(), a = r.length, o = 0; o < a; o++) {
      var s = r[o],
        c = s.f;
      if (!(!i && s === G)) {
        var l = (c & b) === 0;
        if ((l && M(s, t), c & 2)) {
          var u = s;
          (F?.delete(u), c & 65536 || (c & 512 && (s.f |= ce), Dn(u, x, n)));
        } else if (l) {
          var d = s;
          (c & 16 && Vt !== null && Vt.add(d), n === null ? Kt(d) : n.push(d));
        }
      }
    }
}
function On(e) {
  if (typeof e != `object` || !e || fe in e) return e;
  let n = u(e);
  if (n !== c && n !== l) return e;
  var r = new Map(),
    i = t(e),
    a = bn(0),
    s = null,
    d = Pr,
    f = (e) => {
      if (Pr === d) return e();
      var t = U,
        n = Pr;
      (W(null), Fr(d));
      var r = e();
      return (W(t), Fr(n), r);
    };
  return (
    i && r.set(`length`, bn(e.length, s)),
    new Proxy(e, {
      defineProperty(e, t, n) {
        (!(`value` in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) &&
          Ne();
        var i = r.get(t);
        return (
          i === void 0
            ? f(() => {
                var e = bn(n.value, s);
                return (r.set(t, e), e);
              })
            : I(i, n.value, !0),
          !0
        );
      },
      deleteProperty(e, t) {
        var n = r.get(t);
        if (n === void 0) {
          if (t in e) {
            let e = f(() => bn(C, s));
            (r.set(t, e), En(a));
          }
        } else (I(n, C), En(a));
        return !0;
      },
      get(t, n, i) {
        if (n === fe) return e;
        var a = r.get(n),
          c = n in t;
        if (
          (a === void 0 &&
            (!c || o(t, n)?.writable) &&
            ((a = f(() => bn(On(c ? t[n] : C), s))), r.set(n, a)),
          a !== void 0)
        ) {
          var l = Z(a);
          return l === C ? void 0 : l;
        }
        return Reflect.get(t, n, i);
      },
      getOwnPropertyDescriptor(e, t) {
        var n = Reflect.getOwnPropertyDescriptor(e, t);
        if (n && `value` in n) {
          var i = r.get(t);
          i && (n.value = Z(i));
        } else if (n === void 0) {
          var a = r.get(t),
            o = a?.v;
          if (a !== void 0 && o !== C)
            return { enumerable: !0, configurable: !0, value: o, writable: !0 };
        }
        return n;
      },
      has(e, t) {
        if (t === fe) return !0;
        var n = r.get(t),
          i = (n !== void 0 && n.v !== C) || Reflect.has(e, t);
        return (n !== void 0 || (G !== null && (!i || o(e, t)?.writable))) &&
          (n === void 0 && ((n = f(() => bn(i ? On(e[t]) : C, s))), r.set(t, n)), Z(n) === C)
          ? !1
          : i;
      },
      set(e, t, n, c) {
        var l = r.get(t),
          u = t in e;
        if (i && t === `length`)
          for (var d = n; d < l.v; d += 1) {
            var p = r.get(d + ``);
            p === void 0 ? d in e && ((p = f(() => bn(C, s))), r.set(d + ``, p)) : I(p, C);
          }
        if (l === void 0)
          (!u || o(e, t)?.writable) && ((l = f(() => bn(void 0, s))), I(l, On(n)), r.set(t, l));
        else {
          u = l.v !== C;
          var m = f(() => On(n));
          I(l, m);
        }
        var h = Reflect.getOwnPropertyDescriptor(e, t);
        if ((h?.set && h.set.call(c, n), !u)) {
          if (i && typeof t == `string`) {
            var g = r.get(`length`),
              _ = Number(t);
            Number.isInteger(_) && _ >= g.v && I(g, _ + 1);
          }
          En(a);
        }
        return !0;
      },
      ownKeys(e) {
        Z(a);
        var t = Reflect.ownKeys(e).filter((e) => {
          var t = r.get(e);
          return t === void 0 || t.v !== C;
        });
        for (var [n, i] of r) i.v !== C && !(n in e) && t.push(n);
        return t;
      },
      setPrototypeOf() {
        Pe();
      },
    })
  );
}
function kn(e) {
  try {
    if (typeof e == `object` && e && fe in e) return e[fe];
  } catch {}
  return e;
}
function An(e, t) {
  return Object.is(kn(e), kn(t));
}
var jn, Mn, Nn, Pn, Fn;
function In() {
  if (jn === void 0) {
    ((jn = window), (Mn = document), (Nn = /Firefox/.test(navigator.userAgent)));
    var e = Element.prototype,
      t = Node.prototype,
      n = Text.prototype;
    ((Pn = o(t, `firstChild`).get),
      (Fn = o(t, `nextSibling`).get),
      d(e) &&
        ((e.__click = void 0),
        (e.__className = void 0),
        (e.__attributes = null),
        (e.__style = void 0),
        (e.__e = void 0)),
      d(n) && (n.__t = void 0));
  }
}
function L(e = ``) {
  return document.createTextNode(e);
}
function R(e) {
  return Pn.call(e);
}
function z(e) {
  return Fn.call(e);
}
function Ln(e, t) {
  if (!w) return R(e);
  var n = R(E);
  if (n === null) n = E.appendChild(L());
  else if (t && n.nodeType !== 3) {
    var r = L();
    return (n?.before(r), D(r), r);
  }
  return (t && Un(n), D(n), n);
}
function Rn(e, t = !1) {
  if (!w) {
    var n = R(e);
    return n instanceof Comment && n.data === `` ? z(n) : n;
  }
  if (t) {
    if (E?.nodeType !== 3) {
      var r = L();
      return (E?.before(r), D(r), r);
    }
    Un(E);
  }
  return E;
}
function zn(e, t = 1, n = !1) {
  let r = w ? E : e;
  for (var i; t--; ) ((i = r), (r = z(r)));
  if (!w) return r;
  if (n) {
    if (r?.nodeType !== 3) {
      var a = L();
      return (r === null ? i?.after(a) : r.before(a), D(a), a);
    }
    Un(r);
  }
  return (D(r), r);
}
function Bn(e) {
  e.textContent = ``;
}
function Vn() {
  return !k || Vt !== null ? !1 : (G.f & te) !== 0;
}
function Hn(e, t, n) {
  let r = n ? { is: n } : void 0;
  return document.createElementNS(t ?? `http://www.w3.org/1999/xhtml`, e, r);
}
function Un(e) {
  if (e.nodeValue.length < 65536) return;
  let t = e.nextSibling;
  for (; t !== null && t.nodeType === 3; )
    (t.remove(), (e.nodeValue += t.nodeValue), (t = e.nextSibling));
}
function Wn(e, t) {
  if (t) {
    let t = document.body;
    ((e.autofocus = !0),
      j(() => {
        document.activeElement === t && e.focus();
      }));
  }
}
function Gn(e) {
  w && R(e) !== null && Bn(e);
}
var Kn = !1;
function qn() {
  Kn ||
    ((Kn = !0),
    document.addEventListener(
      `reset`,
      (e) => {
        Promise.resolve().then(() => {
          if (!e.defaultPrevented) for (let t of e.target.elements) t.__on_r?.();
        });
      },
      { capture: !0 },
    ));
}
function Jn(e) {
  var t = U,
    n = G;
  (W(null), K(null));
  try {
    return e();
  } finally {
    (W(t), K(n));
  }
}
function Yn(e, t, n, r = n) {
  e.addEventListener(t, () => Jn(n));
  let i = e.__on_r;
  (i
    ? (e.__on_r = () => {
        (i(), r(!0));
      })
    : (e.__on_r = () => r(!0)),
    qn());
}
function Xn(e) {
  (G === null && (U === null && we(e), Ce()), Dr && Se(e));
}
function Zn(e, t) {
  var n = t.last;
  n === null ? (t.last = t.first = e) : ((n.next = e), (e.prev = n), (t.last = e));
}
function B(e, t) {
  var n = G;
  n !== null && n.f & 8192 && (e |= S);
  var r = {
    ctx: A,
    deps: null,
    nodes: null,
    f: e | b | 512,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: n,
    b: n && n.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null,
  };
  P?.register_created_effect(r);
  var i = r;
  if (e & 4) Pt === null ? Rt.ensure().schedule(r) : Pt.push(r);
  else if (t !== null) {
    try {
      Hr(r);
    } catch (e) {
      throw (H(r), e);
    }
    i.deps === null &&
      i.teardown === null &&
      i.nodes === null &&
      i.first === i.last &&
      !(i.f & 524288) &&
      ((i = i.first), e & 16 && e & 65536 && i !== null && (i.f |= re));
  }
  if (i !== null && ((i.parent = n), n !== null && Zn(i, n), U !== null && U.f & 2 && !(e & 64))) {
    var a = U;
    (a.effects ??= []).push(i);
  }
  return r;
}
function Qn() {
  return U !== null && !kr;
}
function $n(e) {
  let t = B(8, null);
  return (M(t, y), (t.teardown = e), t);
}
function er(e) {
  Xn(`$effect`);
  var t = G.f;
  if (!U && t & 32 && !(t & 32768)) {
    var n = A;
    (n.e ??= []).push(e);
  } else return tr(e);
}
function tr(e) {
  return B(4 | oe, e);
}
function nr(e) {
  return (Xn(`$effect.pre`), B(8 | oe, e));
}
function rr(e) {
  Rt.ensure();
  let t = B(64 | ae, e);
  return (e = {}) =>
    new Promise((n) => {
      e.outro
        ? vr(t, () => {
            (H(t), n(void 0));
          })
        : (H(t), n(void 0));
    });
}
function ir(e) {
  return B(4, e);
}
function ar(e, t) {
  var n = A,
    r = { effect: null, ran: !1, deps: e };
  (n.l.$.push(r),
    (r.effect = cr(() => {
      if ((e(), !r.ran)) {
        r.ran = !0;
        var n = G;
        try {
          (K(n.parent), Q(t));
        } finally {
          K(n);
        }
      }
    })));
}
function or() {
  var e = A;
  cr(() => {
    for (var t of e.l.$) {
      t.deps();
      var n = t.effect;
      (n.f & 1024 && n.deps !== null && M(n, x), Lr(n) && Hr(n), (t.ran = !1));
    }
  });
}
function sr(e) {
  return B(ue | ae, e);
}
function cr(e, t = 0) {
  return B(8 | t, e);
}
function lr(e, t = [], n = [], r = []) {
  en(r, t, n, (t) => {
    B(8, () => e(...t.map(Z)));
  });
}
function ur(e, t = [], n = [], r = []) {
  if (n.length > 0 || r.length > 0) var i = rn();
  en(r, t, n, (t) => {
    (B(4, () => e(...t.map(Z))), i && i());
  });
}
function dr(e, t = 0) {
  return B(16 | t, e);
}
function fr(e, t = 0) {
  return B(v | t, e);
}
function V(e) {
  return B(32 | ae, e);
}
function pr(e) {
  var t = e.teardown;
  if (t !== null) {
    let e = Dr,
      n = U;
    (Or(!0), W(null));
    try {
      t.call(null);
    } finally {
      (Or(e), W(n));
    }
  }
}
function mr(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    let e = n.ac;
    e !== null &&
      Jn(() => {
        e.abort(he);
      });
    var r = n.next;
    (n.f & 64 ? (n.parent = null) : H(n, t), (n = r));
  }
}
function hr(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & 32 || H(t), (t = n));
  }
}
function H(e, t = !0) {
  var n = !1;
  ((t || e.f & 262144) &&
    e.nodes !== null &&
    e.nodes.end !== null &&
    (gr(e.nodes.start, e.nodes.end), (n = !0)),
    M(e, ne),
    mr(e, t && !n),
    Vr(e, 0));
  var r = e.nodes && e.nodes.t;
  if (r !== null) for (let e of r) e.stop();
  (pr(e), (e.f ^= ne), (e.f |= ee));
  var i = e.parent;
  (i !== null && i.first !== null && _r(e),
    (e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null));
}
function gr(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : z(e);
    (e.remove(), (e = n));
  }
}
function _r(e) {
  var t = e.parent,
    n = e.prev,
    r = e.next;
  (n !== null && (n.next = r),
    r !== null && (r.prev = n),
    t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n)));
}
function vr(e, t, n = !0) {
  var r = [];
  yr(e, r, !0);
  var i = () => {
      (n && H(e), t && t());
    },
    a = r.length;
  if (a > 0) {
    var o = () => --a || i();
    for (var s of r) s.out(o);
  } else i();
}
function yr(e, t, n) {
  if (!(e.f & 8192)) {
    e.f ^= S;
    var r = e.nodes && e.nodes.t;
    if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
    for (var i = e.first; i !== null; ) {
      var a = i.next,
        o = (i.f & 65536) != 0 || ((i.f & 32) != 0 && (e.f & 16) != 0);
      (yr(i, t, o ? n : !1), (i = a));
    }
  }
}
function br(e) {
  xr(e, !0);
}
function xr(e, t) {
  if (e.f & 8192) {
    ((e.f ^= S), e.f & 1024 || (M(e, b), Rt.ensure().schedule(e)));
    for (var n = e.first; n !== null; ) {
      var r = n.next,
        i = (n.f & 65536) != 0 || (n.f & 32) != 0;
      (xr(n, i ? t : !1), (n = r));
    }
    var a = e.nodes && e.nodes.t;
    if (a !== null) for (let e of a) (e.is_global || t) && e.in();
  }
}
function Sr(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var i = n === r ? null : z(n);
      (t.append(n), (n = i));
    }
}
var Cr = null;
function wr(e) {
  var t = Cr;
  try {
    if (((Cr = new Set()), Q(e), t !== null)) for (var n of Cr) t.add(n);
    return Cr;
  } finally {
    Cr = t;
  }
}
function Tr(e) {
  for (var t of wr(e)) Cn(t, t.v);
}
var Er = !1,
  Dr = !1;
function Or(e) {
  Dr = e;
}
var U = null,
  kr = !1;
function W(e) {
  U = e;
}
var G = null;
function K(e) {
  G = e;
}
var q = null;
function Ar(e) {
  U !== null && (!k || U.f & 2) && (q === null ? (q = [e]) : q.push(e));
}
var J = null,
  Y = 0,
  X = null;
function jr(e) {
  X = e;
}
var Mr = 1,
  Nr = 0,
  Pr = Nr;
function Fr(e) {
  Pr = e;
}
function Ir() {
  return ++Mr;
}
function Lr(e) {
  var t = e.f;
  if (t & 2048) return !0;
  if ((t & 2 && (e.f &= ~ce), t & 4096)) {
    for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
      var a = n[i];
      if ((Lr(a) && fn(a), a.wv > e.wv)) return !0;
    }
    t & 512 && F === null && M(e, y);
  }
  return !1;
}
function Rr(e, t, n = !0) {
  var i = e.reactions;
  if (i !== null && !(!k && q !== null && r.call(q, e)))
    for (var a = 0; a < i.length; a++) {
      var o = i[a];
      o.f & 2 ? Rr(o, t, !1) : t === o && (n ? M(o, b) : o.f & 1024 && M(o, x), Kt(o));
    }
}
function zr(e) {
  var t = J,
    n = Y,
    r = X,
    i = U,
    a = q,
    o = A,
    s = kr,
    c = Pr,
    l = e.f;
  ((J = null),
    (Y = 0),
    (X = null),
    (U = l & 96 ? null : e),
    (q = null),
    et(e.ctx),
    (kr = !1),
    (Pr = ++Nr),
    e.ac !== null &&
      (Jn(() => {
        e.ac.abort(he);
      }),
      (e.ac = null)));
  try {
    e.f |= le;
    var u = e.fn,
      d = u();
    e.f |= te;
    var f = e.deps,
      p = P?.is_fork;
    if (J !== null) {
      var m;
      if ((p || Vr(e, Y), f !== null && Y > 0))
        for (f.length = Y + J.length, m = 0; m < J.length; m++) f[Y + m] = J[m];
      else e.deps = f = J;
      if (Qn() && e.f & 512) for (m = Y; m < f.length; m++) (f[m].reactions ??= []).push(e);
    } else !p && f !== null && Y < f.length && (Vr(e, Y), (f.length = Y));
    if (ct() && X !== null && !kr && f !== null && !(e.f & 6146))
      for (m = 0; m < X.length; m++) Rr(X[m], e);
    if (i !== null && i !== e) {
      if ((Nr++, i.deps !== null)) for (let e = 0; e < n; e += 1) i.deps[e].rv = Nr;
      if (t !== null) for (let e of t) e.rv = Nr;
      X !== null && (r === null ? (r = X) : r.push(...X));
    }
    return (e.f & 8388608 && (e.f ^= de), d);
  } catch (e) {
    return mt(e);
  } finally {
    ((e.f ^= le), (J = t), (Y = n), (X = r), (U = i), (q = a), et(o), (kr = s), (Pr = c));
  }
}
function Br(e, t) {
  let i = t.reactions;
  if (i !== null) {
    var a = n.call(i, e);
    if (a !== -1) {
      var o = i.length - 1;
      o === 0 ? (i = t.reactions = null) : ((i[a] = i[o]), i.pop());
    }
  }
  if (i === null && t.f & 2 && (J === null || !r.call(J, t))) {
    var s = t;
    (s.f & 512 && ((s.f ^= 512), (s.f &= ~ce)), _t(s), pn(s), Vr(s, 0));
  }
}
function Vr(e, t) {
  var n = e.deps;
  if (n !== null) for (var r = t; r < n.length; r++) Br(e, n[r]);
}
function Hr(e) {
  var t = e.f;
  if (!(t & 16384)) {
    M(e, y);
    var n = G,
      r = Er;
    ((G = e), (Er = !0));
    try {
      (t & 16777232 ? hr(e) : mr(e), pr(e));
      var i = zr(e);
      ((e.teardown = typeof i == `function` ? i : null), (e.wv = Mr));
    } finally {
      ((Er = r), (G = n));
    }
  }
}
async function Ur() {
  if (k)
    return new Promise((e) => {
      (requestAnimationFrame(() => e()), setTimeout(() => e()));
    });
  (await Promise.resolve(), zt());
}
function Wr() {
  return Rt.ensure().settled();
}
function Z(e) {
  var t = (e.f & 2) != 0;
  if (
    (Cr?.add(e), U !== null && !kr && !(G !== null && G.f & 16384) && (q === null || !r.call(q, e)))
  ) {
    var n = U.deps;
    if (U.f & 2097152)
      e.rv < Nr &&
        ((e.rv = Nr),
        J === null && n !== null && n[Y] === e ? Y++ : J === null ? (J = [e]) : J.push(e));
    else {
      (U.deps ??= []).push(e);
      var i = e.reactions;
      i === null ? (e.reactions = [U]) : r.call(i, U) || i.push(U);
    }
  }
  if (Dr && gn.has(e)) return gn.get(e);
  if (t) {
    var a = e;
    if (Dr) {
      var o = a.v;
      return (((!(a.f & 1024) && a.reactions !== null) || Kr(a)) && (o = dn(a)), gn.set(a, o), o);
    }
    var s = (a.f & 512) == 0 && !kr && U !== null && (Er || (U.f & 512) != 0),
      c = (a.f & te) === 0;
    (Lr(a) && (s && (a.f |= 512), fn(a)), s && !c && (mn(a), Gr(a)));
  }
  if (F?.has(e)) return F.get(e);
  if (e.f & 8388608) throw e.v;
  return e.v;
}
function Gr(e) {
  if (((e.f |= 512), e.deps !== null))
    for (let t of e.deps) ((t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (mn(t), Gr(t)));
}
function Kr(e) {
  if (e.v === C) return !0;
  if (e.deps === null) return !1;
  for (let t of e.deps) if (gn.has(t) || (t.f & 2 && Kr(t))) return !0;
  return !1;
}
function Q(e) {
  var t = kr;
  try {
    return ((kr = !0), e());
  } finally {
    kr = t;
  }
}
function qr(e) {
  if (!(typeof e != `object` || !e || e instanceof EventTarget)) {
    if (fe in e) Jr(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        let n = e[t];
        typeof n == `object` && n && fe in n && Jr(n);
      }
  }
}
function Jr(e, t = new Set()) {
  if (typeof e == `object` && e && !(e instanceof EventTarget) && !t.has(e)) {
    (t.add(e), e instanceof Date && e.getTime());
    for (let n in e)
      try {
        Jr(e[n], t);
      } catch {}
    let n = u(e);
    if (
      n !== Object.prototype &&
      n !== Array.prototype &&
      n !== Map.prototype &&
      n !== Set.prototype &&
      n !== Date.prototype
    ) {
      let t = s(n);
      for (let n in t) {
        let r = t[n].get;
        if (r)
          try {
            r.call(e);
          } catch {}
      }
    }
  }
}
function Yr(e) {
  return e.endsWith(`capture`) && e !== `gotpointercapture` && e !== `lostpointercapture`;
}
var Xr = [
  `beforeinput`,
  `click`,
  `change`,
  `dblclick`,
  `contextmenu`,
  `focusin`,
  `focusout`,
  `input`,
  `keydown`,
  `keyup`,
  `mousedown`,
  `mousemove`,
  `mouseout`,
  `mouseover`,
  `mouseup`,
  `pointerdown`,
  `pointermove`,
  `pointerout`,
  `pointerover`,
  `pointerup`,
  `touchend`,
  `touchmove`,
  `touchstart`,
];
function Zr(e) {
  return Xr.includes(e);
}
var Qr =
    `allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback`.split(
      `.`,
    ),
  $r = {
    formnovalidate: `formNoValidate`,
    ismap: `isMap`,
    nomodule: `noModule`,
    playsinline: `playsInline`,
    readonly: `readOnly`,
    defaultvalue: `defaultValue`,
    defaultchecked: `defaultChecked`,
    srcobject: `srcObject`,
    novalidate: `noValidate`,
    allowfullscreen: `allowFullscreen`,
    disablepictureinpicture: `disablePictureInPicture`,
    disableremoteplayback: `disableRemotePlayback`,
  };
function ei(e) {
  return ((e = e.toLowerCase()), $r[e] ?? e);
}
[...Qr];
var ti = [`touchstart`, `touchmove`];
function ni(e) {
  return ti.includes(e);
}
var ri = [`textarea`, `script`, `style`, `title`];
function ii(e) {
  return ri.includes(e);
}
var ai = Symbol(`events`),
  oi = new Set(),
  si = new Set();
function ci(e, t, n, r = {}) {
  function i(e) {
    if ((r.capture || pi.call(t, e), !e.cancelBubble)) return Jn(() => n?.call(this, e));
  }
  return (
    e.startsWith(`pointer`) || e.startsWith(`touch`) || e === `wheel`
      ? j(() => {
          t.addEventListener(e, i, r);
        })
      : t.addEventListener(e, i, r),
    i
  );
}
function li(e, t, n, r, i) {
  var a = { capture: r, passive: i },
    o = ci(e, t, n, a);
  (t === document.body || t === window || t === document || t instanceof HTMLMediaElement) &&
    $n(() => {
      t.removeEventListener(e, o, a);
    });
}
function ui(e, t, n) {
  (t[ai] ??= {})[e] = n;
}
function di(e) {
  for (var t = 0; t < e.length; t++) oi.add(e[t]);
  for (var n of si) n(e);
}
var fi = null;
function pi(e) {
  var t = this,
    n = t.ownerDocument,
    r = e.type,
    i = e.composedPath?.() || [],
    o = i[0] || e.target;
  fi = e;
  var s = 0,
    c = fi === e && e[ai];
  if (c) {
    var l = i.indexOf(c);
    if (l !== -1 && (t === document || t === window)) {
      e[ai] = t;
      return;
    }
    var u = i.indexOf(t);
    if (u === -1) return;
    l <= u && (s = l);
  }
  if (((o = i[s] || e.target), o !== t)) {
    a(e, `currentTarget`, {
      configurable: !0,
      get() {
        return o || n;
      },
    });
    var d = U,
      f = G;
    (W(null), K(null));
    try {
      for (var p, m = []; o !== null; ) {
        var h = o.assignedSlot || o.parentNode || o.host || null;
        try {
          var g = o[ai]?.[r];
          g != null && (!o.disabled || e.target === o) && g.call(o, e);
        } catch (e) {
          p ? m.push(e) : (p = e);
        }
        if (e.cancelBubble || h === t || h === null) break;
        o = h;
      }
      if (p) {
        for (let e of m)
          queueMicrotask(() => {
            throw e;
          });
        throw p;
      }
    } finally {
      ((e[ai] = t), delete e.currentTarget, W(d), K(f));
    }
  }
}
var mi =
  globalThis?.window?.trustedTypes &&
  globalThis.window.trustedTypes.createPolicy(`svelte-trusted-html`, { createHTML: (e) => e });
function hi(e) {
  return mi?.createHTML(e) ?? e;
}
function gi(e) {
  var t = Hn(`template`);
  return ((t.innerHTML = hi(e.replaceAll(`<!>`, `<!---->`))), t.content);
}
function $(e, t) {
  var n = G;
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
function _i(e, t) {
  var n = (t & 1) != 0,
    r = (t & 2) != 0,
    i,
    a = !e.startsWith(`<!>`);
  return () => {
    if (w) return ($(E, null), E);
    i === void 0 && ((i = gi(a ? e : `<!>` + e)), n || (i = R(i)));
    var t = r || Nn ? document.importNode(i, !0) : i.cloneNode(!0);
    if (n) {
      var o = R(t),
        s = t.lastChild;
      $(o, s);
    } else $(t, t);
    return t;
  };
}
function vi(e, t, n = `svg`) {
  var r = !e.startsWith(`<!>`),
    i = (t & 1) != 0,
    a = `<${n}>${r ? e : `<!>` + e}</${n}>`,
    o;
  return () => {
    if (w) return ($(E, null), E);
    if (!o) {
      var e = R(gi(a));
      if (i) for (o = document.createDocumentFragment(); R(e); ) o.appendChild(R(e));
      else o = R(e);
    }
    var t = o.cloneNode(!0);
    if (i) {
      var n = R(t),
        r = t.lastChild;
      $(n, r);
    } else $(t, t);
    return t;
  };
}
function yi(e, t) {
  return vi(e, t, `svg`);
}
function bi(e = ``) {
  if (!w) {
    var t = L(e + ``);
    return ($(t, t), t);
  }
  var n = E;
  return (n.nodeType === 3 ? Un(n) : (n.before((n = L())), D(n)), $(n, n), n);
}
function xi() {
  if (w) return ($(E, null), E);
  var e = document.createDocumentFragment(),
    t = document.createComment(``),
    n = L();
  return (e.append(t, n), $(t, n), e);
}
function Si(e, t) {
  if (w) {
    var n = G;
    ((!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = E), O());
    return;
  }
  e !== null && e.before(t);
}
var Ci = !0;
function wi(e) {
  Ci = e;
}
function Ti(e, t) {
  var n = t == null ? `` : typeof t == `object` ? `${t}` : t;
  n !== (e.__t ??= e.nodeValue) && ((e.__t = n), (e.nodeValue = `${n}`));
}
function Ei(e, t) {
  return ki(e, t);
}
function Di(e, t) {
  (In(), (t.intro = t.intro ?? !1));
  let n = t.target,
    r = w,
    i = E;
  try {
    for (var a = R(n); a && (a.nodeType !== 8 || a.data !== `[`); ) a = z(a);
    if (!a) throw Le;
    (T(!0), D(a));
    let r = ki(e, { ...t, anchor: a });
    return (T(!1), r);
  } catch (r) {
    if (
      r instanceof Error &&
      r.message
        .split(
          `
`,
        )
        .some((e) => e.startsWith(`https://svelte.dev/e/`))
    )
      throw r;
    return (
      r !== Le && console.warn(`Failed to hydrate: `, r),
      t.recover === !1 && ke(),
      In(),
      Bn(n),
      T(!1),
      Ei(e, t)
    );
  } finally {
    (T(r), D(i));
  }
}
var Oi = new Map();
function ki(
  e,
  { target: t, anchor: n, props: r = {}, events: a, context: o, intro: s = !0, transformError: c },
) {
  In();
  var l = void 0,
    u = rr(() => {
      var u = n ?? t.appendChild(L());
      Qt(
        u,
        { pending: () => {} },
        (t) => {
          ot({});
          var n = A;
          if (
            (o && (n.c = o),
            a && (r.$$events = a),
            w && $(t, null),
            (Ci = s),
            (l = e(t, r) || {}),
            (Ci = !0),
            w && ((G.nodes.end = E), E === null || E.nodeType !== 8 || E.data !== `]`))
          )
            throw (He(), Le);
          st();
        },
        c,
      );
      var d = new Set(),
        f = (e) => {
          for (var n = 0; n < e.length; n++) {
            var r = e[n];
            if (!d.has(r)) {
              d.add(r);
              var i = ni(r);
              for (let e of [t, document]) {
                var a = Oi.get(e);
                a === void 0 && ((a = new Map()), Oi.set(e, a));
                var o = a.get(r);
                o === void 0
                  ? (e.addEventListener(r, pi, { passive: i }), a.set(r, 1))
                  : a.set(r, o + 1);
              }
            }
          }
        };
      return (
        f(i(oi)),
        si.add(f),
        () => {
          for (var e of d)
            for (let n of [t, document]) {
              var r = Oi.get(n),
                i = r.get(e);
              --i == 0
                ? (n.removeEventListener(e, pi), r.delete(e), r.size === 0 && Oi.delete(n))
                : r.set(e, i);
            }
          (si.delete(f), u !== n && u.parentNode?.removeChild(u));
        }
      );
    });
  return (Ai.set(l, u), l);
}
var Ai = new WeakMap();
function ji(e, t) {
  let n = Ai.get(e);
  return n ? (Ai.delete(e), n(t)) : Promise.resolve();
}
var Mi = class {
  anchor;
  #e = new Map();
  #t = new Map();
  #n = new Map();
  #r = new Set();
  #i = !0;
  constructor(e, t = !0) {
    ((this.anchor = e), (this.#i = t));
  }
  #a = (e) => {
    if (this.#e.has(e)) {
      var t = this.#e.get(e),
        n = this.#t.get(t);
      if (n) (br(n), this.#r.delete(t));
      else {
        var r = this.#n.get(t);
        r &&
          (this.#t.set(t, r.effect),
          this.#n.delete(t),
          r.fragment.lastChild.remove(),
          this.anchor.before(r.fragment),
          (n = r.effect));
      }
      for (let [t, n] of this.#e) {
        if ((this.#e.delete(t), t === e)) break;
        let r = this.#n.get(n);
        r && (H(r.effect), this.#n.delete(n));
      }
      for (let [e, r] of this.#t) {
        if (e === t || this.#r.has(e)) continue;
        let i = () => {
          if (Array.from(this.#e.values()).includes(e)) {
            var t = document.createDocumentFragment();
            (Sr(r, t), t.append(L()), this.#n.set(e, { effect: r, fragment: t }));
          } else H(r);
          (this.#r.delete(e), this.#t.delete(e));
        };
        this.#i || !n ? (this.#r.add(e), vr(r, i, !1)) : i();
      }
    }
  };
  #o = (e) => {
    this.#e.delete(e);
    let t = Array.from(this.#e.values());
    for (let [e, n] of this.#n) t.includes(e) || (H(n.effect), this.#n.delete(e));
  };
  ensure(e, t) {
    var n = P,
      r = Vn();
    if (t && !this.#t.has(e) && !this.#n.has(e))
      if (r) {
        var i = document.createDocumentFragment(),
          a = L();
        (i.append(a), this.#n.set(e, { effect: V(() => t(a)), fragment: i }));
      } else
        this.#t.set(
          e,
          V(() => t(this.anchor)),
        );
    if ((this.#e.set(n, e), r)) {
      for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
      for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
      (n.oncommit(this.#a), n.ondiscard(this.#o));
    } else (w && (this.anchor = E), this.#a(n));
  }
};
function Ni(e, t, n = !1) {
  var r;
  w && ((r = E), O());
  var i = new Mi(e),
    a = n ? re : 0;
  function o(e, t) {
    if (w) {
      var n = Je(r);
      if (e !== parseInt(n.substring(1))) {
        var a = qe();
        (D(a), (i.anchor = a), T(!1), i.ensure(e, t), T(!0));
        return;
      }
    }
    i.ensure(e, t);
  }
  dr(() => {
    var e = !1;
    (t((t, n = 0) => {
      ((e = !0), o(n, t));
    }),
      e || o(-1, null));
  }, a);
}
function Pi(e, t) {
  return t;
}
function Fi(e, t, n) {
  for (var r = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
    let n = t[c];
    vr(
      n,
      () => {
        if (o) {
          if ((o.pending.delete(n), o.done.add(n), o.pending.size === 0)) {
            var t = e.outrogroups;
            (Ii(e, i(o.done)), t.delete(o), t.size === 0 && (e.outrogroups = null));
          }
        } else --s;
      },
      !1,
    );
  }
  if (s === 0) {
    var l = r.length === 0 && n !== null;
    if (l) {
      var u = n,
        d = u.parentNode;
      (Bn(d), d.append(u), e.items.clear());
    }
    Ii(e, t, !l);
  } else ((o = { pending: new Set(t), done: new Set() }), (e.outrogroups ??= new Set()).add(o));
}
function Ii(e, t, n = !0) {
  var r;
  if (e.pending.size > 0) {
    r = new Set();
    for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
  }
  for (var i = 0; i < t.length; i++) {
    var a = t[i];
    r?.has(a) ? ((a.f |= se), Sr(a, document.createDocumentFragment())) : H(t[i], n);
  }
}
var Li;
function Ri(e, n, r, a, o, s = null) {
  var c = e,
    l = new Map();
  if (n & 4) {
    var u = e;
    c = w ? D(R(u)) : u.appendChild(L());
  }
  w && O();
  var d = null,
    f = cn(() => {
      var e = r();
      return t(e) ? e : e == null ? [] : i(e);
    }),
    p,
    m = new Map(),
    h = !0;
  function g(e) {
    v.effect.f & 16384 ||
      (v.pending.delete(e),
      (v.fallback = d),
      Bi(v, p, c, n, a),
      d !== null &&
        (p.length === 0
          ? d.f & 33554432
            ? ((d.f ^= se), Hi(d, null, c))
            : br(d)
          : vr(d, () => {
              d = null;
            })));
  }
  function _(e) {
    v.pending.delete(e);
  }
  var v = {
    effect: dr(() => {
      p = Z(f);
      var e = p.length;
      let t = !1;
      w && (Je(c) === `[!`) != (e === 0) && ((c = qe()), D(c), T(!1), (t = !0));
      for (var i = new Set(), u = P, v = Vn(), y = 0; y < e; y += 1) {
        w && E.nodeType === 8 && E.data === `]` && ((c = E), (t = !0), T(!1));
        var b = p[y],
          x = a(b, y),
          S = h ? null : l.get(x);
        (S
          ? (S.v && Cn(S.v, b), S.i && Cn(S.i, y), v && u.unskip_effect(S.e))
          : ((S = Vi(l, h ? c : (Li ??= L()), b, x, y, o, n, r)), h || (S.e.f |= se), l.set(x, S)),
          i.add(x));
      }
      if (
        (e === 0 &&
          s &&
          !d &&
          (h ? (d = V(() => s(c))) : ((d = V(() => s((Li ??= L())))), (d.f |= se))),
        e > i.size && xe(``, ``, ``),
        w && e > 0 && D(qe()),
        !h)
      )
        if ((m.set(u, i), v)) {
          for (let [e, t] of l) i.has(e) || u.skip_effect(t.e);
          (u.oncommit(g), u.ondiscard(_));
        } else g(u);
      (t && T(!0), Z(f));
    }),
    flags: n,
    items: l,
    pending: m,
    outrogroups: null,
    fallback: d,
  };
  ((h = !1), w && (c = E));
}
function zi(e) {
  for (; e !== null && !(e.f & 32); ) e = e.next;
  return e;
}
function Bi(e, t, n, r, a) {
  var o = (r & 8) != 0,
    s = t.length,
    c = e.items,
    l = zi(e.effect.first),
    u,
    d = null,
    f,
    p = [],
    m = [],
    h,
    g,
    _,
    v;
  if (o)
    for (v = 0; v < s; v += 1)
      ((h = t[v]),
        (g = a(h, v)),
        (_ = c.get(g).e),
        _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= new Set()).add(_)));
  for (v = 0; v < s; v += 1) {
    if (((h = t[v]), (g = a(h, v)), (_ = c.get(g).e), e.outrogroups !== null))
      for (let t of e.outrogroups) (t.pending.delete(_), t.done.delete(_));
    if (
      (_.f & 8192 && (br(_), o && (_.nodes?.a?.unfix(), (f ??= new Set()).delete(_))),
      _.f & 33554432)
    )
      if (((_.f ^= se), _ === l)) Hi(_, null, n);
      else {
        var y = d ? d.next : l;
        (_ === e.effect.last && (e.effect.last = _.prev),
          _.prev && (_.prev.next = _.next),
          _.next && (_.next.prev = _.prev),
          Ui(e, d, _),
          Ui(e, _, y),
          Hi(_, y, n),
          (d = _),
          (p = []),
          (m = []),
          (l = zi(d.next)));
        continue;
      }
    if (_ !== l) {
      if (u !== void 0 && u.has(_)) {
        if (p.length < m.length) {
          var b = m[0],
            x;
          d = b.prev;
          var S = p[0],
            ee = p[p.length - 1];
          for (x = 0; x < p.length; x += 1) Hi(p[x], b, n);
          for (x = 0; x < m.length; x += 1) u.delete(m[x]);
          (Ui(e, S.prev, ee.next),
            Ui(e, d, S),
            Ui(e, ee, b),
            (l = b),
            (d = ee),
            --v,
            (p = []),
            (m = []));
        } else
          (u.delete(_),
            Hi(_, l, n),
            Ui(e, _.prev, _.next),
            Ui(e, _, d === null ? e.effect.first : d.next),
            Ui(e, d, _),
            (d = _));
        continue;
      }
      for (p = [], m = []; l !== null && l !== _; )
        ((u ??= new Set()).add(l), m.push(l), (l = zi(l.next)));
      if (l === null) continue;
    }
    (_.f & 33554432 || p.push(_), (d = _), (l = zi(_.next)));
  }
  if (e.outrogroups !== null) {
    for (let t of e.outrogroups)
      t.pending.size === 0 && (Ii(e, i(t.done)), e.outrogroups?.delete(t));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || u !== void 0) {
    var te = [];
    if (u !== void 0) for (_ of u) _.f & 8192 || te.push(_);
    for (; l !== null; ) (!(l.f & 8192) && l !== e.fallback && te.push(l), (l = zi(l.next)));
    var ne = te.length;
    if (ne > 0) {
      var re = r & 4 && s === 0 ? n : null;
      if (o) {
        for (v = 0; v < ne; v += 1) te[v].nodes?.a?.measure();
        for (v = 0; v < ne; v += 1) te[v].nodes?.a?.fix();
      }
      Fi(e, te, re);
    }
  }
  o &&
    j(() => {
      if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
    });
}
function Vi(e, t, n, r, i, a, o, s) {
  var c = o & 1 ? (o & 16 ? yn(n) : xn(n, !1, !1)) : null,
    l = o & 2 ? yn(i) : null;
  return {
    v: c,
    i: l,
    e: V(
      () => (
        a(t, c ?? n, l ?? i, s),
        () => {
          e.delete(r);
        }
      ),
    ),
  };
}
function Hi(e, t, n) {
  if (e.nodes)
    for (
      var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n;
      r !== null;
    ) {
      var o = z(r);
      if ((a.before(r), r === i)) return;
      r = o;
    }
}
function Ui(e, t, n) {
  (t === null ? (e.effect.first = n) : (t.next = n),
    n === null ? (e.effect.last = t) : (n.prev = t));
}
function Wi(e, t, n = !1, r = !1, i = !1, a = !1) {
  var o = e,
    s = ``;
  if (n) {
    var c = e;
    w && (o = D(R(c)));
  }
  lr(() => {
    var e = G;
    if (s === (s = t() ?? ``)) {
      w && O();
      return;
    }
    if (n && !w) {
      ((e.nodes = null), (c.innerHTML = s), s !== `` && $(R(c), c.lastChild));
      return;
    }
    if ((e.nodes !== null && (gr(e.nodes.start, e.nodes.end), (e.nodes = null)), s !== ``)) {
      if (w) {
        for (var a = E.data, l = O(), u = l; l !== null && (l.nodeType !== 8 || l.data !== ``); )
          ((u = l), (l = z(l)));
        if (l === null) throw (He(), Le);
        ($(E, u), (o = D(l)));
        return;
      }
      var d = Hn(r ? `svg` : i ? `math` : `template`, r ? ze : i ? Be : void 0);
      d.innerHTML = s;
      var f = r || i ? d : d.content;
      if (($(R(f), f.lastChild), r || i)) for (; R(f); ) o.before(R(f));
      else o.before(f);
    }
  });
}
function Gi(e, t, n, r, i) {
  w && O();
  var a = t.$$slots?.[n],
    o = !1;
  (a === !0 && ((a = t[n === `default` ? `children` : n]), (o = !0)),
    a === void 0 ? i !== null && i(e) : a(e, o ? () => r : r));
}
function Ki(e) {
  return (t, ...n) => {
    var r = e(...n),
      i;
    w ? ((i = E), O()) : ((i = R(gi(r.render().trim()))), t.before(i));
    let a = r.setup?.(i);
    ($(i, i), typeof a == `function` && $n(a));
  };
}
function qi(e, t, n) {
  var r;
  w && ((r = E), O());
  var i = new Mi(e);
  dr(() => {
    var e = t() ?? null;
    if (w && (Je(r) === `[`) != (e !== null)) {
      var a = qe();
      (D(a), (i.anchor = a), T(!1), i.ensure(e, e && ((t) => n(t, e))), T(!0));
      return;
    }
    i.ensure(e, e && ((t) => n(t, e)));
  }, re);
}
var Ji = () => performance.now(),
  Yi = { tick: (e) => requestAnimationFrame(e), now: () => Ji(), tasks: new Set() };
function Xi() {
  let e = Yi.now();
  (Yi.tasks.forEach((t) => {
    t.c(e) || (Yi.tasks.delete(t), t.f());
  }),
    Yi.tasks.size !== 0 && Yi.tick(Xi));
}
function Zi(e) {
  let t;
  return (
    Yi.tasks.size === 0 && Yi.tick(Xi),
    {
      promise: new Promise((n) => {
        Yi.tasks.add((t = { c: e, f: n }));
      }),
      abort() {
        Yi.tasks.delete(t);
      },
    }
  );
}
function Qi(e, t) {
  Jn(() => {
    e.dispatchEvent(new CustomEvent(t));
  });
}
function $i(e) {
  if (e === `float`) return `cssFloat`;
  if (e === `offset`) return `cssOffset`;
  if (e.startsWith(`--`)) return e;
  let t = e.split(`-`);
  return t.length === 1
    ? t[0]
    : t[0] +
        t
          .slice(1)
          .map((e) => e[0].toUpperCase() + e.slice(1))
          .join(``);
}
function ea(e) {
  let t = {},
    n = e.split(`;`);
  for (let e of n) {
    let [n, r] = e.split(`:`);
    if (!n || r === void 0) break;
    let i = $i(n.trim());
    t[i] = r.trim();
  }
  return t;
}
var ta = (e) => e;
function na(e, t, n, r) {
  var i = (e & 1) != 0,
    a = (e & 2) != 0,
    o = i && a,
    s = (e & 4) != 0,
    c = o ? `both` : i ? `in` : `out`,
    l,
    u = t.inert,
    d = t.style.overflow,
    f,
    p;
  function m() {
    return Jn(() => (l ??= n()(t, r?.() ?? {}, { direction: c })));
  }
  var h = {
      is_global: s,
      in() {
        if (((t.inert = u), !i)) {
          (p?.abort(), p?.reset?.());
          return;
        }
        (a || f?.abort(),
          (f = ra(t, m(), p, 1, () => {
            (Qi(t, `introend`), f?.abort(), (f = l = void 0), (t.style.overflow = d));
          })));
      },
      out(e) {
        if (!a) {
          (e?.(), (l = void 0));
          return;
        }
        ((t.inert = !0),
          (p = ra(t, m(), f, 0, () => {
            (Qi(t, `outroend`), e?.());
          })));
      },
      stop: () => {
        (f?.abort(), p?.abort());
      },
    },
    g = G;
  if (((g.nodes.t ??= []).push(h), i && Ci)) {
    var _ = s;
    if (!_) {
      for (var v = g.parent; v && v.f & 65536; ) for (; (v = v.parent) && !(v.f & 16); );
      _ = !v || (v.f & 32768) != 0;
    }
    _ &&
      ir(() => {
        Q(() => h.in());
      });
  }
}
function ra(e, t, n, r, i) {
  var a = r === 1;
  if (f(t)) {
    var o,
      s = !1;
    return (
      j(() => {
        s || (o = ra(e, t({ direction: a ? `in` : `out` }), n, r, i));
      }),
      {
        abort: () => {
          ((s = !0), o?.abort());
        },
        deactivate: () => o.deactivate(),
        reset: () => o.reset(),
        t: () => o.t(),
      }
    );
  }
  if ((n?.deactivate(), !t?.duration && !t?.delay))
    return (
      Qi(e, a ? `introstart` : `outrostart`),
      i(),
      { abort: p, deactivate: p, reset: p, t: () => r }
    );
  let { delay: c = 0, css: l, tick: u, easing: d = ta } = t;
  var m = [];
  if (a && n === void 0 && (u && u(0, 1), l)) {
    var h = ea(l(0, 1));
    m.push(h, h);
  }
  var g = () => 1 - r,
    _ = e.animate(m, { duration: c, fill: `forwards` });
  return (
    (_.onfinish = () => {
      (_.cancel(), Qi(e, a ? `introstart` : `outrostart`));
      var o = n?.t() ?? 1 - r;
      n?.abort();
      var s = r - o,
        c = t.duration * Math.abs(s),
        f = [];
      if (c > 0) {
        var p = !1;
        if (l)
          for (var m = Math.ceil(c / (1e3 / 60)), h = 0; h <= m; h += 1) {
            var v = o + s * d(h / m),
              y = ea(l(v, 1 - v));
            (f.push(y), (p ||= y.overflow === `hidden`));
          }
        (p && (e.style.overflow = `hidden`),
          (g = () => {
            var e = _.currentTime;
            return o + s * d(e / c);
          }),
          u &&
            Zi(() => {
              if (_.playState !== `running`) return !1;
              var e = g();
              return (u(e, 1 - e), !0);
            }));
      }
      ((_ = e.animate(f, { duration: c, fill: `forwards` })),
        (_.onfinish = () => {
          ((g = () => r), u?.(r, 1 - r), i());
        }));
    }),
    {
      abort: () => {
        _ && (_.cancel(), (_.effect = null), (_.onfinish = p));
      },
      deactivate: () => {
        i = p;
      },
      reset: () => {
        r === 0 && u?.(1, 0);
      },
      t: () => g(),
    }
  );
}
function ia(e, t, n, r, i, a) {
  let o = w;
  w && O();
  var s = null;
  w && E.nodeType === 1 && ((s = E), O());
  var c = w ? E : e,
    l = new Mi(c, !1);
  (dr(() => {
    let e = t() || null;
    var a = i ? i() : n || e === `svg` ? ze : void 0;
    if (e === null) {
      (l.ensure(null, null), wi(!0));
      return;
    }
    return (
      l.ensure(e, (t) => {
        if (e) {
          if (((s = w ? s : Hn(e, a)), $(s, s), r)) {
            w && ii(e) && s.append(document.createComment(``));
            var n = w ? R(s) : s.appendChild(L());
            (w && (n === null ? T(!1) : D(n)), r(s, n));
          }
          ((G.nodes.end = s), t.before(s));
        }
        w && D(t);
      }),
      wi(!0),
      () => {
        e && wi(!1);
      }
    );
  }, re),
    $n(() => {
      wi(!0);
    }),
    o && (T(!0), D(c)));
}
function aa(e, t) {
  let n = null,
    r = w;
  var i;
  if (w) {
    n = E;
    for (var a = R(document.head); a !== null && (a.nodeType !== 8 || a.data !== e); ) a = z(a);
    if (a === null) T(!1);
    else {
      var o = z(a);
      (a.remove(), D(o));
    }
  }
  w || (i = document.head.appendChild(L()));
  try {
    dr(() => t(i), ie | ae);
  } finally {
    r && (T(!0), D(n));
  }
}
function oa(e, t) {
  var n = void 0,
    r;
  fr(() => {
    n !== (n = t()) &&
      ((r &&= (H(r), null)),
      n &&
        (r = V(() => {
          ir(() => n(e));
        })));
  });
}
function sa(e) {
  var t,
    n,
    r = ``;
  if (typeof e == `string` || typeof e == `number`) r += e;
  else if (typeof e == `object`)
    if (Array.isArray(e)) {
      var i = e.length;
      for (t = 0; t < i; t++) e[t] && (n = sa(e[t])) && (r && (r += ` `), (r += n));
    } else for (n in e) e[n] && (r && (r += ` `), (r += n));
  return r;
}
function ca() {
  for (var e, t, n = 0, r = ``, i = arguments.length; n < i; n++)
    (e = arguments[n]) && (t = sa(e)) && (r && (r += ` `), (r += t));
  return r;
}
function la(e) {
  return typeof e == `object` ? ca(e) : (e ?? ``);
}
var ua = [
  ...` 	
\r\f\xA0\v﻿`,
];
function da(e, t, n) {
  var r = e == null ? `` : `` + e;
  if ((t && (r = r ? r + ` ` + t : t), n)) {
    for (var i of Object.keys(n))
      if (n[i]) r = r ? r + ` ` + i : i;
      else if (r.length)
        for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0; ) {
          var s = o + a;
          (o === 0 || ua.includes(r[o - 1])) && (s === r.length || ua.includes(r[s]))
            ? (r = (o === 0 ? `` : r.substring(0, o)) + r.substring(s + 1))
            : (o = s);
        }
  }
  return r === `` ? null : r;
}
function fa(e, t = !1) {
  var n = t ? ` !important;` : `;`,
    r = ``;
  for (var i of Object.keys(e)) {
    var a = e[i];
    a != null && a !== `` && (r += ` ` + i + `: ` + a + n);
  }
  return r;
}
function pa(e) {
  return e[0] !== `-` || e[1] !== `-` ? e.toLowerCase() : e;
}
function ma(e, t) {
  if (t) {
    var n = ``,
      r,
      i;
    if ((Array.isArray(t) ? ((r = t[0]), (i = t[1])) : (r = t), e)) {
      e = String(e)
        .replaceAll(/\s*\/\*.*?\*\/\s*/g, ``)
        .trim();
      var a = !1,
        o = 0,
        s = !1,
        c = [];
      (r && c.push(...Object.keys(r).map(pa)), i && c.push(...Object.keys(i).map(pa)));
      var l = 0,
        u = -1;
      let t = e.length;
      for (var d = 0; d < t; d++) {
        var f = e[d];
        if (
          (s
            ? f === `/` && e[d - 1] === `*` && (s = !1)
            : a
              ? a === f && (a = !1)
              : f === `/` && e[d + 1] === `*`
                ? (s = !0)
                : f === `"` || f === `'`
                  ? (a = f)
                  : f === `(`
                    ? o++
                    : f === `)` && o--,
          !s && a === !1 && o === 0)
        ) {
          if (f === `:` && u === -1) u = d;
          else if (f === `;` || d === t - 1) {
            if (u !== -1) {
              var p = pa(e.substring(l, u).trim());
              if (!c.includes(p)) {
                f !== `;` && d++;
                var m = e.substring(l, d).trim();
                n += ` ` + m + `;`;
              }
            }
            ((l = d + 1), (u = -1));
          }
        }
      }
    }
    return (r && (n += fa(r)), i && (n += fa(i, !0)), (n = n.trim()), n === `` ? null : n);
  }
  return e == null ? null : String(e);
}
function ha(e, t, n, r, i, a) {
  var o = e.__className;
  if (w || o !== n || o === void 0) {
    var s = da(n, r, a);
    ((!w || s !== e.getAttribute(`class`)) &&
      (s == null ? e.removeAttribute(`class`) : t ? (e.className = s) : e.setAttribute(`class`, s)),
      (e.__className = n));
  } else if (a && i !== a)
    for (var c in a) {
      var l = !!a[c];
      (i == null || l !== !!i[c]) && e.classList.toggle(c, l);
    }
  return a;
}
function ga(e, t = {}, n, r) {
  for (var i in n) {
    var a = n[i];
    t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
  }
}
function _a(e, t, n, r) {
  var i = e.__style;
  if (w || i !== t) {
    var a = ma(t, r);
    ((!w || a !== e.getAttribute(`style`)) &&
      (a == null ? e.removeAttribute(`style`) : (e.style.cssText = a)),
      (e.__style = t));
  } else
    r && (Array.isArray(r) ? (ga(e, n?.[0], r[0]), ga(e, n?.[1], r[1], `important`)) : ga(e, n, r));
  return r;
}
function va(e, n, r = !1) {
  if (e.multiple) {
    if (n == null) return;
    if (!t(n)) return Ue();
    for (var i of e.options) i.selected = n.includes(xa(i));
    return;
  }
  for (i of e.options)
    if (An(xa(i), n)) {
      i.selected = !0;
      return;
    }
  (!r || n !== void 0) && (e.selectedIndex = -1);
}
function ya(e) {
  var t = new MutationObserver(() => {
    va(e, e.__value);
  });
  (t.observe(e, { childList: !0, subtree: !0, attributes: !0, attributeFilter: [`value`] }),
    $n(() => {
      t.disconnect();
    }));
}
function ba(e, t, n = t) {
  var r = new WeakSet(),
    i = !0;
  (Yn(e, `change`, (t) => {
    var i = t ? `[selected]` : `:checked`,
      a;
    if (e.multiple) a = [].map.call(e.querySelectorAll(i), xa);
    else {
      var o = e.querySelector(i) ?? e.querySelector(`option:not([disabled])`);
      a = o && xa(o);
    }
    (n(a), (e.__value = a), P !== null && r.add(P));
  }),
    ir(() => {
      var a = t();
      if (e === document.activeElement) {
        var o = k ? At : P;
        if (r.has(o)) return;
      }
      if ((va(e, a, i), i && a === void 0)) {
        var s = e.querySelector(`:checked`);
        s !== null && ((a = xa(s)), n(a));
      }
      ((e.__value = a), (i = !1));
    }),
    ya(e));
}
function xa(e) {
  return `__value` in e ? e.__value : e.value;
}
var Sa = Symbol(`class`),
  Ca = Symbol(`style`),
  wa = Symbol(`is custom element`),
  Ta = Symbol(`is html`),
  Ea = ge ? `link` : `LINK`,
  Da = ge ? `input` : `INPUT`,
  Oa = ge ? `option` : `OPTION`,
  ka = ge ? `select` : `SELECT`;
function Aa(e) {
  if (w) {
    var t = !1,
      n = () => {
        if (!t) {
          if (((t = !0), e.hasAttribute(`value`))) {
            var n = e.value;
            (Na(e, `value`, null), (e.value = n));
          }
          if (e.hasAttribute(`checked`)) {
            var r = e.checked;
            (Na(e, `checked`, null), (e.checked = r));
          }
        }
      };
    ((e.__on_r = n), j(n), qn());
  }
}
function ja(e, t) {
  var n = Ia(e);
  n.checked !== (n.checked = t ?? void 0) && (e.checked = t);
}
function Ma(e, t) {
  t ? e.hasAttribute(`selected`) || e.setAttribute(`selected`, ``) : e.removeAttribute(`selected`);
}
function Na(e, t, n, r) {
  var i = Ia(e);
  (w &&
    ((i[t] = e.getAttribute(t)),
    t === `src` || t === `srcset` || (t === `href` && e.nodeName === Ea))) ||
    (i[t] !== (i[t] = n) &&
      (t === `loading` && (e[me] = n),
      n == null
        ? e.removeAttribute(t)
        : typeof n != `string` && Ra(e).includes(t)
          ? (e[t] = n)
          : e.setAttribute(t, n)));
}
function Pa(e, t, n, r, i = !1, a = !1) {
  if (w && i && e.nodeName === Da) {
    var o = e;
    (o.type === `checkbox` ? `defaultChecked` : `defaultValue`) in n || Aa(o);
  }
  var s = Ia(e),
    c = s[wa],
    l = !s[Ta];
  let u = w && c;
  u && T(!1);
  var d = t || {},
    f = e.nodeName === Oa;
  for (var p in t) p in n || (n[p] = null);
  (n.class ? (n.class = la(n.class)) : (r || n[Sa]) && (n.class = null),
    n[Ca] && (n.style ??= null));
  var m = Ra(e);
  for (let i in n) {
    let o = n[i];
    if (f && i === `value` && o == null) {
      ((e.value = e.__value = ``), (d[i] = o));
      continue;
    }
    if (i === `class`) {
      (ha(e, e.namespaceURI === `http://www.w3.org/1999/xhtml`, o, r, t?.[Sa], n[Sa]),
        (d[i] = o),
        (d[Sa] = n[Sa]));
      continue;
    }
    if (i === `style`) {
      (_a(e, o, t?.[Ca], n[Ca]), (d[i] = o), (d[Ca] = n[Ca]));
      continue;
    }
    var h = d[i];
    if (!(o === h && !(o === void 0 && e.hasAttribute(i)))) {
      d[i] = o;
      var g = i[0] + i[1];
      if (g !== `$$`)
        if (g === `on`) {
          let t = {},
            n = `$$` + i,
            r = i.slice(2);
          var _ = Zr(r);
          if ((Yr(r) && ((r = r.slice(0, -7)), (t.capture = !0)), !_ && h)) {
            if (o != null) continue;
            (e.removeEventListener(r, d[n], t), (d[n] = null));
          }
          if (_) (ui(r, e, o), di([r]));
          else if (o != null) {
            function a(e) {
              d[i].call(this, e);
            }
            d[n] = ci(r, e, a, t);
          }
        } else if (i === `style`) Na(e, i, o);
        else if (i === `autofocus`) Wn(e, !!o);
        else if (!c && (i === `__value` || (i === `value` && o != null))) e.value = e.__value = o;
        else if (i === `selected` && f) Ma(e, o);
        else {
          var v = i;
          l || (v = ei(v));
          var y = v === `defaultValue` || v === `defaultChecked`;
          if (o == null && !c && !y)
            if (((s[i] = null), v === `value` || v === `checked`)) {
              let n = e,
                r = t === void 0;
              if (v === `value`) {
                let e = n.defaultValue;
                (n.removeAttribute(v), (n.defaultValue = e), (n.value = n.__value = r ? e : null));
              } else {
                let e = n.defaultChecked;
                (n.removeAttribute(v), (n.defaultChecked = e), (n.checked = r ? e : !1));
              }
            } else e.removeAttribute(i);
          else
            y || (m.includes(v) && (c || typeof o != `string`))
              ? ((e[v] = o), v in s && (s[v] = C))
              : typeof o != `function` && Na(e, v, o, a);
        }
    }
  }
  return (u && T(!0), d);
}
function Fa(e, t, n = [], r = [], i = [], a, o = !1, s = !1) {
  en(i, n, r, (n) => {
    var r = void 0,
      i = {},
      c = e.nodeName === ka,
      l = !1;
    if (
      (fr(() => {
        var u = t(...n.map(Z)),
          d = Pa(e, r, u, a, o, s);
        l && c && `value` in u && va(e, u.value);
        for (let e of Object.getOwnPropertySymbols(i)) u[e] || H(i[e]);
        for (let t of Object.getOwnPropertySymbols(u)) {
          var f = u[t];
          (t.description === `@attach` &&
            (!r || f !== r[t]) &&
            (i[t] && H(i[t]), (i[t] = V(() => oa(e, () => f)))),
            (d[t] = f));
        }
        r = d;
      }),
      c)
    ) {
      var u = e;
      ir(() => {
        (va(u, r.value, !0), ya(u));
      });
    }
    l = !0;
  });
}
function Ia(e) {
  return (e.__attributes ??= { [wa]: e.nodeName.includes(`-`), [Ta]: e.namespaceURI === Re });
}
var La = new Map();
function Ra(e) {
  var t = e.getAttribute(`is`) || e.nodeName,
    n = La.get(t);
  if (n) return n;
  La.set(t, (n = []));
  for (var r, i = e, a = Element.prototype; a !== i; ) {
    for (var o in ((r = s(i)), r)) r[o].set && n.push(o);
    i = u(i);
  }
  return n;
}
function za(e, t, n = t) {
  var r = new WeakSet();
  (Yn(e, `input`, async (i) => {
    var a = i ? e.defaultValue : e.value;
    if (((a = Wa(e) ? Ga(a) : a), n(a), P !== null && r.add(P), await Ur(), a !== (a = t()))) {
      var o = e.selectionStart,
        s = e.selectionEnd,
        c = e.value.length;
      if (((e.value = a ?? ``), s !== null)) {
        var l = e.value.length;
        o === s && s === c && l > c
          ? ((e.selectionStart = l), (e.selectionEnd = l))
          : ((e.selectionStart = o), (e.selectionEnd = Math.min(s, l)));
      }
    }
  }),
    ((w && e.defaultValue !== e.value) || (Q(t) == null && e.value)) &&
      (n(Wa(e) ? Ga(e.value) : e.value), P !== null && r.add(P)),
    cr(() => {
      var n = t();
      if (e === document.activeElement) {
        var i = k ? At : P;
        if (r.has(i)) return;
      }
      (Wa(e) && n === Ga(e.value)) ||
        (e.type === `date` && !n && !e.value) ||
        (n !== e.value && (e.value = n ?? ``));
    }));
}
var Ba = new Set();
function Va(e, t, n, r, i = r) {
  var a = n.getAttribute(`type`) === `checkbox`,
    o = e;
  let s = !1;
  if (t !== null) for (var c of t) o = o[c] ??= [];
  (o.push(n),
    Yn(
      n,
      `change`,
      () => {
        var e = n.__value;
        (a && (e = Ua(o, e, n.checked)), i(e));
      },
      () => i(a ? [] : null),
    ),
    cr(() => {
      var e = r();
      if (w && n.defaultChecked !== n.checked) {
        s = !0;
        return;
      }
      a ? ((e ||= []), (n.checked = e.includes(n.__value))) : (n.checked = An(n.__value, e));
    }),
    $n(() => {
      var e = o.indexOf(n);
      e !== -1 && o.splice(e, 1);
    }),
    Ba.has(o) ||
      (Ba.add(o),
      j(() => {
        (o.sort((e, t) => (e.compareDocumentPosition(t) === 4 ? -1 : 1)), Ba.delete(o));
      })),
    j(() => {
      if (s) {
        var e = a ? Ua(o, e, n.checked) : o.find((e) => e.checked)?.__value;
        i(e);
      }
    }));
}
function Ha(e, t, n = t) {
  (Yn(e, `change`, (t) => {
    n(t ? e.defaultChecked : e.checked);
  }),
    ((w && e.defaultChecked !== e.checked) || Q(t) == null) && n(e.checked),
    cr(() => {
      e.checked = !!t();
    }));
}
function Ua(e, t, n) {
  for (var r = new Set(), i = 0; i < e.length; i += 1) e[i].checked && r.add(e[i].__value);
  return (n || r.delete(t), Array.from(r));
}
function Wa(e) {
  var t = e.type;
  return t === `number` || t === `range`;
}
function Ga(e) {
  return e === `` ? null : +e;
}
function Ka(e, t) {
  return e === t || e?.[fe] === t;
}
function qa(e = {}, t, n, r) {
  var i = A.r,
    a = G;
  return (
    ir(() => {
      var o, s;
      return (
        cr(() => {
          ((o = s),
            (s = r?.() || []),
            Q(() => {
              e !== n(...s) && (t(e, ...s), o && Ka(n(...o), e) && t(null, ...o));
            }));
        }),
        () => {
          let r = a;
          for (; r !== i && r.parent !== null && r.parent.f & 33554432; ) r = r.parent;
          let o = () => {
              s && Ka(n(...s), e) && t(null, ...s);
            },
            c = r.teardown;
          r.teardown = () => {
            (o(), c?.());
          };
        }
      );
    }),
    e
  );
}
function Ja(e) {
  return function (...t) {
    return (t[0].stopPropagation(), e?.apply(this, t));
  };
}
function Ya(e) {
  return function (...t) {
    return (t[0].preventDefault(), e?.apply(this, t));
  };
}
function Xa(e = !1) {
  let t = A,
    n = t.l.u;
  if (!n) return;
  let r = () => qr(t.s);
  if (e) {
    let e = 0,
      n = {},
      i = an(() => {
        let r = !1,
          i = t.s;
        for (let e in i) i[e] !== n[e] && ((n[e] = i[e]), (r = !0));
        return (r && e++, e);
      });
    r = () => Z(i);
  }
  (n.b.length &&
    nr(() => {
      (Za(t, r), h(n.b));
    }),
    er(() => {
      let e = Q(() => n.m.map(m));
      return () => {
        for (let t of e) typeof t == `function` && t();
      };
    }),
    n.a.length &&
      er(() => {
        (Za(t, r), h(n.a));
      }));
}
function Za(e, t) {
  if (e.l.s) for (let t of e.l.s) Z(t);
  t();
}
function Qa(e, n) {
  var r = e.$$events?.[n.type];
  for (var i of t(r) ? r.slice() : r == null ? [] : [r]) i.call(this, n);
}
var $a = {
  get(e, t) {
    if (!e.exclude.includes(t)) return (Z(e.version), t in e.special ? e.special[t]() : e.props[t]);
  },
  set(e, t, n) {
    if (!(t in e.special)) {
      var r = G;
      try {
        (K(e.parent_effect),
          (e.special[t] = ro(
            {
              get [t]() {
                return e.props[t];
              },
            },
            t,
            4,
          )));
      } finally {
        K(r);
      }
    }
    return (e.special[t](n), Tn(e.version), !0);
  },
  getOwnPropertyDescriptor(e, t) {
    if (!e.exclude.includes(t) && t in e.props)
      return { enumerable: !0, configurable: !0, value: e.props[t] };
  },
  deleteProperty(e, t) {
    return e.exclude.includes(t) ? !0 : (e.exclude.push(t), Tn(e.version), !0);
  },
  has(e, t) {
    return e.exclude.includes(t) ? !1 : t in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((t) => !e.exclude.includes(t));
  },
};
function eo(e, t) {
  return new Proxy({ props: e, exclude: t, special: {}, version: yn(0), parent_effect: G }, $a);
}
var to = {
  get(e, t) {
    let n = e.props.length;
    for (; n--; ) {
      let r = e.props[n];
      if ((f(r) && (r = r()), typeof r == `object` && r && t in r)) return r[t];
    }
  },
  set(e, t, n) {
    let r = e.props.length;
    for (; r--; ) {
      let i = e.props[r];
      f(i) && (i = i());
      let a = o(i, t);
      if (a && a.set) return (a.set(n), !0);
    }
    return !1;
  },
  getOwnPropertyDescriptor(e, t) {
    let n = e.props.length;
    for (; n--; ) {
      let r = e.props[n];
      if ((f(r) && (r = r()), typeof r == `object` && r && t in r)) {
        let e = o(r, t);
        return (e && !e.configurable && (e.configurable = !0), e);
      }
    }
  },
  has(e, t) {
    if (t === fe || t === pe) return !1;
    for (let n of e.props) if ((f(n) && (n = n()), n != null && t in n)) return !0;
    return !1;
  },
  ownKeys(e) {
    let t = [];
    for (let n of e.props)
      if ((f(n) && (n = n()), n)) {
        for (let e in n) t.includes(e) || t.push(e);
        for (let e of Object.getOwnPropertySymbols(n)) t.includes(e) || t.push(e);
      }
    return t;
  },
};
function no(...e) {
  return new Proxy({ props: e }, to);
}
function ro(e, t, n, r) {
  var i = !Qe || (n & 2) != 0,
    a = (n & 8) != 0,
    s = (n & 16) != 0,
    c = r,
    l = !0,
    u = () => (l && ((l = !1), (c = s ? Q(r) : r)), c);
  let d;
  if (a) {
    var f = fe in e || pe in e;
    d = o(e, t)?.set ?? (f && t in e ? (n) => (e[t] = n) : void 0);
  }
  var p,
    m = !1;
  (a ? ([p, m] = kt(() => e[t])) : (p = e[t]),
    p === void 0 && r !== void 0 && ((p = u()), d && (i && je(t), d(p))));
  var h = i
    ? () => {
        var n = e[t];
        return n === void 0 ? u() : ((l = !0), n);
      }
    : () => {
        var n = e[t];
        return (n !== void 0 && (c = void 0), n === void 0 ? c : n);
      };
  if (i && !(n & 4)) return h;
  if (d) {
    var g = e.$$legacy;
    return function (e, t) {
      return arguments.length > 0 ? ((!i || !t || g || m) && d(t ? h() : e), e) : h();
    };
  }
  var _ = !1,
    v = (n & 1 ? an : cn)(() => ((_ = !1), h()));
  a && Z(v);
  var y = G;
  return function (e, t) {
    if (arguments.length > 0) {
      let n = t ? Z(v) : i && a ? On(e) : e;
      return (I(v, n), (_ = !0), c !== void 0 && (c = n), e);
    }
    return (Dr && _) || y.f & 16384 ? v.v : Z(v);
  };
}
function io(e) {
  return class extends ao {
    constructor(t) {
      super({ component: e, ...t });
    }
  };
}
var ao = class {
  #e;
  #t;
  constructor(e) {
    var t = new Map(),
      n = (e, n) => {
        var r = xn(n, !1, !1);
        return (t.set(e, r), r);
      };
    let r = new Proxy(
      { ...(e.props || {}), $$events: {} },
      {
        get(e, r) {
          return Z(t.get(r) ?? n(r, Reflect.get(e, r)));
        },
        has(e, r) {
          return r === pe ? !0 : (Z(t.get(r) ?? n(r, Reflect.get(e, r))), Reflect.has(e, r));
        },
        set(e, r, i) {
          return (I(t.get(r) ?? n(r, i), i), Reflect.set(e, r, i));
        },
      },
    );
    ((this.#t = (e.hydrate ? Di : Ei)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: r,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover,
      transformError: e.transformError,
    })),
      !k && (!e?.props?.$$host || e.sync === !1) && zt(),
      (this.#e = r.$$events));
    for (let e of Object.keys(this.#t))
      e === `$set` ||
        e === `$destroy` ||
        e === `$on` ||
        a(this, e, {
          get() {
            return this.#t[e];
          },
          set(t) {
            this.#t[e] = t;
          },
          enumerable: !0,
        });
    ((this.#t.$set = (e) => {
      Object.assign(r, e);
    }),
      (this.#t.$destroy = () => {
        ji(this.#t);
      }));
  }
  $set(e) {
    this.#t.$set(e);
  }
  $on(e, t) {
    this.#e[e] = this.#e[e] || [];
    let n = (...e) => t.call(this, ...e);
    return (
      this.#e[e].push(n),
      () => {
        this.#e[e] = this.#e[e].filter((e) => e !== n);
      }
    );
  }
  $destroy() {
    this.#t.$destroy();
  }
};
function oo(e, t) {
  if ((k || _e(`hydratable`), w)) {
    let t = window.__svelte?.h;
    if (t?.has(e)) return t.get(e);
    Ve(e);
  }
  return t();
}
var so = e({
  afterUpdate: () => ho,
  beforeUpdate: () => mo,
  createContext: () => tt,
  createEventDispatcher: () => po,
  createRawSnippet: () => Ki,
  flushSync: () => zt,
  fork: () => Yt,
  getAbortSignal: () => co,
  getAllContexts: () => at,
  getContext: () => nt,
  hasContext: () => it,
  hydratable: () => oo,
  hydrate: () => Di,
  mount: () => Ei,
  onDestroy: () => uo,
  onMount: () => lo,
  setContext: () => rt,
  settled: () => Wr,
  tick: () => Ur,
  unmount: () => ji,
  untrack: () => Q,
});
function co() {
  return (U === null && Oe(), (U.ac ??= new AbortController()).signal);
}
function lo(e) {
  (A === null && ve(`onMount`),
    Qe && A.l !== null
      ? go(A).m.push(e)
      : er(() => {
          let t = Q(e);
          if (typeof t == `function`) return t;
        }));
}
function uo(e) {
  (A === null && ve(`onDestroy`), lo(() => () => Q(e)));
}
function fo(e, t, { bubbles: n = !1, cancelable: r = !1 } = {}) {
  return new CustomEvent(e, { detail: t, bubbles: n, cancelable: r });
}
function po() {
  let e = A;
  return (
    e === null && ve(`createEventDispatcher`),
    (n, r, i) => {
      let a = e.s.$$events?.[n];
      if (a) {
        let o = t(a) ? a.slice() : [a],
          s = fo(n, r, i);
        for (let t of o) t.call(e.x, s);
        return !s.defaultPrevented;
      }
      return !0;
    }
  );
}
function mo(e) {
  (A === null && ve(`beforeUpdate`), A.l === null && Ae(`beforeUpdate`), go(A).b.push(e));
}
function ho(e) {
  (A === null && ve(`afterUpdate`), A.l === null && Ae(`afterUpdate`), go(A).a.push(e));
}
function go(e) {
  var t = e.l;
  return (t.u ??= { a: [], b: [], m: [] });
}
export {
  lr as $,
  qi as A,
  yi as B,
  _a as C,
  $e as Ct,
  aa as D,
  ca as E,
  _ as Et,
  Ni as F,
  Wr as G,
  li as H,
  Ti as I,
  Tr as J,
  Ur as K,
  Si as L,
  Wi as M,
  Ri as N,
  ia as O,
  Pi as P,
  or as Q,
  xi as R,
  va as S,
  rt as St,
  la as T,
  Ge as Tt,
  qr as U,
  bi as V,
  Z as W,
  ir as X,
  ur as Y,
  ar as Z,
  Aa as _,
  Ct as _t,
  eo as a,
  Ln as at,
  ba as b,
  st as bt,
  Qa as c,
  xn as ct,
  Ja as d,
  bn as dt,
  er as et,
  qa as f,
  Tn as ft,
  Fa as g,
  Dt as gt,
  za as h,
  Ot as ht,
  io as i,
  jn as it,
  Gi as j,
  na as k,
  Xa as l,
  Sn as lt,
  Va as m,
  sn as mt,
  uo as n,
  Gn as nt,
  ro as o,
  Rn as ot,
  Ha as p,
  cn as pt,
  Q as q,
  lo as r,
  Mn as rt,
  no as s,
  zn as st,
  so as t,
  nr as tt,
  Ya as u,
  I as ut,
  Na as v,
  St as vt,
  ha as w,
  Ke as wt,
  ya as x,
  ot as xt,
  ja as y,
  nt as yt,
  _i as z,
};
