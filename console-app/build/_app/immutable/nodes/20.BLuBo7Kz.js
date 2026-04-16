import {
  $ as e,
  F as t,
  I as n,
  L as r,
  N as i,
  P as a,
  Q as o,
  Tt as s,
  V as c,
  W as l,
  Z as u,
  at as d,
  b as f,
  bt as p,
  ct as m,
  gt as h,
  ht as g,
  l as _,
  ot as v,
  pt as ee,
  q as y,
  r as b,
  st as x,
  ut as S,
  v as C,
  wt as w,
  xt as T,
  z as E,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as D } from "../chunks/D8pbUplu.js";
import { n as O } from "../chunks/D4lFFHu4.js";
import { t as k } from "../chunks/BZ8YNDoC.js";
import { t as A } from "../chunks/FF_0sOmu.js";
import { t as te } from "../chunks/Bh_67ZLW.js";
import { t as j } from "../chunks/C_dKnYGb2.js";
import { t as M } from "../chunks/B_kQVdkE2.js";
import { t as ne } from "../chunks/BXmH0DjJ2.js";
import { t as re } from "../chunks/elp0DnJy2.js";
import { n as N, t as P } from "../chunks/BEJa09Kq2.js";
import { t as ie } from "../chunks/Da7GIpgR2.js";
import { t as ae } from "../chunks/B2LjsFjQ2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as I } from "../chunks/DmQt9wwK2.js";
import { t as L } from "../chunks/C8W1vu9i2.js";
import { t as R } from "../chunks/ejJaicvO2.js";
import { t as z } from "../chunks/oRaErrij2.js";
var oe = E(`<div class="space-y-4"><!> <!></div>`),
  B = E(`<p class="text-destructive"> </p> <!>`, 1),
  se = E(`<!> Console Access`, 1),
  ce = E(`<!> `, 1),
  le = E(
    `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <select id="edit-status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Active</option><option>Inactive</option><option>Suspended</option></select></div></div> <div class="flex justify-end pt-2"><!></div>`,
    1,
  ),
  ue = E(`<!> <!>`, 1),
  de = E(`<div class="flex items-center justify-between"><!> <!></div>`),
  fe = E(`<option> </option>`),
  pe = E(`<!> `, 1),
  me = E(
    `<div class="flex items-end gap-2"><div class="flex-1 space-y-2"><!> <select id="add-group" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Select a group...</option><!></select></div> <!></div> <!>`,
    1,
  ),
  he = E(`<!> Remove`, 1),
  ge = E(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3"><a class="font-medium text-primary hover:underline"> </a></td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-right"><!></td></tr>`,
  ),
  _e = E(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Group</th><th class="px-4 py-3 font-medium">Description</th><th class="px-4 py-3 font-medium">Joined</th><th class="px-4 py-3 font-medium text-right">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  ve = E(
    `<div class="text-center py-8"><!> <p class="text-muted-foreground text-sm">Not a member of any groups</p></div>`,
  ),
  ye = E(`<!> <!>`, 1),
  be = E(`<!> <!>`, 1),
  xe = E(`<span> </span>`),
  Se = E(
    `<div class="flex items-center justify-between flex-wrap gap-4"><div><div class="flex items-center gap-3 mb-1"><h1 class="text-2xl font-semibold tracking-tight"> </h1> <!> <!></div> <p class="text-sm text-muted-foreground"> </p></div></div> <!> <!> <div class="text-xs text-muted-foreground flex gap-4"><span> </span> <span> </span> <!></div>`,
    1,
  ),
  Ce = E(
    `<div class="space-y-6"><a href="/console/directory" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><!> Back to Directory</a> <!></div>`,
  );
function V(E, V) {
  T(V, !1);
  let we = () => h(D, `$page`, Te),
    [Te, Ee] = g(),
    H = m(),
    U = m(),
    W = m(null),
    G = m([]),
    De = m([]),
    Oe = m(!0),
    K = m(!1),
    q = m(``),
    J = m(``),
    Y = m(``),
    X = m(``),
    Z = m(`active`),
    Q = m(``),
    $ = m(!1);
  function ke(e) {
    switch (e.toLowerCase()) {
      case `active`:
        return `success`;
      case `suspended`:
        return `destructive`;
      case `inactive`:
        return `warning`;
      default:
        return `secondary`;
    }
  }
  async function Ae() {
    (S(Oe, !0), S(q, ``));
    try {
      let e = await fetch(`/api/directory/users/${l(H)}`);
      if (!e.ok) throw Error(`Failed to load user (${e.status})`);
      let t = await e.json();
      (S(W, t.user),
        S(G, t.groups || []),
        l(W) &&
          (S(J, l(W).display_name || ``),
          S(Y, l(W).department || ``),
          S(X, l(W).title || ``),
          S(Z, l(W).status || `active`)));
    } catch (e) {
      S(q, e?.message || `Failed to load user`);
    } finally {
      S(Oe, !1);
    }
  }
  async function je() {
    try {
      let e = await fetch(`/api/directory/groups`);
      e.ok && S(De, (await e.json()).groups || []);
    } catch {}
  }
  async function Me() {
    if (l(W)) {
      S(K, !0);
      try {
        let e = await fetch(`/api/directory/users/${l(H)}`, {
          method: `PATCH`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ displayName: l(J), department: l(Y), title: l(X), status: l(Z) }),
        });
        if (!e.ok) throw Error(`Failed to save user`);
        (S(W, (await e.json()).user), O({ message: `User updated`, variant: `success` }));
      } catch (e) {
        O({ message: e?.message || `Failed to save user`, variant: `error` });
      } finally {
        S(K, !1);
      }
    }
  }
  async function Ne() {
    if (l(Q)) {
      S($, !0);
      try {
        if (
          !(
            await fetch(`/api/directory/groups/${l(Q)}/members`, {
              method: `POST`,
              headers: { "content-type": `application/json` },
              body: JSON.stringify({ userId: l(H) }),
            })
          ).ok
        )
          throw Error(`Failed to add to group`);
        (O({ message: `Added to group`, variant: `success` }), S(Q, ``), await Ae());
      } catch (e) {
        O({ message: e?.message || `Failed to add to group`, variant: `error` });
      } finally {
        S($, !1);
      }
    }
  }
  async function Pe(e) {
    try {
      if (
        !(
          await fetch(`/api/directory/groups/${e}/members`, {
            method: `DELETE`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ userId: l(H) }),
          })
        ).ok
      )
        throw Error(`Failed to remove from group`);
      (O({ message: `Removed from group`, variant: `success` }),
        S(
          G,
          l(G).filter((t) => t.id !== e),
        ));
    } catch (e) {
      O({ message: e?.message || `Failed to remove from group`, variant: `error` });
    }
  }
  (b(() => {
    (Ae(), je());
  }),
    u(
      () => we(),
      () => {
        S(H, we().params.id);
      },
    ),
    u(
      () => (l(De), l(G)),
      () => {
        S(
          U,
          l(De).filter((e) => !l(G).some((t) => t.id === e.id)),
        );
      },
    ),
    o(),
    _());
  var Fe = Ce(),
    Ie = d(Fe);
  (k(d(Ie), { class: `h-4 w-4` }), w(), s(Ie));
  var Le = x(Ie, 2),
    Re = (e) => {
      var t = oe(),
        n = d(t);
      (z(n, { class: `h-8 w-64` }), z(x(n, 2), { class: `h-64 w-full rounded-lg` }), s(t), r(e, t));
    },
    ze = (t) => {
      N(t, {
        children: (t, i) => {
          P(t, {
            class: `py-8 text-center`,
            children: (t, i) => {
              var a = B(),
                o = v(a),
                u = d(o, !0);
              (s(o),
                F(x(o, 2), {
                  variant: `outline`,
                  class: `mt-4`,
                  $$events: { click: Ae },
                  children: (e, t) => {
                    (w(), r(e, c(`Retry`)));
                  },
                  $$slots: { default: !0 },
                }),
                e(() => n(u, l(q))),
                r(t, a));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    Be = (o) => {
      var u = Se(),
        p = v(u),
        m = d(p),
        h = d(m),
        g = d(h),
        _ = d(g, !0);
      s(g);
      var b = x(g, 2);
      {
        let t = ee(() => (l(W), y(() => ke(l(W).status))));
        I(b, {
          get variant() {
            return l(t);
          },
          class: `capitalize`,
          children: (t, i) => {
            w();
            var a = c();
            (e(() => n(a, (l(W), y(() => l(W).status)))), r(t, a));
          },
          $$slots: { default: !0 },
        });
      }
      var T = x(b, 2),
        E = (e) => {
          I(e, {
            variant: `default`,
            children: (e, t) => {
              var n = se();
              (j(v(n), { class: `h-3 w-3 mr-1` }), w(), r(e, n));
            },
            $$slots: { default: !0 },
          });
        };
      (t(T, (e) => {
        (l(W), y(() => l(W).console_user_id) && e(E));
      }),
        s(h));
      var D = x(h, 2),
        O = d(D, !0);
      (s(D), s(m), s(p));
      var k = x(p, 2);
      N(k, {
        children: (t, i) => {
          var a = ue(),
            o = v(a);
          (ie(o, {
            children: (e, t) => {
              ae(e, {
                children: (e, t) => {
                  (w(), r(e, c(`Profile`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            P(x(o, 2), {
              class: `space-y-4`,
              children: (t, i) => {
                var a = le(),
                  o = v(a),
                  u = d(o),
                  p = d(u);
                (R(p, {
                  htmlFor: `edit-email`,
                  children: (e, t) => {
                    (w(), r(e, c(`Email`)));
                  },
                  $$slots: { default: !0 },
                }),
                  L(x(p, 2), {
                    id: `edit-email`,
                    get value() {
                      return (l(W), y(() => l(W).email));
                    },
                    disabled: !0,
                  }),
                  s(u));
                var m = x(u, 2),
                  h = d(m);
                R(h, {
                  htmlFor: `edit-source`,
                  children: (e, t) => {
                    (w(), r(e, c(`Source`)));
                  },
                  $$slots: { default: !0 },
                });
                var g = x(h, 2);
                {
                  let e = ee(() => (l(W), y(() => l(W).source || `manual`)));
                  L(g, {
                    id: `edit-source`,
                    get value() {
                      return l(e);
                    },
                    disabled: !0,
                  });
                }
                s(m);
                var _ = x(m, 2),
                  b = d(_);
                (R(b, {
                  htmlFor: `edit-display-name`,
                  children: (e, t) => {
                    (w(), r(e, c(`Display Name`)));
                  },
                  $$slots: { default: !0 },
                }),
                  L(x(b, 2), {
                    id: `edit-display-name`,
                    get value() {
                      return l(J);
                    },
                    set value(e) {
                      S(J, e);
                    },
                    $$legacy: !0,
                  }),
                  s(_));
                var C = x(_, 2),
                  T = d(C);
                (R(T, {
                  htmlFor: `edit-department`,
                  children: (e, t) => {
                    (w(), r(e, c(`Department`)));
                  },
                  $$slots: { default: !0 },
                }),
                  L(x(T, 2), {
                    id: `edit-department`,
                    get value() {
                      return l(Y);
                    },
                    set value(e) {
                      S(Y, e);
                    },
                    $$legacy: !0,
                  }),
                  s(C));
                var E = x(C, 2),
                  D = d(E);
                (R(D, {
                  htmlFor: `edit-title`,
                  children: (e, t) => {
                    (w(), r(e, c(`Title`)));
                  },
                  $$slots: { default: !0 },
                }),
                  L(x(D, 2), {
                    id: `edit-title`,
                    get value() {
                      return l(X);
                    },
                    set value(e) {
                      S(X, e);
                    },
                    $$legacy: !0,
                  }),
                  s(E));
                var O = x(E, 2),
                  k = d(O);
                R(k, {
                  htmlFor: `edit-status`,
                  children: (e, t) => {
                    (w(), r(e, c(`Status`)));
                  },
                  $$slots: { default: !0 },
                });
                var A = x(k, 2),
                  j = d(A);
                j.value = j.__value = `active`;
                var M = x(j);
                M.value = M.__value = `inactive`;
                var ne = x(M);
                ((ne.value = ne.__value = `suspended`), s(A), s(O), s(o));
                var re = x(o, 2);
                (F(d(re), {
                  get disabled() {
                    return l(K);
                  },
                  $$events: { click: Me },
                  children: (t, i) => {
                    var a = ce(),
                      o = v(a);
                    te(o, { class: `h-4 w-4 mr-1.5` });
                    var s = x(o);
                    (e(() => n(s, ` ${l(K) ? `Saving...` : `Save Changes`}`)), r(t, a));
                  },
                  $$slots: { default: !0 },
                }),
                  s(re),
                  f(
                    A,
                    () => l(Z),
                    (e) => S(Z, e),
                  ),
                  r(t, a));
              },
              $$slots: { default: !0 },
            }),
            r(t, a));
        },
        $$slots: { default: !0 },
      });
      var z = x(k, 2);
      N(z, {
        children: (o, u) => {
          var p = be(),
            m = v(p);
          (ie(m, {
            children: (t, i) => {
              var a = de(),
                o = d(a);
              (ae(o, {
                children: (e, t) => {
                  (w(), r(e, c(`Group Memberships`)));
                },
                $$slots: { default: !0 },
              }),
                I(x(o, 2), {
                  variant: `secondary`,
                  children: (t, i) => {
                    w();
                    var a = c();
                    (e(() => n(a, (l(G), y(() => l(G).length)))), r(t, a));
                  },
                  $$slots: { default: !0 },
                }),
                s(a),
                r(t, a));
            },
            $$slots: { default: !0 },
          }),
            P(x(m, 2), {
              class: `space-y-4`,
              children: (o, u) => {
                var p = ye(),
                  m = v(p),
                  h = (t) => {
                    var o = me(),
                      u = v(o),
                      p = d(u),
                      m = d(p);
                    R(m, {
                      htmlFor: `add-group`,
                      children: (e, t) => {
                        (w(), r(e, c(`Add to Group`)));
                      },
                      $$slots: { default: !0 },
                    });
                    var h = x(m, 2),
                      g = d(h);
                    ((g.value = g.__value = ``),
                      i(
                        x(g),
                        1,
                        () => l(U),
                        a,
                        (t, i) => {
                          var a = fe(),
                            o = d(a, !0);
                          s(a);
                          var c = {};
                          (e(() => {
                            (n(o, (l(i), y(() => l(i).name))),
                              c !== (c = (l(i), y(() => l(i).id))) &&
                                (a.value = (a.__value = (l(i), y(() => l(i).id))) ?? ``));
                          }),
                            r(t, a));
                        },
                      ),
                      s(h),
                      s(p));
                    var _ = x(p, 2);
                    {
                      let t = ee(() => !l(Q) || l($));
                      F(_, {
                        get disabled() {
                          return l(t);
                        },
                        $$events: { click: Ne },
                        children: (t, i) => {
                          var a = pe(),
                            o = v(a);
                          A(o, { class: `h-4 w-4 mr-1.5` });
                          var s = x(o);
                          (e(() => n(s, ` ${l($) ? `Adding...` : `Add`}`)), r(t, a));
                        },
                        $$slots: { default: !0 },
                      });
                    }
                    (s(u),
                      re(x(u, 2), {}),
                      f(
                        h,
                        () => l(Q),
                        (e) => S(Q, e),
                      ),
                      r(t, o));
                  };
                t(m, (e) => {
                  (l(U), y(() => l(U).length > 0) && e(h));
                });
                var g = x(m, 2),
                  _ = (t) => {
                    var o = _e(),
                      c = d(o),
                      u = x(d(c));
                    (i(
                      u,
                      5,
                      () => l(G),
                      a,
                      (t, i) => {
                        var a = ge(),
                          o = d(a),
                          c = d(o),
                          u = d(c, !0);
                        (s(c), s(o));
                        var f = x(o),
                          p = d(f, !0);
                        s(f);
                        var m = x(f),
                          h = d(m, !0);
                        s(m);
                        var g = x(m);
                        (F(d(g), {
                          variant: `ghost`,
                          size: `sm`,
                          $$events: { click: () => Pe(l(i).id) },
                          children: (e, t) => {
                            var n = he();
                            (M(v(n), { class: `h-3.5 w-3.5 mr-1 text-destructive` }), w(), r(e, n));
                          },
                          $$slots: { default: !0 },
                        }),
                          s(g),
                          s(a),
                          e(
                            (e) => {
                              (C(
                                c,
                                `href`,
                                `/console/directory/groups/${(l(i), y(() => l(i).id)) ?? ``}`,
                              ),
                                n(u, (l(i), y(() => l(i).name))),
                                n(p, (l(i), y(() => l(i).description || `-`))),
                                n(h, e));
                            },
                            [
                              () => (
                                l(i),
                                y(() =>
                                  l(i).joined_at
                                    ? new Date(l(i).joined_at).toLocaleDateString()
                                    : `-`,
                                )
                              ),
                            ],
                          ),
                          r(t, a));
                      },
                    ),
                      s(u),
                      s(c),
                      s(o),
                      r(t, o));
                  },
                  b = (e) => {
                    var t = ve();
                    (ne(d(t), { class: `h-10 w-10 mx-auto mb-3 text-muted-foreground/30` }),
                      w(2),
                      s(t),
                      r(e, t));
                  };
                (t(g, (e) => {
                  (l(G), y(() => l(G).length > 0) ? e(_) : e(b, -1));
                }),
                  r(o, p));
              },
              $$slots: { default: !0 },
            }),
            r(o, p));
        },
        $$slots: { default: !0 },
      });
      var oe = x(z, 2),
        B = d(oe),
        Ce = d(B);
      s(B);
      var V = x(B, 2),
        we = d(V);
      s(V);
      var Te = x(V, 2),
        Ee = (t) => {
          var i = xe(),
            a = d(i);
          (s(i), e(() => n(a, `External ID: ${(l(W), y(() => l(W).external_id)) ?? ``}`)), r(t, i));
        };
      (t(Te, (e) => {
        (l(W), y(() => l(W).external_id) && e(Ee));
      }),
        s(oe),
        e(
          (e, t) => {
            (n(_, (l(W), y(() => l(W).display_name || l(W).email))),
              n(O, (l(W), y(() => l(W).email))),
              n(Ce, `Created: ${e ?? ``}`),
              n(we, `Updated: ${t ?? ``}`));
          },
          [
            () => (l(W), y(() => new Date(l(W).created_at).toLocaleString())),
            () => (l(W), y(() => new Date(l(W).updated_at).toLocaleString())),
          ],
        ),
        r(o, u));
    };
  (t(Le, (e) => {
    l(Oe) ? e(Re) : l(q) ? e(ze, 1) : l(W) && e(Be, 2);
  }),
    s(Fe),
    r(E, Fe),
    p(),
    Ee());
}
export { V as component };
