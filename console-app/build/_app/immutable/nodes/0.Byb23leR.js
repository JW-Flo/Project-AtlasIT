import { n as e } from "../chunks/Bupu4aFx.js";
import {
  $ as t,
  A as n,
  C as r,
  D as i,
  F as a,
  H as o,
  I as s,
  K as c,
  L as l,
  M as u,
  N as d,
  P as f,
  Q as p,
  R as m,
  T as h,
  Tt as g,
  U as _,
  V as v,
  W as y,
  X as b,
  Z as x,
  a as S,
  at as C,
  bt as w,
  c as T,
  ct as E,
  d as D,
  f as O,
  gt as k,
  h as A,
  ht as j,
  it as ee,
  j as M,
  k as N,
  l as P,
  lt as F,
  mt as te,
  n as I,
  nt as L,
  o as R,
  ot as z,
  pt as ne,
  q as B,
  r as V,
  rt as re,
  s as H,
  st as U,
  ut as W,
  v as G,
  w as K,
  wt as q,
  xt as ie,
  z as J,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as ae } from "../chunks/DPj-wseU.js";
import {
  a as oe,
  i as se,
  n as ce,
  o as le,
  r as ue,
  s as de,
  t as fe,
} from "../chunks/D1NEK5Pl.js";
import { t as pe } from "../chunks/D8pbUplu.js";
import { r as Y, t as me } from "../chunks/D4lFFHu4.js";
import { t as X } from "../chunks/_6xtu--D.js";
import { t as he } from "../chunks/Bbgqa3ML.js";
import { t as ge } from "../chunks/Bv2yVmao.js";
import { t as _e } from "../chunks/B05d0eRK.js";
import { t as ve } from "../chunks/BaKV8GqY.js";
import { t as ye } from "../chunks/CMgwAYwY.js";
import { t as be } from "../chunks/BdOUJI0P.js";
import { t as xe } from "../chunks/Cnig6hXc.js";
import { t as Se } from "../chunks/Dg5qJDVh.js";
import { t as Ce } from "../chunks/KeBPUFmG.js";
import { n as we, t as Te } from "../chunks/eaBWeOv7.js";
import { t as Ee } from "../chunks/CfWPW66F.js";
import { t as De } from "../chunks/kq9QG3T02.js";
import { t as Oe } from "../chunks/C3V46i3A2.js";
import { t as ke } from "../chunks/H8UJX3L_2.js";
import { t as Ae } from "../chunks/Cyprtw_22.js";
import { t as je } from "../chunks/C_dKnYGb2.js";
import { t as Me } from "../chunks/CMGwYO6i2.js";
import { t as Ne } from "../chunks/BXmH0DjJ2.js";
import { t as Pe } from "../chunks/B0pEiESM2.js";
import { t as Fe } from "../chunks/BHPTFPdW2.js";
import { t as Ie } from "../chunks/elp0DnJy2.js";
import { n as Le, r as Re, t as ze } from "../chunks/BdUjKaVy2.js";
import { a as Be, i as Ve, n as He, r as Ue, t as We } from "../chunks/DRwGYiyO2.js";
var Ge = e({ csr: () => !0, prerender: () => !1, ssr: () => !1, trailingSlash: () => Ke }),
  Ke = `ignore`,
  qe = [],
  Je = !1;
function Ye(e) {
  qe.push(e);
}
function Z(e, t) {
  Ye({ name: e, t: performance.now(), props: t });
}
function Xe(e) {
  if (!Je) {
    Je = !0;
    try {
      e && e(qe);
    } catch {}
  }
}
function Ze() {
  (Z(`init`),
    document.readyState === `complete`
      ? Z(`doc_complete`)
      : window.addEventListener(`load`, () => Z(`doc_complete`), { once: !0 }),
    requestAnimationFrame(() => Z(`raf_1`)),
    requestIdleCallback?.(
      () => {
        (Z(`idle`), Xe());
      },
      { timeout: 3e3 },
    ));
}
var Q = J(`<button><!></button>`);
function $(e, n) {
  ie(n, !1);
  let r = E(),
    i = E(),
    a = R(n, `variant`, 8, `primary`),
    s = R(n, `size`, 8, `md`),
    c = R(n, `disabled`, 8, !1),
    u = R(n, `type`, 8, `button`),
    d = R(n, `ariaLabel`, 8, ``);
  (x(
    () => _(a()),
    () => {
      W(
        r,
        a() === `primary`
          ? `btn-primary`
          : a() === `outline`
            ? `btn-outline`
            : a() === `danger`
              ? `btn-danger`
              : `btn-subtle`,
      );
    },
  ),
    x(
      () => _(s()),
      () => {
        W(i, s() === `sm` ? `btn-sm` : `btn-md`);
      },
    ),
    p());
  var f = Q();
  (M(C(f), n, `default`, {}, null),
    g(f),
    t(() => {
      (G(f, `type`, u()),
        K(f, 1, `btn focus-ring ${y(r)} ${y(i)}`, `svelte-8a1c4v`),
        (f.disabled = c()),
        G(f, `aria-label`, d()));
    }),
    o(`click`, f, function (e) {
      T.call(this, n, e);
    }),
    l(e, f),
    w());
}
function Qe(e) {
  let t = e - 1;
  return t * t * t + 1;
}
function $e(e) {
  let t = typeof e == `string` && e.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
  return t ? [parseFloat(t[1]), t[2] || `px`] : [e, `px`];
}
function et(
  e,
  { delay: t = 0, duration: n = 400, easing: r = Qe, x: i = 0, y: a = 0, opacity: o = 0 } = {},
) {
  let s = getComputedStyle(e),
    c = +s.opacity,
    l = s.transform === `none` ? `` : s.transform,
    u = c * (1 - o),
    [d, f] = $e(i),
    [p, m] = $e(a);
  return {
    delay: t,
    duration: n,
    easing: r,
    css: (e, t) => `
			transform: ${l} translate(${(1 - e) * d}${f}, ${(1 - e) * p}${m});
			opacity: ${c - u * t}`,
  };
}
var tt = J(`<strong class="svelte-b2rfwu"> </strong>`),
  nt = J(
    `<div><div class="content svelte-b2rfwu"><!> <div class="msg svelte-b2rfwu"> </div></div> <!></div>`,
  ),
  rt = J(`<div class="toast-host svelte-b2rfwu" role="region" aria-live="polite"></div>`);
