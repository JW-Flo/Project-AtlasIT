import "../chunks/Bzak7iHL.js";
import "../chunks/B37ZqHvF.js";
import { a as ba, o as Ne } from "../chunks/rRTekDYD.js";
import {
  h as ga,
  G as qa,
  i as ka,
  a8 as wa,
  aZ as Ea,
  a_ as Ta,
  aS as Sa,
  u as Ma,
  a$ as xa,
  b0 as Aa,
  b1 as Ia,
  aJ as De,
  b2 as Oa,
  aI as $a,
  al as C,
  aa as W,
  s as R,
  f as N,
  a as x,
  ag as j,
  V as B,
  d as q,
  ai as _,
  ah as g,
  ad as l,
  af as Be,
  at as La,
  ae as Fe,
  ab as Ie,
  ac as Ca,
  n as Oe,
} from "../chunks/DLjC2_M2.js";
import { a as Ra, s as Na, e as Pe } from "../chunks/39A_Ntu8.js";
import { s as c } from "../chunks/Buy6Yj7A.js";
import { i as J } from "../chunks/CLYubSJh.js";
import { s as Da, a as Ba } from "../chunks/BtMAuxYN.js";
import { p as Fa } from "../chunks/Ck49g6Iw.js";
import { i as Ue } from "../chunks/BHVF3NEQ.js";
import { e as Pa } from "../chunks/B36Hb1sH.js";
import { w as Ua } from "../chunks/ApJzsbmA.js";
function Ga(t, e, s, i, v) {
  var a;
  ga && qa();
  var r = (a = e.$$slots) == null ? void 0 : a[s],
    n = !1;
  (r === !0 && ((r = e.children), (n = !0)),
    r === void 0 || r(t, n ? () => i : i));
}
const za = () => performance.now(),
  T = {
    tick: (t) => requestAnimationFrame(t),
    now: () => za(),
    tasks: new Set(),
  };
