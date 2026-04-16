import {
  $ as e,
  D as t,
  F as n,
  I as r,
  L as i,
  N as a,
  P as o,
  Q as s,
  Tt as c,
  V as l,
  W as u,
  X as d,
  Z as f,
  _ as p,
  at as m,
  b as h,
  bt as g,
  ct as _,
  gt as v,
  h as ee,
  ht as y,
  l as te,
  ot as b,
  p as x,
  q as S,
  r as ne,
  rt as re,
  st as C,
  ut as w,
  v as ie,
  w as ae,
  wt as T,
  xt as oe,
  z as E,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as se } from "../chunks/D8pbUplu.js";
import { n as D } from "../chunks/D4lFFHu4.js";
import { t as ce } from "../chunks/BaKV8GqY.js";
import { t as le } from "../chunks/CFrMXjnD.js";
import { t as ue } from "../chunks/CfWPW66F.js";
import { t as de } from "../chunks/Bh_67ZLW.js";
import { t as fe } from "../chunks/CMGwYO6i2.js";
import { t as pe } from "../chunks/BHPTFPdW2.js";
import { n as O, t as k } from "../chunks/BEJa09Kq2.js";
import { t as A } from "../chunks/Da7GIpgR2.js";
import { t as j } from "../chunks/B2LjsFjQ2.js";
import { t as M } from "../chunks/Cue2Cs472.js";
import { t as me } from "../chunks/DOfJvt542.js";
import { t as N } from "../chunks/ejJaicvO2.js";
import { t as P } from "../chunks/oRaErrij2.js";
var he = E(`<a> </a>`),
  ge = E(`<!> <span> </span>`, 1),
  _e = E(`<div class="space-y-4"><!> <!></div>`),
  ve = E(`<!> Weekly Compliance Digest`, 1),
  ye = E(`<option> </option>`),
  be = E(
    `<div class="ml-7 space-y-3"><div><!> <select id="digest-day" class="mt-1 block w-48 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"></select> <p class="text-xs text-muted-foreground mt-1">Digest generated at 08:00 UTC</p></div></div>`,
  ),
  xe = E(
    `<p class="text-sm text-muted-foreground">Receive an AI-generated summary every week with score changes, new evidence, upcoming deadlines, and drift alerts.</p> <div class="flex items-center gap-3"><input type="checkbox" id="weekly-digest" class="h-4 w-4 rounded border-border text-primary focus:ring-primary"/> <!></div> <!>`,
    1,
  ),
  Se = E(`<!> <!>`, 1),
  Ce = E(`<!> Smart Alerts`, 1),
  we = E(
    `<div class="ml-7"><!> <select id="min-severity" class="mt-1 block w-48 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"><option>All (info + warning + critical)</option><option>Warning + Critical only</option><option>Critical only</option></select></div>`,
  ),
  Te = E(
    `<p class="text-sm text-muted-foreground">Predictive alerts that detect issues before they impact your scores — like evidence collection gaps, score regression trends, and adapter health issues.</p> <div class="flex items-center gap-3"><input type="checkbox" id="smart-alerts" class="h-4 w-4 rounded border-border text-primary focus:ring-primary"/> <!></div> <!>`,
    1,
  ),
  Ee = E(`<!> <!>`, 1),
  De = E(`<!> Delivery Channels`, 1),
  Oe = E(
    `<p class="text-sm text-muted-foreground">Choose how you receive digests and alerts.</p> <div class="space-y-3"><div class="flex items-center gap-3"><input type="checkbox" id="ch-inapp" class="h-4 w-4 rounded border-border text-primary focus:ring-primary"/> <!></div> <div class="flex items-center gap-3"><input type="checkbox" id="ch-email" class="h-4 w-4 rounded border-border text-primary focus:ring-primary"/> <!></div> <div class="flex items-center gap-3"><input type="checkbox" id="ch-slack" class="h-4 w-4 rounded border-border text-primary focus:ring-primary"/> <!></div></div>`,
    1,
  ),
  ke = E(`<!> <!>`, 1),
  Ae = E(`<!> Slack Integration`, 1),
  je = E(`<p class="text-xs text-green-600 dark:text-green-400">Webhook configured</p>`),
  Me = E(
    `<p class="text-sm text-muted-foreground">Enter your Slack incoming webhook URL to receive digests and critical alerts in a channel.</p> <div class="flex gap-2"><input type="url" placeholder="https://hooks.slack.com/services/..." class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"/> <!></div> <!>`,
    1,
  ),
  F = E(`<!> <!>`, 1),
  Ne = E(`<!> `, 1),
  Pe = E(`<!> <!> <!> <!> <div class="flex justify-end"><!></div>`, 1),
  Fe = E(
    `<div class="space-y-6"><div><h1 class="text-2xl font-bold tracking-tight">Settings</h1> <p class="text-muted-foreground">Manage your organization and notification preferences.</p></div> <nav class="flex gap-1 border-b border-border overflow-x-auto"></nav> <!> <!></div>`,
  );
