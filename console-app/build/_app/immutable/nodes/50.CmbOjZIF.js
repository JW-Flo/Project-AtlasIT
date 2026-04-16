import {
  $ as e,
  D as t,
  F as n,
  H as r,
  I as i,
  L as a,
  N as o,
  P as s,
  R as c,
  Tt as l,
  V as u,
  W as d,
  X as f,
  _ as p,
  at as m,
  bt as h,
  ct as g,
  h as _,
  l as v,
  m as ee,
  nt as te,
  ot as y,
  pt as b,
  rt as x,
  st as S,
  ut as C,
  w as ne,
  wt as w,
  xt as T,
  z as E,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as D } from "../chunks/BZ8YNDoC.js";
import { t as re } from "../chunks/C3V46i3A2.js";
import { t as O } from "../chunks/Cyprtw_22.js";
import { n as k, t as A } from "../chunks/BEJa09Kq2.js";
import { t as ie } from "../chunks/Cue2Cs472.js";
import { t as j } from "../chunks/C8W1vu9i2.js";
import { t as M } from "../chunks/ejJaicvO2.js";
var N = E(
    `<meta name="description" content="Submit a data subject access request (DSAR) to exercise your privacy rights under GDPR, CCPA, and other regulations."/>`,
  ),
  P = E(
    `<p class="text-sm text-muted-foreground mb-1">Your reference number:</p> <p class="text-lg font-mono font-semibold text-primary mb-4"> </p>`,
    1,
  ),
  F = E(
    `<div class="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5"><!></div> <h2 class="text-xl font-bold mb-2">Request submitted</h2> <!> <p class="text-sm text-muted-foreground max-w-md mx-auto">We've received your privacy request and will respond to <strong> </strong> within 30 days.
            Please save your reference number for tracking purposes.</p>`,
    1,
  ),
  I = E(
    `<label><input type="radio" name="requestType" class="mt-0.5"/> <div><div class="text-sm font-medium"> </div> <div class="text-xs text-muted-foreground mt-0.5"> </div></div></label>`,
  ),
  L = E(`<p class="text-sm text-destructive"> </p>`),
  R = E(`Submit request <!>`, 1),
  ae = E(
    `<form class="space-y-6"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="flex flex-col gap-1.5"><!> <!></div> <div class="flex flex-col gap-1.5"><!> <!></div></div> <div class="flex flex-col gap-1.5"><!> <!></div> <div class="flex flex-col gap-2"><!> <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"></div></div> <div class="flex flex-col gap-1.5"><!> <textarea id="dsar-details" placeholder="Provide any additional context that may help us process your request..." rows="4" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]"></textarea></div> <!> <div class="flex items-center justify-between pt-2"><p class="text-xs text-muted-foreground max-w-sm">We verify your identity before processing requests. You may be asked to provide additional verification.</p> <!></div></form>`,
  ),
  z =
    E(`<div class="min-h-screen bg-background text-foreground"><div class="max-w-3xl mx-auto px-4 py-12"><a href="/privacy" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"><!> Privacy Policy</a> <div class="flex items-center gap-3 mb-2"><div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><!></div> <h1 class="text-3xl font-bold">Data Privacy Request</h1></div> <p class="text-sm text-muted-foreground mb-10 ml-[52px]">Exercise your data privacy rights under GDPR, CCPA, and other applicable regulations.
      We will respond within 30 days of receiving your request.</p> <!> <div class="mt-10 space-y-6 text-sm text-muted-foreground"><div><h3 class="font-semibold text-foreground mb-1">What happens next?</h3> <ol class="list-decimal pl-5 space-y-1"><li>We acknowledge your request within 3 business days</li> <li>We verify your identity to protect your privacy</li> <li>We process your request and respond within 30 days</li> <li>If we need more time, we'll notify you of the extension (up to 60 additional days)</li></ol></div> <div><h3 class="font-semibold text-foreground mb-1">Your rights</h3> <p>Under GDPR, CCPA, and similar regulations, you have the right to access, correct, delete, restrict, port, and object to the processing of your personal data. For more information, see our <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>.</p></div> <p>You can also contact us directly at <a href="mailto:privacy@atlasit.pro" class="text-primary hover:underline">privacy@atlasit.pro</a>.</p></div></div></div>`);
