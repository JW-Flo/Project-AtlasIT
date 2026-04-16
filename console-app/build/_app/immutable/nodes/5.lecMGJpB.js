import {
  $ as e,
  C as t,
  F as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Tt as s,
  V as c,
  W as l,
  at as u,
  b as d,
  bt as ee,
  ct as f,
  l as p,
  ot as m,
  pt as h,
  r as g,
  st as _,
  ut as v,
  v as y,
  wt as b,
  xt as x,
  z as S,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as C, t as w } from "../chunks/BEJa09Kq2.js";
import { t as T } from "../chunks/Cue2Cs472.js";
import { t as te } from "../chunks/DmQt9wwK2.js";
import { t as E } from "../chunks/C8W1vu9i2.js";
import { t as D } from "../chunks/ejJaicvO2.js";
import { t as O } from "../chunks/oRaErrij2.js";
function k(e) {
  if (typeof e.pendingItems == `number`) return Math.max(0, e.pendingItems);
  let t = Math.max(0, e.totalItems ?? 0),
    n = Math.max(0, e.approvedItems ?? 0),
    r = Math.max(0, e.revokedItems ?? 0);
  return Math.max(0, t - n - r);
}
function A(e) {
  let t = Math.max(0, e.totalItems ?? 0);
  if (t === 0) return 0;
  let n = (Math.max(0, e.approvedItems ?? 0) + Math.max(0, e.revokedItems ?? 0)) / t;
  return Math.max(0, Math.min(100, Math.round(n * 100)));
}
function j(e) {
  switch (e) {
    case `draft`:
      return `Draft`;
    case `active`:
      return `Active`;
    case `completed`:
      return `Completed`;
    case `expired`:
      return `Expired`;
    default:
      return e;
  }
}
function M(e) {
  switch (e) {
    case `draft`:
      return `secondary`;
    case `active`:
      return `warning`;
    case `completed`:
      return `success`;
    case `expired`:
      return `destructive`;
    default:
      return `secondary`;
  }
}
var N = S(`Campaign Name <span class="text-destructive">*</span>`, 1),
  ne = S(`Resource <span class="text-destructive">*</span>`, 1),
  re = S(`<option> </option>`),
  ie = S(`<p class="text-sm text-destructive"> </p>`),
  P = S(
    `<h2 class="text-base font-semibold">New Access Review Campaign</h2> <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div class="space-y-1"><!> <!></div> <div class="space-y-1"><!> <select id="campaign-resource" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Select application...</option><!></select></div> <div class="space-y-1"><!> <select id="campaign-review-type" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>Membership (who has access)</option><option>Roles & Permissions</option><option>Full Entitlements</option></select></div> <div class="space-y-1"><!> <!></div> <div class="space-y-1 lg:col-span-2"><!> <!></div></div> <!> <div class="flex justify-end"><!></div>`,
    1,
  ),
  F = S(`<div class="space-y-3"></div>`),
  I = S(
    `<p class="text-lg font-semibold mb-1">No access review campaigns yet</p> <p class="text-sm text-muted-foreground">Create a campaign above or let automation generate one.</p>`,
    1,
  ),
  L = S(
    `<tr class="border-t hover:bg-muted/50"><td class="px-4 py-3 align-top"><div class="font-medium"> </div> <div class="text-xs text-muted-foreground mt-0.5"> </div></td><td class="px-4 py-3 align-top"><!></td><td class="px-4 py-3 align-top text-muted-foreground"> </td><td class="px-4 py-3 align-top min-w-[180px] sm:min-w-[220px]"><div class="flex items-center justify-between text-xs mb-1"><span class="text-muted-foreground"> </span> <span class="text-muted-foreground"> </span></div> <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary transition-all"></div></div> <div class="text-xs text-muted-foreground mt-1"> </div></td><td class="px-4 py-3 align-top text-right"><div class="flex justify-end gap-2 flex-wrap"><!> <a><!></a></div></td></tr>`,
  ),
  R = S(
    `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b"><th class="px-4 py-3 font-medium">Campaign</th><th class="px-4 py-3 font-medium">Status</th><th class="px-4 py-3 font-medium">Due Date</th><th class="px-4 py-3 font-medium">Progress</th><th class="px-4 py-3 font-medium text-right">Actions</th></tr></thead><tbody></tbody></table></div>`,
  ),
  z = S(
    `<div class="space-y-6"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">Access Reviews</h1> <p class="text-sm text-muted-foreground">Review campaign status and completion progress across user-to-app entitlements.</p></div> <div class="flex gap-2 shrink-0 self-start sm:self-auto"><!> <!></div></div> <!> <!></div>`,
  );
