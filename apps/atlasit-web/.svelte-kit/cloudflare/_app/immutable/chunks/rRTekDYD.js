import {
  h as v,
  G as g,
  av as y,
  aw as h,
  aj as b,
  M as x,
  F as C,
  ax as l,
  ao as k,
  am as a,
  ay as w,
  az as m,
  Y as S,
  aA as d,
  k as A,
  u as f,
  aB as j,
  aC as D,
  aD as E,
  aE as M,
  aF as z,
  aG as F,
  t as G,
} from "./DLjC2_M2.js";
import { h as O, m as P, u as U } from "./39A_Ntu8.js";
function $(e) {
  return (t, ...s) => {
    var u;
    var o = e(...s),
      n;
    if (v) ((n = x), g());
    else {
      var c = o.render().trim(),
        i = y(c);
      ((n = C(i)), t.before(n));
    }
    const r = (u = o.setup) == null ? void 0 : u.call(o, n);
    (h(n, n), typeof r == "function" && b(r));
  };
}
function B() {
  var e;
  return (
    m === null && w(),
    ((e = m).ac ?? (e.ac = new AbortController())).signal
  );
}
function p(e) {
  (a === null && l(),
    A && a.l !== null
      ? _(a).m.push(e)
      : k(() => {
          const t = f(e);
          if (typeof t == "function") return t;
        }));
}
function R(e) {
  (a === null && l(), p(() => () => f(e)));
}
function T(e, t, { bubbles: s = !1, cancelable: o = !1 } = {}) {
  return new CustomEvent(e, { detail: t, bubbles: s, cancelable: o });
}
function Y() {
  const e = a;
  return (
    e === null && l(),
    (t, s, o) => {
      var c;
      const n = (c = e.s.$$events) == null ? void 0 : c[t];
      if (n) {
        const i = S(n) ? n.slice() : [n],
          r = T(t, s, o);
        for (const u of i) u.call(e.x, r);
        return !r.defaultPrevented;
      }
      return !0;
    }
  );
}
function q(e) {
  (a === null && l(), a.l === null && d(), _(a).b.push(e));
}
function H(e) {
  (a === null && l(), a.l === null && d(), _(a).a.push(e));
}
function _(e) {
  var t = e.l;
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
const K = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      afterUpdate: H,
      beforeUpdate: q,
      createEventDispatcher: Y,
      createRawSnippet: $,
      flushSync: j,
      getAbortSignal: B,
      getAllContexts: D,
      getContext: E,
      hasContext: M,
      hydrate: O,
      mount: P,
      onDestroy: R,
      onMount: p,
      setContext: z,
      settled: F,
      tick: G,
      unmount: U,
      untrack: f,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
export { R as a, p as o, K as s };
//# sourceMappingURL=rRTekDYD.js.map