function Ge() {
  const t = T.now();
  (T.tasks.forEach((e) => {
    e.c(t) || (T.tasks.delete(e), e.f());
  }),
    T.tasks.size !== 0 && T.tick(Ge));
}
function Wa(t) {
  let e;
  return (
    T.tasks.size === 0 && T.tick(Ge),
    {
      promise: new Promise((s) => {
        T.tasks.add((e = { c: t, f: s }));
      }),
      abort() {
        T.tasks.delete(e);
      },
    }
  );
}
function D(t, e) {
  De(() => {
    t.dispatchEvent(new CustomEvent(e));
  });
}
function ja(t) {
  if (t === "float") return "cssFloat";
  if (t === "offset") return "cssOffset";
  if (t.startsWith("--")) return t;
  const e = t.split("-");
  return e.length === 1
    ? e[0]
    : e[0] +
        e
          .slice(1)
          .map((s) => s[0].toUpperCase() + s.slice(1))
          .join("");
}
function $e(t) {
  const e = {},
    s = t.split(";");
  for (const i of s) {
    const [v, r] = i.split(":");
    if (!v || r === void 0) break;
    const n = ja(v.trim());
    e[n] = r.trim();
  }
  return e;
}
const Ja = (t) => t;
function Le(t, e, s, i) {
  var v = (t & Aa) !== 0,
    r = (t & Ia) !== 0,
    n = v && r,
    a = (t & xa) !== 0,
    u = n ? "both" : v ? "in" : "out",
    y,
    h = e.inert,
    k = e.style.overflow,
    o,
    f;
  function w() {
    return De(
      () =>
        y ?? (y = s()(e, (i == null ? void 0 : i()) ?? {}, { direction: u })),
    );
  }
  var d = {
      is_global: a,
      in() {
        var b;
        if (((e.inert = h), !v)) {
          (f == null || f.abort(),
            (b = f == null ? void 0 : f.reset) == null || b.call(f));
          return;
        }
        (r || o == null || o.abort(),
          D(e, "introstart"),
          (o = z(e, w(), f, 1, () => {
            (D(e, "introend"),
              o == null || o.abort(),
              (o = y = void 0),
              (e.style.overflow = k));
          })));
      },
      out(b) {
        if (!r) {
          (b == null || b(), (y = void 0));
          return;
        }
        ((e.inert = !0),
          D(e, "outrostart"),
          (f = z(e, w(), o, 0, () => {
            (D(e, "outroend"), b == null || b());
          })));
      },
      stop: () => {
        (o == null || o.abort(), f == null || f.abort());
      },
    },
    m = ka;
  if (((m.transitions ?? (m.transitions = [])).push(d), v && Ra)) {
    var E = a;
    if (!E) {
      for (var p = m.parent; p && (p.f & wa) !== 0; )
        for (; (p = p.parent) && (p.f & Ea) === 0; );
      E = !p || (p.f & Ta) !== 0;
    }
    E &&
      Sa(() => {
        Ma(() => d.in());
      });
  }
}
function z(t, e, s, i, v) {
  var r = i === 1;
  if (Oa(e)) {
    var n,
      a = !1;
    return (
      $a(() => {
        if (!a) {
          var m = e({ direction: r ? "in" : "out" });
          n = z(t, m, s, i, v);
        }
      }),
      {
        abort: () => {
          ((a = !0), n == null || n.abort());
        },
        deactivate: () => n.deactivate(),
        reset: () => n.reset(),
        t: () => n.t(),
      }
    );
  }
  if ((s == null || s.deactivate(), !(e != null && e.duration)))
    return (v(), { abort: C, deactivate: C, reset: C, t: () => i });
  const { delay: u = 0, css: y, tick: h, easing: k = Ja } = e;
  var o = [];
  if (r && s === void 0 && (h && h(0, 1), y)) {
    var f = $e(y(0, 1));
    o.push(f, f);
  }
  var w = () => 1 - i,
    d = t.animate(o, { duration: u, fill: "forwards" });
  return (
    (d.onfinish = () => {
      d.cancel();
      var m = (s == null ? void 0 : s.t()) ?? 1 - i;
      s == null || s.abort();
      var E = i - m,
        p = e.duration * Math.abs(E),
        b = [];
      if (p > 0) {
        var A = !1;
        if (y)
          for (
            var I = Math.ceil(p / 16.666666666666668), M = 0;
            M <= I;
            M += 1
          ) {
            var O = m + E * k(M / I),
              $ = $e(y(O, 1 - O));
            (b.push($), A || (A = $.overflow === "hidden"));
          }
        (A && (t.style.overflow = "hidden"),
          (w = () => {
            var S = d.currentTime;
            return m + E * k(S / p);
          }),
          h &&
            Wa(() => {
              if (d.playState !== "running") return !1;
              var S = w();
              return (h(S, 1 - S), !0);
            }));
      }
      ((d = t.animate(b, { duration: p, fill: "forwards" })),
        (d.onfinish = () => {
          ((w = () => i), h == null || h(i, 1 - i), v());
        }));
    }),
    {
      abort: () => {
        d && (d.cancel(), (d.effect = null), (d.onfinish = C));
      },
      deactivate: () => {
        v = C;
      },
      reset: () => {
        i === 0 && (h == null || h(1, 0));
      },
      t: () => w(),
    }
  );
}
function Ya() {
  const { subscribe: t, update: e, set: s } = Ua([]);
  function i(n) {
    const a = {
      id: crypto.randomUUID(),
      variant: "info",
      timeout: 4e3,
      dismissible: !0,
      ...n,
    };
    return (
      e((u) => [...u, a]),
      a.timeout && a.timeout > 0 && setTimeout(() => v(a.id), a.timeout),
      a.id
    );
  }
  function v(n) {
    e((a) => a.filter((u) => u.id !== n));
  }
  function r() {
    s([]);
  }
  return { subscribe: t, push: i, dismiss: v, clear: r };
}
const Ce = Ya(),
  Ha = (t) => t;
