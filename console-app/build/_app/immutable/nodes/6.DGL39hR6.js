import {
  $ as e,
  F as t,
  I as n,
  L as r,
  N as i,
  P as a,
  Q as o,
  Tt as s,
  U as c,
  V as l,
  W as u,
  Z as d,
  at as f,
  bt as p,
  ct as m,
  gt as h,
  ht as g,
  l as _,
  lt as ee,
  ot as v,
  pt as y,
  q as b,
  r as x,
  st as S,
  ut as C,
  wt as w,
  xt as T,
  z as E,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as D } from "../chunks/D8pbUplu.js";
import { n as O, t as k } from "../chunks/BEJa09Kq2.js";
import { t as A } from "../chunks/Cue2Cs472.js";
import { t as j } from "../chunks/DmQt9wwK2.js";
import { t as te } from "../chunks/C8W1vu9i2.js";
import { t as M } from "../chunks/oRaErrij2.js";
import { t as N } from "../chunks/ap9qvosB2.js";
function P(e) {
  return e.status === `pending`;
}
function ne(e, t, n, r) {
  return e.map((e) =>
    e.id === t
      ? {
          ...e,
          status: n,
          notes: r?.trim() ? r.trim() : e.notes,
          decidedAt: new Date().toISOString(),
        }
      : e,
  );
}
var re = E(
    `<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">Review progress</span> <span class="font-medium"> </span></div> <!> <div class="text-xs text-muted-foreground"> </div>`,
    1,
  ),
  ie = E(`<div class="space-y-3"></div>`),
  ae = E(
    `<p class="text-lg font-semibold mb-1">No review items found</p> <p class="text-sm text-muted-foreground">Items will appear after campaign scope expansion completes.</p>`,
    1,
  ),
  oe = E(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3 align-top"><div class="font-medium"> </div> <div class="text-xs text-muted-foreground"> </div></td><td class="px-4 py-3 align-top"> </td><td class="px-4 py-3 align-top text-muted-foreground"> </td><td class="px-4 py-3 align-top"><!></td><td class="px-4 py-3 align-top min-w-[220px]"><!></td><td class="px-4 py-3 align-top"><div class="flex justify-end gap-2"><!> <!></div></td></tr>`,
  ),
  se = E(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">User</th><th class="px-4 py-3 font-medium">Application</th><th class="px-4 py-3 font-medium">Role</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Notes</th><th class="px-4 py-3 font-medium text-right">Decision</th></tr></thead><tbody></tbody></table></div>`,
  ),
  ce = E(
    `<div class="space-y-6"><div class="flex items-center justify-between gap-4"><div><h1 class="text-2xl font-semibold tracking-tight"> </h1> <p class="text-sm text-muted-foreground">Review each user-to-app entitlement and approve or revoke access.</p></div> <!></div> <!> <!></div>`,
  );