function B(S, B) {
  x(B, !1);
  let V = f(!0),
    H = f([]),
    U = f([]),
    W = f(!1),
    G = f(!1),
    K = f(``),
    q = f(``),
    J = f(``),
    Y = f(``),
    X = f(`membership`),
    Z = f(``),
    Q = f(null);
  async function $() {
    v(V, !0);
    try {
      let e = await fetch(`/api/access-reviews`);
      if (!e.ok) {
        v(H, []);
        return;
      }
      let t = await e.json();
      v(H, Array.isArray(t.campaigns) ? t.campaigns : []);
    } catch {
      v(H, []);
    } finally {
      v(V, !1);
    }
  }
  async function ae() {
    try {
      let e = await fetch(`/api/apps/status`);
      e.ok &&
        v(
          U,
          ((await e.json()).applications || []).filter((e) => e.connected),
        );
    } catch {}
  }
  async function oe() {
    if (!l(K).trim()) {
      v(Z, `Campaign name is required.`);
      return;
    }
    if (!l(Y)) {
      v(Z, `Select a resource to review.`);
      return;
    }
    (v(Z, ``), v(G, !0));
    try {
      let e = await fetch(`/api/access-reviews`, {
        method: `POST`,
        headers: { "content-type": `application/json` },
        body: JSON.stringify({
          name: l(K).trim(),
          dueDate: l(q) || null,
          scope: l(J).trim() || void 0,
          resource: l(Y),
          reviewType: l(X),
        }),
      });
      if (!e.ok) {
        v(Z, (await e.json()).error ?? `Failed to create campaign.`);
        return;
      }
      (v(K, ``), v(q, ``), v(J, ``), v(Y, ``), v(X, `membership`), v(W, !1), await $());
    } catch {
      v(Z, `Unexpected error. Please try again.`);
    } finally {
      v(G, !1);
    }
  }
  async function se(e, t) {
    v(Q, e);
    try {
      if (
        !(
          await fetch(`/api/access-reviews/${e}`, {
            method: `PATCH`,
            headers: { "content-type": `application/json` },
            body: JSON.stringify({ status: t }),
          })
        ).ok
      )
        return;
      await $();
    } catch {
    } finally {
      v(Q, null);
    }
  }
  function ce(e) {
    if (!e) return `—`;
    let t = new Date(e);
    return Number.isNaN(t.getTime()) ? `—` : t.toLocaleDateString();
  }
  (g(() => {
    ($(), ae());
  }),
    p());
  var le = z(),
    ue = u(le),
    de = _(u(ue), 2),
    fe = u(de);
  (T(fe, {
    variant: `outline`,
    $$events: { click: $ },
    children: (e, t) => {
      (b(), i(e, c(`Refresh`)));
    },
    $$slots: { default: !0 },
  }),
    T(_(fe, 2), {
      $$events: {
        click: () => {
          (v(W, !l(W)), v(Z, ``));
        },
      },
      children: (t, n) => {
        b();
        var a = c();
        (e(() => r(a, l(W) ? `Cancel` : `New Campaign`)), i(t, a));
      },
      $$slots: { default: !0 },
    }),
    s(de),
    s(ue));
  var pe = _(ue, 2),
    me = (t) => {
      C(t, {
        children: (t, ee) => {
          w(t, {
            class: `py-5 space-y-4`,
            children: (t, ee) => {
              var f = P(),
                p = _(m(f), 2),
                h = u(p),
                g = u(h);
              (D(g, {
                htmlFor: `campaign-name`,
                children: (e, t) => {
                  b();
                  var n = N();
                  (b(), i(e, n));
                },
                $$slots: { default: !0 },
              }),
                E(_(g, 2), {
                  id: `campaign-name`,
                  type: `text`,
                  placeholder: `Q2 2026 Access Review`,
                  get disabled() {
                    return l(G);
                  },
                  get value() {
                    return l(K);
                  },
                  set value(e) {
                    v(K, e);
                  },
                  $$legacy: !0,
                }),
                s(h));
              var y = _(h, 2),
                x = u(y);
              D(x, {
                htmlFor: `campaign-resource`,
                children: (e, t) => {
                  b();
                  var n = ne();
                  (b(), i(e, n));
                },
                $$slots: { default: !0 },
              });
              var S = _(x, 2),
                C = u(S);
              ((C.value = C.__value = ``),
                a(
                  _(C),
                  1,
                  () => l(U),
                  o,
                  (t, n) => {
                    var a = re(),
                      o = u(a, !0);
                    s(a);
                    var c = {};
                    (e(() => {
                      (r(o, l(n).id),
                        c !== (c = l(n).id) && (a.value = (a.__value = l(n).id) ?? ``));
                    }),
                      i(t, a));
                  },
                ),
                s(S),
                s(y));
              var w = _(y, 2),
                te = u(w);
              D(te, {
                htmlFor: `campaign-review-type`,
                children: (e, t) => {
                  (b(), i(e, c(`Review Type`)));
                },
                $$slots: { default: !0 },
              });
              var O = _(te, 2),
                k = u(O);
              k.value = k.__value = `membership`;
              var A = _(k);
              A.value = A.__value = `roles`;
              var j = _(A);
              ((j.value = j.__value = `entitlements`), s(O), s(w));
              var M = _(w, 2),
                F = u(M);
              (D(F, {
                htmlFor: `campaign-due-date`,
                children: (e, t) => {
                  (b(), i(e, c(`Due Date`)));
                },
                $$slots: { default: !0 },
              }),
                E(_(F, 2), {
                  id: `campaign-due-date`,
                  type: `date`,
                  get disabled() {
                    return l(G);
                  },
                  get value() {
                    return l(q);
                  },
                  set value(e) {
                    v(q, e);
                  },
                  $$legacy: !0,
                }),
                s(M));
              var I = _(M, 2),
                L = u(I);
              (D(L, {
                htmlFor: `campaign-scope`,
                children: (e, t) => {
                  (b(), i(e, c(`Scope`)));
                },
                $$slots: { default: !0 },
              }),
                E(_(L, 2), {
                  id: `campaign-scope`,
                  type: `text`,
                  placeholder: `all users, finance team, engineering…`,
                  get disabled() {
                    return l(G);
                  },
                  get value() {
                    return l(J);
                  },
                  set value(e) {
                    v(J, e);
                  },
                  $$legacy: !0,
                }),
                s(I),
                s(p));
              var R = _(p, 2),
                z = (t) => {
                  var n = ie(),
                    a = u(n, !0);
                  (s(n), e(() => r(a, l(Z))), i(t, n));
                };
              n(R, (e) => {
                l(Z) && e(z);
              });
              var B = _(R, 2);
              (T(u(B), {
                get disabled() {
                  return l(G);
                },
                $$events: { click: oe },
                children: (t, n) => {
                  b();
                  var a = c();
                  (e(() => r(a, l(G) ? `Creating…` : `Create Campaign`)), i(t, a));
                },
                $$slots: { default: !0 },
              }),
                s(B),
                e(() => {
                  ((S.disabled = l(G)), (O.disabled = l(G)));
                }),
                d(
                  S,
                  () => l(Y),
                  (e) => v(Y, e),
                ),
                d(
                  O,
                  () => l(X),
                  (e) => v(X, e),
                ),
                i(t, f));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  n(pe, (e) => {
    l(W) && e(me);
  });
  var he = _(pe, 2),
    ge = (e) => {
      var t = F();
      (a(
        t,
        4,
        () => [1, 2, 3],
        o,
        (e, t) => {
          O(e, { class: `h-16 rounded-lg` });
        },
      ),
        s(t),
        i(e, t));
    },
    _e = (e) => {
      C(e, {
        class: `border-dashed`,
        children: (e, t) => {
          w(e, {
            class: `py-10 text-center`,
            children: (e, t) => {
              var n = I();
              (b(2), i(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    ve = (d) => {
      C(d, {
        children: (d, ee) => {
          w(d, {
            class: `p-0`,
            children: (d, ee) => {
              var f = R(),
                p = u(f),
                m = _(u(p));
              (a(
                m,
                5,
                () => l(H),
                o,
                (a, o) => {
                  let d = h(() => A(l(o))),
                    ee = h(() => k(l(o)));
                  var f = L(),
                    p = u(f),
                    m = u(p),
                    g = u(m, !0);
                  s(m);
                  var v = _(m, 2),
                    x = u(v);
                  (s(v), s(p));
                  var S = _(p),
                    C = u(S);
                  {
                    let t = h(() => M(l(o).status));
                    te(C, {
                      get variant() {
                        return l(t);
                      },
                      children: (t, n) => {
                        b();
                        var a = c();
                        (e((e) => r(a, e), [() => j(l(o).status)]), i(t, a));
                      },
                      $$slots: { default: !0 },
                    });
                  }
                  s(S);
                  var w = _(S),
                    E = u(w, !0);
                  s(w);
                  var D = _(w),
                    O = u(D),
                    N = u(O),
                    ne = u(N);
                  s(N);
                  var re = _(N, 2),
                    ie = u(re);
                  (s(re), s(O));
                  var P = _(O, 2),
                    F = u(P);
                  s(P);
                  var I = _(P, 2),
                    R = u(I);
                  (s(I), s(D));
                  var z = _(D),
                    B = u(z),
                    V = u(B),
                    H = (e) => {
                      {
                        let t = h(() => l(Q) === l(o).id);
                        T(e, {
                          variant: `outline`,
                          size: `sm`,
                          get disabled() {
                            return l(t);
                          },
                          $$events: { click: () => se(l(o).id, `active`) },
                          children: (e, t) => {
                            (b(), i(e, c(`Activate`)));
                          },
                          $$slots: { default: !0 },
                        });
                      }
                    },
                    U = (e) => {
                      {
                        let t = h(() => l(Q) === l(o).id);
                        T(e, {
                          variant: `outline`,
                          size: `sm`,
                          get disabled() {
                            return l(t);
                          },
                          $$events: { click: () => se(l(o).id, `completed`) },
                          children: (e, t) => {
                            (b(), i(e, c(`Complete`)));
                          },
                          $$slots: { default: !0 },
                        });
                      }
                    };
                  n(V, (e) => {
                    l(o).status === `draft` ? e(H) : l(o).status === `active` && e(U, 1);
                  });
                  var W = _(V, 2);
                  (T(u(W), {
                    variant: `outline`,
                    size: `sm`,
                    children: (e, t) => {
                      (b(), i(e, c(`View`)));
                    },
                    $$slots: { default: !0 },
                  }),
                    s(W),
                    s(B),
                    s(z),
                    s(f),
                    e(
                      (e) => {
                        (r(g, l(o).name),
                          r(x, `Scope: ${l(o).scope ?? ``}`),
                          r(E, e),
                          r(ne, `${l(d) ?? ``}% complete`),
                          r(ie, `${l(ee) ?? ``} pending`),
                          t(F, `width: ${l(d)}%`),
                          r(
                            R,
                            `${(l(o).approvedItems ?? 0) + (l(o).revokedItems ?? 0)} / ${l(o).totalItems ?? 0 ?? ``} reviewed`,
                          ),
                          y(W, `href`, `/console/access-reviews/${l(o).id}`));
                      },
                      [() => ce(l(o).dueDate)],
                    ),
                    i(a, f));
                },
              ),
                s(m),
                s(p),
                s(f),
                i(d, f));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    };
  (n(he, (e) => {
    l(V) ? e(ge) : l(H).length === 0 ? e(_e, 1) : e(ve, -1);
  }),
    s(le),
    i(S, le),
    ee());
}
export { B as component };