function Ka(t) {
  const e = t - 1;
  return e * e * e + 1;
}
function Re(t) {
  const e = typeof t == "string" && t.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
  return e ? [parseFloat(e[1]), e[2] || "px"] : [t, "px"];
}
function Va(t, { delay: e = 0, duration: s = 400, easing: i = Ha } = {}) {
  const v = +getComputedStyle(t).opacity;
  return { delay: e, duration: s, easing: i, css: (r) => `opacity: ${r * v}` };
}
function Za(
  t,
  {
    delay: e = 0,
    duration: s = 400,
    easing: i = Ka,
    x: v = 0,
    y: r = 0,
    opacity: n = 0,
  } = {},
) {
  const a = getComputedStyle(t),
    u = +a.opacity,
    y = a.transform === "none" ? "" : a.transform,
    h = u * (1 - n),
    [k, o] = Re(v),
    [f, w] = Re(r);
  return {
    delay: e,
    duration: s,
    easing: i,
    css: (d, m) => `
			transform: ${y} translate(${(1 - d) * k}${o}, ${(1 - d) * f}${w});
			opacity: ${u - h * m}`,
  };
}
var Qa = N(
    '<button class="close svelte-53xc05" aria-label="Dismiss">×</button>',
  ),
  Xa = N('<div role="status"><div class="msg svelte-53xc05"> </div> <!></div>'),
  et = N(
    '<div class="toast-region svelte-53xc05" aria-live="polite" aria-atomic="false"></div>',
  );
