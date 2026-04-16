import {
  $ as e,
  D as t,
  Et as n,
  F as r,
  H as i,
  I as a,
  L as o,
  N as s,
  P as c,
  Q as l,
  R as u,
  Tt as d,
  U as f,
  V as p,
  W as m,
  X as h,
  Z as g,
  _,
  a as v,
  at as y,
  b,
  bt as x,
  ct as S,
  h as C,
  j as w,
  l as T,
  mt as E,
  nt as ee,
  ot as D,
  pt as O,
  q as k,
  r as A,
  rt as j,
  s as M,
  st as N,
  u as te,
  ut as P,
  w as ne,
  wt as F,
  xt as I,
  z as L,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as R } from "../chunks/D4lFFHu4.js";
import { t as z } from "../chunks/_6xtu--D.js";
import { t as re } from "../chunks/CMgwAYwY.js";
import { t as ie } from "../chunks/GTPgCmsy.js";
import { t as ae } from "../chunks/Cnig6hXc.js";
import { t as oe } from "../chunks/Dg5qJDVh.js";
import { t as se } from "../chunks/KeBPUFmG.js";
import { t as ce } from "../chunks/FF_0sOmu.js";
import { t as le } from "../chunks/Cyprtw_22.js";
import { t as ue } from "../chunks/CMGwYO6i2.js";
import { t as de } from "../chunks/B0pEiESM2.js";
import { n as B, t as V } from "../chunks/BEJa09Kq2.js";
import { t as fe } from "../chunks/Da7GIpgR2.js";
import { t as pe } from "../chunks/B2LjsFjQ2.js";
import { t as H } from "../chunks/Cue2Cs472.js";
import { t as U } from "../chunks/DmQt9wwK2.js";
import { t as me } from "../chunks/oRaErrij2.js";
function he(e, t) {
  let n = v(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`circle`, { cx: `12`, cy: `12`, r: `10` }],
      [`path`, { d: `M12 16v-4` }],
      [`path`, { d: `M12 8h.01` }],
    ];
  z(
    e,
    M({ name: `info` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = u();
        (w(D(r), t, `default`, {}, null), o(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var ge = L(`<!> New Attestation`, 1),
  _e = L(
    `<div class="flex items-center gap-3"><!> <div><div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Controls Attested</div></div></div>`,
  ),
  ve = L(
    `<div class="flex items-center gap-3"><!> <div><div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Pending Attestation</div></div></div>`,
  ),
  ye = L(
    `<div class="flex items-center gap-3"><!> <div><div class="text-2xl font-bold"> </div> <div class="text-xs text-muted-foreground">Expiring in 30 days</div></div></div>`,
  ),
  be = L(`<div class="grid gap-4 md:grid-cols-3"><!> <!> <!></div>`),
  xe = L(
    `<div class="flex items-center justify-between"><!> <button class="text-muted-foreground hover:text-foreground"><!></button></div>`,
  ),
  Se = L(`<option> </option>`),
  Ce = L(`<p class="text-xs text-muted-foreground mt-1"> </p>`),
  we = L(`<li class="text-xs text-muted-foreground list-disc"> </li>`),
  Te = L(
    `<div class="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3"><div class="flex items-start gap-2"><!> <div><h4 class="text-sm font-semibold text-primary">Evidence Recommendations</h4> <p class="text-xs text-muted-foreground mt-0.5"> </p></div></div> <div><div class="flex items-center gap-1.5 mb-1.5"><!> <span class="text-xs font-semibold">Recommended documents</span></div> <ul class="space-y-1 ml-5"></ul></div> <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs"><div><span class="font-semibold">Accepted formats:</span> <span class="text-muted-foreground"> </span></div></div> <div class="flex items-start gap-1.5 bg-background/60 rounded-md px-3 py-2"><!> <p class="text-xs text-muted-foreground"> </p></div></div>`,
  ),
  Ee = L(
    `<div><label class="text-sm font-medium block mb-1.5"><!></label> <input type="number" min="0" class="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"/></div>`,
  ),
  De = L(
    `<form class="space-y-4"><div><label class="text-sm font-medium block mb-1.5">Control</label> <div class="relative"><select class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none"><option>Select a control to attest...</option><!></select> <!></div> <!></div> <!> <div><label class="text-sm font-medium block mb-1.5">Evidence Summary</label> <textarea rows="3" placeholder="Describe the evidence supporting this attestation (e.g., board meeting minutes from March 2026 confirm oversight of information security program...)" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"></textarea></div> <!> <div><label class="text-sm font-medium block mb-1.5">Expires (optional)</label> <input type="date" class="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"/> <p class="text-xs text-muted-foreground mt-1">Leave blank for no expiry. Expired attestations are flagged for renewal.</p></div> <div class="flex gap-2 pt-2"><!> <!></div></form>`,
  ),
  Oe = L(`<!> <!>`, 1),
  ke = L(`<button> </button>`),
  Ae = L(`<div class="flex gap-2"><button>All</button> <!></div>`),
  je = L(`<div class="space-y-3"></div>`),
  Me = L(`<!> Create First Attestation`, 1),
  Ne = L(`<!> <p class="text-sm text-muted-foreground"> </p> <!>`, 1),
  Pe = L(`<!> `, 1),
  Fe = L(`<span> </span>`),
  Ie = L(
    `<div class="flex items-start justify-between gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><!> <span class="font-mono text-sm font-medium"> </span> <!> <!></div> <p class="text-sm text-muted-foreground line-clamp-2"> </p> <div class="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground"><span> </span> <span> </span> <!></div></div> <!></div>`,
  ),
  Le = L(`<div class="space-y-2"></div>`),
  Re = L(`<!> `, 1),
  ze = L(
    `<div class="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"><!> <span> </span></div>`,
  ),
  Be = L(
    `<div class="bg-muted/30 rounded-lg px-4 py-3"><div class="flex items-center justify-between"><div><div class="flex items-center gap-2"><!> <span class="font-mono text-sm"> </span></div> <p class="text-xs text-muted-foreground mt-0.5"> </p></div> <!></div> <!></div>`,
  ),
  Ve = L(`<div class="space-y-2"></div>`),
  He = L(`<!> <!>`, 1),
  Ue = L(
    `<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Control Attestations</h1> <p class="text-sm text-muted-foreground mt-1">Provide manual evidence for governance controls that can't be auto-detected</p></div> <!></div> <!> <!> <!> <!> <!></div>`,
  );
function We(v, w) {
  I(w, !1);
  let M = S(),
    L = S(),
    z = S(),
    We = S(),
    Ge = S(),
    Ke = S(),
    W = S(),
    qe = S(),
    G = S(!0),
    K = S([]),
    q = S({}),
    J = S(`all`),
    Y = S(!1),
    X = S(!1),
    Z = S(``),
    Q = S(``),
    Je = S(``),
    $ = S(null);
  async function Ye() {
    try {
      let e = await fetch(`/api/tenant-compliance/attestations?status=all`);
      if (!e.ok) throw Error(`Failed to load attestations`);
      let t = await e.json();
      (P(K, t.attestations || []), P(q, t.availableControls || {}));
    } catch (e) {
      R({ variant: `error`, message: e.message });
    } finally {
      P(G, !1);
    }
  }
  async function Xe() {
    if (!(!m(Z) || !m(Q).trim())) {
      P(X, !0);
      try {
        let e = {};
        m($) !== null && (e.value = m($));
        let t = await fetch(`/api/tenant-compliance/attestations`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({
            controlId: m(Z),
            evidenceSummary: m(Q).trim(),
            expiresAt: m(Je) || void 0,
            metadata: e,
          }),
        });
        if (!t.ok) {
          let e = await t.json();
          throw Error(e.error || `Failed to save`);
        }
        (R({ variant: `success`, message: `Attestation saved and evidence recorded` }),
          Qe(),
          await Ye());
      } catch (e) {
        R({ variant: `error`, message: e.message });
      } finally {
        P(X, !1);
      }
    }
  }
  async function Ze(e) {
    try {
      if (!(await fetch(`/api/tenant-compliance/attestations?id=${e}`, { method: `DELETE` })).ok)
        throw Error(`Failed to revoke`);
      (R({ variant: `success`, message: `Attestation revoked` }), await Ye());
    } catch (e) {
      R({ variant: `error`, message: e.message });
    }
  }
  function Qe() {
    (P(Y, !1), P(Z, ``), P(Q, ``), P(Je, ``), P($, null));
  }
  function $e(e) {
    return e === `active`
      ? `bg-emerald-500/10 text-emerald-500 border-emerald-500/20`
      : e === `expired`
        ? `bg-amber-500/10 text-amber-500 border-amber-500/20`
        : `bg-red-500/10 text-red-500 border-red-500/20`;
  }
  function et(e) {
    let t = new Date(e),
      n = Date.now() - t.getTime(),
      r = Math.floor(n / (1e3 * 60 * 60 * 24));
    return r === 0
      ? `Today`
      : r === 1
        ? `Yesterday`
        : r < 30
          ? `${r}d ago`
          : t.toLocaleDateString();
  }
  (A(Ye),
    g(
      () => (m(J), m(K)),
      () => {
        P(M, m(J) === `all` ? m(K) : m(K).filter((e) => e.framework === m(J)));
      },
    ),
    g(
      () => m(q),
      () => {
        P(L, [...new Set(Object.values(m(q)).map((e) => e.framework))]);
      },
    ),
    g(
      () => (m(q), m(K)),
      () => {
        P(
          z,
          Object.entries(m(q)).filter(
            ([e]) => !m(K).some((t) => t.controlId === e && t.status === `active`),
          ),
        );
      },
    ),
    g(
      () => m(K),
      () => {
        P(We, m(K).filter((e) => e.status === `active`).length);
      },
    ),
    g(
      () => m(q),
      () => {
        P(Ge, Object.keys(m(q)).length);
      },
    ),
    g(
      () => m(K),
      () => {
        P(
          Ke,
          m(K).filter((e) => {
            if (!e.expiresAt || e.status !== `active`) return !1;
            let t = new Date(e.expiresAt).getTime() - Date.now();
            return t > 0 && t < 720 * 60 * 60 * 1e3;
          }),
        );
      },
    ),
    g(
      () => (m(Z), m(q)),
      () => {
        P(W, m(Z) ? m(q)[m(Z)] : null);
      },
    ),
    g(
      () => m(W),
      () => {
        P(
          qe,
          m(W)?.key === `unmitigated_high_risks` ||
            m(W)?.cdtFields?.some((e) => e.includes(`days_since`)),
        );
      },
    ),
    l(),
    T());
  var tt = Ue();
  t(`l68eve`, (e) => {
    h(() => {
      j.title = `Attestations — Compliance — AtlasIT`;
    });
  });
  var nt = y(tt);
  (H(N(y(nt), 2), {
    get disabled() {
      return m(Y);
    },
    $$events: { click: () => P(Y, !0) },
    children: (e, t) => {
      var n = ge();
      (ce(D(n), { class: `h-4 w-4 mr-2` }), F(), o(e, n));
    },
    $$slots: { default: !0 },
  }),
    d(nt));
  var rt = N(nt, 2),
    it = (t) => {
      var n = be(),
        r = y(n);
      B(r, {
        children: (t, n) => {
          V(t, {
            class: `pt-5`,
            children: (t, n) => {
              var r = _e(),
                i = y(r);
              le(i, { class: `h-5 w-5 text-emerald-500` });
              var s = N(i, 2),
                c = y(s),
                l = y(c);
              (d(c), F(2), d(s), d(r), e(() => a(l, `${m(We) ?? ``}/${m(Ge) ?? ``}`)), o(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var i = N(r, 2);
      (B(i, {
        children: (t, n) => {
          V(t, {
            class: `pt-5`,
            children: (t, n) => {
              var r = ve(),
                i = y(r);
              ae(i, { class: `h-5 w-5 text-blue-500` });
              var s = N(i, 2),
                c = y(s),
                l = y(c, !0);
              (d(c), F(2), d(s), d(r), e(() => a(l, (m(z), k(() => m(z).length)))), o(t, r));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        B(N(i, 2), {
          children: (t, n) => {
            V(t, {
              class: `pt-5`,
              children: (t, n) => {
                var r = ye(),
                  i = y(r);
                ie(i, { class: `h-5 w-5 text-amber-500` });
                var s = N(i, 2),
                  c = y(s),
                  l = y(c, !0);
                (d(c), F(2), d(s), d(r), e(() => a(l, (m(Ke), k(() => m(Ke).length)))), o(t, r));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        d(n),
        o(t, n));
    };
  r(rt, (e) => {
    m(G) || e(it);
  });
  var at = N(rt, 2),
    ot = (t) => {
      B(t, {
        children: (t, l) => {
          var u = Oe(),
            h = D(u);
          (fe(h, {
            children: (e, t) => {
              var n = xe(),
                r = y(n);
              pe(r, {
                class: `text-base`,
                children: (e, t) => {
                  (F(), o(e, p(`New Attestation`)));
                },
                $$slots: { default: !0 },
              });
              var a = N(r, 2);
              (de(y(a), { class: `h-4 w-4` }), d(a), d(n), i(`click`, a, Qe), o(e, n));
            },
            $$slots: { default: !0 },
          }),
            V(N(h, 2), {
              children: (t, l) => {
                var u = De(),
                  h = y(u),
                  g = N(y(h), 2),
                  v = y(g),
                  x = y(v);
                ((x.value = x.__value = ``),
                  s(
                    N(x),
                    1,
                    () => (m(q), k(() => Object.entries(m(q)))),
                    c,
                    (t, r) => {
                      var i = E(() => n(m(r), 2));
                      let s = () => m(i)[0],
                        c = () => m(i)[1];
                      var l = Se(),
                        u = y(l);
                      d(l);
                      var f = {};
                      (e(() => {
                        (a(u, `${s() ?? ``} — ${(c(), k(() => c().description)) ?? ``}`),
                          f !== (f = s()) && (l.value = (l.__value = s()) ?? ``));
                      }),
                        o(t, l));
                    },
                  ),
                  d(v),
                  re(N(v, 2), {
                    class: `absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none`,
                  }),
                  d(g));
                var S = N(g, 2),
                  w = (t) => {
                    var n = Ce(),
                      r = y(n);
                    (d(n),
                      e(
                        (e) =>
                          a(
                            r,
                            `Framework: ${(m(W), k(() => m(W).framework)) ?? ``} | Fields: ${e ?? ``}`,
                          ),
                        [() => (m(W), k(() => m(W).cdtFields.join(`, `)))],
                      ),
                      o(t, n));
                  };
                (r(S, (e) => {
                  m(W) && e(w);
                }),
                  d(h));
                var T = N(h, 2),
                  D = (t) => {
                    let n = O(() => (m(W), k(() => m(W).evidenceGuidance)));
                    var r = Te(),
                      i = y(r),
                      l = y(i);
                    se(l, { class: `h-4 w-4 text-primary mt-0.5 shrink-0` });
                    var u = N(l, 2),
                      p = N(y(u), 2),
                      h = y(p, !0);
                    (d(p), d(u), d(i));
                    var g = N(i, 2),
                      _ = y(g);
                    (oe(y(_), { class: `h-3.5 w-3.5 text-muted-foreground` }), F(2), d(_));
                    var v = N(_, 2);
                    (s(
                      v,
                      5,
                      () => (f(m(n)), k(() => m(n).recommendedDocuments)),
                      c,
                      (t, n) => {
                        var r = we(),
                          i = y(r, !0);
                        (d(r), e(() => a(i, m(n))), o(t, r));
                      },
                    ),
                      d(v),
                      d(g));
                    var b = N(g, 2),
                      x = y(b),
                      S = N(y(x), 2),
                      C = y(S, !0);
                    (d(S), d(x), d(b));
                    var w = N(b, 2),
                      T = y(w);
                    he(T, { class: `h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0` });
                    var E = N(T, 2),
                      ee = y(E, !0);
                    (d(E),
                      d(w),
                      d(r),
                      e(
                        (e) => {
                          (a(h, (f(m(n)), k(() => m(n).summary))),
                            a(C, e),
                            a(ee, (f(m(n)), k(() => m(n).tips))));
                        },
                        [() => (f(m(n)), k(() => m(n).acceptableFormats.join(`, `)))],
                      ),
                      o(t, r));
                  };
                r(T, (e) => {
                  (m(W), k(() => m(W)?.evidenceGuidance) && e(D));
                });
                var A = N(T, 2),
                  j = N(y(A), 2);
                (ee(j), d(A));
                var M = N(A, 2),
                  ne = (e) => {
                    var t = Ee(),
                      n = y(t),
                      i = y(n),
                      a = (e) => {
                        o(e, p(`Number of Unmitigated High Risks`));
                      },
                      s = (e) => {
                        o(e, p(`Days Since Last Test`));
                      };
                    (r(i, (e) => {
                      (m(W), k(() => m(W)?.key === `unmitigated_high_risks`) ? e(a) : e(s, -1));
                    }),
                      d(n));
                    var c = N(n, 2);
                    (_(c),
                      d(t),
                      C(
                        c,
                        () => m($),
                        (e) => P($, e),
                      ),
                      o(e, t));
                  };
                r(M, (e) => {
                  m(qe) && e(ne);
                });
                var I = N(M, 2),
                  L = N(y(I), 2);
                (_(L), F(2), d(I));
                var R = N(I, 2),
                  z = y(R);
                {
                  let t = O(() => (m(X), m(Z), m(Q), k(() => m(X) || !m(Z) || m(Q).length < 10)));
                  H(z, {
                    type: `submit`,
                    get disabled() {
                      return m(t);
                    },
                    children: (t, n) => {
                      F();
                      var r = p();
                      (e(() => a(r, m(X) ? `Saving...` : `Save Attestation`)), o(t, r));
                    },
                    $$slots: { default: !0 },
                  });
                }
                (H(N(z, 2), {
                  variant: `outline`,
                  type: `button`,
                  $$events: { click: Qe },
                  children: (e, t) => {
                    (F(), o(e, p(`Cancel`)));
                  },
                  $$slots: { default: !0 },
                }),
                  d(R),
                  d(u),
                  b(
                    v,
                    () => m(Z),
                    (e) => P(Z, e),
                  ),
                  C(
                    j,
                    () => m(Q),
                    (e) => P(Q, e),
                  ),
                  C(
                    L,
                    () => m(Je),
                    (e) => P(Je, e),
                  ),
                  i(`submit`, u, te(Xe)),
                  o(t, u));
              },
              $$slots: { default: !0 },
            }),
            o(t, u));
        },
        $$slots: { default: !0 },
      });
    };
  r(at, (e) => {
    m(Y) && e(ot);
  });
  var st = N(at, 2),
    ct = (t) => {
      var n = Ae(),
        r = y(n);
      (s(
        N(r, 2),
        1,
        () => m(L),
        c,
        (t, n) => {
          var r = ke(),
            s = y(r, !0);
          (d(r),
            e(() => {
              (ne(
                r,
                1,
                `text-xs px-3 py-1 rounded-full border transition-colors ${m(J) === m(n) ? `bg-primary text-primary-foreground border-primary` : `border-border hover:bg-muted`}`,
              ),
                a(s, m(n)));
            }),
            i(`click`, r, () => P(J, m(n))),
            o(t, r));
        },
      ),
        d(n),
        e(() =>
          ne(
            r,
            1,
            `text-xs px-3 py-1 rounded-full border transition-colors ${m(J) === `all` ? `bg-primary text-primary-foreground border-primary` : `border-border hover:bg-muted`}`,
          ),
        ),
        i(`click`, r, () => P(J, `all`)),
        o(t, n));
    };
  r(st, (e) => {
    (m(G), m(K), k(() => !m(G) && m(K).length > 0) && e(ct));
  });
  var lt = N(st, 2),
    ut = (e) => {
      var t = je();
      (s(
        t,
        4,
        () => [, , , , ,],
        c,
        (e, t) => {
          me(e, { class: `h-16 w-full` });
        },
      ),
        d(t),
        o(e, t));
    },
    dt = (t) => {
      B(t, {
        children: (t, n) => {
          V(t, {
            class: `py-12 text-center`,
            children: (t, n) => {
              var i = Ne(),
                s = D(i);
              le(s, { class: `h-10 w-10 text-muted-foreground mx-auto mb-3` });
              var c = N(s, 2),
                l = y(c, !0);
              d(c);
              var u = N(c, 2),
                f = (e) => {
                  H(e, {
                    class: `mt-4`,
                    variant: `outline`,
                    $$events: { click: () => P(Y, !0) },
                    children: (e, t) => {
                      var n = Me();
                      (ce(D(n), { class: `h-4 w-4 mr-2` }), F(), o(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                };
              (r(u, (e) => {
                (m(K), k(() => m(K).length === 0) && e(f));
              }),
                e(() =>
                  a(
                    l,
                    (m(K),
                    k(() =>
                      m(K).length === 0
                        ? `No attestations yet. Create one to provide evidence for governance controls.`
                        : `No attestations match the current filter.`,
                    )),
                  ),
                ),
                o(t, i));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    ft = (t) => {
      var n = Le();
      (s(
        n,
        5,
        () => m(M),
        c,
        (t, n) => {
          B(t, {
            children: (t, i) => {
              V(t, {
                class: `py-4`,
                children: (t, i) => {
                  var s = Ie(),
                    c = y(s),
                    l = y(c),
                    f = y(l);
                  U(f, {
                    variant: `outline`,
                    class: `text-[10px]`,
                    children: (t, r) => {
                      F();
                      var i = p();
                      (e(() => a(i, (m(n), k(() => m(n).framework)))), o(t, i));
                    },
                    $$slots: { default: !0 },
                  });
                  var h = N(f, 2),
                    g = y(h, !0);
                  d(h);
                  var _ = N(h, 2);
                  {
                    let t = O(() => (m(n), k(() => $e(m(n).status))));
                    U(_, {
                      get class() {
                        return `text-[10px] ${m(t) ?? ``}`;
                      },
                      children: (t, r) => {
                        F();
                        var i = p();
                        (e(() => a(i, (m(n), k(() => m(n).status)))), o(t, i));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  var v = N(_, 2),
                    b = (t) => {
                      let i = O(
                        () => (
                          m(n),
                          k(() =>
                            Math.ceil(
                              (new Date(m(n).expiresAt).getTime() - Date.now()) /
                                (1e3 * 60 * 60 * 24),
                            ),
                          )
                        ),
                      );
                      var s = u(),
                        c = D(s),
                        l = (t) => {
                          U(t, {
                            class: `text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20`,
                            children: (t, n) => {
                              var r = Pe(),
                                s = D(r);
                              ue(s, { class: `h-3 w-3 mr-1` });
                              var c = N(s);
                              (e(() => a(c, ` Expires in ${m(i) ?? ``}d`)), o(t, r));
                            },
                            $$slots: { default: !0 },
                          });
                        };
                      (r(c, (e) => {
                        m(i) > 0 && m(i) <= 30 && e(l);
                      }),
                        o(t, s));
                    };
                  (r(v, (e) => {
                    (m(n), k(() => m(n).expiresAt) && e(b));
                  }),
                    d(l));
                  var x = N(l, 2),
                    S = y(x, !0);
                  d(x);
                  var C = N(x, 2),
                    w = y(C),
                    T = y(w);
                  d(w);
                  var E = N(w, 2),
                    ee = y(E, !0);
                  d(E);
                  var A = N(E, 2),
                    j = (t) => {
                      var r = Fe(),
                        i = y(r);
                      (d(r),
                        e(
                          (e) => a(i, `Expires ${e ?? ``}`),
                          [() => (m(n), k(() => new Date(m(n).expiresAt).toLocaleDateString()))],
                        ),
                        o(t, r));
                    };
                  (r(A, (e) => {
                    (m(n), k(() => m(n).expiresAt) && e(j));
                  }),
                    d(C),
                    d(c));
                  var M = N(c, 2),
                    te = (e) => {
                      H(e, {
                        variant: `ghost`,
                        size: `sm`,
                        class: `text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0`,
                        $$events: { click: () => Ze(m(n).id) },
                        children: (e, t) => {
                          (F(), o(e, p(`Revoke`)));
                        },
                        $$slots: { default: !0 },
                      });
                    };
                  (r(M, (e) => {
                    (m(n), k(() => m(n).status === `active`) && e(te));
                  }),
                    d(s),
                    e(
                      (e) => {
                        (a(g, (m(n), k(() => m(n).controlId))),
                          a(S, (m(n), k(() => m(n).evidenceSummary))),
                          a(T, `By ${(m(n), k(() => m(n).attestedBy)) ?? ``}`),
                          a(ee, e));
                      },
                      [() => (m(n), k(() => et(m(n).updatedAt)))],
                    ),
                    o(t, s));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        },
      ),
        d(n),
        o(t, n));
    };
  r(lt, (e) => {
    m(G) ? e(ut) : (m(M), k(() => m(M).length === 0) ? e(dt, 1) : e(ft, -1));
  });
  var pt = N(lt, 2),
    mt = (t) => {
      B(t, {
        children: (t, i) => {
          var l = He(),
            u = D(l);
          (fe(u, {
            children: (t, n) => {
              pe(t, {
                class: `text-base flex items-center gap-2`,
                children: (t, n) => {
                  var r = Re(),
                    i = D(r);
                  ue(i, { class: `h-4 w-4 text-amber-500` });
                  var s = N(i);
                  (e(() =>
                    a(s, ` Controls Pending Attestation (${(m(z), k(() => m(z).length)) ?? ``})`),
                  ),
                    o(t, r));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            V(N(u, 2), {
              children: (t, i) => {
                var l = Ve();
                (s(
                  l,
                  5,
                  () => m(z),
                  c,
                  (t, i) => {
                    var s = E(() => n(m(i), 2));
                    let c = () => m(s)[0],
                      l = () => m(s)[1];
                    var u = Be(),
                      f = y(u),
                      h = y(f),
                      g = y(h),
                      _ = y(g);
                    U(_, {
                      variant: `outline`,
                      class: `text-[10px]`,
                      children: (t, n) => {
                        F();
                        var r = p();
                        (e(() => a(r, (l(), k(() => l().framework)))), o(t, r));
                      },
                      $$slots: { default: !0 },
                    });
                    var v = N(_, 2),
                      b = y(v, !0);
                    (d(v), d(g));
                    var x = N(g, 2),
                      S = y(x, !0);
                    (d(x),
                      d(h),
                      H(N(h, 2), {
                        variant: `outline`,
                        size: `sm`,
                        $$events: {
                          click: () => {
                            (P(Z, c()), P(Y, !0));
                          },
                        },
                        children: (e, t) => {
                          (F(), o(e, p(`Attest`)));
                        },
                        $$slots: { default: !0 },
                      }),
                      d(f));
                    var C = N(f, 2),
                      w = (t) => {
                        var n = ze(),
                          r = y(n);
                        se(r, { class: `h-3 w-3 mt-0.5 shrink-0 text-primary/60` });
                        var i = N(r, 2),
                          s = y(i);
                        (d(i),
                          d(n),
                          e(
                            (e) =>
                              a(
                                s,
                                `Evidence needed: ${e ?? ``}${(l(), k(() => (l().evidenceGuidance.recommendedDocuments.length > 2 ? `, +${l().evidenceGuidance.recommendedDocuments.length - 2} more` : ``))) ?? ``}`,
                              ),
                            [
                              () => (
                                l(),
                                k(() =>
                                  l().evidenceGuidance.recommendedDocuments.slice(0, 2).join(`, `),
                                )
                              ),
                            ],
                          ),
                          o(t, n));
                      };
                    (r(C, (e) => {
                      (l(), k(() => l().evidenceGuidance) && e(w));
                    }),
                      d(u),
                      e(() => {
                        (a(b, c()), a(S, (l(), k(() => l().description))));
                      }),
                      o(t, u));
                  },
                ),
                  d(l),
                  o(t, l));
              },
              $$slots: { default: !0 },
            }),
            o(t, l));
        },
        $$slots: { default: !0 },
      });
    };
  (r(pt, (e) => {
    (m(G), m(z), k(() => !m(G) && m(z).length > 0) && e(mt));
  }),
    d(tt),
    o(v, tt),
    x());
}
export { We as component };
