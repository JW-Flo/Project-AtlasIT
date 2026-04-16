import {
  $ as e,
  I as t,
  L as n,
  R as r,
  T as i,
  Tt as a,
  U as o,
  a as s,
  at as c,
  bt as l,
  j as u,
  l as d,
  o as f,
  ot as p,
  q as m,
  s as h,
  vt as g,
  w as _,
  xt as v,
  z as y,
} from "./CjbcrE1v.js";
import "./CgBQPCl3.js";
import "./C8H49NTu.js";
import "./DuHeJQ6O.js";
import { t as b } from "./DPj-wseU.js";
import { t as x } from "./_6xtu--D.js";
var S = {
    blue: {
      50: `#e3f2ff`,
      100: `#b9e0ff`,
      200: `#8dcbff`,
      300: `#5fb2ff`,
      400: `#379bff`,
      500: `#0d82ff`,
      600: `#0066d6`,
      700: `#004ea5`,
      800: `#003671`,
      900: `#002244`,
    },
    gray: {
      50: `#f5f7fa`,
      100: `#e9edf2`,
      200: `#d4dbe3`,
      300: `#b5c0cc`,
      400: `#8d99a6`,
      500: `#677280`,
      600: `#4d5560`,
      700: `#363c44`,
      800: `#23272d`,
      900: `#14171a`,
    },
    red: { 400: `#f87171`, 500: `#ef4444`, 600: `#dc2626` },
    yellow: { 400: `#facc15`, 500: `#eab308` },
    green: { 400: `#4ade80`, 500: `#22c55e`, 600: `#16a34a` },
  },
  C = {
    "--color-bg": S.gray[900],
    "--color-surface": S.gray[800],
    "--color-surface-alt": S.gray[700],
    "--color-border": S.gray[600],
    "--color-text": `#f5f7fa`,
    "--color-text-dim": `#b5c0cc`,
    "--color-accent": S.blue[500],
    "--color-accent-hover": S.blue[400],
    "--color-critical": S.red[500],
    "--color-warning": S.yellow[500],
    "--color-success": S.green[500],
    "--color-focus": S.blue[300],
  },
  w = {
    "--color-bg": `#ffffff`,
    "--color-surface": S.gray[50],
    "--color-surface-alt": S.gray[100],
    "--color-border": S.gray[300],
    "--color-text": S.gray[900],
    "--color-text-dim": S.gray[500],
    "--color-accent": S.blue[600],
    "--color-accent-hover": S.blue[500],
    "--color-critical": S.red[500],
    "--color-warning": S.yellow[500],
    "--color-success": S.green[600],
    "--color-focus": S.blue[300],
  };
function T(e) {
  let t = document.documentElement;
  Object.entries(e).forEach(([e, n]) => t.style.setProperty(e, n));
}
var E = `atlasit.theme`;
function D() {
  let e = typeof localStorage < `u` ? localStorage.getItem(E) : null;
  return e === `light` || e === `dark`
    ? e
    : (typeof matchMedia < `u` && matchMedia(`(prefers-color-scheme: dark)`).matches, `dark`);
}
var O = g(D()),
  k = !1;
function A(e) {
  (O.set(e),
    typeof localStorage < `u` && localStorage.setItem(E, e),
    typeof document < `u` &&
      ((document.documentElement.dataset.theme = e), T(e === `dark` ? C : w)));
}
function j(e) {
  (A(e),
    k &&
      typeof fetch < `u` &&
      fetch(`/api/user/preferences`, {
        method: `PATCH`,
        headers: { "content-type": `application/json` },
        body: JSON.stringify({ theme: e }),
      }).catch(() => {}));
}
async function M() {
  try {
    let e = await fetch(`/api/user/preferences`);
    if (e.ok) {
      let t = await e.json();
      (t.theme === `light` || t.theme === `dark`) && A(t.theme);
    }
  } catch {}
  k = !0;
}
typeof document < `u` && A(D());
function N(e, t) {
  let i = s(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    a = [
      [
        `path`,
        {
          d: `M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401`,
        },
      ],
    ];
  x(
    e,
    h({ name: `moon` }, () => i, {
      get iconNode() {
        return a;
      },
      children: (e, i) => {
        var a = r();
        (u(p(a), t, `default`, {}, null), n(e, a));
      },
      $$slots: { default: !0 },
    }),
  );
}
function P(e, t) {
  let i = s(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    a = [
      [`circle`, { cx: `12`, cy: `12`, r: `4` }],
      [`path`, { d: `M12 2v2` }],
      [`path`, { d: `M12 20v2` }],
      [`path`, { d: `m4.93 4.93 1.41 1.41` }],
      [`path`, { d: `m17.66 17.66 1.41 1.41` }],
      [`path`, { d: `M2 12h2` }],
      [`path`, { d: `M20 12h2` }],
      [`path`, { d: `m6.34 17.66-1.41 1.41` }],
      [`path`, { d: `m19.07 4.93-1.41 1.41` }],
    ];
  x(
    e,
    h({ name: `sun` }, () => i, {
      get iconNode() {
        return a;
      },
      children: (e, i) => {
        var a = r();
        (u(p(a), t, `default`, {}, null), n(e, a));
      },
      $$slots: { default: !0 },
    }),
  );
}
function F(e, t) {
  let i = s(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    a = [
      [`path`, { d: `M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2` }],
      [`circle`, { cx: `12`, cy: `7`, r: `4` }],
    ];
  x(
    e,
    h({ name: `user` }, () => i, {
      get iconNode() {
        return a;
      },
      children: (e, i) => {
        var a = r();
        (u(p(a), t, `default`, {}, null), n(e, a));
      },
      $$slots: { default: !0 },
    }),
  );
}
var I = y(`<div> </div>`);
function L(r, s) {
  v(s, !1);
  let u = f(s, `initials`, 8, `?`),
    p = f(s, `size`, 8, `md`),
    h = f(s, `class`, 8, ``),
    g = { sm: `h-8 w-8 text-xs`, md: `h-9 w-9 text-sm`, lg: `h-11 w-11 text-base` };
  d();
  var y = I(),
    x = c(y, !0);
  (a(y),
    e(
      (e) => {
        (_(y, 1, e), t(x, u()));
      },
      [
        () =>
          i(
            (o(b),
            o(p()),
            o(h()),
            m(() =>
              b(
                `relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground font-semibold`,
                g[p()],
                h(),
              ),
            )),
          ),
      ],
    ),
    n(r, y),
    l());
}
export { j as a, N as i, F as n, M as o, P as r, O as s, L as t };
