import {
  $ as e,
  F as t,
  I as n,
  L as r,
  N as i,
  P as a,
  Tt as o,
  V as s,
  W as c,
  at as l,
  b as u,
  bt as d,
  ct as f,
  l as p,
  lt as m,
  ot as h,
  pt as g,
  r as _,
  st as v,
  ut as y,
  wt as b,
  xt as x,
  z as S,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as C } from "../chunks/B8cBQjgm.js";
import { t as w } from "../chunks/FF_0sOmu.js";
import { t as T } from "../chunks/CMGwYO6i2.js";
import { n as E, t as D } from "../chunks/BEJa09Kq2.js";
import { t as O } from "../chunks/Da7GIpgR2.js";
import { t as k } from "../chunks/B2LjsFjQ2.js";
import { t as A } from "../chunks/Cue2Cs472.js";
import { t as j } from "../chunks/DmQt9wwK2.js";
import { t as M } from "../chunks/DOfJvt542.js";
import { t as N } from "../chunks/C8W1vu9i2.js";
import { t as P } from "../chunks/ejJaicvO2.js";
import { t as F } from "../chunks/oRaErrij2.js";
async function I(e, t) {
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
async function L(e = {}) {
  let t = new URLSearchParams();
  (e.status && t.set(`status`, e.status),
    e.severity && t.set(`severity`, e.severity),
    e.limit && t.set(`limit`, String(e.limit)),
    e.cursor && t.set(`cursor`, String(e.cursor)));
  let n = t.toString();
  return I(`/api/incidents${n ? `?${n}` : ``}`);
}
async function ee(e) {
  return (await I(`/api/incidents`, { method: `POST`, body: JSON.stringify(e) })).incident;
}
async function te(e) {
  return (await I(`/api/incidents/${e}/resolve`, { method: `POST` })).incident;
}
var ne = S(`<p class="text-sm text-destructive"> </p>`),
  re = S(`<!> `, 1),
  ie = S(
    `<div class="flex gap-3 flex-wrap items-end"><div class="flex flex-col gap-1.5"><!> <!> <!></div> <div class="flex flex-col gap-1.5"><!> <select id="inc-severity" class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div> <div class="flex flex-col gap-1.5"><!> <!></div> <!></div>`,
  ),
  ae = S(`<!> <!>`, 1),
  oe = S(`<!> <p class="pl-7"> </p>`, 1),
  se = S(`<div class="space-y-3"></div>`),
  ce = S(`<!> <p class="text-sm text-muted-foreground">No incidents recorded</p>`, 1),
  le = S(`<!> Resolve`, 1),
  ue = S(`<span class="text-muted-foreground">---</span>`),
  R = S(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 font-medium"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3"><!></td></tr>`,
  ),
  z = S(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">ID</th><th class="px-4 py-3 font-medium">Title</th><th class="px-4 py-3 font-medium">Severity</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Created</th><th class="px-4 py-3 font-medium">Resolved</th><th class="px-4 py-3 font-medium">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  B = S(`<!> <!>`, 1),
  V = S(
    `<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Incidents</h1> <!> <!> <!></div>`,
  );
function H(S, I) {
  x(I, !1);
  let H = f([]),
    U = f(!0),
    W = f(null),
    G = f(null),
    K = f({ title: ``, severity: `medium`, source: `` }),
    q = f(!1),
    J = f(``);
  async function Y(e = !1) {
    try {
      let t = await L({ cursor: e ? void 0 : c(G) || void 0, limit: 25 });
      (e ? y(H, t.items) : y(H, [...c(H), ...t.items]), y(G, t.nextCursor ?? null));
    } catch (e) {
      y(W, e?.message || `Failed`);
    } finally {
      y(U, !1);
    }
  }
  _(() => {
    Y(!0);
  });
  async function de() {
    if (!c(K).title.trim()) {
      y(J, `Incident title is required`);
      return;
    }
    (y(J, ``), y(q, !0), y(W, null));
    try {
      (y(H, [
        await ee({ title: c(K).title, severity: c(K).severity, source: c(K).source || void 0 }),
        ...c(H),
      ]),
        y(K, { ...c(K), title: ``, source: `` }));
    } catch (e) {
      y(W, e?.message || `Create failed`);
    } finally {
      y(q, !1);
    }
  }
  async function fe(e) {
    let t = c(H).findIndex((t) => t.id === e);
    if (t === -1) return;
    let n = c(H)[t];
    y(
      H,
      c(H).map((t) =>
        t.id === e ? { ...t, status: `resolved`, resolvedAt: new Date().toISOString() } : t,
      ),
    );
    try {
      let t = await te(e);
      y(
        H,
        c(H).map((n) => (n.id === e ? t : n)),
      );
    } catch {
      y(
        H,
        c(H).map((t) => (t.id === e ? n : t)),
      );
    }
  }
  function pe(e) {
    switch (e) {
      case `critical`:
        return `destructive`;
      case `high`:
        return `warning`;
      case `medium`:
        return `warning`;
      case `low`:
        return `secondary`;
      default:
        return `outline`;
    }
  }
  p();
  var X = V(),
    Z = v(l(X), 2);
  E(Z, {
    children: (i, a) => {
      var d = ae(),
        f = h(d);
      (O(f, {
        children: (e, t) => {
          k(e, {
            class: `text-base`,
            children: (e, t) => {
              (b(), r(e, s(`Create Incident`)));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        D(v(f, 2), {
          children: (i, a) => {
            var d = ie(),
              f = l(d),
              p = l(f);
            P(p, {
              htmlFor: `inc-title`,
              children: (e, t) => {
                (b(), r(e, s(`Title *`)));
              },
              $$slots: { default: !0 },
            });
            var _ = v(p, 2);
            N(_, {
              id: `inc-title`,
              placeholder: `Incident title`,
              get value() {
                return c(K).title;
              },
              set value(e) {
                m(K, (c(K).title = e));
              },
              $$legacy: !0,
            });
            var y = v(_, 2),
              x = (t) => {
                var i = ne(),
                  a = l(i, !0);
                (o(i), e(() => n(a, c(J))), r(t, i));
              };
            (t(y, (e) => {
              c(J) && e(x);
            }),
              o(f));
            var S = v(f, 2),
              C = l(S);
            P(C, {
              htmlFor: `inc-severity`,
              children: (e, t) => {
                (b(), r(e, s(`Severity`)));
              },
              $$slots: { default: !0 },
            });
            var T = v(C, 2),
              E = l(T);
            E.value = E.__value = `low`;
            var D = v(E);
            D.value = D.__value = `medium`;
            var O = v(D);
            O.value = O.__value = `high`;
            var k = v(O);
            ((k.value = k.__value = `critical`), o(T), o(S));
            var j = v(S, 2),
              M = l(j);
            (P(M, {
              htmlFor: `inc-source`,
              children: (e, t) => {
                (b(), r(e, s(`Source`)));
              },
              $$slots: { default: !0 },
            }),
              N(v(M, 2), {
                id: `inc-source`,
                placeholder: `Optional`,
                get value() {
                  return c(K).source;
                },
                set value(e) {
                  m(K, (c(K).source = e));
                },
                $$legacy: !0,
              }),
              o(j));
            var F = v(j, 2);
            {
              let t = g(() => c(q) || !c(K).title);
              A(F, {
                get disabled() {
                  return c(t);
                },
                $$events: { click: de },
                children: (t, i) => {
                  var a = re(),
                    o = h(a);
                  w(o, { class: `h-4 w-4 mr-1` });
                  var s = v(o);
                  (e(() => n(s, ` ${c(q) ? `Creating...` : `Create`}`)), r(t, a));
                },
                $$slots: { default: !0 },
              });
            }
            (o(d),
              u(
                T,
                () => c(K).severity,
                (e) => m(K, (c(K).severity = e)),
              ),
              r(i, d));
          },
          $$slots: { default: !0 },
        }),
        r(i, d));
    },
    $$slots: { default: !0 },
  });
  var Q = v(Z, 2),
    $ = (t) => {
      M(t, {
        variant: `destructive`,
        children: (t, i) => {
          var a = oe(),
            s = h(a);
          T(s, { class: `h-4 w-4` });
          var u = v(s, 2),
            d = l(u, !0);
          (o(u), e(() => n(d, c(W))), r(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t(Q, (e) => {
    c(W) && e($);
  });
  var me = v(Q, 2),
    he = (e) => {
      var t = se();
      (i(
        t,
        4,
        () => [1, 2, 3],
        a,
        (e, t) => {
          F(e, { class: `h-12 rounded-lg` });
        },
      ),
        o(t),
        r(e, t));
    },
    ge = (e) => {
      E(e, {
        class: `border-dashed`,
        children: (e, t) => {
          D(e, {
            class: `py-16 text-center`,
            children: (e, t) => {
              var n = ce();
              (T(h(n), { class: `h-12 w-12 mx-auto mb-4 text-muted-foreground/30` }),
                b(2),
                r(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    _e = (u) => {
      var d = B(),
        f = h(d);
      E(f, {
        children: (u, d) => {
          D(u, {
            class: `p-0`,
            children: (u, d) => {
              var f = z(),
                p = l(f),
                m = v(l(p));
              (i(
                m,
                5,
                () => c(H),
                a,
                (i, a) => {
                  var u = R(),
                    d = l(u),
                    f = l(d, !0);
                  o(d);
                  var p = v(d),
                    m = l(p, !0);
                  o(p);
                  var _ = v(p),
                    y = l(_);
                  {
                    let t = g(() => pe(c(a).severity));
                    j(y, {
                      get variant() {
                        return c(t);
                      },
                      children: (t, i) => {
                        b();
                        var o = s();
                        (e(() => n(o, c(a).severity)), r(t, o));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  o(_);
                  var x = v(_),
                    S = l(x);
                  {
                    let t = g(() => (c(a).status === `open` ? `warning` : `success`));
                    j(S, {
                      get variant() {
                        return c(t);
                      },
                      children: (t, i) => {
                        b();
                        var o = s();
                        (e(() => n(o, c(a).status)), r(t, o));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  o(x);
                  var w = v(x),
                    T = l(w, !0);
                  o(w);
                  var E = v(w),
                    D = l(E, !0);
                  o(E);
                  var O = v(E),
                    k = l(O),
                    M = (e) => {
                      A(e, {
                        size: `sm`,
                        variant: `success`,
                        $$events: { click: () => fe(c(a).id) },
                        children: (e, t) => {
                          var n = le();
                          (C(h(n), { class: `h-3 w-3 mr-1` }), b(), r(e, n));
                        },
                        $$slots: { default: !0 },
                      });
                    },
                    N = (e) => {
                      r(e, ue());
                    };
                  (t(k, (e) => {
                    c(a).status === `open` ? e(M) : e(N, -1);
                  }),
                    o(O),
                    o(u),
                    e(
                      (e, t) => {
                        (n(f, c(a).id), n(m, c(a).title), n(T, e), n(D, t));
                      },
                      [
                        () => new Date(c(a).createdAt).toLocaleString(),
                        () =>
                          c(a).resolvedAt ? new Date(c(a).resolvedAt).toLocaleString() : `---`,
                      ],
                    ),
                    r(i, u));
                },
              ),
                o(m),
                o(p),
                o(f),
                r(u, f));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var p = v(f, 2),
        m = (e) => {
          A(e, {
            variant: `outline`,
            $$events: { click: () => Y(!1) },
            children: (e, t) => {
              (b(), r(e, s(`Load More`)));
            },
            $$slots: { default: !0 },
          });
        };
      (t(p, (e) => {
        c(G) && e(m);
      }),
        r(u, d));
    };
  (t(me, (e) => {
    c(U) ? e(he) : c(H).length === 0 ? e(ge, 1) : e(_e, -1);
  }),
    o(X),
    r(S, X),
    d());
}
export { H as component };
