import {
  $ as e,
  F as t,
  H as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Q as s,
  S as c,
  Tt as l,
  V as u,
  W as d,
  Z as f,
  at as p,
  b as m,
  bt as h,
  ct as g,
  gt as ee,
  ht as _,
  l as v,
  ot as y,
  pt as b,
  q as x,
  r as S,
  st as C,
  ut as w,
  v as T,
  w as E,
  wt as D,
  x as O,
  xt as k,
  z as A,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as j } from "../chunks/D8pbUplu.js";
import { n as M } from "../chunks/D4lFFHu4.js";
import { t as te } from "../chunks/gpmMc_Bx.js";
import { t as ne } from "../chunks/BGY9DLPb.js";
import { t as re } from "../chunks/B_kQVdkE2.js";
import { t as ie } from "../chunks/CMGwYO6i2.js";
import { t as ae } from "../chunks/Cq3i_Tgy2.js";
import { t as oe } from "../chunks/BXmH0DjJ2.js";
import { n as se, t as ce } from "../chunks/BEJa09Kq2.js";
import { t as N } from "../chunks/Cue2Cs472.js";
import { t as le } from "../chunks/DmQt9wwK2.js";
import { t as ue } from "../chunks/DOfJvt542.js";
import { t as de } from "../chunks/C8W1vu9i2.js";
import { t as P } from "../chunks/ejJaicvO2.js";
import { t as fe } from "../chunks/oRaErrij2.js";
import { t as F } from "../chunks/CohZSUWO.js";
import { n as I, t as L } from "../chunks/WlkLV7O8.js";
import { t as R } from "../chunks/Bsj77roc.js";
var pe = A(`<!> Invite User`, 1),
  me = A(`<a> </a>`),
  he = A(`<!> <p class="pl-7"> </p>`, 1),
  ge = A(`<div class="space-y-3"></div>`),
  _e = A(`<!> Remove`, 1),
  ve = A(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3 font-medium"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3"><div class="flex gap-2 items-center"><select class="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>super-admin</option><option>admin</option><option>member</option></select> <!></div></td></tr>`,
  ),
  ye = A(`<!> Invite Your First User`, 1),
  be = A(
    `<tr><td colspan="5" class="px-4 py-10 text-center"><!> <p class="text-muted-foreground font-medium mb-1">Invite your first team member</p> <p class="text-muted-foreground text-xs mb-3">Add admins or members to collaborate on your organization's IT management.</p> <!></td></tr>`,
  ),
  xe = A(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Name</th><th class="px-4 py-3 font-medium">Email</th><th class="px-4 py-3 font-medium">Role</th><th class="px-4 py-3 font-medium">Last Login</th><th class="px-4 py-3 font-medium">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  Se = A(
    `<!> <div class="space-y-3"><p class="text-sm text-muted-foreground">User invited. Share this temporary password:</p> <div class="flex items-center gap-2"><code class="flex-1 bg-muted border rounded-md px-3 py-2 text-sm font-mono"> </code> <!></div></div> <!>`,
    1,
  ),
  Ce = A(`Email <span class="text-destructive">*</span>`, 1),
  we = A(`<p class="text-sm text-destructive"> </p>`),
  Te = A(`<!> <!>`, 1),
  Ee = A(
    `<!> <div class="space-y-4"><div class="space-y-2"><!> <!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <select id="invite-role" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Member</option><option>Admin</option><option>Super Admin</option></select></div></div> <!>`,
    1,
  ),
  De = A(`<!> <!>`, 1),
  Oe = A(
    `<!> <p class="text-sm text-muted-foreground">Are you sure you want to remove <strong class="text-foreground"> </strong>? They will lose access immediately.</p> <!>`,
    1,
  ),
  ke = A(
    `<div class="space-y-6"><a href="/console/directory" class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm hover:bg-primary/10 transition-colors"><span class="text-foreground"><strong>Directory:</strong> View all organization users and groups in the Directory</span> <!></a> <div class="flex justify-between items-center"><h1 class="text-2xl font-semibold tracking-tight">User Management</h1> <!></div> <div class="flex gap-1 border-b"></div> <!> <!></div> <!> <!> <!>`,
    1,
  );
function Ae(A, Ae) {
  k(Ae, !1);
  let je = () => ee(j, `$page`, Me),
    [Me, Ne] = _(),
    Pe = g(),
    Fe = [
      { href: `/console/settings`, label: `General` },
      { href: `/console/settings/users`, label: `Users` },
      { href: `/console/settings/audit-log`, label: `Audit Log` },
      { href: `/console/settings/billing`, label: `Billing` },
      { href: `/console/settings/trust`, label: `Trust Center` },
      { href: `/console/settings/incidents`, label: `Incidents` },
      { href: `/console/settings/security`, label: `Security` },
      { href: `/console/settings/notifications`, label: `Notifications` },
    ],
    z = g([]),
    B = g(!0),
    V = g(``),
    H = g(!1),
    U = g(``),
    W = g(``),
    G = g(`member`),
    K = g(!1),
    q = g(``),
    J = g(``),
    Y = g(!1),
    X = g(null);
  async function Z() {
    (w(B, !0), w(V, ``));
    try {
      let e = await fetch(`/api/tenant/users`);
      if (!e.ok) throw Error(`Failed to load users (${e.status})`);
      w(z, await e.json());
    } catch (e) {
      w(V, e?.message || `Failed to load users`);
    } finally {
      w(B, !1);
    }
  }
  function Ie() {
    (w(U, ``), w(W, ``), w(G, `member`), w(q, ``), w(J, ``), w(H, !0));
  }
  function Q() {
    (w(H, !1), w(q, ``));
  }
  async function Le() {
    if (d(U)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d(U))) {
        w(J, `Please enter a valid email address`);
        return;
      }
      (w(J, ``), w(K, !0));
      try {
        let e = await fetch(`/api/tenant/users/invite`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ email: d(U), displayName: d(W) || void 0, role: d(G) }),
        });
        if (!e.ok) throw Error(`Failed to invite user`);
        (w(q, (await e.json()).tempPassword || ``),
          M({ message: `User invited successfully`, variant: `success` }),
          await Z());
      } catch (e) {
        M({ message: e?.message || `Failed to invite user`, variant: `error` });
      } finally {
        w(K, !1);
      }
    }
  }
  async function Re() {
    try {
      (await navigator.clipboard.writeText(d(q)),
        M({ message: `Temporary password copied`, variant: `success` }));
    } catch {
      M({ message: `Failed to copy password`, variant: `error` });
    }
  }
  async function ze(e, t) {
    try {
      if (
        !(
          await fetch(`/api/tenant/users/${e.id}`, {
            method: `PATCH`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ roles: [t] }),
          })
        ).ok
      )
        throw Error(`Failed to update role`);
      ((e.role = t), w(z, d(z)), M({ message: `Role updated to ${t}`, variant: `success` }));
    } catch (e) {
      M({ message: e?.message || `Failed to update role`, variant: `error` });
    }
  }
  function Be(e) {
    (w(X, e), w(Y, !0));
  }
  function Ve() {
    (w(Y, !1), w(X, null));
  }
  async function He() {
    if (d(X))
      try {
        if (!(await fetch(`/api/tenant/users/${d(X).id}`, { method: `DELETE` })).ok)
          throw Error(`Failed to remove user`);
        (M({ message: `User removed`, variant: `success` }), Ve(), await Z());
      } catch (e) {
        M({ message: e?.message || `Failed to remove user`, variant: `error` });
      }
  }
  (S(Z),
    f(
      () => je(),
      () => {
        w(Pe, je().url.pathname);
      },
    ),
    s(),
    v());
  var Ue = ke(),
    We = y(Ue),
    $ = p(We);
  (ne(C(p($), 2), { class: `h-4 w-4 text-primary shrink-0` }), l($));
  var Ge = C($, 2);
  (N(C(p(Ge), 2), {
    size: `sm`,
    $$events: { click: Ie },
    children: (e, t) => {
      var n = pe();
      (ae(y(n), { class: `h-4 w-4 mr-1.5` }), D(), i(e, n));
    },
    $$slots: { default: !0 },
  }),
    l(Ge));
  var Ke = C(Ge, 2);
  (a(
    Ke,
    5,
    () => Fe,
    o,
    (t, n) => {
      var a = me(),
        o = p(a, !0);
      (l(a),
        e(() => {
          (T(a, `href`, (d(n), x(() => d(n).href))),
            E(
              a,
              1,
              `px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${(d(Pe), d(n), x(() => (d(Pe) === d(n).href ? `text-foreground border-b-2 border-primary` : `text-muted-foreground hover:text-foreground`))) ?? ``}`,
            ),
            r(o, (d(n), x(() => d(n).label))));
        }),
        i(t, a));
    },
  ),
    l(Ke));
  var qe = C(Ke, 2),
    Je = (t) => {
      ue(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = he(),
            o = y(a);
          ie(o, { class: `h-4 w-4` });
          var s = C(o, 2),
            c = p(s, !0);
          (l(s), e(() => r(c, d(V))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  t(qe, (e) => {
    d(V) && e(Je);
  });
  var Ye = C(qe, 2),
    Xe = (e) => {
      var t = ge();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          fe(e, { class: `h-14 rounded-lg` });
        },
      ),
        l(t),
        i(e, t));
    },
    Ze = (t) => {
      se(t, {
        children: (t, s) => {
          ce(t, {
            class: `p-0`,
            children: (t, s) => {
              var f = xe(),
                m = p(f),
                h = C(p(m));
              (a(
                h,
                5,
                () => d(z),
                o,
                (t, a) => {
                  var o = ve(),
                    s = p(o),
                    f = p(s, !0);
                  l(s);
                  var m = C(s),
                    h = p(m, !0);
                  l(m);
                  var g = C(m),
                    ee = p(g);
                  {
                    let t = b(
                      () => (d(a), x(() => (d(a).role === `admin` ? `default` : `secondary`))),
                    );
                    le(ee, {
                      get variant() {
                        return d(t);
                      },
                      children: (t, n) => {
                        D();
                        var o = u();
                        (e(() => r(o, (d(a), x(() => d(a).role)))), i(t, o));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  l(g);
                  var _ = C(g),
                    v = p(_, !0);
                  l(_);
                  var S = C(_),
                    w = p(S),
                    T = p(w),
                    E = p(T);
                  E.value = E.__value = `super-admin`;
                  var k = C(E);
                  k.value = k.__value = `admin`;
                  var A = C(k);
                  ((A.value = A.__value = `member`), l(T));
                  var j;
                  (O(T),
                    N(C(T, 2), {
                      size: `sm`,
                      variant: `destructive`,
                      $$events: { click: () => Be(d(a)) },
                      children: (e, t) => {
                        var n = _e();
                        (re(y(n), { class: `h-3 w-3 mr-1` }), D(), i(e, n));
                      },
                      $$slots: { default: !0 },
                    }),
                    l(w),
                    l(S),
                    l(o),
                    e(
                      (e) => {
                        (r(f, (d(a), x(() => d(a).displayName || `---`))),
                          r(h, (d(a), x(() => d(a).email))),
                          r(v, e),
                          j !== (j = (d(a), x(() => d(a).role))) &&
                            ((T.value = (T.__value = (d(a), x(() => d(a).role))) ?? ``),
                            c(T, (d(a), x(() => d(a).role)))));
                      },
                      [
                        () => (
                          d(a),
                          x(() =>
                            d(a).lastLogin
                              ? new Date(d(a).lastLogin).toLocaleDateString()
                              : `Never`,
                          )
                        ),
                      ],
                    ),
                    n(`change`, T, (e) => ze(d(a), e.currentTarget.value)),
                    i(t, o));
                },
                (e) => {
                  var t = be(),
                    n = p(t),
                    r = p(n);
                  (oe(r, { class: `h-10 w-10 mx-auto mb-3 text-muted-foreground/30` }),
                    N(C(r, 6), {
                      $$events: { click: Ie },
                      children: (e, t) => {
                        var n = ye();
                        (ae(y(n), { class: `h-4 w-4 mr-1.5` }), D(), i(e, n));
                      },
                      $$slots: { default: !0 },
                    }),
                    l(n),
                    l(t),
                    i(e, t));
                },
              ),
                l(h),
                l(m),
                l(f),
                i(t, f));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (t(Ye, (e) => {
    d(B) ? e(Xe) : e(Ze, -1);
  }),
    l(We));
  var Qe = C(We, 2);
  {
    let t = b(() => d(H) && !!d(q));
    F(Qe, {
      get open() {
        return d(t);
      },
      onClose: Q,
      children: (t, n) => {
        var a = Se(),
          o = y(a);
        I(o, {
          children: (e, t) => {
            L(e, {
              children: (e, t) => {
                (D(), i(e, u(`User Invited`)));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        });
        var s = C(o, 2),
          c = C(p(s), 2),
          f = p(c),
          m = p(f, !0);
        (l(f),
          N(C(f, 2), {
            size: `sm`,
            variant: `outline`,
            $$events: { click: Re },
            children: (e, t) => {
              te(e, { class: `h-4 w-4` });
            },
            $$slots: { default: !0 },
          }),
          l(c),
          l(s),
          R(C(s, 2), {
            children: (e, t) => {
              N(e, {
                variant: `outline`,
                $$events: { click: Q },
                children: (e, t) => {
                  (D(), i(e, u(`Done`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
          e(() => r(m, d(q))),
          i(t, a));
      },
      $$slots: { default: !0 },
    });
  }
  var $e = C(Qe, 2);
  {
    let n = b(() => d(H) && !d(q));
    F($e, {
      get open() {
        return d(n);
      },
      onClose: Q,
      children: (n, a) => {
        var o = Ee(),
          s = y(o);
        I(s, {
          children: (e, t) => {
            L(e, {
              children: (e, t) => {
                (D(), i(e, u(`Invite User`)));
              },
              $$slots: { default: !0 },
            });
          },
          $$slots: { default: !0 },
        });
        var c = C(s, 2),
          f = p(c),
          h = p(f);
        P(h, {
          htmlFor: `invite-email`,
          children: (e, t) => {
            D();
            var n = Ce();
            (D(), i(e, n));
          },
          $$slots: { default: !0 },
        });
        var g = C(h, 2);
        de(g, {
          id: `invite-email`,
          type: `email`,
          get value() {
            return d(U);
          },
          set value(e) {
            w(U, e);
          },
          $$legacy: !0,
        });
        var ee = C(g, 2),
          _ = (t) => {
            var n = we(),
              a = p(n, !0);
            (l(n), e(() => r(a, d(J))), i(t, n));
          };
        (t(ee, (e) => {
          d(J) && e(_);
        }),
          l(f));
        var v = C(f, 2),
          x = p(v);
        (P(x, {
          htmlFor: `invite-name`,
          children: (e, t) => {
            (D(), i(e, u(`Display Name`)));
          },
          $$slots: { default: !0 },
        }),
          de(C(x, 2), {
            id: `invite-name`,
            get value() {
              return d(W);
            },
            set value(e) {
              w(W, e);
            },
            $$legacy: !0,
          }),
          l(v));
        var S = C(v, 2),
          T = p(S);
        P(T, {
          htmlFor: `invite-role`,
          children: (e, t) => {
            (D(), i(e, u(`Role`)));
          },
          $$slots: { default: !0 },
        });
        var E = C(T, 2),
          O = p(E);
        O.value = O.__value = `member`;
        var k = C(O);
        k.value = k.__value = `admin`;
        var A = C(k);
        ((A.value = A.__value = `super-admin`),
          l(E),
          l(S),
          l(c),
          R(C(c, 2), {
            children: (t, n) => {
              var a = Te(),
                o = y(a);
              N(o, {
                variant: `outline`,
                $$events: { click: Q },
                children: (e, t) => {
                  (D(), i(e, u(`Cancel`)));
                },
                $$slots: { default: !0 },
              });
              var s = C(o, 2);
              {
                let t = b(() => !d(U) || d(K));
                N(s, {
                  get disabled() {
                    return d(t);
                  },
                  $$events: { click: Le },
                  children: (t, n) => {
                    D();
                    var a = u();
                    (e(() => r(a, d(K) ? `Inviting...` : `Send Invite`)), i(t, a));
                  },
                  $$slots: { default: !0 },
                });
              }
              i(t, a);
            },
            $$slots: { default: !0 },
          }),
          m(
            E,
            () => d(G),
            (e) => w(G, e),
          ),
          i(n, o));
      },
      $$slots: { default: !0 },
    });
  }
  (F(C($e, 2), {
    get open() {
      return d(Y);
    },
    onClose: Ve,
    children: (t, n) => {
      var a = Oe(),
        o = y(a);
      I(o, {
        children: (e, t) => {
          L(e, {
            children: (e, t) => {
              (D(), i(e, u(`Remove User`)));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
      var s = C(o, 2),
        c = C(p(s)),
        f = p(c, !0);
      (l(c),
        D(),
        l(s),
        R(C(s, 2), {
          children: (e, t) => {
            var n = De(),
              r = y(n);
            (N(r, {
              variant: `outline`,
              $$events: { click: Ve },
              children: (e, t) => {
                (D(), i(e, u(`Cancel`)));
              },
              $$slots: { default: !0 },
            }),
              N(C(r, 2), {
                variant: `destructive`,
                $$events: { click: He },
                children: (e, t) => {
                  (D(), i(e, u(`Remove`)));
                },
                $$slots: { default: !0 },
              }),
              i(e, n));
          },
          $$slots: { default: !0 },
        }),
        e(() => r(f, (d(X), x(() => d(X)?.email)))),
        i(t, a));
    },
    $$slots: { default: !0 },
  }),
    i(A, Ue),
    h(),
    Ne());
}
export { Ae as component };