function it(e, n) {
  ie(n, !1);
  let r = E([]);
  I(Y.subscribe((e) => W(r, e)));
  let i = (e) =>
    e === `success`
      ? `toast-success`
      : e === `error`
        ? `toast-error`
        : e === `warning`
          ? `toast-warning`
          : `toast-info`;
  P();
  var o = rt();
  (d(
    o,
    5,
    () => y(r),
    (e) => e.id,
    (e, n) => {
      var r = nt(),
        o = C(r),
        c = C(o),
        u = (e) => {
          var r = tt(),
            i = C(r, !0);
          (g(r), t(() => s(i, y(n).title)), l(e, r));
        };
      a(c, (e) => {
        y(n).title && e(u);
      });
      var d = U(c, 2),
        f = C(d, !0);
      (g(d),
        g(o),
        $(U(o, 2), {
          size: `sm`,
          variant: `subtle`,
          ariaLabel: `Dismiss`,
          $$events: { click: () => me(y(n).id) },
          children: (e, t) => {
            (q(), l(e, v(`✕`)));
          },
          $$slots: { default: !0 },
        }),
        g(r),
        t(
          (e) => {
            (K(r, 1, `toast ${e ?? ``}`, `svelte-b2rfwu`), s(f, y(n).message));
          },
          [() => i(y(n).variant)],
        ),
        N(
          1,
          r,
          () => et,
          () => ({ y: 10, duration: 140 }),
        ),
        N(
          2,
          r,
          () => et,
          () => ({ y: -6, duration: 120 }),
        ),
        l(e, r));
    },
  ),
    g(o),
    l(e, o),
    w());
}
function at(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`circle`, { cx: `12`, cy: `12`, r: `10` }],
      [`path`, { d: `m9 12 2 2 4-4` }],
    ];
  X(
    e,
    H({ name: `circle-check` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function ot(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`rect`, { width: `8`, height: `4`, x: `8`, y: `2`, rx: `1`, ry: `1` }],
      [`path`, { d: `M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2` }],
      [`path`, { d: `m9 14 2 2 4-4` }],
    ];
  X(
    e,
    H({ name: `clipboard-check` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function st(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [
        `path`,
        {
          d: `M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3`,
        },
      ],
      [`path`, { d: `m14.305 19.53.923-.382` }],
      [`path`, { d: `m15.228 16.852-.923-.383` }],
      [`path`, { d: `m16.852 15.228-.383-.923` }],
      [`path`, { d: `m16.852 20.772-.383.924` }],
      [`path`, { d: `m19.148 15.228.383-.923` }],
      [`path`, { d: `m19.53 21.696-.382-.924` }],
      [`path`, { d: `m20.772 16.852.924-.383` }],
      [`path`, { d: `m20.772 19.148.924.383` }],
      [`circle`, { cx: `18`, cy: `18`, r: `3` }],
    ];
  X(
    e,
    H({ name: `folder-cog` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function ct(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [
        `path`,
        {
          d: `M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z`,
        },
      ],
      [`circle`, { cx: `16.5`, cy: `7.5`, r: `.5`, fill: `currentColor` }],
    ];
  X(
    e,
    H({ name: `key-round` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function lt(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`rect`, { width: `7`, height: `9`, x: `3`, y: `3`, rx: `1` }],
      [`rect`, { width: `7`, height: `5`, x: `14`, y: `3`, rx: `1` }],
      [`rect`, { width: `7`, height: `9`, x: `14`, y: `12`, rx: `1` }],
      [`rect`, { width: `7`, height: `5`, x: `3`, y: `16`, rx: `1` }],
    ];
  X(
    e,
    H({ name: `layout-dashboard` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function ut(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `m16 17 5-5-5-5` }],
      [`path`, { d: `M21 12H9` }],
      [`path`, { d: `M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4` }],
    ];
  X(
    e,
    H({ name: `log-out` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function dt(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M4 5h16` }],
      [`path`, { d: `M4 12h16` }],
      [`path`, { d: `M4 19h16` }],
    ];
  X(
    e,
    H({ name: `menu` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function ft(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8` }],
      [`path`, { d: `M3 3v5h5` }],
    ];
  X(
    e,
    H({ name: `rotate-ccw` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function pt(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`path`, { d: `M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5` }],
      [
        `path`,
        {
          d: `M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244`,
        },
      ],
      [`path`, { d: `M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05` }],
    ];
  X(
    e,
    H({ name: `store` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
function mt(e, t) {
  let n = S(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`rect`, { width: `8`, height: `8`, x: `3`, y: `3`, rx: `2` }],
      [`path`, { d: `M7 11v4a2 2 0 0 0 2 2h4` }],
      [`rect`, { width: `8`, height: `8`, x: `13`, y: `13`, rx: `2` }],
    ];
  X(
    e,
    H({ name: `workflow` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = m();
        (M(z(r), t, `default`, {}, null), l(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var ht = J(
    `<div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><!></div>`,
  ),
  gt = J(
    `<div class="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5"><!></div>`,
  ),
  _t = J(`<div class="copilot-content prose prose-sm dark:prose-invert max-w-none"></div>`),
  vt = J(
    `<a class="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"> <!></a>`,
  ),
  yt = J(`<div class="flex flex-wrap gap-1.5 mt-2"></div>`),
  bt = J(`<div><!> <div><div><!></div> <!> <div> </div></div></div>`);
function xt(e, n) {
  ie(n, !1);
  let r = E(),
    i = E(),
    o = R(n, `message`, 8);
  function c(e) {
    return e
      .replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        `<pre class="bg-muted rounded-md p-3 text-xs overflow-x-auto my-2"><code>$2</code></pre>`,
      )
      .replace(/`([^`]+)`/g, `<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>`)
      .replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`)
      .replace(/^### (.+)$/gm, `<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>`)
      .replace(/^## (.+)$/gm, `<h3 class="font-semibold mt-3 mb-1">$1</h3>`)
      .replace(/^(\d+)\. (.+)$/gm, `<li class="ml-4 list-decimal">$2</li>`)
      .replace(/^[-*] (.+)$/gm, `<li class="ml-4 list-disc">$1</li>`)
      .replace(/^\|(.+)\|$/gm, (e) => {
        let t = e
          .split(`|`)
          .filter(Boolean)
          .map((e) => e.trim());
        return t.every((e) => /^[-:]+$/.test(e))
          ? ``
          : `<tr>${t.map((e) => `<td class="border px-2 py-1 text-xs">${e}</td>`).join(``)}</tr>`;
      })
      .replace(/\n\n/g, `</p><p class='mt-2'>`)
      .replace(/\n/g, `<br>`);
  }
  (x(
    () => _(o()),
    () => {
      W(r, o().role === `user`);
    },
  ),
    x(
      () => _(o()),
      () => {
        W(i, c(o().content));
      },
    ),
    p(),
    P());
  var h = bt(),
    b = C(h),
    S = (e) => {
      var t = ht();
      (Te(C(t), { class: `h-3.5 w-3.5 text-primary` }), g(t), l(e, t));
    },
    T = (e) => {
      var t = gt();
      (ce(C(t), { class: `h-3.5 w-3.5 text-muted-foreground` }), g(t), l(e, t));
    };
  a(b, (e) => {
    y(r) ? e(T, -1) : e(S);
  });
  var D = U(b, 2),
    O = C(D),
    k = C(O),
    A = (e) => {
      var n = v();
      (t(() => s(n, (_(o()), B(() => o().content)))), l(e, n));
    },
    j = (e) => {
      var t = _t();
      (u(t, () => y(i), !0), g(t), l(e, t));
    };
  (a(k, (e) => {
    y(r) ? e(A) : e(j, -1);
  }),
    g(O));
  var ee = U(O, 2),
    M = (e) => {
      var n = yt();
      (d(
        n,
        5,
        () => (_(o()), B(() => o().actions)),
        f,
        (e, n) => {
          var r = m(),
            i = z(r),
            o = (e) => {
              var r = vt(),
                i = C(r);
              (_e(U(i), { class: `h-3 w-3` }),
                g(r),
                t(() => {
                  (G(r, `href`, (y(n), B(() => y(n).href))),
                    s(i, `${(y(n), B(() => y(n).label)) ?? ``} `));
                }),
                l(e, r));
            };
          (a(i, (e) => {
            (y(n), B(() => y(n).href) && e(o));
          }),
            l(e, r));
        },
      ),
        g(n),
        l(e, n));
    };
  a(ee, (e) => {
    (_(o()), B(() => o().actions && o().actions.length > 0) && e(M));
  });
  var N = U(ee, 2);
  K(N, 1, `text-[10px] text-muted-foreground mt-1 `);
  var F = C(N, !0);
  (g(N),
    g(D),
    g(h),
    t(
      (e) => {
        (K(h, 1, `flex items-start gap-3 ${y(r) ? `flex-row-reverse` : ``}`),
          K(D, 1, `flex-1 min-w-0 ${y(r) ? `text-right` : ``}`),
          K(
            O,
            1,
            `inline-block rounded-lg px-3 py-2 text-sm leading-relaxed ${y(r) ? `bg-primary text-primary-foreground max-w-[85%]` : `bg-muted/50 max-w-full text-left`}`,
          ),
          s(F, e));
      },
      [
        () => (
          _(o()),
          B(() =>
            new Date(o().timestamp).toLocaleTimeString([], { hour: `2-digit`, minute: `2-digit` }),
          )
        ),
      ],
    ),
    l(e, h),
    w());
}
var St = J(
    `<div class="flex items-center gap-2 text-sm text-muted-foreground py-4"><!> <span>Analyzing audit readiness...</span></div>`,
  ),
  Ct = J(`<p class="mt-1.5 font-mono text-[10px]"> </p>`),
  wt = J(
    `<div class="px-3 pb-3 pt-0 text-xs text-muted-foreground border-t"><p class="mt-2"> </p> <!> <a class="inline-flex items-center gap-1 mt-2 text-primary hover:underline">Take action <!></a></div>`,
  ),
  Tt = J(
    `<div class="rounded-md border overflow-hidden"><button class="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm hover:bg-accent/30 transition-colors"><!> <span class="flex-1 min-w-0 font-medium truncate"> </span> <!></button> <!></div>`,
  ),
  Et = J(
    `<div class="flex items-center gap-3 rounded-lg border p-3"><div><span> </span></div> <div><div class="text-sm font-semibold"> </div> <div class="text-xs text-muted-foreground"> </div></div></div> <div class="space-y-1.5"></div>`,
    1,
  ),
  Dt = J(`<div class="space-y-4"><!></div>`);
function Ot(e, r) {
  ie(r, !1);
  let i = R(r, `framework`, 8, `SOC2`),
    c = E(!0),
    u = E(0),
    f = E(0),
    p = E(0),
    m = E([]),
    h = E(new Set());
  V(async () => {
    try {
      let e = await fetch(`/api/copilot/audit-prep?framework=${encodeURIComponent(i())}`);
      if (e.ok) {
        let t = await e.json();
        (W(u, t.readinessScore), W(f, t.totalItems), W(p, t.completeItems), W(m, t.checklist));
      }
    } catch {
    } finally {
      W(c, !1);
    }
  });
  function _(e) {
    (y(h).has(e) ? y(h).delete(e) : y(h).add(e), W(h, y(h)));
  }
  function v(e) {
    return e >= 80 ? `text-green-500` : e >= 60 ? `text-yellow-500` : `text-red-500`;
  }
  function b(e) {
    return e === `complete` ? at : e === `warning` ? Me : be;
  }
  function x(e) {
    return e === `complete`
      ? `text-green-500`
      : e === `warning`
        ? `text-yellow-500`
        : `text-red-500`;
  }
  P();
  var S = Dt(),
    T = C(S),
    D = (e) => {
      var t = St();
      (we(C(t), { class: `h-4 w-4 animate-spin` }), q(2), g(t), l(e, t));
    },
    O = (e) => {
      var r = Et(),
        c = z(r),
        S = C(c),
        w = C(S),
        T = C(w);
      (g(w), g(S));
      var E = U(S, 2),
        D = C(E),
        O = C(D);
      g(D);
      var k = U(D, 2),
        A = C(k);
      (g(k), g(E), g(c));
      var j = U(c, 2);
      (d(
        j,
        5,
        () => y(m),
        (e) => e.id,
        (e, r) => {
          var i = Tt(),
            c = C(i),
            u = C(c);
          {
            let e = ne(() => (y(r), B(() => x(y(r).status))));
            n(
              u,
              () => b(y(r).status),
              (t, n) => {
                n(t, {
                  get class() {
                    return `h-4 w-4 shrink-0 ${y(e) ?? ``}`;
                  },
                });
              },
            );
          }
          var d = U(u, 2),
            f = C(d, !0);
          g(d);
          var p = U(d, 2);
          {
            let e = ne(() => (y(h), y(r), B(() => (y(h).has(y(r).id) ? `rotate-180` : ``))));
            ye(p, {
              get class() {
                return `h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${y(e) ?? ``}`;
              },
            });
          }
          g(c);
          var m = U(c, 2),
            v = (e) => {
              var n = wt(),
                i = C(n),
                o = C(i, !0);
              g(i);
              var c = U(i, 2),
                u = (e) => {
                  var n = Ct(),
                    i = C(n);
                  (g(n),
                    t(
                      (e) =>
                        s(
                          i,
                          `Controls: ${e ?? ``}${(y(r), B(() => (y(r).controls.length > 8 ? `...` : ``))) ?? ``}`,
                        ),
                      [() => (y(r), B(() => y(r).controls.slice(0, 8).join(`, `)))],
                    ),
                    l(e, n));
                };
              a(c, (e) => {
                (y(r), B(() => y(r).controls && y(r).controls.length > 0) && e(u));
              });
              var d = U(c, 2);
              (_e(U(C(d)), { class: `h-3 w-3` }),
                g(d),
                g(n),
                t(() => {
                  (s(o, (y(r), B(() => y(r).description))),
                    G(d, `href`, (y(r), B(() => y(r).href))));
                }),
                l(e, n));
            },
            S = te(() => (y(h), y(r), B(() => y(h).has(y(r).id))));
          (a(m, (e) => {
            y(S) && e(v);
          }),
            g(i),
            t(() => s(f, (y(r), B(() => y(r).title)))),
            o(`click`, c, () => _(y(r).id)),
            l(e, i));
        },
      ),
        g(j),
        t(
          (e) => {
            (K(
              S,
              1,
              `h-12 w-12 rounded-full border-2 flex items-center justify-center shrink-0 ${y(u) >= 80 ? `border-green-500` : y(u) >= 60 ? `border-yellow-500` : `border-red-500`}`,
            ),
              K(w, 1, `text-lg font-bold ${e ?? ``}`),
              s(T, `${y(u) ?? ``}%`),
              s(O, `${i() ?? ``} Audit Readiness`),
              s(A, `${y(p) ?? ``}/${y(f) ?? ``} items ready`));
          },
          [() => (y(u), B(() => v(y(u))))],
        ),
        l(e, r));
    };
  (a(T, (e) => {
    y(c) ? e(D) : e(O, -1);
  }),
    g(S),
    l(e, S),
    w());
}
var kt = J(
    `<div class="flex flex-col items-center justify-center h-full text-center px-4"><div class="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><!></div> <h3 class="text-base font-semibold mb-1">How can I help?</h3> <p class="text-sm text-muted-foreground mb-6">Ask about your compliance posture, audit readiness, or get recommendations.</p> <div class="w-full space-y-2"><button class="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent/50 transition-colors group"><div class="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><!></div> <div class="flex-1 min-w-0"><div class="font-medium">What should I do next?</div> <div class="text-xs text-muted-foreground">Get prioritized compliance actions</div></div> <!></button> <button class="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent/50 transition-colors group"><div class="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><!></div> <div class="flex-1 min-w-0"><div class="font-medium">Prepare for audit</div> <div class="text-xs text-muted-foreground">Generate audit readiness checklist</div></div> <!></button> <button class="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent/50 transition-colors group"><div class="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><!></div> <div class="flex-1 min-w-0"><div class="font-medium">Create automation rule</div> <div class="text-xs text-muted-foreground">Build a rule in plain English</div></div> <!></button></div></div>`,
  ),
  At = J(`<div class="px-1"><!></div>`),
  jt = J(
    `<div class="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><!> <span>Analyzing your compliance data...</span></div>`,
  ),
  Mt = J(`<div class="text-[10px] text-green-600 dark:text-green-400 mt-1"> </div>`),
  Nt = J(
    `<a class="block rounded-lg border p-3 text-sm hover:bg-accent/30 transition-colors"><div class="flex items-start gap-2"><span> </span> <div class="flex-1 min-w-0"><div class="font-medium"> </div> <div class="text-xs text-muted-foreground mt-0.5"> </div> <!></div> <!></div></a>`,
  ),
  Pt = J(
    `<div class="space-y-2"><h3 class="text-sm font-semibold px-1">Prioritized Actions</h3> <!></div>`,
  ),
  Ft = J(
    `<div class="flex items-start gap-3"><div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><!></div> <div class="flex items-center gap-2 text-sm text-muted-foreground py-2"><!> <span>Analyzing your compliance data...</span></div></div>`,
  ),
  It = J(`<!> <!>`, 1),
  Lt = J(
    `<button class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap hover:bg-accent/50 transition-colors shrink-0"><!> </button>`,
  ),
  Rt = J(`<div class="flex gap-1.5 mb-2 overflow-x-auto pb-1"></div>`),
  zt = J(
    `<div class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"></div> <aside class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col bg-card border-l shadow-2xl"><div class="flex items-center justify-between h-14 px-4 border-b shrink-0"><div class="flex items-center gap-2"><div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center"><!></div> <div><h2 class="text-sm font-semibold">Compliance Copilot</h2> <p class="text-[10px] text-muted-foreground">AI-powered compliance assistant</p></div></div> <div class="flex items-center gap-1"><button class="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="New conversation" aria-label="New conversation"><!></button> <button class="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Close copilot"><!></button></div></div> <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4"><!></div> <div class="border-t p-3 shrink-0"><!> <div class="flex items-end gap-2"><textarea placeholder="Ask about your compliance..." class="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" rows="1"></textarea> <button class="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0" aria-label="Send message"><!></button></div> <p class="text-[10px] text-muted-foreground mt-1.5 text-center">AI responses are based on your live compliance data. Always verify recommendations.</p></div></aside>`,
    1,
  );
function Bt(e, r) {
  ie(r, !1);
  let i = R(r, `open`, 8, !1),
    u = R(r, `onClose`, 8, () => {}),
    h = E([]),
    v = E(``),
    b = E(!1),
    S = null,
    T = E(),
    D = E(),
    k = E(!1),
    j = E([]),
    M = E(!1),
    te = [
      {
        id: `what_next`,
        label: `What should I do next?`,
        description: `Get prioritized compliance actions`,
        icon: Te,
      },
      {
        id: `audit_prep`,
        label: `Prepare for audit`,
        description: `Generate audit readiness checklist`,
        icon: ot,
      },
      {
        id: `create_rule`,
        label: `Create automation rule`,
        description: `Build a rule in plain English`,
        icon: Fe,
      },
    ];
  async function I() {
    (W(M, !0), W(k, !1));
    try {
      let e = await fetch(`/api/copilot/actions`);
      e.ok && W(j, (await e.json()).actions);
    } catch {}
    W(M, !1);
  }
  function ne() {
    (W(k, !0), W(j, []));
  }
  async function V(e, t) {
    let n = e ?? y(v).trim();
    if (!(!n && !t)) {
      (W(v, ``),
        W(b, !0),
        t ||
          W(h, [
            ...y(h),
            {
              id: crypto.randomUUID(),
              role: `user`,
              content: n,
              timestamp: new Date().toISOString(),
            },
          ]),
        await c(),
        re());
      try {
        let e = {};
        (t ? ((e.quickAction = t), (e.message = ``)) : (e.message = n),
          S && (e.conversationId = S));
        let r = await fetch(`/api/copilot/chat`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify(e),
        });
        if (!r.ok) {
          let e = await r.json().catch(() => ({ error: `Request failed` }));
          W(h, [
            ...y(h),
            {
              id: crypto.randomUUID(),
              role: `assistant`,
              content:
                e.error === `Rate limit exceeded. Try again later.`
                  ? `You've reached the copilot rate limit. Please try again in a bit.`
                  : `Sorry, I'm having trouble right now. Please try again.`,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }
        let i = await r.json();
        ((S = i.conversationId), W(h, [...y(h), i.message]));
      } catch {
        W(h, [
          ...y(h),
          {
            id: crypto.randomUUID(),
            role: `assistant`,
            content: `Connection error. Please check your network and try again.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        (W(b, !1), await c(), re());
      }
    }
  }
  function re() {
    y(T) && F(T, (y(T).scrollTop = y(T).scrollHeight));
  }
  function H(e) {
    e.key === `Enter` && !e.shiftKey && (e.preventDefault(), V());
  }
  function J() {
    (W(h, []), (S = null), W(v, ``), W(k, !1), W(j, []));
  }
  function ae(e) {
    e.key === `Escape` && i() && u()();
  }
  (x(
    () => (_(i()), y(D)),
    () => {
      i() && c().then(() => y(D)?.focus());
    },
  ),
    p(),
    P());
  var oe = m();
  o(`keydown`, ee, ae);
  var se = z(oe),
    ce = (e) => {
      var r = zt(),
        i = z(r),
        c = U(i, 2),
        p = C(c),
        m = C(p),
        _ = C(m);
      (Te(C(_), { class: `h-4 w-4 text-primary` }), g(_), q(2), g(m));
      var x = U(m, 2),
        S = C(x);
      (ft(C(S), { class: `h-4 w-4` }), g(S));
      var w = U(S, 2);
      (Pe(C(w), { class: `h-4 w-4` }), g(w), g(x), g(p));
      var E = U(p, 2),
        ee = C(E),
        P = (e) => {
          var n = kt(),
            r = C(n);
          (Ee(C(r), { class: `h-6 w-6 text-primary` }), g(r));
          var i = U(r, 6),
            a = C(i),
            s = C(a);
          (Te(C(s), { class: `h-4 w-4 text-primary` }),
            g(s),
            _e(U(s, 4), {
              class: `h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0`,
            }),
            g(a));
          var c = U(a, 2),
            u = C(c);
          (ot(C(u), { class: `h-4 w-4 text-primary` }),
            g(u),
            _e(U(u, 4), {
              class: `h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0`,
            }),
            g(c));
          var d = U(c, 2),
            f = C(d);
          (Fe(C(f), { class: `h-4 w-4 text-primary` }),
            g(f),
            _e(U(f, 4), {
              class: `h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0`,
            }),
            g(d),
            g(i),
            g(n),
            t(() => {
              ((a.disabled = y(b)), (c.disabled = y(b)), (d.disabled = y(b)));
            }),
            o(`click`, a, I),
            o(`click`, c, ne),
            o(`click`, d, () => V(void 0, `create_rule`)),
            l(e, n));
        },
        F = (e) => {
          var t = At();
          (Ot(C(t), { framework: `SOC2` }), g(t), l(e, t));
        },
        R = (e) => {
          var t = jt();
          (we(C(t), { class: `h-4 w-4 animate-spin` }), q(2), g(t), l(e, t));
        },
        re = (e) => {
          var n = Pt();
          (d(
            U(C(n), 2),
            1,
            () => y(j),
            (e) => e.id,
            (e, n) => {
              var r = Nt(),
                i = C(r),
                o = C(i),
                c = C(o, !0);
              g(o);
              var u = U(o, 2),
                d = C(u),
                f = C(d, !0);
              g(d);
              var p = U(d, 2),
                m = C(p, !0);
              g(p);
              var h = U(p, 2),
                _ = (e) => {
                  var r = Mt(),
                    i = C(r);
                  (g(r),
                    t(() =>
                      s(
                        i,
                        `+${(y(n), B(() => y(n).scoreImpact)) ?? ``}% estimated score improvement`,
                      ),
                    ),
                    l(e, r));
                };
              (a(h, (e) => {
                (y(n), B(() => y(n).scoreImpact) && e(_));
              }),
                g(u),
                _e(U(u, 2), { class: `h-4 w-4 text-muted-foreground shrink-0 mt-0.5` }),
                g(i),
                g(r),
                t(() => {
                  (G(r, `href`, (y(n), B(() => y(n).href))),
                    K(
                      o,
                      1,
                      `inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0 mt-0.5
                  ${(y(n), B(() => (y(n).impact === `critical` ? `bg-red-500/15 text-red-600 dark:text-red-400` : y(n).impact === `high` ? `bg-orange-500/15 text-orange-600 dark:text-orange-400` : y(n).impact === `medium` ? `bg-yellow-500/15 text-yellow-600 dark:text-yellow-400` : `bg-blue-500/15 text-blue-600 dark:text-blue-400`))) ?? ``}`,
                    ),
                    s(c, (y(n), B(() => y(n).impact))),
                    s(f, (y(n), B(() => y(n).title))),
                    s(m, (y(n), B(() => y(n).description))));
                }),
                l(e, r));
            },
          ),
            g(n),
            l(e, n));
        },
        ie = (e) => {
          var t = It(),
            n = z(t);
          d(
            n,
            1,
            () => y(h),
            (e) => e.id,
            (e, t) => {
              xt(e, {
                get message() {
                  return y(t);
                },
              });
            },
          );
          var r = U(n, 2),
            i = (e) => {
              var t = Ft(),
                n = C(t);
              (Te(C(n), { class: `h-3.5 w-3.5 text-primary` }), g(n));
              var r = U(n, 2);
              (we(C(r), { class: `h-4 w-4 animate-spin` }), q(2), g(r), g(t), l(e, t));
            };
          (a(r, (e) => {
            y(b) && e(i);
          }),
            l(e, t));
        };
      (a(ee, (e) => {
        (y(h),
          y(k),
          y(j),
          y(M),
          B(() => y(h).length === 0 && !y(k) && y(j).length === 0 && !y(M))
            ? e(P)
            : y(k)
              ? e(F, 1)
              : y(M)
                ? e(R, 2)
                : (y(j), B(() => y(j).length > 0) ? e(re, 3) : e(ie, -1)));
      }),
        g(E),
        O(
          E,
          (e) => W(T, e),
          () => y(T),
        ));
      var ae = U(E, 2),
        oe = C(ae),
        se = (e) => {
          var r = Rt();
          (d(
            r,
            5,
            () => te,
            f,
            (e, r) => {
              var i = Lt(),
                a = C(i);
              n(
                a,
                () => y(r).icon,
                (e, t) => {
                  t(e, { class: `h-3 w-3` });
                },
              );
              var c = U(a);
              (g(i),
                t(() => {
                  ((i.disabled = y(b)), s(c, ` ${(y(r), B(() => y(r).label)) ?? ``}`));
                }),
                o(`click`, i, () => V(void 0, y(r).id)),
                l(e, i));
            },
          ),
            g(r),
            l(e, r));
        };
      a(oe, (e) => {
        (y(h), B(() => y(h).length > 0) && e(se));
      });
      var ce = U(oe, 2),
        le = C(ce);
      (L(le),
        O(
          le,
          (e) => W(D, e),
          () => y(D),
        ));
      var ue = U(le, 2);
      (Oe(C(ue), { class: `h-4 w-4` }),
        g(ue),
        g(ce),
        q(2),
        g(ae),
        g(c),
        t(
          (e) => {
            ((le.disabled = y(b)), (ue.disabled = e));
          },
          [() => (y(b), y(v), B(() => y(b) || !y(v).trim()))],
        ),
        o(`click`, i, function (...e) {
          u()?.apply(this, e);
        }),
        o(`click`, S, J),
        o(`click`, w, function (...e) {
          u()?.apply(this, e);
        }),
        A(
          le,
          () => y(v),
          (e) => W(v, e),
        ),
        o(`keydown`, le, H),
        o(`click`, ue, () => V()),
        N(
          3,
          c,
          () => et,
          () => ({ x: 420, duration: 250, opacity: 1 }),
        ),
        l(e, r));
    };
  (a(se, (e) => {
    i() && e(ce);
  }),
    l(e, oe),
    w());
}
var Vt = null,
  Ht = null;
async function Ut(e = fetch) {
  return (
    Vt ||
    Ht ||
    ((Ht = (async () => {
      let t = { complianceBase: `/api/mock/compliance` };
      try {
        let n = await e(`/api/config`);
        if (!n.ok) return t;
        let r = await n.json(),
          i = typeof r?.complianceBase == `string` ? r.complianceBase : t.complianceBase,
          a = {
            complianceBase: i,
            resolvedBase: typeof r?.resolvedBase == `string` ? r.resolvedBase : i,
          };
        return ((Vt = a), a);
      } catch {
        return ((Vt = t), t);
      } finally {
        Ht = null;
      }
    })()),
    Ht)
  );
}
var Wt = J(`<img class="h-8 w-8 rounded-lg object-cover shrink-0"/>`),
  Gt = J(
    `<div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0"><span class="text-primary-foreground font-bold text-sm"> </span></div>`,
  ),
  Kt = J(`<span class="font-semibold text-lg tracking-tight"> </span>`),
  qt = J(
    `<div class="mx-3 mt-3 bg-destructive text-destructive-foreground text-xs rounded-md px-3 py-2 flex items-center justify-between"><span>Viewing as tenant</span> <button class="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded">Exit</button></div>`,
  ),
  Jt = J(
    `<div class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"> </div>`,
  ),
  Yt = J(`<a><!> <!></a>`),
  Xt = J(`<div><!> <div class="space-y-0.5"></div></div>`),
  Zt = J(`<span>Collapse</span>`),
  Qt = J(`<div class="text-xs text-muted-foreground truncate"> </div>`),
  $t = J(`<div class="flex-1 min-w-0"><div class="text-sm font-medium truncate"> </div> <!></div>`),
  en = J(`<img class="h-8 w-8 rounded-lg object-cover"/>`),
  tn = J(
    `<div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><span class="text-primary-foreground font-bold text-sm"> </span></div>`,
  ),
  nn = J(
    `<div class="mx-3 mt-3 bg-destructive text-destructive-foreground text-xs rounded-md px-3 py-2 flex items-center justify-between"><span>Viewing as tenant</span> <button class="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded">Exit</button></div>`,
  ),
  rn = J(`<a><!> </a>`),
  an = J(
    `<div><div class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"> </div> <div class="space-y-0.5"></div></div>`,
  ),
  on = J(`<div class="text-xs text-muted-foreground truncate"> </div>`),
  sn = J(
    `<div class="fixed inset-0 z-40 md:hidden"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div> <aside class="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] flex flex-col bg-card border-r shadow-xl overflow-y-auto"><div class="flex items-center justify-between gap-2 px-4 h-16 border-b shrink-0"><a href="/console" class="flex items-center gap-2"><!> <span class="font-semibold text-lg tracking-tight"> </span></a> <button class="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Close navigation menu"><!></button></div> <!> <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6"></nav> <div class="border-t p-3 shrink-0"><a href="/console/profile" class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors"><!> <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate"> </div> <!></div></a></div></aside></div>`,
  ),
  cn = J(`<!> <span class="text-foreground font-medium"> </span>`, 1),
  ln = J(
    `<span class="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"> </span>`,
  ),
  un = J(
    `<a href="/console/compliance"><!> <span> </span> <span class="text-[10px] opacity-75"> </span></a>`,
  ),
  dn = J(`<div class="text-xs text-muted-foreground truncate"> </div>`),
  fn = J(
    `<div class="absolute top-full right-0 mt-1.5 w-64 rounded-lg border bg-card shadow-lg z-50 overflow-hidden"><div class="flex items-center gap-3 p-4"><!> <div class="min-w-0"><div class="text-sm font-semibold truncate"> </div> <!></div></div> <!> <a href="/console/profile" class="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><!> My Account</a> <a href="/console/settings" class="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><!> Settings</a> <button class="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full text-left"><!> Sign Out</button></div>`,
  ),
  pn = J(
    `<div class="flex h-dvh bg-background text-foreground overflow-hidden"><a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm">Skip to content</a> <aside><a href="/console"><!> <!></a> <!> <nav></nav> <div><button><!> <!></button></div> <div><a href="/console/profile"><!> <!></a></div></aside> <!> <div class="flex-1 min-w-0 flex flex-col"><header class="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60"><div class="flex items-center gap-2 text-sm text-muted-foreground"><button class="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors -ml-1" aria-label="Toggle navigation menu"><!></button> <a href="/console" class="hover:text-foreground transition-colors">Console</a> <!></div> <div class="flex items-center gap-1"><a href="/notifications" class="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Notifications" aria-label="Notifications"><!> <!></a> <!> <button title="Compliance Copilot (Cmd+K)" aria-label="Toggle compliance copilot"><!></button> <button class="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Toggle theme" aria-label="Toggle theme"><!></button> <div class="profile-dropdown-container relative ml-1"><button class="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-accent transition-colors" aria-label="User menu"><!> <!></button> <!></div></div></header> <main class="flex-1 overflow-y-auto" id="main"><div class="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8"><!></div> <!> <footer class="border-t py-4 px-6 text-center text-xs text-muted-foreground"> <a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a> &middot; <a href="/privacy/dsar" class="hover:text-foreground transition-colors">Data Requests</a> &middot; <a href="/terms" class="hover:text-foreground transition-colors">Terms</a> &middot; <a href="/support" class="hover:text-foreground transition-colors">Support</a> &middot; <a href="https://status.atlasit.pro" class="hover:text-foreground transition-colors">Status</a></footer></main></div> <!></div>`,
  );
function mn(e, i) {
  ie(i, !1);
  let c = () => k(pe, `$page`, m),
    u = () => k(He, `$complianceScore`, m),
    [m, b] = j(),
    S = E(),
    T = E(),
    O = E(),
    A = E(),
    N = R(i, `serverSession`, 8, null),
    F = E([]),
    te = E(!1),
    I = E(``),
    L = E(``),
    re = E(!1),
    H = E(``),
    J = E(``),
    Y = E(``),
    me = [
      {
        title: `Overview`,
        items: [
          { href: `/console`, label: `Dashboard`, icon: lt },
          { href: `/console/directory`, label: `Directory`, icon: Ne },
        ],
      },
      {
        title: `Compliance`,
        items: [
          { href: `/console/compliance`, label: `Controls`, icon: Ae },
          { href: `/console/compliance/feed`, label: `Evidence`, icon: he },
          { href: `/console/policies`, label: `Policies`, icon: Se },
          { href: `/console/insights`, label: `Insights`, icon: Ce },
          { href: `/console/compliance/attestations`, label: `Attestations`, icon: xe },
          { href: `/console/compliance/packs`, label: `Packs`, icon: st },
        ],
      },
      {
        title: `Security`,
        items: [
          { href: `/console/access-reviews`, label: `Access Reviews`, icon: ot },
          { href: `/access-requests`, label: `Access Requests`, icon: ct },
          { href: `/console/incidents`, label: `Incidents`, icon: Me },
          { href: `/console/nhi`, label: `NHI Governance`, icon: Ae },
          { href: `/console/jml/changelog`, label: `JML Changelog`, icon: Se },
        ],
      },
      {
        title: `Automation`,
        items: [
          { href: `/console/workflows`, label: `Workflows`, icon: mt },
          { href: `/console/automation`, label: `Rules`, icon: Fe },
          { href: `/console/automation/runs`, label: `Runs`, icon: mt },
        ],
      },
      {
        title: `Apps`,
        items: [
          { href: `/console/apps`, label: `Connected Apps`, icon: ge },
          { href: `/console/marketplace`, label: `Marketplace`, icon: pt },
          { href: `/console/discovery`, label: `Discovery`, icon: De },
        ],
      },
      {
        title: `System`,
        items: [
          { href: `/console/platform-status`, label: `Platform Status`, icon: he },
          { href: `/console/settings`, label: `Settings`, icon: ke },
        ],
      },
    ];
  async function X() {
    (We(),
      await fetch(`/api/admin/impersonate/exit`, { method: `POST` }),
      (location.href = `/console/admin`));
  }
  function _e(e, t) {
    if (e === `/console`) return t === `/console` || t === `/console/`;
    if (!t.startsWith(e)) return !1;
    for (let n of y(O)) if (n !== e && n.startsWith(e) && t.startsWith(n)) return !1;
    return !0;
  }
  function be(e) {
    let t = e.trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(t) ||
      /^rgb[a]?\([^)]+\)$/.test(t) ||
      /^hsl[a]?\([^)]+\)$/.test(t) ||
      /^[a-zA-Z]{2,30}$/.test(t)
      ? t
      : ``;
  }
  function we(e, t) {
    (W(J, e),
      W(Y, be(t)),
      typeof document < `u` &&
        (y(Y)
          ? document.documentElement.style.setProperty(`--accent-brand`, y(Y))
          : document.documentElement.style.removeProperty(`--accent-brand`)));
  }
  function Ee(e) {
    e?.authenticated &&
      (W(F, e.roles || []),
      W(te, e.superAdmin || !1),
      W(I, e.email || ``),
      W(L, e.displayName || e.email || `User`),
      W(re, e.impersonating || !1),
      e.impersonatedBy,
      W(H, e.orgName || ``),
      we(e.branding?.logoUrl || ``, e.branding?.accentColor || ``),
      typeof window < `u` && Re.set(e));
  }
  async function Oe(e = !1) {
    Ee(await (e ? Le() : ze()));
  }
  V(async () => {
    Ze();
    try {
      await Ut();
    } catch {}
    if (!N()?.authenticated)
      try {
        await Oe();
      } catch {}
    let e = (e) => {
      let t = e?.detail;
      t ? we(t.logoUrl || ``, t.accentColor || ``) : Oe(!0).catch(() => {});
    };
    (window.addEventListener(`branding-updated`, e), le().catch(() => {}));
    let t = c().data?.complianceScores;
    return (
      t ? Ve(t) : Ue().catch(() => {}),
      () => window.removeEventListener(`branding-updated`, e)
    );
  });
  let Ge;
  V(
    () => (
      (Ge = setInterval(() => {
        Be().catch(() => {});
      }, 6e4)),
      () => clearInterval(Ge)
    ),
  );
  let Ke = E(0);
  V(async () => {
    try {
      let e = await fetch(`/api/notifications?unread=true`);
      e.ok && W(Ke, (await e.json()).unreadCount || 0);
    } catch {
      W(Ke, 0);
    }
  });
  let qe = E(`dark`),
    Je = de.subscribe((e) => W(qe, e));
  function Ye() {
    oe(y(qe) === `dark` ? `light` : `dark`);
  }
  V(() => () => Je());
  let Z = E(!1),
    Xe = E(!1),
    Q = E(!1),
    $ = E(!1);
  typeof window < `u` && W(Q, localStorage.getItem(`sidebar-collapsed`) === `true`);
  function Qe() {
    (W(Q, !y(Q)), typeof window < `u` && localStorage.setItem(`sidebar-collapsed`, String(y(Q))));
  }
  function $e() {
    W(Xe, !1);
  }
  function et(e) {
    e.target.closest(`.profile-dropdown-container`) || W(Z, !1);
  }
  function tt(e) {
    (e.metaKey || e.ctrlKey) && e.key === `k` && (e.preventDefault(), W($, !y($)));
  }
  async function nt() {
    (We(), await fetch(`/api/auth/logout`, { method: `POST` }), (location.href = `/console/login`));
  }
  let rt = new Set([
    `nhi`,
    `jml`,
    `sso`,
    `mfa`,
    `api`,
    `sla`,
    `ai`,
    `rbac`,
    `oidc`,
    `saml`,
    `scim`,
  ]);
  function at(e) {
    return e.replace(/\b\w+/g, (e) =>
      rt.has(e.toLowerCase()) ? e.toUpperCase() : e.charAt(0).toUpperCase() + e.slice(1),
    );
  }
  (x(
    () => (y(te), y(F), he),
    () => {
      W(
        S,
        y(te) || y(F).includes(`super-admin`)
          ? [
              ...me.slice(0, -1),
              {
                ...me[me.length - 1],
                items: [
                  ...me[me.length - 1].items,
                  { href: `/console/admin`, label: `Admin`, icon: je },
                  { href: `/console/admin/operations`, label: `Operations`, icon: he },
                ],
              },
            ]
          : me,
      );
    },
  ),
    x(
      () => c(),
      () => {
        W(T, c().url.pathname);
      },
    ),
    x(
      () => y(S),
      () => {
        W(
          O,
          y(S).flatMap((e) => e.items.map((e) => e.href)),
        );
      },
    ),
    x(
      () => _(N()),
      () => {
        N()?.authenticated && Ee(N());
      },
    ),
    x(
      () => y(T),
      () => {
        y(T) && W(Xe, !1);
      },
    ),
    x(
      () => y(L),
      () => {
        W(
          A,
          y(L)
            ? y(L)
                .split(/[\s@]/)
                .filter(Boolean)
                .slice(0, 2)
                .map((e) => e[0].toUpperCase())
                .join(``)
            : `?`,
        );
      },
    ),
    p(),
    P());
  var ft = pn();
  (o(`click`, ee, et), o(`keydown`, ee, tt));
  var ht = U(C(ft), 2),
    gt = C(ht),
    _t = C(gt),
    vt = (e) => {
      var n = Wt();
      (t(() => {
        (G(n, `src`, y(J)), G(n, `alt`, `${(y(H) || `Organization`) ?? ``} logo`));
      }),
        l(e, n));
    },
    yt = (e) => {
      var n = Gt(),
        i = C(n),
        a = C(i, !0);
      (g(i),
        g(n),
        t(
          (e) => {
            (r(n, y(Y) ? `background-color: ${y(Y)}` : ``), s(a, e));
          },
          [() => (y(H), B(() => (y(H) ? y(H)[0].toUpperCase() : `A`)))],
        ),
        l(e, n));
    };
  a(_t, (e) => {
    y(J) ? e(vt) : e(yt, -1);
  });
  var bt = U(_t, 2),
    xt = (e) => {
      var n = Kt(),
        r = C(n, !0);
      (g(n), t(() => s(r, y(H) || `AtlasIT`)), l(e, n));
    };
  (a(bt, (e) => {
    y(Q) || e(xt);
  }),
    g(gt));
  var St = U(gt, 2),
    Ct = (e) => {
      var t = qt(),
        n = U(C(t), 2);
      (g(t), o(`click`, n, X), l(e, t));
    };
  a(St, (e) => {
    y(re) && !y(Q) && e(Ct);
  });
  var wt = U(St, 2);
  (d(
    wt,
    5,
    () => y(S),
    f,
    (e, i) => {
      var o = Xt(),
        c = C(o),
        u = (e) => {
          var n = Jt(),
            r = C(n, !0);
          (g(n), t(() => s(r, (y(i), B(() => y(i).title)))), l(e, n));
        };
      a(c, (e) => {
        y(Q) || e(u);
      });
      var p = U(c, 2);
      (d(
        p,
        5,
        () => (y(i), B(() => y(i).items)),
        f,
        (e, i) => {
          let o = ne(() => (y(i), y(T), B(() => _e(y(i).href, y(T)))));
          var c = Yt(),
            u = C(c);
          n(
            u,
            () => y(i).icon,
            (e, t) => {
              t(e, { class: `h-4 w-4 shrink-0` });
            },
          );
          var d = U(u, 2),
            f = (e) => {
              var n = v();
              (t(() => s(n, (y(i), B(() => y(i).label)))), l(e, n));
            };
          (a(d, (e) => {
            y(Q) || e(f);
          }),
            g(c),
            t(
              (e) => {
                (G(c, `href`, (y(i), B(() => y(i).href))),
                  G(c, `title`, (y(Q), y(i), B(() => (y(Q) ? y(i).label : ``)))),
                  K(c, 1, e, `svelte-1bh9rh3`),
                  r(c, y(o) && y(Y) ? `color: ${y(Y)}` : ``));
              },
              [
                () =>
                  h(
                    (_(ae),
                    y(Q),
                    _(y(o)),
                    B(() =>
                      ae(
                        `flex items-center rounded-md text-sm font-medium transition-colors`,
                        y(Q) ? `justify-center px-2 py-2` : `gap-3 px-3 py-2 border-l-2`,
                        y(o)
                          ? y(Q)
                            ? `nav-active bg-[color-mix(in_srgb,var(--accent-brand,hsl(var(--primary)))_10%,transparent)]`
                            : `nav-active bg-[color-mix(in_srgb,var(--accent-brand,hsl(var(--primary)))_10%,transparent)] border-l-[var(--accent-brand,hsl(var(--primary)))]`
                          : y(Q)
                            ? `text-muted-foreground hover:bg-accent hover:text-accent-foreground`
                            : `text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent`,
                      ),
                    )),
                  ),
              ],
            ),
            l(e, c));
        },
      ),
        g(p),
        g(o),
        l(e, o));
    },
  ),
    g(wt));
  var Tt = U(wt, 2),
    Et = C(Tt),
    Dt = C(Et);
  {
    let e = ne(() => (y(Q) ? `rotate-[-90deg]` : `rotate-90`));
    ye(Dt, {
      get class() {
        return `h-4 w-4 shrink-0 ${y(e) ?? ``} transition-transform`;
      },
    });
  }
  var Ot = U(Dt, 2),
    kt = (e) => {
      l(e, Zt());
    };
  (a(Ot, (e) => {
    y(Q) || e(kt);
  }),
    g(Et),
    g(Tt));
  var At = U(Tt, 2),
    jt = C(At),
    Mt = C(jt);
  fe(Mt, {
    get initials() {
      return y(A);
    },
    size: `sm`,
  });
  var Nt = U(Mt, 2),
    Pt = (e) => {
      var n = $t(),
        r = C(n),
        i = C(r, !0);
      g(r);
      var o = U(r, 2),
        c = (e) => {
          var n = Qt(),
            r = C(n, !0);
          (g(n), t(() => s(r, y(I))), l(e, n));
        };
      (a(o, (e) => {
        y(I) && y(I) !== y(L) && e(c);
      }),
        g(n),
        t(() => s(i, y(L) || `User`)),
        l(e, n));
    };
  (a(Nt, (e) => {
    y(Q) || e(Pt);
  }),
    g(jt),
    g(At),
    g(ht));
  var Ft = U(ht, 2),
    It = (e) => {
      var i = sn(),
        c = C(i),
        u = U(c, 2),
        p = C(u),
        m = C(p),
        v = C(m),
        b = (e) => {
          var n = en();
          (t(() => {
            (G(n, `src`, y(J)), G(n, `alt`, `${(y(H) || `Organization`) ?? ``} logo`));
          }),
            l(e, n));
        },
        x = (e) => {
          var n = tn(),
            i = C(n),
            a = C(i, !0);
          (g(i),
            g(n),
            t(
              (e) => {
                (r(n, y(Y) ? `background-color: ${y(Y)}` : ``), s(a, e));
              },
              [() => (y(H), B(() => (y(H) ? y(H)[0].toUpperCase() : `A`)))],
            ),
            l(e, n));
        };
      a(v, (e) => {
        y(J) ? e(b) : e(x, -1);
      });
      var w = U(v, 2),
        E = C(w, !0);
      (g(w), g(m));
      var D = U(m, 2);
      (Pe(C(D), { class: `h-5 w-5` }), g(D), g(p));
      var O = U(p, 2),
        k = (e) => {
          var t = nn(),
            n = U(C(t), 2);
          (g(t), o(`click`, n, X), l(e, t));
        };
      a(O, (e) => {
        y(re) && e(k);
      });
      var j = U(O, 2);
      (d(
        j,
        5,
        () => y(S),
        f,
        (e, i) => {
          var a = an(),
            c = C(a),
            u = C(c, !0);
          g(c);
          var p = U(c, 2);
          (d(
            p,
            5,
            () => (y(i), B(() => y(i).items)),
            f,
            (e, i) => {
              let a = ne(() => (y(i), y(T), B(() => _e(y(i).href, y(T)))));
              var c = rn(),
                u = C(c);
              n(
                u,
                () => y(i).icon,
                (e, t) => {
                  t(e, { class: `h-4 w-4 shrink-0` });
                },
              );
              var d = U(u);
              (g(c),
                t(
                  (e) => {
                    (G(c, `href`, (y(i), B(() => y(i).href))),
                      K(c, 1, e, `svelte-1bh9rh3`),
                      r(c, y(a) && y(Y) ? `color: ${y(Y)}` : ``),
                      s(d, ` ${(y(i), B(() => y(i).label)) ?? ``}`));
                  },
                  [
                    () =>
                      h(
                        (_(ae),
                        _(y(a)),
                        B(() =>
                          ae(
                            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors border-l-2`,
                            y(a)
                              ? `bg-[color-mix(in_srgb,var(--accent-brand,hsl(var(--primary)))_10%,transparent)] border-l-[var(--accent-brand,hsl(var(--primary)))]`
                              : `text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent`,
                          ),
                        )),
                      ),
                  ],
                ),
                o(`click`, c, $e),
                l(e, c));
            },
          ),
            g(p),
            g(a),
            t(() => s(u, (y(i), B(() => y(i).title)))),
            l(e, a));
        },
      ),
        g(j));
      var ee = U(j, 2),
        M = C(ee),
        N = C(M);
      fe(N, {
        get initials() {
          return y(A);
        },
        size: `sm`,
      });
      var P = U(N, 2),
        F = C(P),
        te = C(F, !0);
      g(F);
      var R = U(F, 2),
        z = (e) => {
          var n = on(),
            r = C(n, !0);
          (g(n), t(() => s(r, y(I))), l(e, n));
        };
      (a(R, (e) => {
        y(I) && y(I) !== y(L) && e(z);
      }),
        g(P),
        g(M),
        g(ee),
        g(u),
        g(i),
        t(() => {
          (s(E, y(H) || `AtlasIT`), s(te, y(L) || `User`));
        }),
        o(`click`, c, $e),
        o(`click`, m, $e),
        o(`click`, D, $e),
        o(`click`, M, $e),
        l(e, i));
    };
  a(Ft, (e) => {
    y(Xe) && e(It);
  });
  var Lt = U(Ft, 2),
    Rt = C(Lt),
    zt = C(Rt),
    Vt = C(zt),
    Ht = C(Vt),
    mn = (e) => {
      Pe(e, { class: `h-5 w-5` });
    },
    hn = (e) => {
      dt(e, { class: `h-5 w-5` });
    };
  (a(Ht, (e) => {
    y(Xe) ? e(mn) : e(hn, -1);
  }),
    g(Vt));
  var gn = U(Vt, 4),
    _n = (e) => {
      var n = cn(),
        r = z(n);
      ye(r, { class: `h-3 w-3 -rotate-90` });
      var i = U(r, 2),
        a = C(i, !0);
      (g(i),
        t(
          (e) => s(a, e),
          [
            () => (
              y(T),
              B(() => at(y(T).split(`/`).filter(Boolean).slice(1).join(` / `).replace(/-/g, ` `)))
            ),
          ],
        ),
        l(e, n));
    };
  (a(gn, (e) => {
    y(T) !== `/console` && y(T) !== `/console/` && e(_n);
  }),
    g(zt));
  var vn = U(zt, 2),
    yn = C(vn),
    bn = C(yn);
  ve(bn, { class: `h-[18px] w-[18px]` });
  var xn = U(bn, 2),
    Sn = (e) => {
      var n = ln(),
        r = C(n, !0);
      (g(n), t(() => s(r, y(Ke) > 9 ? `9+` : y(Ke))), l(e, n));
    };
  (a(xn, (e) => {
    y(Ke) > 0 && e(Sn);
  }),
    g(yn));
  var Cn = U(yn, 2),
    wn = (e) => {
      var n = un(),
        r = C(n);
      Ae(r, { class: `h-3.5 w-3.5` });
      var i = U(r, 2),
        a = C(i, !0);
      g(i);
      var o = U(i, 2),
        c = C(o);
      (g(o),
        g(n),
        t(
          (e) => {
            (K(
              n,
              1,
              `hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-semibold transition-colors
              ${(u(), B(() => (u().overallScore >= 80 ? `bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25` : u().overallScore >= 60 ? `bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25` : `bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25`))) ?? ``}`,
            ),
              G(n, `title`, `Compliance: ${e ?? ``}`),
              G(
                n,
                `aria-label`,
                `Compliance score: ${(u(), B(() => u().grade)) ?? ``} ${(u(), B(() => u().overallScore)) ?? ``}%`,
              ),
              s(a, (u(), B(() => u().grade))),
              s(c, `${(u(), B(() => u().overallScore)) ?? ``}%`));
          },
          [
            () => (
              u(),
              B(() =>
                u()
                  .frameworks.map((e) => `${e.framework} ${e.grade} (${e.score}%)`)
                  .join(`, `),
              )
            ),
          ],
        ),
        l(e, n));
    };
  a(Cn, (e) => {
    u() && e(wn);
  });
  var Tn = U(Cn, 2);
  (Te(C(Tn), { class: `h-[18px] w-[18px]` }), g(Tn));
  var En = U(Tn, 2),
    Dn = C(En),
    On = (e) => {
      ue(e, { class: `h-[18px] w-[18px]` });
    },
    kn = (e) => {
      se(e, { class: `h-[18px] w-[18px]` });
    };
  (a(Dn, (e) => {
    y(qe) === `dark` ? e(On) : e(kn, -1);
  }),
    g(En));
  var An = U(En, 2),
    jn = C(An),
    Mn = C(jn);
  (fe(Mn, {
    get initials() {
      return y(A);
    },
    size: `sm`,
  }),
    ye(U(Mn, 2), { class: `h-3 w-3 text-muted-foreground` }),
    g(jn));
  var Nn = U(jn, 2),
    Pn = (e) => {
      var n = fn(),
        r = C(n),
        i = C(r);
      fe(i, {
        get initials() {
          return y(A);
        },
        size: `lg`,
      });
      var c = U(i, 2),
        u = C(c),
        d = C(u, !0);
      g(u);
      var f = U(u, 2),
        p = (e) => {
          var n = dn(),
            r = C(n, !0);
          (g(n), t(() => s(r, y(I))), l(e, n));
        };
      (a(f, (e) => {
        y(I) && y(I) !== y(L) && e(p);
      }),
        g(c),
        g(r));
      var m = U(r, 2);
      Ie(m, {});
      var h = U(m, 2);
      (ce(C(h), { class: `h-4 w-4` }), q(), g(h));
      var _ = U(h, 2);
      (ke(C(_), { class: `h-4 w-4` }), q(), g(_));
      var v = U(_, 2);
      (ut(C(v), { class: `h-4 w-4` }),
        q(),
        g(v),
        g(n),
        t(() => s(d, y(L))),
        o(`click`, h, () => W(Z, !1)),
        o(`click`, _, () => W(Z, !1)),
        o(`click`, v, nt),
        l(e, n));
    };
  (a(Nn, (e) => {
    y(Z) && e(Pn);
  }),
    g(An),
    g(vn),
    g(Rt));
  var Fn = U(Rt, 2),
    In = C(Fn);
  (M(C(In), i, `default`, {}, null), g(In));
  var Ln = U(In, 2);
  it(Ln, {});
  var Rn = U(Ln, 2),
    zn = C(Rn);
  (q(9),
    g(Rn),
    g(Fn),
    g(Lt),
    Bt(U(Lt, 2), {
      onClose: () => W($, !1),
      get open() {
        return y($);
      },
      set open(e) {
        W($, e);
      },
      $$legacy: !0,
    }),
    g(ft),
    t(
      (e) => {
        (K(
          ht,
          1,
          `hidden md:flex flex-col border-r bg-card shrink-0 sidebar-transition ${y(Q) ? `w-[64px]` : `w-[240px]`}`,
          `svelte-1bh9rh3`,
        ),
          K(
            gt,
            1,
            `flex items-center gap-2 h-16 border-b hover:bg-accent/50 transition-colors ${y(Q) ? `px-4 justify-center` : `px-6`}`,
          ),
          G(gt, `title`, y(Q) ? y(H) || `AtlasIT` : ``),
          K(wt, 1, `flex-1 overflow-y-auto py-4 ${y(Q) ? `px-2` : `px-3`} space-y-6`),
          K(Tt, 1, `border-t ${y(Q) ? `px-2` : `px-3`} py-2`),
          K(
            Et,
            1,
            `flex items-center ${y(Q) ? `justify-center` : `gap-3 px-3`} w-full rounded-md py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors`,
          ),
          G(Et, `title`, y(Q) ? `Expand sidebar` : `Collapse sidebar`),
          G(Et, `aria-label`, y(Q) ? `Expand sidebar` : `Collapse sidebar`),
          K(At, 1, `border-t ${y(Q) ? `p-2` : `p-3`}`),
          K(
            jt,
            1,
            `flex items-center ${y(Q) ? `justify-center` : `gap-3 px-3`} rounded-md py-2 hover:bg-accent transition-colors`,
          ),
          G(jt, `title`, y(Q) ? y(L) : ``),
          G(Vt, `aria-expanded`, y(Xe)),
          K(
            Tn,
            1,
            `inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors ${y($) ? `bg-primary/10 text-primary` : `hover:bg-accent text-muted-foreground hover:text-foreground`}`,
          ),
          G(jn, `aria-expanded`, y(Z)),
          s(zn, `© ${e ?? ``} AtlasIT · `));
      },
      [() => B(() => new Date().getFullYear())],
    ),
    o(`click`, Et, Qe),
    o(`click`, Vt, () => W(Xe, !y(Xe))),
    o(`click`, Tn, () => W($, !y($))),
    o(`click`, En, Ye),
    o(
      `click`,
      jn,
      D(() => W(Z, !y(Z))),
    ),
    l(e, ft),
    w(),
    b());
}
var hn = J(`<meta name="viewport" content="width=device-width, initial-scale=1"/>`);
function gn(e, t) {
  ie(t, !1);
  let n = () => k(pe, `$page`, r),
    [r, o] = j(),
    s = E(),
    c = E();
  if (typeof window < `u`) {
    let e = window.fetch.bind(window),
      t = {
        "/api/tenant/dashboard": `/api/v1/dashboard`,
        "/api/platform/dashboard": `/api/v1/dashboard`,
        "/api/tenant-compliance/scores": `/api/compliance/api/v1/policies/coverage`,
        "/api/evidence-feed": `/api/compliance/api/v1/evidence`,
        "/api/incidents": `/api/compliance/api/v1/incidents`,
        "/api/automation/executions": `/orchestrator/api/v1/automation/rules`,
        "/api/automation/rules": `/orchestrator/api/v1/automation/rules`,
        "/api/access-reviews": `/api/compliance/api/v1/access-requests`,
        "/api/access-requests": `/api/compliance/api/v1/access-requests`,
        "/api/analytics/events": `/orchestrator/api/v1/events`,
        "/api/auth/session": `/api/v1/auth/validate`,
      };
    window.fetch = function (n, r) {
      let i = typeof n == `string` ? n : n instanceof URL ? n.href : n.url;
      if (i.includes(`__data.json`))
        return Promise.resolve(
          new Response(JSON.stringify({ type: `data`, nodes: [null, null, null] }), {
            status: 200,
            headers: { "content-type": `application/json` },
          }),
        );
      if (!i.startsWith(`/api/`) && !i.startsWith(`/orchestrator/`) && !i.startsWith(`/adapters/`))
        return e(n, r);
      let a = new Headers(r?.headers ?? {}),
        o = sessionStorage.getItem(`atlasit_token`);
      o && !a.has(`authorization`) && a.set(`authorization`, `Bearer ${o}`);
      try {
        let e = JSON.parse(sessionStorage.getItem(`atlasit_user`) ?? `{}`);
        e.tenantId && !a.has(`x-tenant-id`) && a.set(`x-tenant-id`, e.tenantId);
      } catch {}
      a.has(`x-correlation-id`) || a.set(`x-correlation-id`, crypto.randomUUID());
      let [s, c] = i.split(`?`),
        l = ``;
      for (let [e, n] of Object.entries(t))
        if (s === e || s.startsWith(e + `/`)) {
          l = n + s.substring(e.length) + (c ? `?` + c : ``);
          break;
        }
      return (
        !l &&
          (s.startsWith(`/api/v1/`) ||
            s.startsWith(`/api/compliance/`) ||
            s.startsWith(`/api/onboarding/`) ||
            s.startsWith(`/orchestrator/`) ||
            s.startsWith(`/adapters/`)) &&
          (l = i),
        l
          ? e(`https://ahjoepuw96.execute-api.us-east-1.amazonaws.com${l}`, { ...r, headers: a })
          : Promise.resolve(
              new Response(JSON.stringify({ authenticated: !1, data: null, items: [] }), {
                status: 200,
                headers: { "content-type": `application/json` },
              }),
            )
      );
    };
  }
  V(() => {
    let e = sessionStorage.getItem(`atlasit_token`),
      t = window.location.pathname,
      n = [`/login`, `/`, `/support`, `/trust`, `/faq`, `/privacy`, `/developers`].some(
        (e) => t === e || t.startsWith(e + `/`),
      );
    if (!e && !n) {
      window.location.href = `/login`;
      return;
    }
  });
  let u = [
    `/login`,
    `/support`,
    `/trust`,
    `/console/login`,
    `/console/onboarding`,
    `/faq`,
    `/privacy`,
    `/developers`,
  ];
  (x(
    () => n(),
    () => {
      W(
        s,
        n().url.pathname === `/` ||
          u.some((e) => n().url.pathname === e || n().url.pathname.startsWith(e + `/`)),
      );
    },
  ),
    x(
      () => n(),
      () => {
        W(c, n().data?.session);
      },
    ),
    p(),
    P());
  var d = m();
  i(`12qhfyh`, (e) => {
    var t = hn();
    (b(() => {
      re.title = `AtlasIT Console`;
    }),
      l(e, t));
  });
  var f = z(d),
    h = (e) => {
      var n = m();
      (M(z(n), t, `default`, {}, null), l(e, n));
    },
    g = (e) => {
      mn(e, {
        get serverSession() {
          return y(c);
        },
        children: (e, n) => {
          var r = m();
          (M(z(r), t, `default`, {}, null), l(e, r));
        },
        $$slots: { default: !0 },
      });
    };
  (a(f, (e) => {
    y(s) ? e(h) : e(g, -1);
  }),
    l(e, d),
    w(),
    o());
}
export { gn as component, Ge as universal };
