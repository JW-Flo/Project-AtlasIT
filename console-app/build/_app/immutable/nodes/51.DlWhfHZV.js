import {
  $ as e,
  D as t,
  F as n,
  H as r,
  I as i,
  L as a,
  Q as o,
  R as s,
  Tt as c,
  V as l,
  W as u,
  X as d,
  Z as f,
  a as p,
  at as m,
  b as ee,
  bt as h,
  ct as g,
  h as te,
  j as _,
  l as v,
  nt as ne,
  ot as y,
  pt as b,
  r as x,
  rt as S,
  s as C,
  st as w,
  ut as T,
  w as E,
  wt as D,
  xt as O,
  z as k,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as A } from "../chunks/_6xtu--D.js";
import { t as j } from "../chunks/Bbgqa3ML.js";
import { t as M } from "../chunks/B05d0eRK.js";
import { t as N } from "../chunks/GTPgCmsy.js";
import { t as P } from "../chunks/Dg5qJDVh.js";
import { t as F } from "../chunks/CFrMXjnD.js";
import { t as I } from "../chunks/B8frm5cY.js";
import { t as re } from "../chunks/C3V46i3A2.js";
import { n as L, t as R } from "../chunks/BEJa09Kq2.js";
import { t as z } from "../chunks/Cue2Cs472.js";
import { t as ie } from "../chunks/C8W1vu9i2.js";
import { t as B } from "../chunks/ejJaicvO2.js";
function ae(e, t) {
  let n = p(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`rect`, { width: `20`, height: `14`, x: `2`, y: `3`, rx: `2` }],
      [`line`, { x1: `8`, x2: `16`, y1: `21`, y2: `21` }],
      [`line`, { x1: `12`, x2: `12`, y1: `17`, y2: `21` }],
    ];
  A(
    e,
    C({ name: `monitor` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = s();
        (_(y(r), t, `default`, {}, null), a(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var oe = k(
    `<meta name="description" content="Get help with AtlasIT — AI-powered IT management for SMBs. Documentation, status, and direct support channels."/>`,
  ),
  se = k(
    `<div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 shrink-0"><!></div> <h3 class="text-base font-semibold tracking-tight mb-1.5">Documentation</h3> <p class="text-sm text-muted-foreground leading-relaxed flex-1">Setup guides, API reference, connector configuration, and workflow authoring for the AtlasIT platform.</p> <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">Browse docs <!></div>`,
    1,
  ),
  ce = k(
    `<div class="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mb-5 shrink-0"><!></div> <h3 class="text-base font-semibold tracking-tight mb-1.5">Integration guides</h3> <p class="text-sm text-muted-foreground leading-relaxed flex-1">Step-by-step setup for Okta, Google Workspace, Slack, AWS, and other supported connectors.</p> <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">View integrations <!></div>`,
    1,
  ),
  le = k(
    `<div class="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center mb-5 shrink-0"><!></div> <h3 class="text-base font-semibold tracking-tight mb-1.5">System status</h3> <p class="text-sm text-muted-foreground leading-relaxed flex-1">Real-time availability for the AtlasIT control plane, connectors, and workflow execution engine.</p> <div class="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">Check status <!></div>`,
    1,
  ),
  ue = k(
    `<div class="flex flex-col items-center justify-center h-full text-center py-8"><div class="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center mb-4"><!></div> <h3 class="text-base font-semibold mb-2">Message sent</h3> <p class="text-sm text-muted-foreground mb-6">We'll get back to you at <strong> </strong> within our normal response window.</p> <!></div>`,
  ),
  de = k(`<p class="text-sm text-destructive"> </p>`),
  fe = k(`Send message <!>`, 1),
  pe = k(
    `<form class="flex flex-col gap-4"><div class="grid grid-cols-2 gap-3"><div class="flex flex-col gap-1.5"><!> <!></div> <div class="flex flex-col gap-1.5"><!> <!></div></div> <div class="flex flex-col gap-1.5"><!> <select id="category" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><option>General inquiry</option><option>Integration setup</option><option>Account &amp; billing</option><option>Incident / outage</option><option>Security concern</option><option>Feature request</option></select></div> <div class="flex flex-col gap-1.5"><!> <textarea id="message" placeholder="Describe your issue or question…" rows="5" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"></textarea></div> <!> <div><!></div></form>`,
  ),
  me = k(
    `<div class="grid grid-cols-1 md:grid-cols-2"><div class="p-10 border-b md:border-b-0 md:border-r"><h2 class="text-xl font-bold tracking-tight mb-3">Contact support</h2> <p class="text-sm text-muted-foreground mb-8 leading-relaxed">For account issues, integration troubleshooting, or anything the docs don't cover — reach us directly.</p> <div class="space-y-5"><div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><!></div> <div><div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Email</div> <a href="mailto:support@atlasit.pro" class="text-sm text-foreground hover:text-primary transition-colors no-underline">support@atlasit.pro</a></div></div> <div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><!></div> <div><div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Response time</div> <span class="text-sm text-foreground">Business-critical: &lt; 4 hours &middot; General: &lt; 24 hours</span></div></div> <div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><!></div> <div><div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Hours</div> <span class="text-sm text-foreground">Mon–Fri, 8 AM – 8 PM CT</span></div></div></div></div> <div class="p-10"><!></div></div>`,
  ),
  he = k(
    `<div class="min-h-dvh bg-background text-foreground flex flex-col"><nav class="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md"><div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between"><a href="https://atlasit.pro" class="flex items-center gap-2.5 no-underline text-foreground hover:opacity-80 transition-opacity"><div class="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0"><span class="text-primary-foreground font-bold text-sm">A</span></div> <span class="font-semibold text-base tracking-tight">AtlasIT</span></a> <ul class="flex items-center gap-6 list-none m-0 p-0"><li><a href="https://docs.atlasit.pro" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline">Docs</a></li> <li><a href="/support" aria-current="page" class="text-sm font-medium text-foreground no-underline">Support</a></li> <li><a href="https://status.atlasit.pro" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline">Status</a></li> <li><!></li></ul></div></nav> <section class="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center w-full"><h1 class="text-4xl font-bold tracking-tight leading-tight">How can we help?</h1> <p class="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">Documentation, system status, and direct access to the AtlasIT team.</p></section> <div class="max-w-5xl mx-auto px-6 pb-10 w-full"><div><span></span> <span> </span> <a href="https://status.atlasit.pro" class="ml-auto text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity no-underline text-inherit">View status page <!></a></div></div> <div class="max-w-5xl mx-auto px-6 pb-16 w-full"><div class="grid grid-cols-1 sm:grid-cols-3 gap-5"><a href="https://docs.atlasit.pro" class="no-underline text-inherit group"><!></a> <a href="https://docs.atlasit.pro/integrations" class="no-underline text-inherit group"><!></a> <a href="https://status.atlasit.pro" class="no-underline text-inherit group"><!></a></div></div> <section class="max-w-5xl mx-auto px-6 pb-20 w-full"><!></section> <footer class="mt-auto border-t py-6 px-6 text-center text-xs text-muted-foreground">&copy; 2026 AtlasIT &middot; <a href="/privacy" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Privacy</a> &middot; <a href="/privacy/dsar" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Data requests</a> &middot; <a href="/terms" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Terms</a> &middot; <a href="https://status.atlasit.pro" class="text-muted-foreground hover:text-foreground transition-colors no-underline">Status</a></footer></div>`,
  );
function V(p, _) {
  O(_, !1);
  let C = g(),
    k = g(),
    A = g(`loading`),
    V = g(`Checking system status…`),
    H = g(``),
    U = g(``),
    W = g(`general`),
    G = g(``),
    K = g(`idle`),
    q = g(``);
  x(async () => {
    try {
      let e = await fetch(`/api/health`);
      if (e.ok) {
        let t = await e.json();
        if (t.ok) (T(A, `operational`), T(V, `All systems operational`));
        else {
          T(A, `degraded`);
          let e = Object.entries(t.services ?? {})
            .filter(([, e]) => !e.ok)
            .map(([e]) => e)
            .join(`, `);
          T(V, e ? `Degraded performance — ${e}` : `Some services are degraded`);
        }
      } else (T(A, `outage`), T(V, `Unable to reach services`));
    } catch {
      (T(A, `outage`), T(V, `Status unavailable`));
    }
  });
  async function ge(e) {
    if ((e.preventDefault(), u(K) !== `submitting`)) {
      (T(K, `submitting`), T(q, ``));
      try {
        let e = await fetch(`/api/support`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ name: u(H), email: u(U), category: u(W), message: u(G) }),
        });
        e.ok
          ? (T(K, `success`), T(H, ``), T(U, ``), T(W, `general`), T(G, ``))
          : (T(
              q,
              (await e.json().catch(() => ({}))).error ||
                `Failed to send message. Please try again.`,
            ),
            T(K, `error`));
      } catch {
        (T(q, `Network error. Please check your connection and try again.`), T(K, `error`));
      }
    }
  }
  function _e() {
    (T(K, `idle`), T(q, ``));
  }
  (f(
    () => u(A),
    () => {
      T(
        C,
        {
          loading: `bg-muted/50 border-border text-muted-foreground`,
          operational: `bg-success/10 border-success/30 text-success`,
          degraded: `bg-warning/10 border-warning/30 text-warning-foreground`,
          outage: `bg-destructive/10 border-destructive/30 text-destructive`,
        }[u(A)],
      );
    },
  ),
    f(
      () => u(A),
      () => {
        T(
          k,
          {
            loading: `bg-muted-foreground animate-pulse`,
            operational: `bg-success animate-pulse`,
            degraded: `bg-warning animate-pulse`,
            outage: `bg-destructive`,
          }[u(A)],
        );
      },
    ),
    o(),
    v());
  var J = he();
  t(`1j5tn20`, (e) => {
    var t = oe();
    (d(() => {
      S.title = `Support — AtlasIT`;
    }),
      a(e, t));
  });
  var Y = m(J),
    ve = m(Y),
    ye = w(m(ve), 2),
    be = w(m(ye), 6);
  (z(m(be), {
    href: `/console/login`,
    size: `sm`,
    children: (e, t) => {
      (D(), a(e, l(`Console Login`)));
    },
    $$slots: { default: !0 },
  }),
    c(be),
    c(ye),
    c(ve),
    c(Y));
  var X = w(Y, 4),
    Z = m(X),
    xe = m(Z),
    Q = w(xe, 2),
    Se = m(Q, !0);
  c(Q);
  var Ce = w(Q, 2);
  (M(w(m(Ce)), { class: `inline h-3 w-3 ml-0.5` }), c(Ce), c(Z), c(X));
  var $ = w(X, 2),
    we = m($),
    Te = m(we);
  (L(m(Te), {
    class: `h-full transition-colors hover:border-primary/40 cursor-pointer`,
    children: (e, t) => {
      R(e, {
        class: `pt-7 pb-6 px-7 flex flex-col h-full`,
        children: (e, t) => {
          var n = se(),
            r = y(n);
          (P(m(r), { class: `h-5 w-5 text-primary` }), c(r));
          var i = w(r, 6);
          (M(w(m(i)), { class: `h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5` }),
            c(i),
            a(e, n));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  }),
    c(Te));
  var Ee = w(Te, 2);
  (L(m(Ee), {
    class: `h-full transition-colors hover:border-primary/40 cursor-pointer`,
    children: (e, t) => {
      R(e, {
        class: `pt-7 pb-6 px-7 flex flex-col h-full`,
        children: (e, t) => {
          var n = ce(),
            r = y(n);
          (I(m(r), { class: `h-5 w-5 text-success` }), c(r));
          var i = w(r, 6);
          (M(w(m(i)), { class: `h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5` }),
            c(i),
            a(e, n));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  }),
    c(Ee));
  var De = w(Ee, 2);
  (L(m(De), {
    class: `h-full transition-colors hover:border-primary/40 cursor-pointer`,
    children: (e, t) => {
      R(e, {
        class: `pt-7 pb-6 px-7 flex flex-col h-full`,
        children: (e, t) => {
          var n = le(),
            r = y(n);
          (j(m(r), { class: `h-5 w-5 text-warning-foreground` }), c(r));
          var i = w(r, 6);
          (M(w(m(i)), { class: `h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5` }),
            c(i),
            a(e, n));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  }),
    c(De),
    c(we),
    c($));
  var Oe = w($, 2);
  (L(m(Oe), {
    children: (t, o) => {
      R(t, {
        class: `p-0`,
        children: (t, o) => {
          var d = me(),
            f = m(d),
            p = w(m(f), 4),
            h = m(p),
            g = m(h);
          (F(m(g), { class: `h-3.5 w-3.5 text-primary` }), c(g), D(2), c(h));
          var _ = w(h, 2),
            v = m(_);
          (N(m(v), { class: `h-3.5 w-3.5 text-primary` }), c(v), D(2), c(_));
          var x = w(_, 2),
            S = m(x);
          (ae(m(S), { class: `h-3.5 w-3.5 text-primary` }), c(S), D(2), c(x), c(p), c(f));
          var C = w(f, 2),
            E = m(C),
            O = (t) => {
              var n = ue(),
                r = m(n);
              (re(m(r), { class: `h-5 w-5 text-success` }), c(r));
              var o = w(r, 4),
                s = w(m(o)),
                d = m(s, !0);
              (c(s),
                D(),
                c(o),
                z(w(o, 2), {
                  variant: `outline`,
                  size: `sm`,
                  $$events: { click: _e },
                  children: (e, t) => {
                    (D(), a(e, l(`Send another`)));
                  },
                  $$slots: { default: !0 },
                }),
                c(n),
                e(() => i(d, u(U) || `your email`)),
                a(t, n));
            },
            k = (t) => {
              var o = pe(),
                d = m(o),
                f = m(d),
                p = m(f);
              B(p, {
                htmlFor: `name`,
                children: (e, t) => {
                  (D(), a(e, l(`Name`)));
                },
                $$slots: { default: !0 },
              });
              var h = w(p, 2);
              {
                let e = b(() => u(K) === `submitting`);
                ie(h, {
                  id: `name`,
                  type: `text`,
                  placeholder: `Your name`,
                  get disabled() {
                    return u(e);
                  },
                  get value() {
                    return u(H);
                  },
                  set value(e) {
                    T(H, e);
                  },
                  $$legacy: !0,
                });
              }
              c(f);
              var g = w(f, 2),
                _ = m(g);
              B(_, {
                htmlFor: `email`,
                children: (e, t) => {
                  (D(), a(e, l(`Email`)));
                },
                $$slots: { default: !0 },
              });
              var v = w(_, 2);
              {
                let e = b(() => u(K) === `submitting`);
                ie(v, {
                  id: `email`,
                  type: `email`,
                  placeholder: `you@company.com`,
                  get disabled() {
                    return u(e);
                  },
                  get value() {
                    return u(U);
                  },
                  set value(e) {
                    T(U, e);
                  },
                  $$legacy: !0,
                });
              }
              (c(g), c(d));
              var x = w(d, 2),
                S = m(x);
              B(S, {
                htmlFor: `category`,
                children: (e, t) => {
                  (D(), a(e, l(`Category`)));
                },
                $$slots: { default: !0 },
              });
              var C = w(S, 2),
                E = m(C);
              E.value = E.__value = `general`;
              var O = w(E);
              O.value = O.__value = `integration`;
              var k = w(O);
              k.value = k.__value = `account`;
              var A = w(k);
              A.value = A.__value = `incident`;
              var j = w(A);
              j.value = j.__value = `security`;
              var M = w(j);
              ((M.value = M.__value = `feature`), c(C), c(x));
              var N = w(x, 2),
                P = m(N);
              B(P, {
                htmlFor: `message`,
                children: (e, t) => {
                  (D(), a(e, l(`Message`)));
                },
                $$slots: { default: !0 },
              });
              var F = w(P, 2);
              (ne(F), c(N));
              var I = w(N, 2),
                L = (t) => {
                  var n = de(),
                    r = m(n, !0);
                  (c(n), e(() => i(r, u(q))), a(t, n));
                };
              n(I, (e) => {
                u(K) === `error` && u(q) && e(L);
              });
              var R = w(I, 2),
                ae = m(R);
              {
                let e = b(() => u(K) === `submitting`);
                z(ae, {
                  type: `submit`,
                  get disabled() {
                    return u(e);
                  },
                  class: `gap-1.5`,
                  children: (e, t) => {
                    var r = s(),
                      i = y(r),
                      o = (e) => {
                        a(e, l(`Sending…`));
                      },
                      c = (e) => {
                        var t = fe();
                        (re(w(y(t)), { class: `h-3.5 w-3.5` }), a(e, t));
                      };
                    (n(i, (e) => {
                      u(K) === `submitting` ? e(o) : e(c, -1);
                    }),
                      a(e, r));
                  },
                  $$slots: { default: !0 },
                });
              }
              (c(R),
                c(o),
                e(() => {
                  ((C.disabled = u(K) === `submitting`), (F.disabled = u(K) === `submitting`));
                }),
                ee(
                  C,
                  () => u(W),
                  (e) => T(W, e),
                ),
                te(
                  F,
                  () => u(G),
                  (e) => T(G, e),
                ),
                r(`submit`, o, ge),
                a(t, o));
            };
          (n(E, (e) => {
            u(K) === `success` ? e(O) : e(k, -1);
          }),
            c(C),
            c(d),
            a(t, d));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  }),
    c(Oe),
    D(2),
    c(J),
    e(() => {
      (E(
        Z,
        1,
        `rounded-xl border px-5 py-3.5 flex items-center gap-3 text-sm font-medium ${u(C) ?? ``}`,
      ),
        E(xe, 1, `w-2 h-2 rounded-full shrink-0 ${u(k) ?? ``}`),
        i(Se, u(V)));
    }),
    a(p, J),
    h());
}
export { V as component };
