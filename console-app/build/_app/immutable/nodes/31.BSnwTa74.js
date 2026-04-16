import {
  $ as e,
  A as t,
  F as n,
  H as r,
  I as i,
  L as a,
  N as o,
  P as s,
  Q as c,
  R as l,
  Tt as u,
  V as d,
  W as f,
  Z as p,
  _ as m,
  at as h,
  bt as g,
  ct as _,
  l as v,
  ot as y,
  p as b,
  pt as x,
  q as S,
  r as C,
  st as w,
  ut as T,
  w as E,
  wt as D,
  xt as O,
  z as k,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { a as A, i as j, n as ee, r as te, s as ne, t as re } from "../chunks/D1NEK5Pl.js";
import { n as M } from "../chunks/D4lFFHu4.js";
import { t as ie } from "../chunks/BaKV8GqY.js";
import { t as ae } from "../chunks/Bh_67ZLW.js";
import { t as oe } from "../chunks/C_dKnYGb2.js";
import { t as se } from "../chunks/CMGwYO6i2.js";
import { r as ce } from "../chunks/BdUjKaVy2.js";
import { n as N, t as P } from "../chunks/BEJa09Kq2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as le } from "../chunks/DOfJvt542.js";
import { t as I } from "../chunks/C8W1vu9i2.js";
import { t as L } from "../chunks/ejJaicvO2.js";
import { t as ue } from "../chunks/oRaErrij2.js";
var de = k(`<button><!> </button>`),
  fe = k(`<div class="space-y-4"></div>`),
  pe = k(
    `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"> </span>`,
  ),
  me = k(`<div class="space-y-2"><!> <div class="flex gap-2 flex-wrap"></div></div>`),
  he = k(`<!> `, 1),
  ge = k(
    `<div class="flex items-center gap-4"><!> <div><div class="text-lg font-semibold"> </div> <div class="text-sm text-muted-foreground"> </div></div></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!> <p class="text-xs text-muted-foreground">Email cannot be changed</p></div> <!> <div class="pt-2"><!></div>`,
    1,
  ),
  _e = k(`<!> Light`, 1),
  ve = k(`<!> Dark`, 1),
  ye = k(`<!> `, 1),
  be = k(
    `<div class="space-y-3"><label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" class="h-4 w-4 rounded border-input"/> <span class="text-sm">Email on directory sync events</span></label> <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" class="h-4 w-4 rounded border-input"/> <span class="text-sm">Email on compliance score changes</span></label> <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" class="h-4 w-4 rounded border-input"/> <span class="text-sm">In-app alert notifications</span></label></div> <div class="pt-2"><!></div>`,
    1,
  ),
  xe = k(
    `<div class="space-y-3"><!> <div class="flex gap-2"><!> <!></div></div> <div class="space-y-3"><!> <!></div>`,
    1,
  ),
  Se = k(`<!> <p class="pl-7"> </p>`, 1),
  Ce = k(`<!> `, 1),
  we = k(
    `<div class="space-y-1"><h3 class="text-base font-semibold">Change Password</h3> <p class="text-sm text-muted-foreground">Update your account password</p></div> <!> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="pt-2"><!></div>`,
    1,
  ),
  Te = k(`<!> Manage MFA Settings`, 1),
  Ee = k(
    `<div class="space-y-1"><h3 class="text-base font-semibold">Multi-Factor Authentication</h3> <p class="text-sm text-muted-foreground">Add an extra layer of security to your account with TOTP-based MFA.</p></div> <!>`,
    1,
  ),
  De = k(`<!> <!>`, 1),
  Oe = k(
    `<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">My Account</h1> <div class="flex gap-1 border-b"></div> <!> <!> <!></div>`,
  );
function ke(k, ke) {
  O(ke, !1);
  let Ae = _(),
    je = [
      { id: `profile`, label: `Profile`, icon: ee },
      { id: `preferences`, label: `Preferences`, icon: ie },
      { id: `security`, label: `Security`, icon: oe },
    ],
    R = _(`profile`),
    z = _(!0),
    B = _(``),
    V = _(``),
    H = _([]),
    Me = _(``),
    U = _(!1),
    W = _(!0),
    G = _(!1),
    K = _(!1),
    q = _(!0),
    J = _(!1),
    Y = _(``),
    X = _(``),
    Z = _(``),
    Q = _(``),
    $ = _(!1),
    Ne = _(`dark`),
    Pe = ne.subscribe((e) => T(Ne, e));
  async function Fe() {
    T(z, !0);
    try {
      let e = await fetch(`/api/user/profile`);
      if (!e.ok) throw Error(`Failed to load profile`);
      let t = await e.json();
      (T(B, t.displayName || ``),
        T(V, t.email || ``),
        T(H, t.roles || []),
        T(Me, t.tenantId || ``));
    } catch (e) {
      M({ message: e?.message || `Failed to load profile`, variant: `error` });
    } finally {
      T(z, !1);
    }
  }
  async function Ie() {
    T(W, !0);
    try {
      let e = await fetch(`/api/user/preferences`);
      if (!e.ok) throw Error(`Failed to load preferences`);
      let t = await e.json();
      (T(G, t.notification_email_on_sync === `true`),
        T(K, t.notification_email_on_compliance === `true`),
        T(q, t.notification_in_app_alerts !== `false`));
    } catch {
    } finally {
      T(W, !1);
    }
  }
  async function Le() {
    T(U, !0);
    try {
      let e = await fetch(`/api/user/profile`, {
        method: `PATCH`,
        headers: { "content-type": `application/json` },
        body: JSON.stringify({ displayName: f(B) }),
      });
      if (!e.ok) {
        let t = await e.json().catch(() => ({}));
        throw Error(t.error || `Failed to save profile`);
      }
      (M({ message: `Profile updated`, variant: `success` }),
        ce.update((e) => e && { ...e, displayName: f(B) }));
    } catch (e) {
      M({ message: e?.message || `Failed to save`, variant: `error` });
    } finally {
      T(U, !1);
    }
  }
  async function Re() {
    T(J, !0);
    try {
      if (
        !(
          await fetch(`/api/user/preferences`, {
            method: `PATCH`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({
              notification_email_on_sync: String(f(G)),
              notification_email_on_compliance: String(f(K)),
              notification_in_app_alerts: String(f(q)),
            }),
          })
        ).ok
      )
        throw Error(`Failed to save preferences`);
      M({ message: `Preferences saved`, variant: `success` });
    } catch (e) {
      M({ message: e?.message || `Failed to save`, variant: `error` });
    } finally {
      T(J, !1);
    }
  }
  async function ze() {
    if ((T(Q, ``), f(X).length < 8)) {
      T(Q, `New password must be at least 8 characters`);
      return;
    }
    if (f(X) !== f(Z)) {
      T(Q, `Passwords do not match`);
      return;
    }
    T($, !0);
    try {
      let e = await fetch(`/api/user/password`, {
          method: `PATCH`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ currentPassword: f(Y), newPassword: f(X) }),
        }),
        t = await e.json().catch(() => ({}));
      if (!e.ok) {
        T(Q, t.error || `Failed to change password`);
        return;
      }
      (M({ message: `Password changed successfully`, variant: `success` }),
        T(Y, ``),
        T(X, ``),
        T(Z, ``));
    } catch (e) {
      T(Q, e?.message || `Failed to change password`);
    } finally {
      T($, !1);
    }
  }
  (C(() => (Fe(), Ie(), () => Pe())),
    p(
      () => f(B),
      () => {
        T(
          Ae,
          f(B)
            ? f(B)
                .split(/[\s@]/)
                .filter(Boolean)
                .slice(0, 2)
                .map((e) => e[0].toUpperCase())
                .join(``)
            : `?`,
        );
      },
    ),
    c(),
    v());
  var Be = Oe(),
    Ve = w(h(Be), 2);
  (o(
    Ve,
    5,
    () => je,
    s,
    (n, o) => {
      var s = de(),
        c = h(s);
      t(
        c,
        () => f(o).icon,
        (e, t) => {
          t(e, { class: `h-4 w-4` });
        },
      );
      var l = w(c);
      (u(s),
        e(() => {
          (E(
            s,
            1,
            `flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${(f(R), f(o), S(() => (f(R) === f(o).id ? `text-foreground border-b-2 border-primary` : `text-muted-foreground hover:text-foreground`))) ?? ``}`,
          ),
            i(l, ` ${(f(o), S(() => f(o).label)) ?? ``}`));
        }),
        r(`click`, s, () => T(R, f(o).id)),
        a(n, s));
    },
  ),
    u(Ve));
  var He = w(Ve, 2),
    Ue = (t) => {
      var r = l(),
        c = y(r),
        p = (e) => {
          var t = fe();
          (o(
            t,
            4,
            () => [1, 2, 3],
            s,
            (e, t) => {
              ue(e, { class: `h-12 rounded-lg` });
            },
          ),
            u(t),
            a(e, t));
        },
        m = (t) => {
          N(t, {
            children: (t, r) => {
              P(t, {
                class: `pt-6 space-y-5`,
                children: (t, r) => {
                  var c = ge(),
                    l = y(c),
                    p = h(l);
                  re(p, {
                    get initials() {
                      return f(Ae);
                    },
                    size: `lg`,
                    class: `h-16 w-16 text-xl`,
                  });
                  var m = w(p, 2),
                    g = h(m),
                    _ = h(g, !0);
                  u(g);
                  var v = w(g, 2),
                    b = h(v, !0);
                  (u(v), u(m), u(l));
                  var x = w(l, 2),
                    C = h(x);
                  (L(C, {
                    htmlFor: `display-name`,
                    children: (e, t) => {
                      (D(), a(e, d(`Display Name`)));
                    },
                    $$slots: { default: !0 },
                  }),
                    I(w(C, 2), {
                      id: `display-name`,
                      placeholder: `Your name`,
                      get value() {
                        return f(B);
                      },
                      set value(e) {
                        T(B, e);
                      },
                      $$legacy: !0,
                    }),
                    u(x));
                  var E = w(x, 2),
                    O = h(E);
                  (L(O, {
                    htmlFor: `email`,
                    children: (e, t) => {
                      (D(), a(e, d(`Email`)));
                    },
                    $$slots: { default: !0 },
                  }),
                    I(w(O, 2), {
                      id: `email`,
                      get value() {
                        return f(V);
                      },
                      disabled: !0,
                    }),
                    D(2),
                    u(E));
                  var k = w(E, 2),
                    A = (t) => {
                      var n = me(),
                        r = h(n);
                      L(r, {
                        children: (e, t) => {
                          (D(), a(e, d(`Roles`)));
                        },
                        $$slots: { default: !0 },
                      });
                      var c = w(r, 2);
                      (o(
                        c,
                        5,
                        () => f(H),
                        s,
                        (t, n) => {
                          var r = pe(),
                            o = h(r, !0);
                          (u(r), e(() => i(o, f(n))), a(t, r));
                        },
                      ),
                        u(c),
                        u(n),
                        a(t, n));
                    };
                  n(k, (e) => {
                    (f(H), S(() => f(H).length > 0) && e(A));
                  });
                  var j = w(k, 2);
                  (F(h(j), {
                    get disabled() {
                      return f(U);
                    },
                    $$events: { click: Le },
                    children: (t, n) => {
                      var r = he(),
                        o = y(r);
                      ae(o, { class: `h-4 w-4 mr-1.5` });
                      var s = w(o);
                      (e(() => i(s, ` ${f(U) ? `Saving...` : `Save Changes`}`)), a(t, r));
                    },
                    $$slots: { default: !0 },
                  }),
                    u(j),
                    e(() => {
                      (i(_, f(B) || f(V)), i(b, f(Me)));
                    }),
                    a(t, c));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          });
        };
      (n(c, (e) => {
        f(z) ? e(p) : e(m, -1);
      }),
        a(t, r));
    };
  n(He, (e) => {
    f(R) === `profile` && e(Ue);
  });
  var We = w(He, 2),
    Ge = (t) => {
      N(t, {
        children: (t, r) => {
          P(t, {
            class: `pt-6 space-y-6`,
            children: (t, r) => {
              var o = xe(),
                s = y(o),
                c = h(s);
              L(c, {
                children: (e, t) => {
                  (D(), a(e, d(`Theme`)));
                },
                $$slots: { default: !0 },
              });
              var l = w(c, 2),
                p = h(l);
              {
                let e = x(() => (f(Ne) === `light` ? `default` : `outline`));
                F(p, {
                  get variant() {
                    return f(e);
                  },
                  $$events: { click: () => A(`light`) },
                  children: (e, t) => {
                    var n = _e();
                    (te(y(n), { class: `h-4 w-4 mr-1.5` }), D(), a(e, n));
                  },
                  $$slots: { default: !0 },
                });
              }
              var g = w(p, 2);
              {
                let e = x(() => (f(Ne) === `dark` ? `default` : `outline`));
                F(g, {
                  get variant() {
                    return f(e);
                  },
                  $$events: { click: () => A(`dark`) },
                  children: (e, t) => {
                    var n = ve();
                    (j(y(n), { class: `h-4 w-4 mr-1.5` }), D(), a(e, n));
                  },
                  $$slots: { default: !0 },
                });
              }
              (u(l), u(s));
              var _ = w(s, 2),
                v = h(_);
              L(v, {
                children: (e, t) => {
                  (D(), a(e, d(`Notification Preferences`)));
                },
                $$slots: { default: !0 },
              });
              var S = w(v, 2),
                C = (e) => {
                  ue(e, { class: `h-24 rounded-lg` });
                },
                E = (t) => {
                  var n = be(),
                    r = y(n),
                    o = h(r),
                    s = h(o);
                  (m(s), D(2), u(o));
                  var c = w(o, 2),
                    l = h(c);
                  (m(l), D(2), u(c));
                  var d = w(c, 2),
                    p = h(d);
                  (m(p), D(2), u(d), u(r));
                  var g = w(r, 2);
                  (F(h(g), {
                    get disabled() {
                      return f(J);
                    },
                    $$events: { click: Re },
                    children: (t, n) => {
                      var r = ye(),
                        o = y(r);
                      ae(o, { class: `h-4 w-4 mr-1.5` });
                      var s = w(o);
                      (e(() => i(s, ` ${f(J) ? `Saving...` : `Save Preferences`}`)), a(t, r));
                    },
                    $$slots: { default: !0 },
                  }),
                    u(g),
                    b(
                      s,
                      () => f(G),
                      (e) => T(G, e),
                    ),
                    b(
                      l,
                      () => f(K),
                      (e) => T(K, e),
                    ),
                    b(
                      p,
                      () => f(q),
                      (e) => T(q, e),
                    ),
                    a(t, n));
                };
              (n(S, (e) => {
                f(W) ? e(C) : e(E, -1);
              }),
                u(_),
                a(t, o));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  n(We, (e) => {
    f(R) === `preferences` && e(Ge);
  });
  var Ke = w(We, 2),
    qe = (t) => {
      var r = De(),
        o = y(r);
      (N(o, {
        children: (t, r) => {
          P(t, {
            class: `pt-6 space-y-5`,
            children: (t, r) => {
              var o = we(),
                s = w(y(o), 2),
                c = (t) => {
                  le(t, {
                    variant: `destructive`,
                    children: (t, n) => {
                      var r = Se(),
                        o = y(r);
                      se(o, { class: `h-4 w-4` });
                      var s = w(o, 2),
                        c = h(s, !0);
                      (u(s), e(() => i(c, f(Q))), a(t, r));
                    },
                    $$slots: { default: !0 },
                  });
                };
              n(s, (e) => {
                f(Q) && e(c);
              });
              var l = w(s, 2),
                p = h(l);
              (L(p, {
                htmlFor: `current-password`,
                children: (e, t) => {
                  (D(), a(e, d(`Current Password`)));
                },
                $$slots: { default: !0 },
              }),
                I(w(p, 2), {
                  id: `current-password`,
                  type: `password`,
                  get value() {
                    return f(Y);
                  },
                  set value(e) {
                    T(Y, e);
                  },
                  $$legacy: !0,
                }),
                u(l));
              var m = w(l, 2),
                g = h(m);
              (L(g, {
                htmlFor: `new-password`,
                children: (e, t) => {
                  (D(), a(e, d(`New Password`)));
                },
                $$slots: { default: !0 },
              }),
                I(w(g, 2), {
                  id: `new-password`,
                  type: `password`,
                  placeholder: `At least 8 characters`,
                  get value() {
                    return f(X);
                  },
                  set value(e) {
                    T(X, e);
                  },
                  $$legacy: !0,
                }),
                u(m));
              var _ = w(m, 2),
                v = h(_);
              (L(v, {
                htmlFor: `confirm-password`,
                children: (e, t) => {
                  (D(), a(e, d(`Confirm New Password`)));
                },
                $$slots: { default: !0 },
              }),
                I(w(v, 2), {
                  id: `confirm-password`,
                  type: `password`,
                  get value() {
                    return f(Z);
                  },
                  set value(e) {
                    T(Z, e);
                  },
                  $$legacy: !0,
                }),
                u(_));
              var b = w(_, 2),
                S = h(b);
              {
                let t = x(() => f($) || !f(Y) || !f(X) || !f(Z));
                F(S, {
                  get disabled() {
                    return f(t);
                  },
                  $$events: { click: ze },
                  children: (t, n) => {
                    var r = Ce(),
                      o = y(r);
                    oe(o, { class: `h-4 w-4 mr-1.5` });
                    var s = w(o);
                    (e(() => i(s, ` ${f($) ? `Changing...` : `Change Password`}`)), a(t, r));
                  },
                  $$slots: { default: !0 },
                });
              }
              (u(b), a(t, o));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      }),
        N(w(o, 2), {
          children: (e, t) => {
            P(e, {
              class: `pt-6 space-y-3`,
              children: (e, t) => {
                var n = Ee();
                (F(w(y(n), 2), {
                  variant: `outline`,
                  href: `/console/settings/security`,
                  children: (e, t) => {
                    var n = Te();
                    (oe(y(n), { class: `h-4 w-4 mr-1.5` }), D(), a(e, n));
                  },
                  $$slots: { default: !0 },
                }),
                  a(e, n));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        }),
        a(t, r));
    };
  (n(Ke, (e) => {
    f(R) === `security` && e(qe);
  }),
    u(Be),
    a(k, Be),
    g());
}
export { ke as component };
