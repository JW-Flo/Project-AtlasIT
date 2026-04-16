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
  pt as y,
  q as b,
  r as x,
  st as S,
  ut as C,
  v as w,
  wt as T,
  xt as E,
  z as D,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as O } from "../chunks/D8pbUplu.js";
import { n as k } from "../chunks/D4lFFHu4.js";
import { t as ee } from "../chunks/Bv2yVmao.js";
import { t as A } from "../chunks/BZ8YNDoC.js";
import { t as te } from "../chunks/FF_0sOmu.js";
import { t as ne } from "../chunks/Bh_67ZLW.js";
import { t as re } from "../chunks/B_kQVdkE2.js";
import { t as j } from "../chunks/BXmH0DjJ2.js";
import { t as ie } from "../chunks/elp0DnJy2.js";
import { n as M, t as N } from "../chunks/BEJa09Kq2.js";
import { t as P } from "../chunks/Da7GIpgR2.js";
import { t as ae } from "../chunks/B2LjsFjQ2.js";
import { t as F } from "../chunks/Cue2Cs472.js";
import { t as I } from "../chunks/DmQt9wwK2.js";
import { t as oe } from "../chunks/C8W1vu9i2.js";
import { t as L } from "../chunks/ejJaicvO2.js";
import { t as R } from "../chunks/oRaErrij2.js";
var se = D(`<div class="space-y-4"><!> <!></div>`),
  z = D(`<p class="text-destructive"> </p> <!>`, 1),
  ce = D(`<!> `, 1),
  le = D(`<p class="text-sm text-muted-foreground"> </p>`),
  ue = D(`<!> `, 1),
  de = D(
    `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div></div> <div class="flex justify-end pt-2"><!></div>`,
    1,
  ),
  fe = D(`<!> <!>`, 1),
  pe = D(`<div class="flex items-center justify-between"><!> <!></div>`),
  me = D(`<option> </option>`),
  he = D(`<!> `, 1),
  ge = D(`<!> Remove`, 1),
  _e = D(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3"><a class="font-medium text-primary hover:underline"> </a></td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-muted-foreground"> </td><td class="px-4 py-3 text-right"><!></td></tr>`,
  ),
  ve = D(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Name</th><th class="px-4 py-3 font-medium">Email</th><th class="px-4 py-3 font-medium">Department</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Joined</th><th class="px-4 py-3 font-medium text-right">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  ye = D(
    `<div class="text-center py-8"><!> <p class="text-muted-foreground text-sm">No members in this group</p></div>`,
  ),
  be = D(
    `<div class="flex items-end gap-2"><div class="flex-1 space-y-2"><!> <div class="flex gap-2"><!> <select id="add-member" class="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Select a user...</option><!></select></div></div> <!></div> <!> <!>`,
    1,
  ),
  xe = D(`<!> <!>`, 1),
  Se = D(`<div class="flex items-center justify-between"><!> <!></div>`),
  Ce = D(`<option> </option>`),
  we = D(`<!> Assign`, 1),
  Te = D(`<!> Remove`, 1),
  Ee = D(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3 font-medium flex items-center gap-2"><!> </td><td class="px-4 py-3"><!></td><td class="px-4 py-3 text-right"><!></td></tr>`,
  ),
  De = D(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Application</th><th class="px-4 py-3 font-medium">Role</th><th class="px-4 py-3 font-medium text-right">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  Oe = D(
    `<div class="text-center py-6"><!> <p class="text-muted-foreground text-sm">No applications assigned to this group</p></div>`,
  ),
  ke = D(
    `<div class="flex items-end gap-2"><div class="flex-1 space-y-2"><!> <div class="flex gap-2"><select id="assign-app" class="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Select application...</option><!></select> <select class="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Member</option><option>Admin</option><option>Viewer</option><option>Editor</option></select></div></div> <!></div> <!> <!>`,
    1,
  ),
  Ae = D(`<!> <!>`, 1),
  je = D(`<span> </span>`),
  Me = D(
    `<div class="flex items-center justify-between flex-wrap gap-4"><div><div class="flex items-center gap-3 mb-1"><h1 class="text-2xl font-semibold tracking-tight"> </h1> <!></div> <!></div></div> <!> <!> <!> <div class="text-xs text-muted-foreground flex gap-4"><span> </span> <span> </span> <!></div>`,
    1,
  ),
  Ne = D(
    `<div class="space-y-6"><a href="/console/directory" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><!> Back to Directory</a> <!></div>`,
  );
function B(D, B) {
  E(B, !1);
  let Pe = () => h(O, `$page`, Fe),
    [Fe, Ie] = g(),
    V = m(),
    Le = m(),
    Re = m(),
    H = m(null),
    U = m([]),
    ze = m([]),
    Be = m(!0),
    W = m(!1),
    G = m(``),
    K = m(``),
    q = m(``),
    J = m(``),
    Y = m(``),
    X = m(!1),
    Ve = m([]),
    Z = m([]),
    Q = m(``),
    $ = m(`member`);
  function He(e, t) {
    return t && t !== `-`
      ? t
      : e
          .split(`@`)[0]
          .split(/[._-]/)
          .map((e) => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase())
          .join(` `);
  }
  function Ue(e) {
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
  async function We() {
    (C(Be, !0), C(G, ``));
    try {
      let e = await fetch(`/api/directory/groups/${l(V)}`);
      if (!e.ok) throw Error(`Failed to load group (${e.status})`);
      let t = await e.json();
      (C(H, t.group),
        C(U, t.members || []),
        t.appMappings &&
          C(
            Z,
            t.appMappings.map((e) => ({ id: e.id, appId: e.appId || e.app_id, role: e.role })),
          ),
        l(H) && (C(K, l(H).name || ``), C(q, l(H).description || ``)));
    } catch (e) {
      C(G, e?.message || `Failed to load group`);
    } finally {
      C(Be, !1);
    }
  }
  async function Ge() {
    try {
      let e = await fetch(`/api/directory/users?limit=500`);
      e.ok && C(ze, (await e.json()).users || []);
    } catch {}
  }
  async function Ke() {
    if (l(H)) {
      C(W, !0);
      try {
        let e = await fetch(`/api/directory/groups/${l(V)}`, {
          method: `PATCH`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ name: l(K), description: l(q) }),
        });
        if (!e.ok) throw Error(`Failed to save group`);
        let t = await e.json();
        (C(H, { ...l(H), ...t.group }), k({ message: `Group updated`, variant: `success` }));
      } catch (e) {
        k({ message: e?.message || `Failed to save group`, variant: `error` });
      } finally {
        C(W, !1);
      }
    }
  }
  async function qe() {
    if (l(Y)) {
      C(X, !0);
      try {
        if (
          !(
            await fetch(`/api/directory/groups/${l(V)}/members`, {
              method: `POST`,
              headers: { "content-type": `application/json` },
              body: JSON.stringify({ userId: l(Y) }),
            })
          ).ok
        )
          throw Error(`Failed to add member`);
        (k({ message: `Member added`, variant: `success` }), C(Y, ``), C(J, ``), await We());
      } catch (e) {
        k({ message: e?.message || `Failed to add member`, variant: `error` });
      } finally {
        C(X, !1);
      }
    }
  }
  async function Je(e) {
    try {
      if (
        !(
          await fetch(`/api/directory/groups/${l(V)}/members`, {
            method: `DELETE`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ userId: e }),
          })
        ).ok
      )
        throw Error(`Failed to remove member`);
      (k({ message: `Member removed`, variant: `success` }),
        C(
          U,
          l(U).filter((t) => t.id !== e),
        ));
    } catch (e) {
      k({ message: e?.message || `Failed to remove member`, variant: `error` });
    }
  }
  async function Ye() {
    try {
      let e = await fetch(`/api/apps/status`);
      e.ok &&
        C(
          Ve,
          ((await e.json()).applications || []).filter((e) => e.connected),
        );
    } catch {}
  }
  async function Xe() {
    if (!(!l(Q) || l(Z).some((e) => e.appId === l(Q))))
      try {
        let e = await fetch(`/api/directory/mappings`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({ groupId: l(H).id, appId: l(Q), role: l($) || `member` }),
        });
        if (!e.ok) throw Error(`Failed to save`);
        let t = await e.json();
        (C(Z, [...l(Z), { id: t.mapping?.id, appId: l(Q), role: l($) || `member` }]),
          C(Q, ``),
          C($, `member`));
      } catch {
        k({ title: `Error`, description: `Failed to assign app`, variant: `destructive` });
      }
  }
  async function Ze(e) {
    let t = l(Z).find((t) => t.appId === e);
    (t?.id && (await fetch(`/api/directory/mappings?id=${t.id}`, { method: `DELETE` })),
      C(
        Z,
        l(Z).filter((t) => t.appId !== e),
      ));
  }
  (x(() => {
    (We(), Ge(), Ye());
  }),
    u(
      () => Pe(),
      () => {
        C(V, Pe().params.id);
      },
    ),
    u(
      () => l(U),
      () => {
        C(Le, new Set(l(U).map((e) => e.id)));
      },
    ),
    u(
      () => (l(ze), l(Le), l(J)),
      () => {
        C(
          Re,
          l(ze)
            .filter((e) => !l(Le).has(e.id))
            .filter((e) => {
              if (!l(J)) return !0;
              let t = l(J).toLowerCase();
              return e.name.toLowerCase().includes(t) || e.email.toLowerCase().includes(t);
            }),
        );
      },
    ),
    o(),
    _());
  var Qe = Ne(),
    $e = d(Qe);
  (A(d($e), { class: `h-4 w-4` }), T(), s($e));
  var et = S($e, 2),
    tt = (e) => {
      var t = se(),
        n = d(t);
      (R(n, { class: `h-8 w-64` }), R(S(n, 2), { class: `h-64 w-full rounded-lg` }), s(t), r(e, t));
    },
    nt = (t) => {
      M(t, {
        children: (t, i) => {
          N(t, {
            class: `py-8 text-center`,
            children: (t, i) => {
              var a = z(),
                o = v(a),
                u = d(o, !0);
              (s(o),
                F(S(o, 2), {
                  variant: `outline`,
                  class: `mt-4`,
                  $$events: { click: We },
                  children: (e, t) => {
                    (T(), r(e, c(`Retry`)));
                  },
                  $$slots: { default: !0 },
                }),
                e(() => n(u, l(G))),
                r(t, a));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    rt = (o) => {
      var u = Me(),
        p = v(u),
        m = d(p),
        h = d(m),
        g = d(h),
        _ = d(g, !0);
      (s(g),
        I(S(g, 2), {
          variant: `secondary`,
          children: (t, i) => {
            var a = ce(),
              o = v(a);
            j(o, { class: `h-3 w-3 mr-1` });
            var s = S(o);
            (e(() => n(s, ` ${(l(U), b(() => l(U).length)) ?? ``} members`)), r(t, a));
          },
          $$slots: { default: !0 },
        }),
        s(h));
      var x = S(h, 2),
        E = (t) => {
          var i = le(),
            a = d(i, !0);
          (s(i), e(() => n(a, (l(H), b(() => l(H).description)))), r(t, i));
        };
      (t(x, (e) => {
        (l(H), b(() => l(H).description) && e(E));
      }),
        s(m),
        s(p));
      var D = S(p, 2);
      M(D, {
        children: (t, i) => {
          var a = fe(),
            o = v(a);
          (P(o, {
            children: (e, t) => {
              ae(e, {
                children: (e, t) => {
                  (T(), r(e, c(`Group Details`)));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            N(S(o, 2), {
              class: `space-y-4`,
              children: (t, i) => {
                var a = de(),
                  o = v(a),
                  u = d(o),
                  f = d(u);
                (L(f, {
                  htmlFor: `edit-name`,
                  children: (e, t) => {
                    (T(), r(e, c(`Name`)));
                  },
                  $$slots: { default: !0 },
                }),
                  oe(S(f, 2), {
                    id: `edit-name`,
                    get value() {
                      return l(K);
                    },
                    set value(e) {
                      C(K, e);
                    },
                    $$legacy: !0,
                  }),
                  s(u));
                var p = S(u, 2),
                  m = d(p);
                (L(m, {
                  htmlFor: `edit-description`,
                  children: (e, t) => {
                    (T(), r(e, c(`Description`)));
                  },
                  $$slots: { default: !0 },
                }),
                  oe(S(m, 2), {
                    id: `edit-description`,
                    get value() {
                      return l(q);
                    },
                    set value(e) {
                      C(q, e);
                    },
                    $$legacy: !0,
                  }),
                  s(p),
                  s(o));
                var h = S(o, 2),
                  g = d(h);
                {
                  let t = y(() => l(W) || !l(K));
                  F(g, {
                    get disabled() {
                      return l(t);
                    },
                    $$events: { click: Ke },
                    children: (t, i) => {
                      var a = ue(),
                        o = v(a);
                      ne(o, { class: `h-4 w-4 mr-1.5` });
                      var s = S(o);
                      (e(() => n(s, ` ${l(W) ? `Saving...` : `Save Changes`}`)), r(t, a));
                    },
                    $$slots: { default: !0 },
                  });
                }
                (s(h), r(t, a));
              },
              $$slots: { default: !0 },
            }),
            r(t, a));
        },
        $$slots: { default: !0 },
      });
      var O = S(D, 2);
      M(O, {
        children: (o, u) => {
          var p = xe(),
            m = v(p);
          (P(m, {
            children: (t, i) => {
              var a = pe(),
                o = d(a);
              (ae(o, {
                children: (e, t) => {
                  (T(), r(e, c(`Members`)));
                },
                $$slots: { default: !0 },
              }),
                I(S(o, 2), {
                  variant: `secondary`,
                  children: (t, i) => {
                    T();
                    var a = c();
                    (e(() => n(a, (l(U), b(() => l(U).length)))), r(t, a));
                  },
                  $$slots: { default: !0 },
                }),
                s(a),
                r(t, a));
            },
            $$slots: { default: !0 },
          }),
            N(S(m, 2), {
              class: `space-y-4`,
              children: (o, u) => {
                var p = be(),
                  m = v(p),
                  h = d(m),
                  g = d(h);
                L(g, {
                  htmlFor: `add-member`,
                  children: (e, t) => {
                    (T(), r(e, c(`Add Member`)));
                  },
                  $$slots: { default: !0 },
                });
                var _ = S(g, 2),
                  x = d(_);
                oe(x, {
                  id: `add-member-search`,
                  placeholder: `Search users...`,
                  class: `max-w-xs`,
                  get value() {
                    return l(J);
                  },
                  set value(e) {
                    C(J, e);
                  },
                  $$legacy: !0,
                });
                var E = S(x, 2),
                  D = d(E);
                ((D.value = D.__value = ``),
                  i(
                    S(D),
                    1,
                    () => l(Re),
                    a,
                    (t, i) => {
                      var a = me(),
                        o = d(a);
                      s(a);
                      var c = {};
                      (e(() => {
                        (n(
                          o,
                          `${(l(i), b(() => l(i).name || l(i).email)) ?? ``} (${(l(i), b(() => l(i).email)) ?? ``})`,
                        ),
                          c !== (c = (l(i), b(() => l(i).id))) &&
                            (a.value = (a.__value = (l(i), b(() => l(i).id))) ?? ``));
                      }),
                        r(t, a));
                    },
                  ),
                  s(E),
                  s(_),
                  s(h));
                var O = S(h, 2);
                {
                  let t = y(() => !l(Y) || l(X));
                  F(O, {
                    get disabled() {
                      return l(t);
                    },
                    $$events: { click: qe },
                    children: (t, i) => {
                      var a = he(),
                        o = v(a);
                      te(o, { class: `h-4 w-4 mr-1.5` });
                      var s = S(o);
                      (e(() => n(s, ` ${l(X) ? `Adding...` : `Add`}`)), r(t, a));
                    },
                    $$slots: { default: !0 },
                  });
                }
                s(m);
                var k = S(m, 2);
                ie(k, {});
                var ee = S(k, 2),
                  A = (t) => {
                    var o = ve(),
                      u = d(o),
                      f = S(d(u));
                    (i(
                      f,
                      5,
                      () => l(U),
                      a,
                      (t, i) => {
                        var a = _e(),
                          o = d(a),
                          u = d(o),
                          f = d(u, !0);
                        (s(u), s(o));
                        var p = S(o),
                          m = d(p, !0);
                        s(p);
                        var h = S(p),
                          g = d(h, !0);
                        s(h);
                        var _ = S(h),
                          x = d(_);
                        {
                          let t = y(() => (l(i), b(() => Ue(l(i).status))));
                          I(x, {
                            get variant() {
                              return l(t);
                            },
                            class: `capitalize`,
                            children: (t, a) => {
                              T();
                              var o = c();
                              (e(() => n(o, (l(i), b(() => l(i).status)))), r(t, o));
                            },
                            $$slots: { default: !0 },
                          });
                        }
                        s(_);
                        var C = S(_),
                          E = d(C, !0);
                        s(C);
                        var D = S(C);
                        (F(d(D), {
                          variant: `ghost`,
                          size: `sm`,
                          $$events: { click: () => Je(l(i).id) },
                          children: (e, t) => {
                            var n = ge();
                            (re(v(n), { class: `h-3.5 w-3.5 mr-1 text-destructive` }),
                              T(),
                              r(e, n));
                          },
                          $$slots: { default: !0 },
                        }),
                          s(D),
                          s(a),
                          e(
                            (e, t) => {
                              (w(
                                u,
                                `href`,
                                `/console/directory/users/${(l(i), b(() => l(i).id)) ?? ``}`,
                              ),
                                n(f, e),
                                n(m, (l(i), b(() => l(i).email))),
                                n(g, (l(i), b(() => l(i).department || `-`))),
                                n(E, t));
                            },
                            [
                              () => (l(i), b(() => He(l(i).email, l(i).display_name))),
                              () => (
                                l(i),
                                b(() =>
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
                      s(f),
                      s(u),
                      s(o),
                      r(t, o));
                  },
                  ne = (e) => {
                    var t = ye();
                    (j(d(t), { class: `h-10 w-10 mx-auto mb-3 text-muted-foreground/30` }),
                      T(2),
                      s(t),
                      r(e, t));
                  };
                (t(ee, (e) => {
                  (l(U), b(() => l(U).length > 0) ? e(A) : e(ne, -1));
                }),
                  f(
                    E,
                    () => l(Y),
                    (e) => C(Y, e),
                  ),
                  r(o, p));
              },
              $$slots: { default: !0 },
            }),
            r(o, p));
        },
        $$slots: { default: !0 },
      });
      var k = S(O, 2);
      M(k, {
        children: (o, u) => {
          var p = Ae(),
            m = v(p);
          (P(m, {
            children: (t, i) => {
              var a = Se(),
                o = d(a);
              (ae(o, {
                children: (e, t) => {
                  (T(), r(e, c(`Application Assignments`)));
                },
                $$slots: { default: !0 },
              }),
                I(S(o, 2), {
                  variant: `secondary`,
                  children: (t, i) => {
                    T();
                    var a = c();
                    (e(() => n(a, (l(Z), b(() => l(Z).length)))), r(t, a));
                  },
                  $$slots: { default: !0 },
                }),
                s(a),
                r(t, a));
            },
            $$slots: { default: !0 },
          }),
            N(S(m, 2), {
              class: `space-y-4`,
              children: (o, u) => {
                var p = ke(),
                  m = v(p),
                  h = d(m),
                  g = d(h);
                L(g, {
                  htmlFor: `assign-app`,
                  children: (e, t) => {
                    (T(), r(e, c(`Assign Application`)));
                  },
                  $$slots: { default: !0 },
                });
                var _ = S(g, 2),
                  x = d(_),
                  w = d(x);
                ((w.value = w.__value = ``),
                  i(
                    S(w),
                    1,
                    () => (
                      l(Ve),
                      l(Z),
                      b(() => l(Ve).filter((e) => !l(Z).some((t) => t.appId === e.id)))
                    ),
                    a,
                    (t, i) => {
                      var a = Ce(),
                        o = d(a, !0);
                      s(a);
                      var c = {};
                      (e(() => {
                        (n(o, (l(i), b(() => l(i).id))),
                          c !== (c = (l(i), b(() => l(i).id))) &&
                            (a.value = (a.__value = (l(i), b(() => l(i).id))) ?? ``));
                      }),
                        r(t, a));
                    },
                  ),
                  s(x));
                var E = S(x, 2),
                  D = d(E);
                D.value = D.__value = `member`;
                var O = S(D);
                O.value = O.__value = `admin`;
                var k = S(O);
                k.value = k.__value = `viewer`;
                var A = S(k);
                ((A.value = A.__value = `editor`), s(E), s(_), s(h));
                var ne = S(h, 2);
                {
                  let e = y(() => !l(Q));
                  F(ne, {
                    get disabled() {
                      return l(e);
                    },
                    $$events: { click: Xe },
                    children: (e, t) => {
                      var n = we();
                      (te(v(n), { class: `h-4 w-4 mr-1.5` }), T(), r(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                }
                s(m);
                var j = S(m, 2);
                ie(j, {});
                var M = S(j, 2),
                  N = (t) => {
                    var o = De(),
                      u = d(o),
                      f = S(d(u));
                    (i(
                      f,
                      5,
                      () => l(Z),
                      a,
                      (t, i) => {
                        var a = Ee(),
                          o = d(a),
                          u = d(o);
                        ee(u, { class: `h-4 w-4 text-muted-foreground` });
                        var f = S(u);
                        s(o);
                        var p = S(o);
                        (I(d(p), {
                          variant: `outline`,
                          class: `capitalize`,
                          children: (t, a) => {
                            T();
                            var o = c();
                            (e(() => n(o, (l(i), b(() => l(i).role)))), r(t, o));
                          },
                          $$slots: { default: !0 },
                        }),
                          s(p));
                        var m = S(p);
                        (F(d(m), {
                          variant: `ghost`,
                          size: `sm`,
                          $$events: { click: () => Ze(l(i).appId) },
                          children: (e, t) => {
                            var n = Te();
                            (re(v(n), { class: `h-3.5 w-3.5 mr-1 text-destructive` }),
                              T(),
                              r(e, n));
                          },
                          $$slots: { default: !0 },
                        }),
                          s(m),
                          s(a),
                          e(() => n(f, ` ${(l(i), b(() => l(i).appId)) ?? ``}`)),
                          r(t, a));
                      },
                    ),
                      s(f),
                      s(u),
                      s(o),
                      r(t, o));
                  },
                  P = (e) => {
                    var t = Oe();
                    (ee(d(t), { class: `h-8 w-8 mx-auto mb-2 text-muted-foreground/30` }),
                      T(2),
                      s(t),
                      r(e, t));
                  };
                (t(M, (e) => {
                  (l(Z), b(() => l(Z).length > 0) ? e(N) : e(P, -1));
                }),
                  f(
                    x,
                    () => l(Q),
                    (e) => C(Q, e),
                  ),
                  f(
                    E,
                    () => l($),
                    (e) => C($, e),
                  ),
                  r(o, p));
              },
              $$slots: { default: !0 },
            }),
            r(o, p));
        },
        $$slots: { default: !0 },
      });
      var A = S(k, 2),
        R = d(A),
        se = d(R);
      s(R);
      var z = S(R, 2),
        Ne = d(z);
      s(z);
      var B = S(z, 2),
        Pe = (t) => {
          var i = je(),
            a = d(i);
          (s(i), e(() => n(a, `External ID: ${(l(H), b(() => l(H).external_id)) ?? ``}`)), r(t, i));
        };
      (t(B, (e) => {
        (l(H), b(() => l(H).external_id) && e(Pe));
      }),
        s(A),
        e(
          (e, t) => {
            (n(_, (l(H), b(() => l(H).name))),
              n(se, `Created: ${e ?? ``}`),
              n(Ne, `Updated: ${t ?? ``}`));
          },
          [
            () => (l(H), b(() => new Date(l(H).created_at).toLocaleString())),
            () => (l(H), b(() => new Date(l(H).updated_at).toLocaleString())),
          ],
        ),
        r(o, u));
    };
  (t(et, (e) => {
    l(Be) ? e(tt) : l(G) ? e(nt, 1) : l(H) && e(rt, 2);
  }),
    s(Qe),
    r(D, Qe),
    p(),
    Ie());
}
export { B as component };
