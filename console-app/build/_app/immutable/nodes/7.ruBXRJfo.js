import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  N as a,
  P as o,
  S as s,
  Tt as c,
  V as l,
  W as u,
  at as d,
  bt as f,
  ct as p,
  l as m,
  ot as h,
  pt as g,
  r as _,
  st as v,
  ut as y,
  wt as b,
  x as ee,
  xt as x,
  z as S,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as C } from "../chunks/D4lFFHu4.js";
import { t as te } from "../chunks/DHVpvl6C.js";
import { t as ne } from "../chunks/C_dKnYGb2.js";
import { t as re } from "../chunks/B_kQVdkE2.js";
import { t as w } from "../chunks/CMGwYO6i2.js";
import { n as ie, t as T } from "../chunks/BEJa09Kq2.js";
import "../chunks/Da7GIpgR2.js";
import "../chunks/B2LjsFjQ2.js";
import { t as E } from "../chunks/Cue2Cs472.js";
import { t as ae } from "../chunks/DmQt9wwK2.js";
import { t as D } from "../chunks/DOfJvt542.js";
import { t as O } from "../chunks/oRaErrij2.js";
import { t as k } from "../chunks/CohZSUWO.js";
import { n as A, t as j } from "../chunks/WlkLV7O8.js";
import { t as M } from "../chunks/Bsj77roc.js";
var N = S(`<!> <p class="pl-7"> </p>`, 1),
  P = S(`<div class="space-y-3"></div>`),
  oe = S(`<option> </option>`),
  se = S(`<!> Impersonate`, 1),
  ce = S(`<!> Delete`, 1),
  le = S(
    `<tr class="border-t hover:bg-muted/50"><td class="px-3 sm:px-4 py-3"><div class="font-medium"> </div> <div class="text-xs text-muted-foreground sm:hidden"> </div></td><td class="px-3 sm:px-4 py-3 text-muted-foreground hidden sm:table-cell"> </td><td class="px-3 sm:px-4 py-3 text-muted-foreground hidden md:table-cell"> </td><td class="px-3 sm:px-4 py-3 hidden sm:table-cell"><select class="text-xs border rounded px-2 py-1 bg-background"></select></td><td class="px-3 sm:px-4 py-3"><!></td><td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell"> </td><td class="px-3 sm:px-4 py-3"><div class="flex flex-wrap gap-1.5 sm:gap-2"><!> <!> <!></div></td></tr>`,
  ),
  F = S(
    `<tr><td colspan="7" class="px-4 py-6 text-center text-muted-foreground">No tenants found</td></tr>`,
  ),
  I = S(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-3 sm:px-4 py-3 font-medium">Org Name</th><th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">Owner Email</th><th class="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Users</th><th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">Tier</th><th class="px-3 sm:px-4 py-3 font-medium">Status</th><th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Created</th><th class="px-3 sm:px-4 py-3 font-medium">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  ue = S(`<!> <!>`, 1),
  de = S(
    `<!> <p class="text-sm text-muted-foreground">Are you sure you want to delete tenant <strong class="text-foreground"> </strong>? This cannot be undone.</p> <!>`,
    1,
  ),
  fe = S(`<!> <!>`, 1),
  pe = S(
    `<!> <p class="text-sm text-muted-foreground"> <strong class="text-foreground"> </strong>? <!></p> <!>`,
    1,
  ),
  me = S(`<!> Impersonate`, 1),
  he = S(`<!> <!>`, 1),
  ge = S(
    `<!> <div class="space-y-2"><p class="text-sm text-muted-foreground">You are about to impersonate <strong class="text-foreground"> </strong>.</p> <p class="text-sm text-muted-foreground">Your session will switch to this tenant's context and all actions you take will be performed as that tenant. This session change is logged in the audit trail.</p></div> <!>`,
    1,
  ),
  _e = S(
    `<div class="space-y-6"><div class="flex items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">Platform Administration</h1> <p class="text-sm text-muted-foreground">Manage tenants across the platform</p></div> <div class="flex items-center gap-2 shrink-0"><!></div></div> <!> <!></div> <!> <!> <!>`,
    1,
  );
function L(S, L) {
  x(L, !1);
  let ve = [`free`, `starter`, `professional`, `enterprise`],
    R = p([]),
    z = p(!0),
    B = p(``),
    V = p(!1),
    H = p(null),
    U = p(!1),
    W = p(null),
    G = p(!1),
    K = p(null);
  async function ye() {
    (y(z, !0), y(B, ``));
    try {
      let e = await fetch(`/api/admin/tenants`);
      if (!e.ok) throw Error(`Failed to load tenants (${e.status})`);
      y(R, await e.json());
    } catch (e) {
      y(B, e?.message || `Failed to load tenants`);
    } finally {
      y(z, !1);
    }
  }
  function be(e) {
    (y(W, e), y(U, !0));
  }
  function q() {
    (y(U, !1), y(W, null));
  }
  async function xe() {
    if (!u(W)) return;
    let e = u(W),
      t = e.status === `active` ? `disabled` : `active`;
    q();
    try {
      if (
        !(
          await fetch(`/api/admin/tenants/${e.id}`, {
            method: `PATCH`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ status: t }),
          })
        ).ok
      )
        throw Error(`Failed to update tenant`);
      ((e.status = t),
        y(R, u(R)),
        C({ message: `Tenant ${t === `active` ? `enabled` : `disabled`}`, variant: `success` }));
    } catch (e) {
      C({ message: e?.message || `Failed to update tenant`, variant: `error` });
    }
  }
  function Se(e) {
    (y(H, e), y(V, !0));
  }
  function J() {
    (y(V, !1), y(H, null));
  }
  async function Ce() {
    if (u(H))
      try {
        if (!(await fetch(`/api/admin/tenants/${u(H).id}`, { method: `DELETE` })).ok)
          throw Error(`Failed to delete tenant`);
        (C({ message: `Tenant "${u(H).name}" deleted`, variant: `success` }), J(), await ye());
      } catch (e) {
        C({ message: e?.message || `Failed to delete tenant`, variant: `error` });
      }
  }
  function we(e) {
    (y(K, e), y(G, !0));
  }
  function Y() {
    (y(G, !1), y(K, null));
  }
  async function Te(e, t) {
    try {
      if (
        !(
          await fetch(`/api/admin/tenants/${e.id}`, {
            method: `PATCH`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ tier: t }),
          })
        ).ok
      )
        throw Error(`Failed to update tier`);
      ((e.tier = t), y(R, u(R)), C({ message: `Tier updated to ${t}`, variant: `success` }));
    } catch (e) {
      C({ message: e?.message || `Failed to update tier`, variant: `error` });
    }
  }
  async function Ee() {
    if (!u(K)) return;
    let e = u(K);
    Y();
    try {
      if (!(await fetch(`/api/admin/tenants/${e.id}/impersonate`, { method: `POST` })).ok)
        throw Error(`Failed to impersonate tenant`);
      location.href = `/console`;
    } catch (e) {
      C({ message: e?.message || `Failed to impersonate`, variant: `error` });
    }
  }
  (_(ye), m());
  var X = _e(),
    Z = h(X),
    Q = d(Z),
    De = v(d(Q), 2);
  (ne(d(De), { class: `h-5 w-5 text-primary` }), c(De), c(Q));
  var Oe = v(Q, 2),
    ke = (t) => {
      D(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = N(),
            o = h(a);
          w(o, { class: `h-4 w-4` });
          var s = v(o, 2),
            l = d(s, !0);
          (c(s), e(() => r(l, u(B))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t(Oe, (e) => {
    u(B) && e(ke);
  });
  var Ae = v(Oe, 2),
    je = (e) => {
      var t = P();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          O(e, { class: `h-16 rounded-lg` });
        },
      ),
        c(t),
        i(e, t));
    },
    Me = (t) => {
      ie(t, {
        children: (t, f) => {
          T(t, {
            class: `p-0`,
            children: (t, f) => {
              var p = I(),
                m = d(p),
                _ = v(d(m));
              (a(
                _,
                5,
                () => u(R),
                o,
                (t, f) => {
                  var p = le(),
                    m = d(p),
                    _ = d(m),
                    y = d(_, !0);
                  c(_);
                  var x = v(_, 2),
                    S = d(x, !0);
                  (c(x), c(m));
                  var C = v(m),
                    ne = d(C, !0);
                  c(C);
                  var w = v(C),
                    ie = d(w, !0);
                  c(w);
                  var T = v(w),
                    D = d(T);
                  (a(
                    D,
                    5,
                    () => ve,
                    o,
                    (t, n) => {
                      var a = oe(),
                        o = d(a, !0);
                      c(a);
                      var s = {};
                      (e(
                        (e) => {
                          (r(o, e), s !== (s = u(n)) && (a.value = (a.__value = u(n)) ?? ``));
                        },
                        [() => u(n).charAt(0).toUpperCase() + u(n).slice(1)],
                      ),
                        i(t, a));
                    },
                  ),
                    c(D));
                  var O;
                  (ee(D), c(T));
                  var k = v(T),
                    A = d(k);
                  {
                    let t = g(() => (u(f).status === `active` ? `success` : `destructive`));
                    ae(A, {
                      get variant() {
                        return u(t);
                      },
                      children: (t, n) => {
                        b();
                        var a = l();
                        (e(() => r(a, u(f).status)), i(t, a));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  c(k);
                  var j = v(k),
                    M = d(j, !0);
                  c(j);
                  var N = v(j),
                    P = d(N),
                    F = d(P);
                  {
                    let t = g(() => (u(f).status === `active` ? `outline` : `success`));
                    E(F, {
                      size: `sm`,
                      get variant() {
                        return u(t);
                      },
                      $$events: { click: () => be(u(f)) },
                      children: (t, n) => {
                        b();
                        var a = l();
                        (e(() => r(a, u(f).status === `active` ? `Disable` : `Enable`)), i(t, a));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  var I = v(F, 2);
                  (E(I, {
                    size: `sm`,
                    variant: `secondary`,
                    $$events: { click: () => we(u(f)) },
                    children: (e, t) => {
                      var n = se();
                      (te(h(n), { class: `h-3 w-3 mr-1` }), b(), i(e, n));
                    },
                    $$slots: { default: !0 },
                  }),
                    E(v(I, 2), {
                      size: `sm`,
                      variant: `destructive`,
                      $$events: { click: () => Se(u(f)) },
                      children: (e, t) => {
                        var n = ce();
                        (re(h(n), { class: `h-3 w-3 mr-1` }), b(), i(e, n));
                      },
                      $$slots: { default: !0 },
                    }),
                    c(P),
                    c(N),
                    c(p),
                    e(
                      (e) => {
                        (r(y, u(f).name),
                          r(S, u(f).ownerEmail),
                          r(ne, u(f).ownerEmail),
                          r(ie, u(f).user_count),
                          O !== (O = u(f).tier || `free`) &&
                            ((D.value = (D.__value = u(f).tier || `free`) ?? ``),
                            s(D, u(f).tier || `free`)),
                          r(M, e));
                      },
                      [() => new Date(u(f).createdAt).toLocaleDateString()],
                    ),
                    n(`change`, D, (e) => Te(u(f), e.currentTarget.value)),
                    i(t, p));
                },
                (e) => {
                  i(e, F());
                },
              ),
                c(_),
                c(m),
                c(p),
                i(t, p));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (t(Ae, (e) => {
    u(z) ? e(je) : e(Me, -1);
  }),
    c(Z));
  var Ne = v(Z, 2);
  k(Ne, {
    get open() {
      return u(V);
    },
    onClose: J,
    children: (t, n) => {
      var a = de(),
        o = h(a);
      A(o, {
        children: (e, t) => {
          j(e, {
            children: (e, t) => {
              (b(), i(e, l(`Delete Tenant`)));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var s = v(o, 2),
        f = v(d(s)),
        p = d(f, !0);
      (c(f),
        b(),
        c(s),
        M(v(s, 2), {
          children: (e, t) => {
            var n = ue(),
              r = h(n);
            (E(r, {
              variant: `outline`,
              $$events: { click: J },
              children: (e, t) => {
                (b(), i(e, l(`Cancel`)));
              },
              $$slots: { default: !0 },
            }),
              E(v(r, 2), {
                variant: `destructive`,
                $$events: { click: Ce },
                children: (e, t) => {
                  (b(), i(e, l(`Delete`)));
                },
                $$slots: { default: !0 },
              }),
              i(e, n));
          },
          $$slots: { default: !0 },
        }),
        e(() => r(p, u(H)?.name)),
        i(t, a));
    },
    $$slots: { default: !0 },
  });
  var $ = v(Ne, 2);
  (k($, {
    get open() {
      return u(U);
    },
    onClose: q,
    children: (n, a) => {
      var o = pe(),
        s = h(o);
      A(s, {
        children: (t, n) => {
          j(t, {
            children: (t, n) => {
              b();
              var a = l();
              (e(() => r(a, `${u(W)?.status === `active` ? `Disable` : `Enable`} Tenant`)),
                i(t, a));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var f = v(s, 2),
        p = d(f),
        m = v(p),
        _ = d(m, !0);
      c(m);
      var y = v(m, 2),
        ee = (e) => {
          i(e, l(`All users will lose access immediately.`));
        };
      (t(y, (e) => {
        u(W)?.status === `active` && e(ee);
      }),
        c(f),
        M(v(f, 2), {
          children: (t, n) => {
            var a = fe(),
              o = h(a);
            E(o, {
              variant: `outline`,
              $$events: { click: q },
              children: (e, t) => {
                (b(), i(e, l(`Cancel`)));
              },
              $$slots: { default: !0 },
            });
            var s = v(o, 2);
            {
              let t = g(() => (u(W)?.status === `active` ? `destructive` : `default`));
              E(s, {
                get variant() {
                  return u(t);
                },
                $$events: { click: xe },
                children: (t, n) => {
                  b();
                  var a = l();
                  (e(() => r(a, u(W)?.status === `active` ? `Disable` : `Enable`)), i(t, a));
                },
                $$slots: { default: !0 },
              });
            }
            i(t, a);
          },
          $$slots: { default: !0 },
        }),
        e(() => {
          (r(
            p,
            `Are you sure you want to ${u(W)?.status === `active` ? `disable` : `enable`} tenant `,
          ),
            r(_, u(W)?.name));
        }),
        i(n, o));
    },
    $$slots: { default: !0 },
  }),
    k(v($, 2), {
      get open() {
        return u(G);
      },
      onClose: Y,
      children: (t, n) => {
        var a = ge(),
          o = h(a);
        A(o, {
          children: (e, t) => {
            j(e, {
              children: (e, t) => {
                (b(), i(e, l(`Impersonate Tenant`)));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        });
        var s = v(o, 2),
          f = d(s),
          p = v(d(f)),
          m = d(p, !0);
        (c(p),
          b(),
          c(f),
          b(2),
          c(s),
          M(v(s, 2), {
            children: (e, t) => {
              var n = he(),
                r = h(n);
              (E(r, {
                variant: `outline`,
                $$events: { click: Y },
                children: (e, t) => {
                  (b(), i(e, l(`Cancel`)));
                },
                $$slots: { default: !0 },
              }),
                E(v(r, 2), {
                  variant: `secondary`,
                  $$events: { click: Ee },
                  children: (e, t) => {
                    var n = me();
                    (te(h(n), { class: `h-3 w-3 mr-1` }), b(), i(e, n));
                  },
                  $$slots: { default: !0 },
                }),
                i(e, n));
            },
            $$slots: { default: !0 },
          }),
          e(() => r(m, u(K)?.name)),
          i(t, a));
      },
      $$slots: { default: !0 },
    }),
    i(S, X),
    f());
}
export { L as component };
