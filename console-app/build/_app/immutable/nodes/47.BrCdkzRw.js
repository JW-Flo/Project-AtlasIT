import {
  $ as e,
  F as t,
  I as n,
  L as r,
  N as i,
  P as a,
  R as o,
  Tt as s,
  V as c,
  W as l,
  a as u,
  at as d,
  bt as f,
  ct as p,
  j as m,
  l as h,
  ot as g,
  pt as _,
  r as v,
  s as y,
  st as b,
  ut as x,
  w as S,
  wt as C,
  xt as w,
  z as T,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { n as E } from "../chunks/D4lFFHu4.js";
import { t as D } from "../chunks/_6xtu--D.js";
import { t as O } from "../chunks/BaKV8GqY.js";
import { t as ee } from "../chunks/DHVpvl6C.js";
import { t as k } from "../chunks/CMGwYO6i2.js";
import { n as A, t as j } from "../chunks/BEJa09Kq2.js";
import { t as M } from "../chunks/Cue2Cs472.js";
import { t as te } from "../chunks/DmQt9wwK2.js";
import { t as ne } from "../chunks/DOfJvt542.js";
import { t as re } from "../chunks/oRaErrij2.js";
function N(e, t) {
  let n = u(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    i = [
      [`path`, { d: `M18 6 7 17l-5-5` }],
      [`path`, { d: `m22 10-7.5 7.5L13 16` }],
    ];
  D(
    e,
    y({ name: `check-check` }, () => n, {
      get iconNode() {
        return i;
      },
      children: (e, n) => {
        var i = o();
        (m(g(i), t, `default`, {}, null), r(e, i));
      },
      $$slots: { default: !0 },
    }),
  );
}
var P = T(`<p class="text-sm text-muted-foreground"> </p>`),
  F = T(`<!> Mark All Read`, 1),
  I = T(`<div class="space-y-3"></div>`),
  L = T(`<!> <p class="pl-7"> </p>`, 1),
  R = T(`<!> <p class="text-sm text-muted-foreground">No notifications yet</p>`, 1),
  z = T(`<span> </span>`),
  B = T(`<p class="text-xs text-muted-foreground mt-1"> </p>`),
  V = T(`<!> Read`, 1),
  H = T(
    `<div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1 flex-wrap"><!> <!> <span class="text-xs text-muted-foreground ml-auto shrink-0"> </span></div> <p class="text-sm"> </p> <!></div> <!>`,
    1,
  ),
  U = T(`<div class="flex flex-col gap-2"></div>`),
  W = T(
    `<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Notifications</h1> <!></div> <!></div> <!></div>`,
  );
function G(o, u) {
  w(u, !1);
  let m = p([]),
    y = p(!0),
    T = p(null),
    D = p(0);
  async function G() {
    (x(y, !0), x(T, null));
    try {
      let e = await fetch(`/api/notifications`);
      if (!e.ok) throw Error(`Failed (${e.status})`);
      let t = await e.json();
      (x(m, t.items || []), x(D, t.unreadCount ?? l(m).filter((e) => !e.read).length));
    } catch (e) {
      x(T, e?.message || `Failed to load notifications`);
    } finally {
      x(y, !1);
    }
  }
  async function K(e) {
    try {
      (await fetch(`/api/notifications/read`, {
        method: `POST`,
        headers: { "Content-Type": `application/json` },
        body: JSON.stringify({ ids: [e] }),
      }),
        x(
          m,
          l(m).map((t) => (t.id === e ? { ...t, read: !0, readAt: new Date().toISOString() } : t)),
        ),
        x(D, Math.max(0, l(D) - 1)));
    } catch {
      E({ message: `Failed to mark as read`, variant: `error` });
    }
  }
  async function q() {
    try {
      (await fetch(`/api/notifications/read-all`, { method: `POST` }),
        x(
          m,
          l(m).map((e) => ({ ...e, read: !0, readAt: e.readAt || new Date().toISOString() })),
        ),
        x(D, 0),
        E({ message: `All notifications marked as read`, variant: `success` }));
    } catch {
      E({ message: `Failed to mark all as read`, variant: `error` });
    }
  }
  function J(e) {
    switch (e) {
      case `incident`:
        return `destructive`;
      case `access_request`:
        return `default`;
      case `policy`:
        return `success`;
      case `workflow`:
        return `secondary`;
      default:
        return `outline`;
    }
  }
  function Y(e) {
    switch (e) {
      case `critical`:
        return `text-destructive`;
      case `high`:
        return `text-warning`;
      case `medium`:
        return `text-warning`;
      case `low`:
        return `text-primary`;
      default:
        return `text-muted-foreground`;
    }
  }
  (v(() => {
    G();
  }),
    h());
  var X = W(),
    Z = d(X),
    Q = d(Z),
    ie = b(d(Q), 2),
    ae = (t) => {
      var i = P(),
        a = d(i);
      (s(i), e(() => n(a, `${l(D) ?? ``} unread`)), r(t, i));
    };
  (t(ie, (e) => {
    l(D) > 0 && e(ae);
  }),
    s(Q));
  var oe = b(Q, 2),
    se = (e) => {
      M(e, {
        variant: `outline`,
        size: `sm`,
        $$events: { click: q },
        children: (e, t) => {
          var n = F();
          (N(g(n), { class: `h-4 w-4 mr-1.5` }), C(), r(e, n));
        },
        $$slots: { default: !0 },
      });
    };
  (t(oe, (e) => {
    l(m).length > 0 && l(D) > 0 && e(se);
  }),
    s(Z));
  var ce = b(Z, 2),
    le = (e) => {
      var t = I();
      (i(
        t,
        4,
        () => [1, 2, 3],
        a,
        (e, t) => {
          re(e, { class: `h-16 rounded-lg` });
        },
      ),
        s(t),
        r(e, t));
    },
    $ = (t) => {
      ne(t, {
        variant: `destructive`,
        children: (t, i) => {
          var a = L(),
            o = g(a);
          k(o, { class: `h-4 w-4` });
          var c = b(o, 2),
            u = d(c, !0);
          (s(c), e(() => n(u, l(T))), r(t, a));
        },
        $$slots: { default: !0 },
      });
    },
    ue = (e) => {
      A(e, {
        class: `border-dashed`,
        children: (e, t) => {
          j(e, {
            class: `py-16 text-center`,
            children: (e, t) => {
              var n = R();
              (O(g(n), { class: `h-12 w-12 mx-auto mb-4 text-muted-foreground/30` }),
                C(2),
                r(e, n));
            },
            $$slots: { default: !0 },
          });
        },
        $$slots: { default: !0 },
      });
    },
    de = (o) => {
      var u = U();
      (i(
        u,
        5,
        () => l(m),
        a,
        (i, a) => {
          {
            let o = _(() => (l(a).read ? `opacity-60` : ``));
            A(i, {
              get class() {
                return `${l(o) ?? ``} transition-opacity`;
              },
              children: (i, o) => {
                j(i, {
                  class: `py-4 flex items-start gap-3`,
                  children: (i, o) => {
                    var u = H(),
                      f = g(u),
                      p = d(f),
                      m = d(p),
                      h = (t) => {
                        {
                          let i = _(() => J(l(a).kind));
                          te(t, {
                            get variant() {
                              return l(i);
                            },
                            children: (t, i) => {
                              C();
                              var o = c();
                              (e((e) => n(o, e), [() => l(a).kind.replace(`_`, ` `)]), r(t, o));
                            },
                            $$slots: { default: !0 },
                          });
                        }
                      };
                    t(m, (e) => {
                      l(a).kind && e(h);
                    });
                    var v = b(m, 2),
                      y = (t) => {
                        var i = z(),
                          o = d(i, !0);
                        (s(i),
                          e(
                            (e) => {
                              (S(
                                i,
                                1,
                                `text-[10px] uppercase tracking-wider font-semibold ${e ?? ``}`,
                              ),
                                n(o, l(a).severity));
                            },
                            [() => Y(l(a).severity)],
                          ),
                          r(t, i));
                      };
                    t(v, (e) => {
                      l(a).severity && e(y);
                    });
                    var x = b(v, 2),
                      w = d(x, !0);
                    (s(x), s(p));
                    var T = b(p, 2),
                      E = d(T, !0);
                    s(T);
                    var D = b(T, 2),
                      O = (t) => {
                        var i = B(),
                          o = d(i);
                        (s(i), e(() => n(o, `Ref: ${l(a).ref ?? ``}`)), r(t, i));
                      };
                    (t(D, (e) => {
                      l(a).ref && e(O);
                    }),
                      s(f));
                    var k = b(f, 2),
                      A = (e) => {
                        M(e, {
                          variant: `ghost`,
                          size: `sm`,
                          $$events: { click: () => K(l(a).id) },
                          children: (e, t) => {
                            var n = V();
                            (ee(g(n), { class: `h-3.5 w-3.5 mr-1` }), C(), r(e, n));
                          },
                          $$slots: { default: !0 },
                        });
                      };
                    (t(k, (e) => {
                      l(a).read || e(A);
                    }),
                      e(
                        (e) => {
                          (n(w, e), n(E, l(a).message));
                        },
                        [() => new Date(l(a).createdAt).toLocaleString()],
                      ),
                      r(i, u));
                  },
                  $$slots: { default: !0 },
                });
              },
              $$slots: { default: !0 },
            });
          }
        },
      ),
        s(u),
        r(o, u));
    };
  (t(ce, (e) => {
    l(y) ? e(le) : l(T) ? e($, 1) : l(m).length === 0 ? e(ue, 2) : e(de, -1);
  }),
    s(X),
    r(o, X),
    f());
}
export { G as component };