function F(E, F) {
  T(F, !1);
  let I = () => h(D, `$page`, le),
    [le, ue] = g(),
    L = m(),
    R = m(),
    z = m(),
    B = m(),
    V = m(!0),
    H = m(null),
    U = m([]),
    W = m(`Access Review Campaign`),
    G = m(`active`),
    K = m({});
  function de(e) {
    return e === `draft`
      ? `secondary`
      : e === `active`
        ? `warning`
        : e === `completed`
          ? `success`
          : e === `expired`
            ? `destructive`
            : `secondary`;
  }
  function fe(e) {
    return e === `approved` ? `success` : e === `revoked` ? `destructive` : `secondary`;
  }
  async function pe() {
    C(V, !0);
    try {
      let e = await fetch(`/api/access-reviews/${u(L)}/items`);
      if (!e.ok) {
        C(U, []);
        return;
      }
      let t = await e.json();
      (C(W, t.campaign?.name || `Campaign ${u(L)}`),
        C(G, t.campaign?.status || `active`),
        C(U, Array.isArray(t.items) ? t.items : []));
    } catch {
      C(U, []);
    } finally {
      C(V, !1);
    }
  }
  async function q(e, t) {
    let n = u(K)[e] || ``;
    C(H, e);
    try {
      if (
        !(
          await fetch(`/api/access-reviews/${u(L)}/decisions`, {
            method: `POST`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ itemId: e, decision: t, notes: n.trim() || void 0 }),
          })
        ).ok
      )
        return;
      C(U, ne(u(U), e, t, n));
    } catch {
    } finally {
      C(H, null);
    }
  }
  (x(pe),
    d(
      () => I(),
      () => {
        C(L, I().params.id);
      },
    ),
    d(
      () => u(U),
      () => {
        C(R, u(U).filter((e) => e.status === `pending`).length);
      },
    ),
    d(
      () => (u(U), u(R)),
      () => {
        C(z, u(U).length - u(R));
      },
    ),
    d(
      () => (u(U), u(z)),
      () => {
        C(B, u(U).length === 0 ? 0 : Math.round((u(z) / u(U).length) * 100));
      },
    ),
    o(),
    _());
  var J = ce(),
    Y = f(J),
    X = f(Y),
    Z = f(X),
    me = f(Z, !0);
  (s(Z), w(2), s(X));
  var he = S(X, 2);
  {
    let t = y(() => (u(G), b(() => de(u(G)))));
    j(he, {
      get variant() {
        return u(t);
      },
      children: (t, i) => {
        w();
        var a = l();
        (e(() => n(a, u(G))), r(t, a));
      },
      $$slots: { default: !0 },
    });
  }
  s(Y);
  var Q = S(Y, 2);
  O(Q, {
    children: (t, i) => {
      k(t, {
        class: `py-5 space-y-3`,
        children: (t, i) => {
          var a = re(),
            o = v(a),
            c = S(f(o), 2),
            l = f(c);
          (s(c), s(o));
          var d = S(o, 2);
          N(d, {
            get value() {
              return u(B);
            },
            max: 100,
          });
          var p = S(d, 2),
            m = f(p);
          (s(p),
            e(() => {
              (n(
                l,
                `${u(z) ?? ``}/${(u(U), b(() => u(U).length)) ?? ``} reviewed (${u(B) ?? ``}%)`,
              ),
                n(m, `${u(R) ?? ``} pending decisions`));
            }),
            r(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  });
  var ge = S(Q, 2),
    $ = (e) => {
      var t = ie();
      (i(
        t,
        4,
        () => [1, 2, 3],
        a,
        (e, t) => {
          M(e, { class: `h-14 rounded-lg` });
        },
      ),
        s(t),
        r(e, t));
    },
    _e = (e) => {
      O(e, {
        class: `border-dashed`,
        children: (e, t) => {
          k(e, {
            class: `py-10 text-center`,
            children: (e, t) => {
              var n = ae();
              (w(2), r(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    ve = (t) => {
      O(t, {
        children: (t, o) => {
          k(t, {
            class: `p-0`,
            children: (t, o) => {
              var d = se(),
                p = f(d),
                m = S(f(p));
              (i(
                m,
                5,
                () => u(U),
                a,
                (t, i) => {
                  var a = oe(),
                    o = f(a),
                    d = f(o),
                    p = f(d, !0);
                  s(d);
                  var m = S(d, 2),
                    h = f(m);
                  (s(m), s(o));
                  var g = S(o),
                    _ = f(g, !0);
                  s(g);
                  var v = S(g),
                    x = f(v, !0);
                  s(v);
                  var C = S(v),
                    T = f(C);
                  {
                    let t = y(() => (u(i), b(() => fe(u(i).status))));
                    j(T, {
                      get variant() {
                        return u(t);
                      },
                      children: (t, a) => {
                        w();
                        var o = l();
                        (e(() => n(o, (u(i), b(() => u(i).status)))), r(t, o));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  s(C);
                  var E = S(C),
                    D = f(E);
                  {
                    let e = y(() => (c(P), u(i), u(H), b(() => !P(u(i)) || u(H) === u(i).id)));
                    te(D, {
                      type: `text`,
                      placeholder: `Optional decision note`,
                      get disabled() {
                        return u(e);
                      },
                      get value() {
                        return u(K)[u(i).id];
                      },
                      set value(e) {
                        ee(K, (u(K)[u(i).id] = e));
                      },
                      $$legacy: !0,
                    });
                  }
                  s(E);
                  var O = S(E),
                    k = f(O),
                    M = f(k);
                  {
                    let e = y(() => (c(P), u(i), u(H), b(() => !P(u(i)) || u(H) === u(i).id)));
                    A(M, {
                      variant: `outline`,
                      size: `sm`,
                      get disabled() {
                        return u(e);
                      },
                      $$events: { click: () => q(u(i).id, `approved`) },
                      children: (e, t) => {
                        (w(), r(e, l(`Approve`)));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  var N = S(M, 2);
                  {
                    let e = y(() => (c(P), u(i), u(H), b(() => !P(u(i)) || u(H) === u(i).id)));
                    A(N, {
                      variant: `destructive`,
                      size: `sm`,
                      get disabled() {
                        return u(e);
                      },
                      $$events: { click: () => q(u(i).id, `revoked`) },
                      children: (e, t) => {
                        (w(), r(e, l(`Revoke`)));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  (s(k),
                    s(O),
                    s(a),
                    e(() => {
                      (n(p, (u(i), b(() => u(i).userEmail || u(i).userId))),
                        n(h, `Reviewer: ${(u(i), b(() => u(i).reviewerEmail || `manager`)) ?? ``}`),
                        n(_, (u(i), b(() => u(i).appName || u(i).appId))),
                        n(x, (u(i), b(() => u(i).role || `—`))));
                    }),
                    r(t, a));
                },
              ),
                s(m),
                s(p),
                s(d),
                r(t, d));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (t(ge, (e) => {
    u(V) ? e($) : (u(U), b(() => u(U).length === 0) ? e(_e, 1) : e(ve, -1));
  }),
    s(J),
    e(() => n(me, u(W))),
    r(E, J),
    p(),
    ue());
}
export { F as component };