function B(E, B) {
  T(B, !1);
  let oe = [],
    V = g(``),
    H = g(``),
    U = g(``),
    W = g(`access`),
    G = g(``),
    K = g(`idle`),
    q = g(``),
    J = g(``),
    se = [
      {
        value: `access`,
        label: `Access my personal data`,
        desc: `Receive a copy of all personal data we hold about you`,
      },
      {
        value: `deletion`,
        label: `Delete my personal data`,
        desc: `Request permanent deletion of your data from our systems`,
      },
      {
        value: `correction`,
        label: `Correct inaccurate data`,
        desc: `Update or correct personal information we hold`,
      },
      {
        value: `portability`,
        label: `Export / transfer my data`,
        desc: `Receive your data in a portable, machine-readable format`,
      },
      {
        value: `restriction`,
        label: `Restrict processing`,
        desc: `Limit how we process your personal data`,
      },
      {
        value: `objection`,
        label: `Object to processing`,
        desc: `Object to specific types of data processing`,
      },
    ];
  async function ce(e) {
    if ((e.preventDefault(), d(K) !== `submitting`)) {
      (C(K, `submitting`), C(q, ``));
      try {
        let e = await fetch(`/api/privacy/dsar`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({
            name: d(V),
            email: d(H),
            organization: d(U),
            requestType: d(W),
            details: d(G),
          }),
        });
        e.ok
          ? (C(J, (await e.json()).refId || ``), C(K, `success`))
          : (C(
              q,
              (await e.json().catch(() => ({}))).error ||
                `Failed to submit request. Please try again.`,
            ),
            C(K, `error`));
      } catch {
        (C(q, `Network error. Please check your connection and try again.`), C(K, `error`));
      }
    }
  }
  v();
  var Y = z();
  t(`i89avc`, (e) => {
    var t = N();
    (f(() => {
      x.title = `Data Privacy Request — AtlasIT`;
    }),
      a(e, t));
  });
  var X = m(Y),
    Z = m(X);
  (D(m(Z), { class: `h-4 w-4` }), w(), l(Z));
  var Q = S(Z, 2),
    $ = m(Q);
  (O(m($), { class: `h-5 w-5 text-primary` }), l($), w(2), l(Q));
  var le = S(Q, 4),
    ue = (t) => {
      k(t, {
        children: (t, r) => {
          A(t, {
            class: `py-12 text-center`,
            children: (t, r) => {
              var o = F(),
                s = y(o);
              (O(m(s), { class: `h-7 w-7 text-success` }), l(s));
              var c = S(s, 4),
                u = (t) => {
                  var n = P(),
                    r = S(y(n), 2),
                    o = m(r, !0);
                  (l(r), e(() => i(o, d(J))), a(t, n));
                };
              n(c, (e) => {
                d(J) && e(u);
              });
              var f = S(c, 2),
                p = S(m(f)),
                h = m(p, !0);
              (l(p), w(), l(f), e(() => i(h, d(H))), a(t, o));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    de = (t) => {
      k(t, {
        children: (t, f) => {
          A(t, {
            class: `p-8`,
            children: (t, f) => {
              var h = ae(),
                g = m(h),
                v = m(g),
                x = m(v);
              M(x, {
                htmlFor: `dsar-name`,
                children: (e, t) => {
                  (w(), a(e, u(`Full name *`)));
                },
                $$slots: { default: !0 },
              });
              var T = S(x, 2);
              {
                let e = b(() => d(K) === `submitting`);
                j(T, {
                  id: `dsar-name`,
                  type: `text`,
                  placeholder: `Your legal name`,
                  get disabled() {
                    return d(e);
                  },
                  required: !0,
                  get value() {
                    return d(V);
                  },
                  set value(e) {
                    C(V, e);
                  },
                  $$legacy: !0,
                });
              }
              l(v);
              var E = S(v, 2),
                D = m(E);
              M(D, {
                htmlFor: `dsar-email`,
                children: (e, t) => {
                  (w(), a(e, u(`Email address *`)));
                },
                $$slots: { default: !0 },
              });
              var O = S(D, 2);
              {
                let e = b(() => d(K) === `submitting`);
                j(O, {
                  id: `dsar-email`,
                  type: `email`,
                  placeholder: `you@example.com`,
                  get disabled() {
                    return d(e);
                  },
                  required: !0,
                  get value() {
                    return d(H);
                  },
                  set value(e) {
                    C(H, e);
                  },
                  $$legacy: !0,
                });
              }
              (l(E), l(g));
              var k = S(g, 2),
                A = m(k);
              M(A, {
                htmlFor: `dsar-org`,
                children: (e, t) => {
                  (w(), a(e, u(`Organization (optional)`)));
                },
                $$slots: { default: !0 },
              });
              var N = S(A, 2);
              {
                let e = b(() => d(K) === `submitting`);
                j(N, {
                  id: `dsar-org`,
                  type: `text`,
                  placeholder: `Company or tenant name`,
                  get disabled() {
                    return d(e);
                  },
                  get value() {
                    return d(U);
                  },
                  set value(e) {
                    C(U, e);
                  },
                  $$legacy: !0,
                });
              }
              l(k);
              var P = S(k, 2),
                F = m(P);
              M(F, {
                children: (e, t) => {
                  (w(), a(e, u(`Request type *`)));
                },
                $$slots: { default: !0 },
              });
              var z = S(F, 2);
              (o(
                z,
                5,
                () => se,
                s,
                (t, n) => {
                  var r = I(),
                    o = m(r);
                  p(o);
                  var s,
                    c = S(o, 2),
                    u = m(c),
                    f = m(u, !0);
                  l(u);
                  var h = S(u, 2),
                    g = m(h, !0);
                  (l(h),
                    l(c),
                    l(r),
                    e(() => {
                      (ne(
                        r,
                        1,
                        `flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${d(W) === d(n).value ? `border-primary bg-primary/5` : `border-border hover:border-muted-foreground/30`}`,
                      ),
                        (o.disabled = d(K) === `submitting`),
                        s !== (s = d(n).value) && (o.value = (o.__value = d(n).value) ?? ``),
                        i(f, d(n).label),
                        i(g, d(n).desc));
                    }),
                    ee(
                      oe,
                      [],
                      o,
                      () => (d(n).value, d(W)),
                      (e) => C(W, e),
                    ),
                    a(t, r));
                },
              ),
                l(z),
                l(P));
              var B = S(P, 2),
                J = m(B);
              M(J, {
                htmlFor: `dsar-details`,
                children: (e, t) => {
                  (w(), a(e, u(`Additional details (optional)`)));
                },
                $$slots: { default: !0 },
              });
              var Y = S(J, 2);
              (te(Y), l(B));
              var X = S(B, 2),
                Z = (t) => {
                  var n = L(),
                    r = m(n, !0);
                  (l(n), e(() => i(r, d(q))), a(t, n));
                };
              n(X, (e) => {
                d(K) === `error` && d(q) && e(Z);
              });
              var Q = S(X, 2),
                $ = S(m(Q), 2);
              {
                let e = b(() => d(K) === `submitting`);
                ie($, {
                  type: `submit`,
                  get disabled() {
                    return d(e);
                  },
                  class: `gap-1.5`,
                  children: (e, t) => {
                    var r = c(),
                      i = y(r),
                      o = (e) => {
                        a(e, u(`Submitting...`));
                      },
                      s = (e) => {
                        var t = R();
                        (re(S(y(t)), { class: `h-3.5 w-3.5` }), a(e, t));
                      };
                    (n(i, (e) => {
                      d(K) === `submitting` ? e(o) : e(s, -1);
                    }),
                      a(e, r));
                  },
                  $$slots: { default: !0 },
                });
              }
              (l(Q),
                l(h),
                e(() => (Y.disabled = d(K) === `submitting`)),
                _(
                  Y,
                  () => d(G),
                  (e) => C(G, e),
                ),
                r(`submit`, h, ce),
                a(t, h));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (n(le, (e) => {
    d(K) === `success` ? e(ue) : e(de, -1);
  }),
    w(2),
    l(X),
    l(Y),
    a(E, Y),
    h());
}
export { B as component };