function at(t, e) {
  W(e, !1);
  let s = B([]);
  const i = Ce.subscribe((r) => R(s, r));
  (ba(i), J());
  var v = et();
  (Pa(
    v,
    5,
    () => q(s),
    (r) => r.id,
    (r, n) => {
      var a = Xa(),
        u = g(a),
        y = g(u, !0);
      _(u);
      var h = l(u, 2);
      {
        var k = (o) => {
          var f = Qa();
          (Pe("click", f, () => Ce.dismiss(q(n).id)), x(o, f));
        };
        Ue(h, (o) => {
          q(n).dismissible !== !1 && o(k);
        });
      }
      (_(a),
        Be(() => {
          (c(a, 1, `toast ${q(n).variant ?? ""}`, "svelte-53xc05"),
            Na(y, q(n).message));
        }),
        Le(
          1,
          a,
          () => Za,
          () => ({ y: 12, duration: 120 }),
        ),
        Le(
          2,
          a,
          () => Va,
          () => ({ duration: 120 }),
        ),
        x(r, a));
    },
  ),
    _(v),
    x(t, v),
    j());
}
var tt = N(
  '<div class="offline svelte-l46k7l" role="status" aria-live="polite">You are offline. Some data may be stale.</div>',
);
function st(t, e) {
  W(e, !1);
  let s = B(!0);
  function i() {
    R(s, navigator.onLine);
  }
  (Ne(
    () => (
      i(),
      window.addEventListener("online", i),
      window.addEventListener("offline", i),
      () => {
        (window.removeEventListener("online", i),
          window.removeEventListener("offline", i));
      }
    ),
  ),
    J());
  var v = La(),
    r = Fe(v);
  {
    var n = (a) => {
      var u = tt();
      x(a, u);
    };
    Ue(r, (a) => {
      q(s) || a(n);
    });
  }
  (x(t, v), j());
}
var it = N(
  '<header class="shell svelte-12qhfyh"><nav class="nav-bar svelte-12qhfyh"><div class="left svelte-12qhfyh"><a href="/" class="logo svelte-12qhfyh"><span class="badge svelte-12qhfyh">AI</span> <span class="name svelte-12qhfyh">AtlasIT</span></a> <div class="desktop-links svelte-12qhfyh"><a href="/governance/compliance">Dashboard</a> <a href="/onboarding">Onboarding</a> <a href="/marketplace/slack">Marketplace</a> <a href="/orchestrator">Orchestrator</a> <a href="/api-manager">API Manager</a> <a href="/workflows">JML Demo</a> <div class="dd svelte-12qhfyh" data-label="IT"><button class="nav-link dd-btn svelte-12qhfyh">IT <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/it/policies/templates">Policies</a> <a href="/it/backup">Backup & Recovery</a></div></div> <div class="dd svelte-12qhfyh" data-label="Security"><button class="nav-link dd-btn svelte-12qhfyh">Security <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/security/incidents">Security Center</a> <a href="/security/activity">Scanner</a></div></div> <div class="dd svelte-12qhfyh" data-label="Governance"><button class="nav-link dd-btn svelte-12qhfyh">Governance <svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path d="M19 9l-7 7-7-7"></path></svg></button> <div class="dd-menu svelte-12qhfyh"><a href="/governance/compliance">Compliance</a> <a href="/governance/evidence">Evidence</a></div></div></div></div> <div class="right svelte-12qhfyh"><div class="divider svelte-12qhfyh"></div> <a href="/login" class="btn blue svelte-12qhfyh">Login</a> <a href="/register" class="btn purple svelte-12qhfyh">Register</a> <button class="mobile-toggle svelte-12qhfyh" aria-label="Menu"><svg viewBox="0 0 24 24" class="svelte-12qhfyh"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></nav> <div><a href="/governance/compliance">Dashboard</a> <a href="/onboarding">Onboarding</a> <a href="/marketplace/slack">Marketplace</a> <a href="/orchestrator">Orchestrator</a> <a href="/api-manager">API Manager</a> <a href="/it/policies/templates">IT Policies</a> <a href="/it/backup">Backup & Recovery</a> <a href="/security/incidents">Security Center</a> <a href="/security/activity">Scanner</a> <a href="/governance/compliance">Compliance</a> <a href="/governance/evidence">Evidence</a> <div class="mobile-auth svelte-12qhfyh"><a href="/login" class="btn blue block svelte-12qhfyh">Login</a> <a href="/register" class="btn purple block svelte-12qhfyh">Register</a></div></div> <div class="demo-banner svelte-12qhfyh">DEMO MODE · SAMPLE DATA RESETS REGULARLY AND IS NOT PRODUCTION</div></header> <main class="main-container svelte-12qhfyh"><!></main> <!> <!>',
  1,
);
function mt(t, e) {
  W(e, !1);
  const s = () => Ba(Fa, "$page", i),
    [i, v] = Da(),
    r = B();
  let n = B(!1);
  const a = (L) => q(r) === L || (L !== "/" && q(r).startsWith(L + "/"));
  function u() {
    R(n, !q(n));
  }
  (Ne(() => {
    typeof window < "u" &&
      window.addEventListener("resize", () => {
        window.innerWidth > 860 && R(n, !1);
      });
  }),
    Ie(
      () => s(),
      () => {
        R(r, s().url.pathname);
      },
    ),
    Ie(
      () => (q(n), q(r)),
      () => {
        q(n) && q(r);
      },
    ),
    Ca(),
    J());
  var y = it(),
    h = Fe(y),
    k = g(h),
    o = g(k),
    f = l(g(o), 2),
    w = g(f);
  let d;
  var m = l(w, 2);
  let E;
  var p = l(m, 2);
  let b;
  var A = l(p, 2);
  let I;
  var M = l(A, 2);
  let O;
  var $ = l(M, 2);
  let S;
  var F = l($, 2),
    Y = l(g(F), 2),
    H = g(Y);
  let K;
  var ze = l(H, 2);
  let V;
  (_(Y), _(F));
  var P = l(F, 2),
    Z = l(g(P), 2),
    Q = g(Z);
  let X;
  var We = l(Q, 2);
  let ee;
  (_(Z), _(P));
  var ae = l(P, 2),
    te = l(g(ae), 2),
    se = g(te);
  let ie;
  var je = l(se, 2);
  let re;
  (_(te), _(ae), _(f), _(o));
  var ne = l(o, 2),
    Je = l(g(ne), 6);
  (_(ne), _(k));
  var U = l(k, 2);
  let le;
  var ve = g(U);
  let oe;
  var ce = l(ve, 2);
  let fe;
  var he = l(ce, 2);
  let de;
  var ue = l(he, 2);
  let _e;
  var ye = l(ue, 2);
  let me;
  var pe = l(ye, 2);
  let be;
  var ge = l(pe, 2);
  let qe;
  var ke = l(ge, 2);
  let we;
  var Ee = l(ke, 2);
  let Te;
  var Se = l(Ee, 2);
  let Me;
  var Ye = l(Se, 2);
  let xe;
  (Oe(2), _(U), Oe(2), _(h));
  var G = l(h, 2),
    He = g(G);
  (Ga(He, e, "default", {}), _(G));
  var Ae = l(G, 2);
  at(Ae, {});
  var Ke = l(Ae, 2);
  (st(Ke, {}),
    Be(
      (
        L,
        Ve,
        Ze,
        Qe,
        Xe,
        ea,
        aa,
        ta,
        sa,
        ia,
        ra,
        na,
        la,
        va,
        oa,
        ca,
        fa,
        ha,
        da,
        ua,
        _a,
        ya,
        ma,
        pa,
      ) => {
        ((d = c(w, 1, "nav-link svelte-12qhfyh", null, d, L)),
          (E = c(m, 1, "nav-link svelte-12qhfyh", null, E, Ve)),
          (b = c(p, 1, "nav-link svelte-12qhfyh", null, b, Ze)),
          (I = c(A, 1, "nav-link svelte-12qhfyh", null, I, Qe)),
          (O = c(M, 1, "nav-link svelte-12qhfyh", null, O, Xe)),
          (S = c($, 1, "nav-link gradient svelte-12qhfyh", null, S, ea)),
          (K = c(H, 1, "svelte-12qhfyh", null, K, aa)),
          (V = c(ze, 1, "svelte-12qhfyh", null, V, ta)),
          (X = c(Q, 1, "svelte-12qhfyh", null, X, sa)),
          (ee = c(We, 1, "svelte-12qhfyh", null, ee, ia)),
          (ie = c(se, 1, "svelte-12qhfyh", null, ie, ra)),
          (re = c(je, 1, "svelte-12qhfyh", null, re, na)),
          (le = c(U, 1, "mobile-menu svelte-12qhfyh", null, le, la)),
          (oe = c(ve, 1, "svelte-12qhfyh", null, oe, va)),
          (fe = c(ce, 1, "svelte-12qhfyh", null, fe, oa)),
          (de = c(he, 1, "svelte-12qhfyh", null, de, ca)),
          (_e = c(ue, 1, "svelte-12qhfyh", null, _e, fa)),
          (me = c(ye, 1, "svelte-12qhfyh", null, me, ha)),
          (be = c(pe, 1, "svelte-12qhfyh", null, be, da)),
          (qe = c(ge, 1, "svelte-12qhfyh", null, qe, ua)),
          (we = c(ke, 1, "svelte-12qhfyh", null, we, _a)),
          (Te = c(Ee, 1, "svelte-12qhfyh", null, Te, ya)),
          (Me = c(Se, 1, "svelte-12qhfyh", null, Me, ma)),
          (xe = c(Ye, 1, "svelte-12qhfyh", null, xe, pa)));
      },
      [
        () => ({ active: a("/governance/compliance") }),
        () => ({ active: a("/onboarding") }),
        () => ({ active: a("/marketplace") }),
        () => ({ active: a("/orchestrator") }),
        () => ({ active: a("/api-manager") }),
        () => ({ active: a("/workflows") }),
        () => ({ active: a("/it/policies/templates") }),
        () => ({ active: a("/it/backup") }),
        () => ({ active: a("/security/incidents") }),
        () => ({ active: a("/security/activity") }),
        () => ({ active: a("/governance/compliance") }),
        () => ({ active: a("/governance/evidence") }),
        () => ({ open: q(n) }),
        () => ({ active: a("/governance/compliance") }),
        () => ({ active: a("/onboarding") }),
        () => ({ active: a("/marketplace") }),
        () => ({ active: a("/orchestrator") }),
        () => ({ active: a("/api-manager") }),
        () => ({ active: a("/it/policies/templates") }),
        () => ({ active: a("/it/backup") }),
        () => ({ active: a("/security/incidents") }),
        () => ({ active: a("/security/activity") }),
        () => ({ active: a("/governance/compliance") }),
        () => ({ active: a("/governance/evidence") }),
      ],
    ),
    Pe("click", Je, u),
    x(t, y),
    j(),
    v());
}
export { mt as component };
//# sourceMappingURL=0.CUWamxcP.js.map