function I(E, I) {
  oe(I, !1);
  let L = () => v(se, `$page`, Ie),
    [Ie, Le] = y(),
    R = _(),
    Re = [
      { href: `/console/settings`, label: `General` },
      { href: `/console/settings/users`, label: `Users` },
      { href: `/console/settings/audit-log`, label: `Audit Log` },
      { href: `/console/settings/billing`, label: `Billing` },
      { href: `/console/settings/trust`, label: `Trust Center` },
      { href: `/console/settings/incidents`, label: `Incidents` },
      { href: `/console/settings/security`, label: `Security` },
      { href: `/console/settings/notifications`, label: `Notifications` },
    ],
    z = _(!0),
    B = _(!1),
    V = _(``),
    H = _(``),
    U = _(!1),
    W = _(!0),
    G = _(0),
    K = _(!0),
    q = _(`warning`),
    J = _(!0),
    Y = _(!1),
    X = _(!0),
    ze = [`Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`];
  async function Be() {
    (w(z, !0), w(V, ``));
    try {
      let e = await fetch(`/api/user/preferences`);
      if (!e.ok) throw Error(`Failed to load (${e.status})`);
      let t = await e.json();
      if (t.digest_preferences)
        try {
          let e = JSON.parse(t.digest_preferences);
          (w(W, e.weeklyDigestEnabled ?? !0),
            w(G, e.weeklyDigestDay ?? 0),
            w(K, e.smartAlertsEnabled ?? !0),
            w(q, e.smartAlertMinSeverity ?? `warning`),
            w(J, e.channels?.inApp ?? !0),
            w(Y, e.channels?.slack ?? !1),
            w(X, e.channels?.email ?? !0));
        } catch {}
      let n = await fetch(`/api/tenants/preferences`);
      if (n.ok) {
        let e = await n.json();
        e.slack_webhook_url && (w(H, e.slack_webhook_url), w(U, !0));
      }
    } catch (e) {
      w(V, e.message);
    } finally {
      w(z, !1);
    }
  }
  async function Ve() {
    (w(B, !0), w(V, ``));
    try {
      let e = JSON.stringify({
          weeklyDigestEnabled: u(W),
          weeklyDigestDay: u(G),
          smartAlertsEnabled: u(K),
          smartAlertMinSeverity: u(q),
          channels: { inApp: u(J), slack: u(Y), email: u(X) },
        }),
        t = await fetch(`/api/user/preferences`, {
          method: `PATCH`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({ digest_preferences: e }),
        });
      if (!t.ok) throw Error(`Save failed (${t.status})`);
      D({ message: `Notification preferences saved`, variant: `success` });
    } catch (e) {
      (w(V, e.message), D({ message: `Failed to save: ${e.message}`, variant: `error` }));
    } finally {
      w(B, !1);
    }
  }
  async function He() {
    if (!u(H).startsWith(`https://hooks.slack.com/`)) {
      D({ message: `Invalid Slack webhook URL`, variant: `error` });
      return;
    }
    try {
      let e = await fetch(`/api/tenants/preferences`, {
        method: `POST`,
        headers: { "Content-Type": `application/json` },
        body: JSON.stringify({ key: `slack_webhook_url`, value: u(H) }),
      });
      if (!e.ok) throw Error(`Save failed (${e.status})`);
      (w(U, !0), D({ message: `Slack webhook saved`, variant: `success` }));
    } catch (e) {
      D({ message: `Failed to save webhook: ${e.message}`, variant: `error` });
    }
  }
  (ne(Be),
    f(
      () => L(),
      () => {
        w(R, L().url.pathname);
      },
    ),
    s(),
    te());
  var Z = Fe();
  t(`w6q31d`, (e) => {
    d(() => {
      re.title = `Notification Settings | AtlasIT`;
    });
  });
  var Q = C(m(Z), 2);
  (a(
    Q,
    5,
    () => Re,
    o,
    (t, n) => {
      var a = he(),
        o = m(a, !0);
      (c(a),
        e(() => {
          (ie(a, `href`, (u(n), S(() => u(n).href))),
            ae(
              a,
              1,
              `px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${(u(R), u(n), S(() => (u(R) === u(n).href ? `border-primary text-primary` : `border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50`))) ?? ``}`,
            ),
            r(o, (u(n), S(() => u(n).label))));
        }),
        i(t, a));
    },
  ),
    c(Q));
  var $ = C(Q, 2),
    Ue = (t) => {
      me(t, {
        variant: `destructive`,
        children: (t, n) => {
          var a = ge(),
            o = b(a);
          fe(o, { class: `h-4 w-4` });
          var s = C(o, 2),
            l = m(s, !0);
          (c(s), e(() => r(l, u(V))), i(t, a));
        },
        $$slots: { default: !0 },
      });
    };
  n($, (e) => {
    u(V) && e(Ue);
  });
  var We = C($, 2),
    Ge = (e) => {
      var t = _e(),
        n = m(t);
      (P(n, { class: `h-48 w-full` }), P(C(n, 2), { class: `h-48 w-full` }), c(t), i(e, t));
    },
    Ke = (t) => {
      var s = Pe(),
        d = b(s);
      O(d, {
        children: (t, s) => {
          var d = Se(),
            f = b(d);
          (A(f, {
            children: (e, t) => {
              j(e, {
                class: `flex items-center gap-2`,
                children: (e, t) => {
                  var n = ve();
                  (ce(b(n), { class: `h-5 w-5` }), T(), i(e, n));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            k(C(f, 2), {
              class: `space-y-4`,
              children: (t, s) => {
                var d = xe(),
                  f = C(b(d), 2),
                  g = m(f);
                (p(g),
                  N(C(g, 2), {
                    for: `weekly-digest`,
                    children: (e, t) => {
                      (T(), i(e, l(`Enable weekly digest`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  c(f));
                var _ = C(f, 2),
                  v = (t) => {
                    var n = be(),
                      s = m(n),
                      d = m(s);
                    N(d, {
                      for: `digest-day`,
                      children: (e, t) => {
                        (T(), i(e, l(`Delivery day`)));
                      },
                      $$slots: { default: !0 },
                    });
                    var f = C(d, 2);
                    (a(
                      f,
                      5,
                      () => ze,
                      o,
                      (t, n, a) => {
                        var o = ye(),
                          s = m(o, !0);
                        (c(o), (o.value = o.__value = a), e(() => r(s, u(n))), i(t, o));
                      },
                    ),
                      c(f),
                      T(2),
                      c(s),
                      c(n),
                      h(
                        f,
                        () => u(G),
                        (e) => w(G, e),
                      ),
                      i(t, n));
                  };
                (n(_, (e) => {
                  u(W) && e(v);
                }),
                  x(
                    g,
                    () => u(W),
                    (e) => w(W, e),
                  ),
                  i(t, d));
              },
              $$slots: { default: !0 },
            }),
            i(t, d));
        },
        $$slots: { default: !0 },
      });
      var f = C(d, 2);
      O(f, {
        children: (e, t) => {
          var r = Ee(),
            a = b(r);
          (A(a, {
            children: (e, t) => {
              j(e, {
                class: `flex items-center gap-2`,
                children: (e, t) => {
                  var n = Ce();
                  (pe(b(n), { class: `h-5 w-5` }), T(), i(e, n));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            k(C(a, 2), {
              class: `space-y-4`,
              children: (e, t) => {
                var r = Te(),
                  a = C(b(r), 2),
                  o = m(a);
                (p(o),
                  N(C(o, 2), {
                    for: `smart-alerts`,
                    children: (e, t) => {
                      (T(), i(e, l(`Enable smart alerts`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  c(a));
                var s = C(a, 2),
                  d = (e) => {
                    var t = we(),
                      n = m(t);
                    N(n, {
                      for: `min-severity`,
                      children: (e, t) => {
                        (T(), i(e, l(`Minimum severity`)));
                      },
                      $$slots: { default: !0 },
                    });
                    var r = C(n, 2),
                      a = m(r);
                    a.value = a.__value = `info`;
                    var o = C(a);
                    o.value = o.__value = `warning`;
                    var s = C(o);
                    ((s.value = s.__value = `critical`),
                      c(r),
                      c(t),
                      h(
                        r,
                        () => u(q),
                        (e) => w(q, e),
                      ),
                      i(e, t));
                  };
                (n(s, (e) => {
                  u(K) && e(d);
                }),
                  x(
                    o,
                    () => u(K),
                    (e) => w(K, e),
                  ),
                  i(e, r));
              },
              $$slots: { default: !0 },
            }),
            i(e, r));
        },
        $$slots: { default: !0 },
      });
      var g = C(f, 2);
      O(g, {
        children: (e, t) => {
          var n = ke(),
            r = b(n);
          (A(r, {
            children: (e, t) => {
              j(e, {
                class: `flex items-center gap-2`,
                children: (e, t) => {
                  var n = De();
                  (le(b(n), { class: `h-5 w-5` }), T(), i(e, n));
                },
                $$slots: { default: !0 },
              });
            },
            $$slots: { default: !0 },
          }),
            k(C(r, 2), {
              class: `space-y-4`,
              children: (e, t) => {
                var n = Oe(),
                  r = C(b(n), 2),
                  a = m(r),
                  o = m(a);
                (p(o),
                  N(C(o, 2), {
                    for: `ch-inapp`,
                    children: (e, t) => {
                      (T(), i(e, l(`In-app notifications`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  c(a));
                var s = C(a, 2),
                  d = m(s);
                (p(d),
                  N(C(d, 2), {
                    for: `ch-email`,
                    children: (e, t) => {
                      (T(), i(e, l(`Email`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  c(s));
                var f = C(s, 2),
                  h = m(f);
                (p(h),
                  N(C(h, 2), {
                    for: `ch-slack`,
                    children: (e, t) => {
                      (T(), i(e, l(`Slack`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  c(f),
                  c(r),
                  x(
                    o,
                    () => u(J),
                    (e) => w(J, e),
                  ),
                  x(
                    d,
                    () => u(X),
                    (e) => w(X, e),
                  ),
                  x(
                    h,
                    () => u(Y),
                    (e) => w(Y, e),
                  ),
                  i(e, n));
              },
              $$slots: { default: !0 },
            }),
            i(e, n));
        },
        $$slots: { default: !0 },
      });
      var _ = C(g, 2),
        v = (t) => {
          O(t, {
            children: (t, a) => {
              var o = F(),
                s = b(o);
              (A(s, {
                children: (e, t) => {
                  j(e, {
                    class: `flex items-center gap-2`,
                    children: (e, t) => {
                      var n = Ae();
                      (ue(b(n), { class: `h-5 w-5` }), T(), i(e, n));
                    },
                    $$slots: { default: !0 },
                  });
                },
                $$slots: { default: !0 },
              }),
                k(C(s, 2), {
                  class: `space-y-4`,
                  children: (t, a) => {
                    var o = Me(),
                      s = C(b(o), 2),
                      d = m(s);
                    (p(d),
                      M(C(d, 2), {
                        variant: `outline`,
                        size: `sm`,
                        $$events: { click: He },
                        children: (t, n) => {
                          T();
                          var a = l();
                          (e(() => r(a, u(U) ? `Update` : `Save`)), i(t, a));
                        },
                        $$slots: { default: !0 },
                      }),
                      c(s));
                    var f = C(s, 2),
                      h = (e) => {
                        i(e, je());
                      };
                    (n(f, (e) => {
                      u(U) && e(h);
                    }),
                      ee(
                        d,
                        () => u(H),
                        (e) => w(H, e),
                      ),
                      i(t, o));
                  },
                  $$slots: { default: !0 },
                }),
                i(t, o));
            },
            $$slots: { default: !0 },
          });
        };
      n(_, (e) => {
        u(Y) && e(v);
      });
      var y = C(_, 2);
      (M(m(y), {
        get disabled() {
          return u(B);
        },
        $$events: { click: Ve },
        children: (t, n) => {
          var a = Ne(),
            o = b(a);
          de(o, { class: `h-4 w-4 mr-2` });
          var s = C(o);
          (e(() => r(s, ` ${u(B) ? `Saving...` : `Save Preferences`}`)), i(t, a));
        },
        $$slots: { default: !0 },
      }),
        c(y),
        i(t, s));
    };
  (n(We, (e) => {
    u(z) ? e(Ge) : e(Ke, -1);
  }),
    c(Z),
    i(E, Z),
    g(),
    Le());
}
export { I as component };
