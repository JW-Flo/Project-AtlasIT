import {
  $ as e,
  F as t,
  I as n,
  J as r,
  L as i,
  N as a,
  P as o,
  Tt as s,
  V as c,
  W as l,
  at as u,
  b as d,
  bt as f,
  ct as p,
  gt as m,
  ht as h,
  l as g,
  lt as _,
  ot as v,
  pt as y,
  r as b,
  st as x,
  ut as S,
  wt as C,
  xt as w,
  z as T,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as E } from "../chunks/CAW9w7U8.js";
import { t as D } from "../chunks/FF_0sOmu.js";
import { t as O } from "../chunks/Cyprtw_22.js";
import { t as k } from "../chunks/CMGwYO6i2.js";
import { t as A } from "../chunks/B0pEiESM2.js";
import { t as j } from "../chunks/BHPTFPdW2.js";
import { r as M } from "../chunks/BdUjKaVy2.js";
import { n as N, t as P } from "../chunks/BEJa09Kq2.js";
import { t as ee } from "../chunks/Da7GIpgR2.js";
import { t as te } from "../chunks/B2LjsFjQ2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as ne } from "../chunks/DmQt9wwK2.js";
import { t as re } from "../chunks/DOfJvt542.js";
import { t as I } from "../chunks/C8W1vu9i2.js";
import { t as L } from "../chunks/ejJaicvO2.js";
import { t as ie } from "../chunks/oRaErrij2.js";
async function R(e, t) {
  let n = await fetch(e, {
    headers: { Accept: `application/json`, "Content-Type": `application/json` },
    ...t,
  });
  if (!n.ok) {
    let e = await n.text().catch(() => ``);
    throw Error(`HTTP ${n.status}: ${e}`);
  }
  return n.json();
}
async function ae(e = {}) {
  let t = new URLSearchParams();
  (e.status && t.set(`status`, e.status),
    e.limit && t.set(`limit`, String(e.limit)),
    e.cursor && t.set(`cursor`, String(e.cursor)));
  let n = t.toString();
  return R(n ? `/api/access-requests?` + n : `/api/access-requests`);
}
async function oe(e) {
  return (await R(`/api/access-requests`, { method: `POST`, body: JSON.stringify(e) })).request;
}
async function se(e, t) {
  return (await R(`/api/access-requests/${e}/${t}`, { method: `POST` })).request;
}
var ce = T(`<option> </option>`),
  le = T(`<option> </option>`),
  ue = T(`<!> `, 1),
  de = T(`<p class="text-xs text-destructive mt-2"> </p>`),
  fe = T(
    `<div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end"><div class="flex flex-col gap-1.5"><!> <!></div> <div class="flex flex-col gap-1.5"><!> <select id="ar-resource" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Select application...</option><!></select></div> <div class="flex flex-col gap-1.5"><!> <!></div> <div class="flex flex-col gap-1.5"><!> <select id="ar-justification" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Select justification...</option><!></select></div> <!></div> <!>`,
    1,
  ),
  pe = T(`<!> <!>`, 1),
  me = T(`<!> <p class="pl-7"> </p>`, 1),
  he = T(`<div class="space-y-3"></div>`),
  ge = T(
    `<!> <p class="text-sm text-muted-foreground">No access requests yet. Create one above.</p>`,
    1,
  ),
  _e = T(`<!> Approve`, 1),
  ve = T(`<!> Deny`, 1),
  ye = T(`<!> <!>`, 1),
  be = T(`<!> Fulfill`, 1),
  xe = T(`<span class="text-muted-foreground">---</span>`),
  Se = T(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 font-medium"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3"><div class="flex gap-2"><!></div></td></tr>`,
  ),
  Ce = T(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">ID</th><th class="px-4 py-3 font-medium">Subject</th><th class="px-4 py-3 font-medium">Resource</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  we = T(`<!> <!>`, 1),
  Te = T(
    `<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Access Requests</h1> <!> <!> <!></div>`,
  );
function z(T, R) {
  w(R, !1);
  let z = () => m(M, `$session`, Ee),
    [Ee, De] = h(),
    B = [
      `Business need`,
      `Temporary access for project`,
      `Compliance requirement`,
      `Incident response`,
      `Role change / promotion`,
      `Other`,
    ],
    V = p([]),
    H = p(!0),
    U = p(null),
    W = p(null),
    G = p({ subjectRef: ``, resource: ``, justification: ``, roleRequested: `` }),
    K = p(!1),
    q = p(``),
    J = p([]);
  async function Y(e = !1) {
    try {
      let t = await ae({ cursor: e ? void 0 : l(W) || void 0, limit: 25 });
      (e ? S(V, t.items) : S(V, [...l(V), ...t.items]), S(W, t.nextCursor ?? null));
    } catch (e) {
      S(U, e?.message || `Failed`);
    } finally {
      S(H, !1);
    }
  }
  async function Oe() {
    try {
      let e = await fetch(`/api/apps/status`);
      e.ok &&
        S(
          J,
          ((await e.json()).applications || []).filter((e) => e.connected),
        );
    } catch {}
  }
  b(() => {
    (z()?.email &&
      (_(G, (l(G).subjectRef = z().email)),
      r(() => {
        l(J);
      })),
      Y(!0),
      Oe());
  });
  async function ke() {
    if ((S(q, ``), !l(G).subjectRef.trim())) {
      S(q, `Subject Ref is required`);
      return;
    }
    if (!l(G).resource.trim()) {
      S(q, `Resource is required`);
      return;
    }
    (S(K, !0), S(U, null));
    try {
      (S(V, [
        await oe({
          subjectRef: l(G).subjectRef.trim(),
          resource: l(G).resource.trim(),
          justification: l(G).justification.trim() || void 0,
          roleRequested: l(G).roleRequested.trim() || void 0,
        }),
        ...l(V),
      ]),
        S(G, { subjectRef: z()?.email || ``, resource: ``, justification: ``, roleRequested: `` }));
    } catch (e) {
      S(U, e?.message || `Create failed`);
    } finally {
      S(K, !1);
    }
  }
  async function X(e, t) {
    let n = l(V).findIndex((t) => t.id === e);
    if (n === -1) return;
    let r = l(V)[n];
    S(
      V,
      l(V).map((n) =>
        n.id === e
          ? { ...n, status: t === `approve` ? `approved` : t === `deny` ? `denied` : `fulfilled` }
          : n,
      ),
    );
    try {
      let n = await se(e, t);
      S(
        V,
        l(V).map((t) => (t.id === e ? n : t)),
      );
    } catch {
      S(
        V,
        l(V).map((t) => (t.id === e ? r : t)),
      );
    }
  }
  function Ae(e) {
    switch (e) {
      case `pending`:
        return `warning`;
      case `approved`:
        return `success`;
      case `denied`:
        return `destructive`;
      case `fulfilled`:
        return `default`;
      default:
        return `outline`;
    }
  }
  g();
  var Z = Te(),
    Q = x(u(Z), 2);
  N(Q, {
    children: (f, p) => {
      var m = pe(),
        h = v(m);
      (ee(h, {
        children: (e, t) => {
          te(e, {
            class: `text-base`,
            children: (e, t) => {
              (C(), i(e, c(`New Access Request`)));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        P(x(h, 2), {
          children: (f, p) => {
            var m = fe(),
              h = v(m),
              g = u(h),
              y = u(g);
            (L(y, {
              htmlFor: `ar-subject`,
              children: (e, t) => {
                (C(), i(e, c(`Subject Ref *`)));
              },
              $$slots: { default: !0 },
            }),
              I(x(y, 2), {
                id: `ar-subject`,
                placeholder: `user@company.com`,
                get value() {
                  return l(G).subjectRef;
                },
                set value(e) {
                  (_(G, (l(G).subjectRef = e)),
                    r(() => {
                      l(J);
                    }));
                },
                $$legacy: !0,
              }),
              s(g));
            var b = x(g, 2),
              S = u(b);
            L(S, {
              htmlFor: `ar-resource`,
              children: (e, t) => {
                (C(), i(e, c(`Application *`)));
              },
              $$slots: { default: !0 },
            });
            var w = x(S, 2),
              T = u(w);
            ((T.value = T.__value = ``),
              a(
                x(T),
                1,
                () => l(J),
                o,
                (t, r) => {
                  var a = ce(),
                    o = u(a, !0);
                  s(a);
                  var c = {};
                  (e(() => {
                    (n(o, l(r).id), c !== (c = l(r).id) && (a.value = (a.__value = l(r).id) ?? ``));
                  }),
                    i(t, a));
                },
              ),
              s(w),
              s(b));
            var E = x(b, 2),
              O = u(E);
            (L(O, {
              htmlFor: `ar-role`,
              children: (e, t) => {
                (C(), i(e, c(`Role Requested`)));
              },
              $$slots: { default: !0 },
            }),
              I(x(O, 2), {
                id: `ar-role`,
                placeholder: `e.g. Admin, Viewer, Editor`,
                get value() {
                  return l(G).roleRequested;
                },
                set value(e) {
                  (_(G, (l(G).roleRequested = e)),
                    r(() => {
                      l(J);
                    }));
                },
                $$legacy: !0,
              }),
              s(E));
            var k = x(E, 2),
              A = u(k);
            L(A, {
              htmlFor: `ar-justification`,
              children: (e, t) => {
                (C(), i(e, c(`Justification`)));
              },
              $$slots: { default: !0 },
            });
            var j = x(A, 2),
              M = u(j);
            ((M.value = M.__value = ``),
              a(
                x(M),
                1,
                () => B,
                o,
                (t, r) => {
                  var a = le(),
                    o = u(a, !0);
                  s(a);
                  var c = {};
                  (e(() => {
                    (n(o, l(r)), c !== (c = l(r)) && (a.value = (a.__value = l(r)) ?? ``));
                  }),
                    i(t, a));
                },
              ),
              s(j),
              s(k),
              F(x(k, 2), {
                get disabled() {
                  return l(K);
                },
                $$events: { click: ke },
                children: (t, r) => {
                  var a = ue(),
                    o = v(a);
                  D(o, { class: `h-4 w-4 mr-1` });
                  var s = x(o);
                  (e(() => n(s, ` ${l(K) ? `Creating...` : `+ Create`}`)), i(t, a));
                },
                $$slots: { default: !0 },
              }),
              s(h));
            var N = x(h, 2),
              P = (t) => {
                var r = de(),
                  a = u(r, !0);
                (s(r), e(() => n(a, l(q))), i(t, r));
              };
            (t(N, (e) => {
              l(q) && e(P);
            }),
              d(
                w,
                () => l(G).resource,
                (e) => (
                  _(G, (l(G).resource = e)),
                  r(() => {
                    l(J);
                  })
                ),
              ),
              d(
                j,
                () => l(G).justification,
                (e) => (
                  _(G, (l(G).justification = e)),
                  r(() => {
                    l(J);
                  })
                ),
              ),
              i(f, m));
          },
          $$slots: { default: !0 },
        }),
        i(f, m));
    },
    $$slots: { default: !0 },
  });
  var $ = x(Q, 2),
    je = (t) => {
      re(t, {
        variant: `destructive`,
        children: (t, r) => {
          var a = me(),
            o = v(a);
          k(o, { class: `h-4 w-4` });
          var c = x(o, 2),
            d = u(c, !0);
          (s(c), e(() => n(d, l(U))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t($, (e) => {
    l(U) && e(je);
  });
  var Me = x($, 2),
    Ne = (e) => {
      var t = he();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          ie(e, { class: `h-12 rounded-lg` });
        },
      ),
        s(t),
        i(e, t));
    },
    Pe = (e) => {
      N(e, {
        class: `border-dashed`,
        children: (e, t) => {
          P(e, {
            class: `py-16 text-center`,
            children: (e, t) => {
              var n = ge();
              (O(v(n), { class: `h-12 w-12 mx-auto mb-4 text-muted-foreground/30` }),
                C(2),
                i(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    Fe = (r) => {
      var d = we(),
        f = v(d);
      N(f, {
        children: (r, d) => {
          P(r, {
            class: `p-0`,
            children: (r, d) => {
              var f = Ce(),
                p = u(f),
                m = x(u(p));
              (a(
                m,
                5,
                () => l(V),
                o,
                (r, a) => {
                  var o = Se(),
                    d = u(o),
                    f = u(d, !0);
                  s(d);
                  var p = x(d),
                    m = u(p, !0);
                  s(p);
                  var h = x(p),
                    g = u(h, !0);
                  s(h);
                  var _ = x(h),
                    b = u(_);
                  {
                    let t = y(() => Ae(l(a).status));
                    ne(b, {
                      get variant() {
                        return l(t);
                      },
                      children: (t, r) => {
                        C();
                        var o = c();
                        (e(() => n(o, l(a).status)), i(t, o));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  s(_);
                  var S = x(_),
                    w = u(S),
                    T = u(w),
                    D = (e) => {
                      var t = ye(),
                        n = v(t);
                      (F(n, {
                        size: `sm`,
                        variant: `success`,
                        $$events: { click: () => X(l(a).id, `approve`) },
                        children: (e, t) => {
                          var n = _e();
                          (E(v(n), { class: `h-3 w-3 mr-1` }), C(), i(e, n));
                        },
                        $$slots: { default: !0 },
                      }),
                        F(x(n, 2), {
                          size: `sm`,
                          variant: `destructive`,
                          $$events: { click: () => X(l(a).id, `deny`) },
                          children: (e, t) => {
                            var n = ve();
                            (A(v(n), { class: `h-3 w-3 mr-1` }), C(), i(e, n));
                          },
                          $$slots: { default: !0 },
                        }),
                        i(e, t));
                    },
                    O = (e) => {
                      F(e, {
                        size: `sm`,
                        $$events: { click: () => X(l(a).id, `fulfill`) },
                        children: (e, t) => {
                          var n = be();
                          (j(v(n), { class: `h-3 w-3 mr-1` }), C(), i(e, n));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    k = (e) => {
                      i(e, xe());
                    };
                  (t(T, (e) => {
                    l(a).status === `pending`
                      ? e(D)
                      : l(a).status === `approved`
                        ? e(O, 1)
                        : e(k, -1);
                  }),
                    s(w),
                    s(S),
                    s(o),
                    e(() => {
                      (n(f, l(a).id), n(m, l(a).subject), n(g, l(a).resource));
                    }),
                    i(r, o));
                },
              ),
                s(m),
                s(p),
                s(f),
                i(r, f));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var p = x(f, 2),
        m = (e) => {
          F(e, {
            variant: `outline`,
            $$events: { click: () => Y(!1) },
            children: (e, t) => {
              (C(), i(e, c(`Load More`)));
            },
            $$slots: { default: !0 },
          });
        };
      (t(p, (e) => {
        l(W) && e(m);
      }),
        i(r, d));
    };
  (t(Me, (e) => {
    l(H) ? e(Ne) : l(V).length === 0 ? e(Pe, 1) : e(Fe, -1);
  }),
    s(Z),
    i(T, Z),
    f(),
    De());
}
export { z as component };
