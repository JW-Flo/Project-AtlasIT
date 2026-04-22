import { ab as store_get, ac as head, ad as slot, ae as unsubscribe_stores, af as fallback, ag as bind_props, ah as sanitize_props, ai as spread_props, aj as attr_class, ak as stringify, al as attr, am as attr_style, an as escape_html, ao as ensure_array_like, ap as clsx } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';
import { w as writable } from './index-C1X1AO8K.js';
import { p as page } from './stores-emli2svW.js';
import { t as toasts } from './toastStore-X6rW096m.js';
import { o as onDestroy, t as tick } from './index-server-C1ubzO3x.js';
import { S as Sparkles } from './sparkles-DZDSQuPW.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { A as Arrow_right } from './arrow-right-QFdd_4wx.js';
import { X } from './x-BmTrGS3K.js';
import { C as Clipboard_check, P as Play } from './play-CuA3OCFR.js';
import { Z as Zap } from './zap-Bjwz_Fvl.js';
import { S as Send } from './send-BSqYoF4I.js';
import { A as Arrow_left } from './arrow-left-26Np_Hiw.js';
import { s as session } from './session-B8MDMP-a.js';
import { A as App_window, C as Chevron_right } from './chevron-right-CfUr7O77.js';
import { U as Users } from './users-B6QpDkaK.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import { A as Activity } from './activity-BZT1Fpfp.js';
import { F as File_check } from './file-check-nCfSdN0B.js';
import { F as File_text } from './file-text-ONGDnfqP.js';
import { K as Key_round } from './key-round-BRAhoWZh.js';
import { T as Triangle_alert } from './triangle-alert-BIxAVWgG.js';
import { S as Search } from './search-BqxOHk0I.js';
import { S as Shield } from './shield-DkMnJ1a-.js';
import { C as Chevron_down } from './chevron-down-CeLScmpZ.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';

function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
const palette = {
  blue: {
    300: "#5fb2ff",
    400: "#379bff",
    500: "#0d82ff",
    600: "#0066d6"
  },
  gray: {
    50: "#f5f7fa",
    100: "#e9edf2",
    300: "#b5c0cc",
    500: "#677280",
    600: "#4d5560",
    700: "#363c44",
    800: "#23272d",
    900: "#14171a"
  },
  red: { 500: "#ef4444" },
  yellow: { 500: "#eab308" },
  green: { 500: "#22c55e", 600: "#16a34a" }
};
const darkThemeVars = {
  "--color-bg": palette.gray[900],
  "--color-surface": palette.gray[800],
  "--color-surface-alt": palette.gray[700],
  "--color-border": palette.gray[600],
  "--color-text": "#f5f7fa",
  "--color-text-dim": "#b5c0cc",
  "--color-accent": palette.blue[500],
  "--color-accent-hover": palette.blue[400],
  "--color-critical": palette.red[500],
  "--color-warning": palette.yellow[500],
  "--color-success": palette.green[500],
  "--color-focus": palette.blue[300]
};
const lightThemeVars = {
  "--color-bg": "#ffffff",
  "--color-surface": palette.gray[50],
  "--color-surface-alt": palette.gray[100],
  "--color-border": palette.gray[300],
  "--color-text": palette.gray[900],
  "--color-text-dim": palette.gray[500],
  "--color-accent": palette.blue[600],
  "--color-accent-hover": palette.blue[500],
  "--color-critical": palette.red[500],
  "--color-warning": palette.yellow[500],
  "--color-success": palette.green[600],
  "--color-focus": palette.blue[300]
};
function applyTheme(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
const KEY = "atlasit.theme";
function detect() {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
  if (stored === "light" || stored === "dark") return stored;
  if (typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches)
    return "dark";
  return "dark";
}
const theme = writable(detect());
function applyLocal(t) {
  theme.set(t);
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, t);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = t;
    document.documentElement.classList.toggle("dark", t === "dark");
    applyTheme(t === "dark" ? darkThemeVars : lightThemeVars);
  }
}
if (typeof document !== "undefined") {
  applyLocal(detect());
}
function Button($$renderer, $$props) {
  let vClass, sClass;
  let variant = fallback($$props["variant"], "primary");
  let size = fallback($$props["size"], "md");
  let disabled = fallback($$props["disabled"], false);
  let type = fallback($$props["type"], "button");
  let ariaLabel = fallback($$props["ariaLabel"], "");
  const base = "btn focus-ring";
  vClass = variant === "primary" ? "btn-primary" : variant === "outline" ? "btn-outline" : variant === "danger" ? "btn-danger" : "btn-subtle";
  sClass = size === "sm" ? "btn-sm" : "btn-md";
  $$renderer.push(`<button${attr("type", type)}${attr_class(`${base} ${vClass} ${sClass}`, "svelte-xbvsi3")}${attr("disabled", disabled, true)}${attr("aria-label", ariaLabel)}><!--[-->`);
  slot($$renderer, $$props, "default", {});
  $$renderer.push(`<!--]--></button>`);
  bind_props($$props, { variant, size, disabled, type, ariaLabel });
}
function ToastContainer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let list = [];
    const unsub = toasts.subscribe((v) => list = v);
    onDestroy(unsub);
    const variantClass = (v) => v === "success" ? "toast-success" : v === "error" ? "toast-error" : v === "warning" ? "toast-warning" : "toast-info";
    $$renderer2.push(`<div class="toast-host svelte-2cjnr4" role="region" aria-live="polite"><!--[-->`);
    const each_array = ensure_array_like(list);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let t = each_array[$$index];
      $$renderer2.push(`<div${attr_class(`toast ${stringify(variantClass(t.variant))}`, "svelte-2cjnr4")}><div class="content svelte-2cjnr4">`);
      if (t.title) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<strong class="svelte-2cjnr4">${escape_html(t.title)}</strong>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="msg svelte-2cjnr4">${escape_html(t.message)}</div></div> `);
      Button($$renderer2, {
        size: "sm",
        variant: "subtle",
        ariaLabel: "Dismiss",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->✕`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Bell($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }],
    [
      "path",
      {
        "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "bell" },
    $$sanitized_props,
    {
      /**
       * @component @name Bell
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuMjY4IDIxYTIgMiAwIDAgMCAzLjQ2NCAwIiAvPgogIDxwYXRoIGQ9Ik0zLjI2MiAxNS4zMjZBMSAxIDAgMCAwIDQgMTdoMTZhMSAxIDAgMCAwIC43NC0xLjY3M0MxOS40MSAxMy45NTYgMTggMTIuNDk5IDE4IDhBNiA2IDAgMCAwIDYgOGMwIDQuNDk5LTEuNDExIDUuOTU2LTIuNzM4IDcuMzI2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/bell
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Chart_column($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { "d": "M18 17V9" }],
    ["path", { "d": "M13 17V5" }],
    ["path", { "d": "M8 17v-3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "chart-column" },
    $$sanitized_props,
    {
      /**
       * @component @name ChartColumn
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAzdjE2YTIgMiAwIDAgMCAyIDJoMTYiIC8+CiAgPHBhdGggZD0iTTE4IDE3VjkiIC8+CiAgPHBhdGggZD0iTTEzIDE3VjUiIC8+CiAgPHBhdGggZD0iTTggMTd2LTMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/chart-column
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function File_chart_column_increasing($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { "d": "M8 18v-2" }],
    ["path", { "d": "M12 18v-4" }],
    ["path", { "d": "M16 18v-6" }]
  ];
  Icon($$renderer, spread_props([
    { name: "file-chart-column-increasing" },
    $$sanitized_props,
    {
      /**
       * @component @name FileChartColumnIncreasing
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNiAyMmEyIDIgMCAwIDEtMi0yVjRhMiAyIDAgMCAxIDItMmg4YTIuNCAyLjQgMCAwIDEgMS43MDQuNzA2bDMuNTg4IDMuNTg4QTIuNCAyLjQgMCAwIDEgMjAgOHYxMmEyIDIgMCAwIDEtMiAyeiIgLz4KICA8cGF0aCBkPSJNMTQgMnY1YTEgMSAwIDAgMCAxIDFoNSIgLz4KICA8cGF0aCBkPSJNOCAxOHYtMiIgLz4KICA8cGF0aCBkPSJNMTIgMTh2LTQiIC8+CiAgPHBhdGggZD0iTTE2IDE4di02IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/file-chart-column-increasing
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Folder_cog($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3"
      }
    ],
    ["path", { "d": "m14.305 19.53.923-.382" }],
    ["path", { "d": "m15.228 16.852-.923-.383" }],
    ["path", { "d": "m16.852 15.228-.383-.923" }],
    ["path", { "d": "m16.852 20.772-.383.924" }],
    ["path", { "d": "m19.148 15.228.383-.923" }],
    ["path", { "d": "m19.53 21.696-.382-.924" }],
    ["path", { "d": "m20.772 16.852.924-.383" }],
    ["path", { "d": "m20.772 19.148.924.383" }],
    ["circle", { "cx": "18", "cy": "18", "r": "3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "folder-cog" },
    $$sanitized_props,
    {
      /**
       * @component @name FolderCog
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuMyAyMEg0YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDMuOThhMiAyIDAgMCAxIDEuNjkuOWwuNjYgMS4yQTIgMiAwIDAgMCAxMiA2aDhhMiAyIDAgMCAxIDIgMnYzLjMiIC8+CiAgPHBhdGggZD0ibTE0LjMwNSAxOS41My45MjMtLjM4MiIgLz4KICA8cGF0aCBkPSJtMTUuMjI4IDE2Ljg1Mi0uOTIzLS4zODMiIC8+CiAgPHBhdGggZD0ibTE2Ljg1MiAxNS4yMjgtLjM4My0uOTIzIiAvPgogIDxwYXRoIGQ9Im0xNi44NTIgMjAuNzcyLS4zODMuOTI0IiAvPgogIDxwYXRoIGQ9Im0xOS4xNDggMTUuMjI4LjM4My0uOTIzIiAvPgogIDxwYXRoIGQ9Im0xOS41MyAyMS42OTYtLjM4Mi0uOTI0IiAvPgogIDxwYXRoIGQ9Im0yMC43NzIgMTYuODUyLjkyNC0uMzgzIiAvPgogIDxwYXRoIGQ9Im0yMC43NzIgMTkuMTQ4LjkyNC4zODMiIC8+CiAgPGNpcmNsZSBjeD0iMTgiIGN5PSIxOCIgcj0iMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/folder-cog
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Layout_dashboard($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "rect",
      { "width": "7", "height": "9", "x": "3", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "14", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "9", "x": "14", "y": "12", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "3", "y": "16", "rx": "1" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "layout-dashboard" },
    $$sanitized_props,
    {
      /**
       * @component @name LayoutDashboard
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI5IiB4PSIzIiB5PSIzIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIxNCIgeT0iMyIgcng9IjEiIC8+CiAgPHJlY3Qgd2lkdGg9IjciIGhlaWdodD0iOSIgeD0iMTQiIHk9IjEyIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIzIiB5PSIxNiIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/layout-dashboard
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Lightbulb($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
      }
    ],
    ["path", { "d": "M9 18h6" }],
    ["path", { "d": "M10 22h4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "lightbulb" },
    $$sanitized_props,
    {
      /**
       * @component @name Lightbulb
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMTRjLjItMSAuNy0xLjcgMS41LTIuNSAxLS45IDEuNS0yLjIgMS41LTMuNUE2IDYgMCAwIDAgNiA4YzAgMSAuMiAyLjIgMS41IDMuNS43LjcgMS4zIDEuNSAxLjUgMi41IiAvPgogIDxwYXRoIGQ9Ik05IDE4aDYiIC8+CiAgPHBhdGggZD0iTTEwIDIyaDQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/lightbulb
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Log_out($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "m16 17 5-5-5-5" }],
    ["path", { "d": "M21 12H9" }],
    ["path", { "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "log-out" },
    $$sanitized_props,
    {
      /**
       * @component @name LogOut
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgMTcgNS01LTUtNSIgLz4KICA8cGF0aCBkPSJNMjEgMTJIOSIgLz4KICA8cGF0aCBkPSJNOSAyMUg1YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/log-out
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Menu($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M4 5h16" }],
    ["path", { "d": "M4 12h16" }],
    ["path", { "d": "M4 19h16" }]
  ];
  Icon($$renderer, spread_props([
    { name: "menu" },
    $$sanitized_props,
    {
      /**
       * @component @name Menu
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCA1aDE2IiAvPgogIDxwYXRoIGQ9Ik00IDEyaDE2IiAvPgogIDxwYXRoIGQ9Ik00IDE5aDE2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/menu
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Message_square($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "message-square" },
    $$sanitized_props,
    {
      /**
       * @component @name MessageSquare
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjIgMTdhMiAyIDAgMCAxLTIgMkg2LjgyOGEyIDIgMCAwIDAtMS40MTQuNTg2bC0yLjIwMiAyLjIwMkEuNzEuNzEgMCAwIDEgMiAyMS4yODZWNWEyIDIgMCAwIDEgMi0yaDE2YTIgMiAwIDAgMSAyIDJ6IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/message-square
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Moon($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "moon" },
    $$sanitized_props,
    {
      /**
       * @component @name Moon
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAuOTg1IDEyLjQ4NmE5IDkgMCAxIDEtOS40NzMtOS40NzJjLjQwNS0uMDIyLjYxNy40Ni40MDIuODAzYTYgNiAwIDAgMCA4LjI2OCA4LjI2OGMuMzQ0LS4yMTUuODI1LS4wMDQuODAzLjQwMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/moon
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Rotate_ccw($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      { "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }
    ],
    ["path", { "d": "M3 3v5h5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "rotate-ccw" },
    $$sanitized_props,
    {
      /**
       * @component @name RotateCcw
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAxMmE5IDkgMCAxIDAgOS05IDkuNzUgOS43NSAwIDAgMC02Ljc0IDIuNzRMMyA4IiAvPgogIDxwYXRoIGQ9Ik0zIDN2NWg1IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/rotate-ccw
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Settings($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
      }
    ],
    ["circle", { "cx": "12", "cy": "12", "r": "3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "settings" },
    $$sanitized_props,
    {
      /**
       * @component @name Settings
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOS42NzEgNC4xMzZhMi4zNCAyLjM0IDAgMCAxIDQuNjU5IDAgMi4zNCAyLjM0IDAgMCAwIDMuMzE5IDEuOTE1IDIuMzQgMi4zNCAwIDAgMSAyLjMzIDQuMDMzIDIuMzQgMi4zNCAwIDAgMCAwIDMuODMxIDIuMzQgMi4zNCAwIDAgMS0yLjMzIDQuMDMzIDIuMzQgMi4zNCAwIDAgMC0zLjMxOSAxLjkxNSAyLjM0IDIuMzQgMCAwIDEtNC42NTkgMCAyLjM0IDIuMzQgMCAwIDAtMy4zMi0xLjkxNSAyLjM0IDIuMzQgMCAwIDEtMi4zMy00LjAzMyAyLjM0IDIuMzQgMCAwIDAgMC0zLjgzMUEyLjM0IDIuMzQgMCAwIDEgNi4zNSA2LjA1MWEyLjM0IDIuMzQgMCAwIDAgMy4zMTktMS45MTUiIC8+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/settings
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Store($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      { "d": "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" }
    ],
    [
      "path",
      {
        "d": "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
      }
    ],
    [
      "path",
      { "d": "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "store" },
    $$sanitized_props,
    {
      /**
       * @component @name Store
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMjF2LTVhMSAxIDAgMCAwLTEtMWgtNGExIDEgMCAwIDAtMSAxdjUiIC8+CiAgPHBhdGggZD0iTTE3Ljc3NCAxMC4zMWExLjEyIDEuMTIgMCAwIDAtMS41NDkgMCAyLjUgMi41IDAgMCAxLTMuNDUxIDAgMS4xMiAxLjEyIDAgMCAwLTEuNTQ4IDAgMi41IDIuNSAwIDAgMS0zLjQ1MiAwIDEuMTIgMS4xMiAwIDAgMC0xLjU0OSAwIDIuNSAyLjUgMCAwIDEtMy43Ny0zLjI0OGwyLjg4OS00LjE4NEEyIDIgMCAwIDEgNyAyaDEwYTIgMiAwIDAgMSAxLjY1My44NzNsMi44OTUgNC4xOTJhMi41IDIuNSAwIDAgMS0zLjc3NCAzLjI0NCIgLz4KICA8cGF0aCBkPSJNNCAxMC45NVYxOWEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTguMDUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/store
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Sun($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "4" }],
    ["path", { "d": "M12 2v2" }],
    ["path", { "d": "M12 20v2" }],
    ["path", { "d": "m4.93 4.93 1.41 1.41" }],
    ["path", { "d": "m17.66 17.66 1.41 1.41" }],
    ["path", { "d": "M2 12h2" }],
    ["path", { "d": "M20 12h2" }],
    ["path", { "d": "m6.34 17.66-1.41 1.41" }],
    ["path", { "d": "m19.07 4.93-1.41 1.41" }]
  ];
  Icon($$renderer, spread_props([
    { name: "sun" },
    $$sanitized_props,
    {
      /**
       * @component @name Sun
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiAvPgogIDxwYXRoIGQ9Ik0xMiAydjIiIC8+CiAgPHBhdGggZD0iTTEyIDIwdjIiIC8+CiAgPHBhdGggZD0ibTQuOTMgNC45MyAxLjQxIDEuNDEiIC8+CiAgPHBhdGggZD0ibTE3LjY2IDE3LjY2IDEuNDEgMS40MSIgLz4KICA8cGF0aCBkPSJNMiAxMmgyIiAvPgogIDxwYXRoIGQ9Ik0yMCAxMmgyIiAvPgogIDxwYXRoIGQ9Im02LjM0IDE3LjY2LTEuNDEgMS40MSIgLz4KICA8cGF0aCBkPSJtMTkuMDcgNC45My0xLjQxIDEuNDEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/sun
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function User($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }],
    ["circle", { "cx": "12", "cy": "7", "r": "4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "user" },
    $$sanitized_props,
    {
      /**
       * @component @name User
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTkgMjF2LTJhNCA0IDAgMCAwLTQtNEg5YTQgNCAwIDAgMC00IDR2MiIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/user
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Workflow($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "rect",
      { "width": "8", "height": "8", "x": "3", "y": "3", "rx": "2" }
    ],
    ["path", { "d": "M7 11v4a2 2 0 0 0 2 2h4" }],
    [
      "rect",
      { "width": "8", "height": "8", "x": "13", "y": "13", "rx": "2" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "workflow" },
    $$sanitized_props,
    {
      /**
       * @component @name Workflow
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4PSIzIiB5PSIzIiByeD0iMiIgLz4KICA8cGF0aCBkPSJNNyAxMXY0YTIgMiAwIDAgMCAyIDJoNCIgLz4KICA8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4PSIxMyIgeT0iMTMiIHJ4PSIyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/workflow
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function CopilotMessage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isUser, rendered;
    let message = $$props["message"];
    function renderContent(text) {
      return text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-md p-3 text-xs overflow-x-auto my-2"><code>$2</code></pre>').replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>').replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>').replace(/^## (.+)$/gm, '<h3 class="font-semibold mt-3 mb-1">$1</h3>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>').replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>').replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split("|").filter(Boolean).map((c) => c.trim());
        if (cells.every((c) => /^[-:]+$/.test(c))) return "";
        return `<tr>${cells.map((c) => `<td class="border px-2 py-1 text-xs">${c}</td>`).join("")}</tr>`;
      }).replace(/\n\n/g, "</p><p class='mt-2'>").replace(/\n/g, "<br>");
    }
    isUser = message.role === "user";
    rendered = renderContent(message.content);
    $$renderer2.push(`<div${attr_class(`flex items-start gap-3 ${stringify(isUser ? "flex-row-reverse" : "")}`)}>`);
    if (!isUser) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">`);
      Sparkles($$renderer2, { class: "h-3.5 w-3.5 text-primary" });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">`);
      User($$renderer2, { class: "h-3.5 w-3.5 text-muted-foreground" });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--> <div${attr_class(`flex-1 min-w-0 ${stringify(isUser ? "text-right" : "")}`)}><div${attr_class(`inline-block rounded-lg px-3 py-2 text-sm leading-relaxed ${stringify(isUser ? "bg-primary text-primary-foreground max-w-[85%]" : "bg-muted/50 max-w-full text-left")}`)}>`);
    if (isUser) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`${escape_html(message.content)}`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="copilot-content prose prose-sm dark:prose-invert max-w-none">${html(rendered)}</div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (message.actions && message.actions.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex flex-wrap gap-1.5 mt-2"><!--[-->`);
      const each_array = ensure_array_like(message.actions);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let action = each_array[$$index];
        if (action.href) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<a${attr("href", action.href)} class="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors">${escape_html(action.label)} `);
          Arrow_right($$renderer2, { class: "h-3 w-3" });
          $$renderer2.push(`<!----></a>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class(`text-[10px] text-muted-foreground mt-1 ${stringify(isUser ? "" : "")}`)}>${escape_html(new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</div></div></div>`);
    bind_props($$props, { message });
  });
}
function CopilotPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let open = fallback($$props["open"], false);
    let onClose = fallback($$props["onClose"], () => {
    });
    let messages = [];
    let inputValue = "";
    let loading = false;
    let inputElement;
    let whatNextActions = [];
    const quickActions = [
      {
        id: "what_next",
        label: "What should I do next?",
        description: "Get prioritized compliance actions",
        icon: Sparkles
      },
      {
        id: "audit_prep",
        label: "Prepare for audit",
        description: "Generate audit readiness checklist",
        icon: Clipboard_check
      },
      {
        id: "create_rule",
        label: "Create automation rule",
        description: "Build a rule in plain English",
        icon: Zap
      }
    ];
    if (open) {
      tick().then(() => inputElement?.focus());
    }
    if (
      // Handle Escape key
      open
    ) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"></div> <aside class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col bg-card border-l shadow-2xl"><div class="flex items-center justify-between h-14 px-4 border-b shrink-0"><div class="flex items-center gap-2"><div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">`);
      Sparkles($$renderer2, { class: "h-4 w-4 text-primary" });
      $$renderer2.push(`<!----></div> <div><h2 class="text-sm font-semibold">Compliance Copilot</h2> <p class="text-[10px] text-muted-foreground">AI-powered compliance assistant</p></div></div> <div class="flex items-center gap-1"><button class="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="New conversation" aria-label="New conversation">`);
      Rotate_ccw($$renderer2, { class: "h-4 w-4" });
      $$renderer2.push(`<!----></button> <button class="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Close copilot">`);
      X($$renderer2, { class: "h-4 w-4" });
      $$renderer2.push(`<!----></button></div></div> <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">`);
      if (messages.length === 0 && true && whatNextActions.length === 0 && true) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex flex-col items-center justify-center h-full text-center px-4"><div class="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">`);
        Message_square($$renderer2, { class: "h-6 w-6 text-primary" });
        $$renderer2.push(`<!----></div> <h3 class="text-base font-semibold mb-1">How can I help?</h3> <p class="text-sm text-muted-foreground mb-6">Ask about your compliance posture, audit readiness, or get recommendations.</p> <div class="w-full space-y-2"><button class="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent/50 transition-colors group"${attr("disabled", loading, true)}><div class="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">`);
        Sparkles($$renderer2, { class: "h-4 w-4 text-primary" });
        $$renderer2.push(`<!----></div> <div class="flex-1 min-w-0"><div class="font-medium">What should I do next?</div> <div class="text-xs text-muted-foreground">Get prioritized compliance actions</div></div> `);
        Arrow_right($$renderer2, {
          class: "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        });
        $$renderer2.push(`<!----></button> <button class="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent/50 transition-colors group"${attr("disabled", loading, true)}><div class="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">`);
        Clipboard_check($$renderer2, { class: "h-4 w-4 text-primary" });
        $$renderer2.push(`<!----></div> <div class="flex-1 min-w-0"><div class="font-medium">Prepare for audit</div> <div class="text-xs text-muted-foreground">Generate audit readiness checklist</div></div> `);
        Arrow_right($$renderer2, {
          class: "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        });
        $$renderer2.push(`<!----></button> <button class="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent/50 transition-colors group"${attr("disabled", loading, true)}><div class="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">`);
        Zap($$renderer2, { class: "h-4 w-4 text-primary" });
        $$renderer2.push(`<!----></div> <div class="flex-1 min-w-0"><div class="font-medium">Create automation rule</div> <div class="text-xs text-muted-foreground">Build a rule in plain English</div></div> `);
        Arrow_right($$renderer2, {
          class: "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        });
        $$renderer2.push(`<!----></button></div></div>`);
      } else if (whatNextActions.length > 0) {
        $$renderer2.push("<!--[3-->");
        $$renderer2.push(`<div class="space-y-2"><h3 class="text-sm font-semibold px-1">Prioritized Actions</h3> <!--[-->`);
        const each_array = ensure_array_like(whatNextActions);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let action = each_array[$$index];
          $$renderer2.push(`<a${attr("href", action.href)} class="block rounded-lg border p-3 text-sm hover:bg-accent/30 transition-colors"><div class="flex items-start gap-2"><span${attr_class(`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0 mt-0.5 ${stringify(action.impact === "critical" ? "bg-destructive-muted text-destructive" : action.impact === "high" ? "bg-warning-muted text-warning" : action.impact === "medium" ? "bg-warning-muted text-warning" : "bg-info-muted text-info")}`)}>${escape_html(action.impact)}</span> <div class="flex-1 min-w-0"><div class="font-medium">${escape_html(action.title)}</div> <div class="text-xs text-muted-foreground mt-0.5">${escape_html(action.description)}</div> `);
          if (action.scoreImpact) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="text-[10px] text-success mt-1">+${escape_html(action.scoreImpact)}% estimated score improvement</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> `);
          Arrow_right($$renderer2, { class: "h-4 w-4 text-muted-foreground shrink-0 mt-0.5" });
          $$renderer2.push(`<!----></div></a>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(messages);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let msg = each_array_1[$$index_1];
          CopilotMessage($$renderer2, { message: msg });
        }
        $$renderer2.push(`<!--]--> `);
        {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div> <div class="border-t p-3 shrink-0">`);
      if (messages.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex gap-1.5 mb-2 overflow-x-auto pb-1"><!--[-->`);
        const each_array_2 = ensure_array_like(quickActions);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let action = each_array_2[$$index_2];
          $$renderer2.push(`<button class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap hover:bg-accent/50 transition-colors shrink-0"${attr("disabled", loading, true)}>`);
          if (action.icon) {
            $$renderer2.push("<!--[-->");
            action.icon($$renderer2, { class: "h-3 w-3" });
            $$renderer2.push("<!--]-->");
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push("<!--]-->");
          }
          $$renderer2.push(` ${escape_html(action.label)}</button>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex items-end gap-2"><textarea placeholder="Ask about your compliance..." class="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" rows="1"${attr("disabled", loading, true)}>`);
      const $$body = escape_html(inputValue);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea> <button class="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"${attr("disabled", !inputValue.trim(), true)} aria-label="Send message">`);
      Send($$renderer2, { class: "h-4 w-4" });
      $$renderer2.push(`<!----></button></div> <p class="text-[10px] text-muted-foreground mt-1.5 text-center">AI responses are based on your live compliance data. Always verify recommendations.</p></div></aside>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { open, onClose });
  });
}
function Avatar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let initials = fallback($$props["initials"], "?");
    let size = fallback($$props["size"], "md");
    let className = fallback($$props["class"], "");
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-9 w-9 text-sm",
      lg: "h-11 w-11 text-base"
    };
    $$renderer2.push(`<div${attr_class(clsx(cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground font-semibold", sizeClasses[size], className)))}>${escape_html(initials)}</div>`);
    bind_props($$props, { initials, size, class: className });
  });
}
const complianceScore = writable(null);
const DEMO_KEY = "atlasit_demo";
const TOKEN_KEY = "atlasit_token";
const USER_KEY = "atlasit_user";
const DEMO_USER = {
  userId: "demo-user-001",
  email: "alex@acmecorp.io",
  tenantId: "demo-tenant-001",
  role: "admin",
  displayName: "Alex Morgan"
};
function isDemoMode() {
  if (typeof window === "undefined") return false;
  const realToken = sessionStorage.getItem(TOKEN_KEY);
  if (realToken && realToken !== "demo-token") {
    sessionStorage.removeItem(DEMO_KEY);
    return false;
  }
  if (new URLSearchParams(window.location.search).get("demo") === "true") return true;
  return sessionStorage.getItem(DEMO_KEY) === "true";
}
function initDemo() {
  sessionStorage.setItem(DEMO_KEY, "true");
  sessionStorage.setItem(TOKEN_KEY, "demo-token");
  sessionStorage.setItem(USER_KEY, JSON.stringify(DEMO_USER));
}
const TOUR_KEY = "atlasit_demo_tour";
function loadState() {
  if (typeof sessionStorage === "undefined")
    return { active: false, currentStep: 0, completed: false };
  try {
    const stored = sessionStorage.getItem(TOUR_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
  }
  return { active: false, currentStep: 0, completed: false };
}
function persist(state) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(TOUR_KEY, JSON.stringify(state));
  }
}
const tourState = writable(loadState());
tourState.subscribe(persist);
const TOUR_STEPS = [
  {
    selector: "[data-tour='compliance-pill']",
    title: "Compliance Score",
    description: "Your real-time compliance score updates every 60 seconds. Color-coded green/yellow/red based on how your controls are performing across all installed frameworks.",
    placement: "bottom"
  },
  {
    selector: "[data-tour='hero-score']",
    title: "Overall Compliance",
    description: "The hero card shows your aggregate score, trend sparkline over the past 30 days, and a breakdown of passing, failing, and unknown controls.",
    placement: "bottom",
    route: "/console"
  },
  {
    selector: "[data-tour='framework-cards']",
    title: "Framework Breakdown",
    description: "Each framework card shows its individual score and control coverage. Click any card to drill into the compliance pack details.",
    placement: "top",
    route: "/console"
  },
  {
    selector: "[data-tour='evidence-feed']",
    title: "Evidence Stream",
    description: "Real-time feed of compliance evidence collected from your connected integrations. Each item is scored against relevant controls.",
    placement: "left",
    route: "/console"
  },
  {
    selector: "[data-tour='connected-apps']",
    title: "Connected Apps",
    description: "Your active integrations that feed evidence into the compliance engine. Sync status shows when data was last pulled.",
    placement: "right",
    route: "/console"
  },
  {
    selector: "[data-tour='directory-users']",
    title: "User Directory",
    description: "Users synced from your identity provider. Lifecycle tracking (active, suspended, deactivated) powers JML automation and access reviews.",
    placement: "bottom",
    route: "/console/directory"
  },
  {
    selector: "[data-tour='compliance-packs']",
    title: "Compliance Packs",
    description: "Pre-built framework packs with mapped controls. Install a pack and controls auto-populate with evidence-grounded scoring.",
    placement: "bottom",
    route: "/console/compliance/packs"
  },
  {
    selector: "[data-tour='policies']",
    title: "Policy Management",
    description: "Create, publish, and track acknowledgement of compliance policies. Policies are evidence items that feed into framework scoring.",
    placement: "bottom",
    route: "/console/policies"
  },
  {
    selector: "[data-tour='automation-rules']",
    title: "Automation Rules",
    description: "Event-driven rules that automate compliance tasks: enforce MFA on new users, revoke access on offboarding, trigger quarterly reviews.",
    placement: "bottom",
    route: "/console/automation"
  },
  {
    selector: "[data-tour='access-reviews']",
    title: "Access Reviews",
    description: "Periodic access review campaigns. Reviewers approve or revoke access for each user-resource pair, generating SOC 2 and ISO 27001 evidence.",
    placement: "bottom",
    route: "/console/access-reviews"
  },
  {
    selector: "[data-tour='marketplace']",
    title: "Integration Marketplace",
    description: "35+ integrations available. Connect your tools and evidence flows in automatically — no code required.",
    placement: "bottom",
    route: "/console/marketplace"
  }
];
function DemoModePill($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let state = { active: false, currentStep: 0, completed: false };
    const unsub = tourState.subscribe((s) => state = s);
    onDestroy(unsub);
    $$renderer2.push(`<div class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary-muted border border-primary/20 text-xs font-medium text-primary"><span class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span> <span>Demo Mode</span> `);
    if (state.active) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="text-primary/60 tabular-nums">· ${escape_html(state.currentStep + 1)}/${escape_html(TOUR_STEPS.length)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (!state.active && !state.completed) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-2xs font-semibold" title="Start guided tour">`);
      Play($$renderer2, { class: "h-2.5 w-2.5", strokeWidth: 3 });
      $$renderer2.push(`<!----> Tour</button>`);
    } else if (state.active) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<button class="ml-0.5 inline-flex items-center justify-center h-4 w-4 rounded hover:bg-primary/20 transition-colors" title="Skip tour">`);
      X($$renderer2, { class: "h-3 w-3", strokeWidth: 2.5 });
      $$renderer2.push(`<!----></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <span class="text-primary/20">|</span> <button class="inline-flex items-center gap-0.5 hover:text-destructive transition-colors text-2xs" title="Exit demo mode">`);
    Log_out($$renderer2, { class: "h-3 w-3", strokeWidth: 2 });
    $$renderer2.push(`<!----> Exit</button></div>`);
  });
}
function DemoTour($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let step, isLastStep, clipPath, tooltipStyle;
    let state = { active: false, currentStep: 0 };
    const unsub = tourState.subscribe((s) => state = s);
    onDestroy(unsub);
    let targetRect = null;
    let resizeObserver = null;
    async function navigateAndHighlight(s) {
      if (s.route && window.location.pathname !== s.route) {
        window.location.href = s.route + "?demo=true";
        return;
      }
      await tick();
      setTimeout(() => findAndHighlight(s.selector), 300);
    }
    function findAndHighlight(selector) {
      const el = document.querySelector(selector);
      if (!el) {
        targetRect = null;
        return;
      }
      updateRect(el);
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => updateRect(el));
      resizeObserver.observe(el);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function updateRect(el) {
      targetRect = el.getBoundingClientRect();
      setTimeout(() => false, 200);
    }
    step = state.active && state.currentStep < TOUR_STEPS.length ? TOUR_STEPS[state.currentStep] : null;
    isLastStep = state.currentStep >= TOUR_STEPS.length - 1;
    if (step) {
      navigateAndHighlight(step);
    }
    clipPath = targetRect ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${targetRect.left - 6}px ${targetRect.top - 6}px,
        ${targetRect.left - 6}px ${targetRect.bottom + 6}px,
        ${targetRect.right + 6}px ${targetRect.bottom + 6}px,
        ${targetRect.right + 6}px ${targetRect.top - 6}px,
        ${targetRect.left - 6}px ${targetRect.top - 6}px
      )` : "none";
    tooltipStyle = (() => {
      if (!targetRect || !step) return "display:none";
      const pad = 16;
      let top = 0;
      let left = 0;
      switch (step.placement) {
        case "bottom":
          top = targetRect.bottom + pad;
          left = targetRect.left + targetRect.width / 2;
          break;
        case "top":
          top = targetRect.top - pad;
          left = targetRect.left + targetRect.width / 2;
          break;
        case "left":
          top = targetRect.top + targetRect.height / 2;
          left = targetRect.left - pad;
          break;
        case "right":
          top = targetRect.top + targetRect.height / 2;
          left = targetRect.right + pad;
          break;
      }
      const transform = step.placement === "bottom" ? "translate(-50%, 0)" : step.placement === "top" ? "translate(-50%, -100%)" : step.placement === "left" ? "translate(-100%, -50%)" : "translate(0, -50%)";
      return `position:fixed;top:${top}px;left:${left}px;transform:${transform};z-index:10001`;
    })();
    if (state.active && step) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[10000] transition-[clip-path] duration-300 ease-out"${attr_style(`background:rgba(0,0,0,0.55);clip-path:${stringify(clipPath)}`)}></div> `);
      if (targetRect) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="fixed z-[10000] pointer-events-none rounded-lg ring-2 ring-primary/60 transition-all duration-300"${attr_style(`top:${stringify(targetRect.top - 6)}px;left:${stringify(targetRect.left - 6)}px;width:${stringify(targetRect.width + 12)}px;height:${stringify(targetRect.height + 12)}px`)}></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div${attr_style(tooltipStyle)} class="w-80 max-w-[90vw] bg-popover border border-border rounded-xl shadow-2xl p-5 animate-scale-in" role="dialog"${attr("aria-label", `Tour step ${stringify(state.currentStep + 1)} of ${stringify(TOUR_STEPS.length)}`)}><div class="flex items-start justify-between mb-3"><div><div class="text-2xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Step ${escape_html(state.currentStep + 1)} of ${escape_html(TOUR_STEPS.length)}</div> <h3 class="text-sm font-semibold text-foreground">${escape_html(step.title)}</h3></div> <button class="h-7 w-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center -mr-1 -mt-1" aria-label="Skip tour">`);
      X($$renderer2, { class: "h-4 w-4", strokeWidth: 2 });
      $$renderer2.push(`<!----></button></div> <p class="text-xs text-muted-foreground leading-relaxed mb-4">${escape_html(step.description)}</p> <div class="flex items-center justify-between"><div class="flex gap-1"><!--[-->`);
      const each_array = ensure_array_like(TOUR_STEPS);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        each_array[i];
        $$renderer2.push(`<div${attr_class(`h-1.5 rounded-full transition-all duration-200 ${stringify(i === state.currentStep ? "w-4 bg-primary" : i < state.currentStep ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20")}`)}></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-1.5">`);
      if (state.currentStep > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">`);
        Arrow_left($$renderer2, { class: "h-3 w-3", strokeWidth: 2.5 });
        $$renderer2.push(`<!----> Back</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <button class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors">${escape_html(isLastStep ? "Finish" : "Next")} `);
      if (!isLastStep) {
        $$renderer2.push("<!--[0-->");
        Arrow_right($$renderer2, { class: "h-3 w-3", strokeWidth: 2.5 });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Breadcrumb($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let segments = $$props["segments"];
    $$renderer2.push(`<nav aria-label="Breadcrumb" class="flex items-center gap-2 text-sm"><!--[-->`);
    const each_array = ensure_array_like(segments);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let segment = each_array[i];
      if (i > 0) {
        $$renderer2.push("<!--[0-->");
        Chevron_right($$renderer2, { class: "w-4 h-4 text-muted-foreground" });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (segment.href && i < segments.length - 1) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a${attr("href", segment.href)} class="text-muted-foreground hover:text-foreground transition-colors">${escape_html(segment.label)}</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<span class="text-foreground font-medium">${escape_html(segment.label)}</span>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></nav>`);
    bind_props($$props, { segments });
  });
}
function AppFrame($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let computedSections, current, allNavHrefs, breadcrumbSegments, initials;
    let serverSession = fallback($$props["serverSession"], null);
    let userRoles = [];
    let isSuperAdmin = false;
    let userEmail = "";
    let userDisplayName = "";
    let isImpersonating = false;
    let orgName = "";
    let logoUrl = "";
    let accentColor = "";
    const demoMode = isDemoMode();
    const navSections = [
      {
        title: "Overview",
        items: [
          { href: "/console", label: "Dashboard", icon: Layout_dashboard },
          { href: "/console/directory", label: "Directory", icon: Users }
        ]
      },
      {
        title: "Compliance",
        items: [
          {
            href: "/console/compliance",
            label: "Overview",
            icon: Shield_check
          },
          {
            href: "/console/compliance/packs",
            label: "Packs",
            icon: Folder_cog
          },
          {
            href: "/console/compliance/controls",
            label: "Controls",
            icon: Shield_check
          },
          {
            href: "/console/compliance/evidence",
            label: "Evidence",
            icon: Activity
          },
          {
            href: "/console/compliance/attestations",
            label: "Attestations",
            icon: File_check
          },
          {
            href: "/console/compliance/audit-package",
            label: "Audit Package",
            icon: File_text
          },
          { href: "/console/policies", label: "Policies", icon: File_text }
        ]
      },
      {
        title: "Security",
        items: [
          {
            href: "/console/access-reviews",
            label: "Access Reviews",
            icon: Clipboard_check
          },
          {
            href: "/console/access-requests",
            label: "Access Requests",
            icon: Key_round
          },
          {
            href: "/console/incidents",
            label: "Incidents",
            icon: Triangle_alert
          },
          {
            href: "/console/nhi",
            label: "NHI Governance",
            icon: Shield_check
          },
          {
            href: "/console/jml/changelog",
            label: "JML Changelog",
            icon: File_text
          }
        ]
      },
      {
        title: "Automation",
        items: [
          {
            href: "/console/workflows",
            label: "Workflows",
            icon: Workflow
          },
          { href: "/console/automation", label: "Rules", icon: Zap },
          {
            href: "/console/automation/runs",
            label: "Runs",
            icon: Workflow
          }
        ]
      },
      {
        title: "Apps",
        items: [
          {
            href: "/console/apps",
            label: "Connected Apps",
            icon: App_window
          },
          {
            href: "/console/marketplace",
            label: "Marketplace",
            icon: Store
          },
          { href: "/console/discovery", label: "Discovery", icon: Search }
        ]
      },
      {
        title: "Analytics",
        items: [
          {
            href: "/console/analytics",
            label: "Analytics",
            icon: Chart_column
          },
          {
            href: "/console/reports",
            label: "Reports",
            icon: File_chart_column_increasing
          },
          {
            href: "/console/insights",
            label: "Insights",
            icon: Lightbulb
          }
        ]
      },
      {
        title: "System",
        items: [
          { href: "/console/audit", label: "Audit Log", icon: File_text },
          {
            href: "/console/platform-status",
            label: "Platform Status",
            icon: Activity
          },
          { href: "/console/settings", label: "Settings", icon: Settings }
        ]
      }
    ];
    function isActive(href, pathname) {
      if (href === "/console") return pathname === "/console" || pathname === "/console/";
      if (!pathname.startsWith(href)) return false;
      for (const other of allNavHrefs) {
        if (other !== href && other.startsWith(href) && pathname.startsWith(other)) {
          return false;
        }
      }
      return true;
    }
    function sanitizeColor(color) {
      const trimmed = color.trim();
      if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
      if (/^rgb[a]?\([^)]+\)$/.test(trimmed)) return trimmed;
      if (/^hsl[a]?\([^)]+\)$/.test(trimmed)) return trimmed;
      if (/^[a-zA-Z]{2,30}$/.test(trimmed)) return trimmed;
      return "";
    }
    function applyBranding(logo, accent) {
      logoUrl = logo;
      accentColor = sanitizeColor(accent);
      if (typeof document !== "undefined") {
        if (accentColor) {
          document.documentElement.style.setProperty("--accent-brand", accentColor);
        } else {
          document.documentElement.style.removeProperty("--accent-brand");
        }
      }
    }
    function applySessionData(sessionData) {
      if (!sessionData?.authenticated) return;
      userRoles = sessionData.roles || [];
      isSuperAdmin = sessionData.superAdmin || false;
      userEmail = sessionData.email || "";
      userDisplayName = sessionData.displayName || sessionData.email || "User";
      isImpersonating = sessionData.impersonating || false;
      sessionData.impersonatedBy || "";
      orgName = sessionData.orgName || "";
      sessionData.tenantId || "";
      sessionData.billingTier || sessionData.tier || "";
      applyBranding(sessionData.branding?.logoUrl || "", sessionData.branding?.accentColor || "");
      if (typeof window !== "undefined") {
        session.set(sessionData);
      }
    }
    let t = "dark";
    theme.subscribe((v) => t = v);
    let profileOpen = false;
    let mobileMenuOpen = false;
    let sidebarCollapsed = false;
    let copilotOpen = false;
    let expandedSections = {};
    if (typeof window !== "undefined") {
      sidebarCollapsed = localStorage.getItem("sidebar-collapsed") === "true";
      try {
        const saved = localStorage.getItem("expanded-sections");
        expandedSections = saved ? JSON.parse(saved) : {};
      } catch {
        expandedSections = {};
      }
    }
    computedSections = isSuperAdmin || userRoles.includes("super-admin") ? [
      ...navSections.slice(0, -1),
      {
        ...navSections[navSections.length - 1],
        items: [
          ...navSections[navSections.length - 1].items,
          { href: "/console/admin", label: "Admin", icon: Shield },
          {
            href: "/console/admin/operations",
            label: "Operations",
            icon: Activity
          }
        ]
      }
    ] : navSections;
    current = store_get($$store_subs ??= {}, "$page", page).url.pathname;
    allNavHrefs = computedSections.flatMap((s) => s.items.map((i) => i.href));
    breadcrumbSegments = (() => {
      const parts = current.split("/").filter(Boolean);
      if (parts[0] === "console") parts.shift();
      if (parts.length === 0) return [{ label: "Dashboard", href: void 0 }];
      return parts.map((part, i) => {
        const label = part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const href = i === parts.length - 1 ? void 0 : `/console/${parts.slice(0, i + 1).join("/")}`;
        return { label, href };
      });
    })();
    if (serverSession?.authenticated) {
      applySessionData(serverSession);
    }
    if (computedSections) {
      computedSections.forEach((section) => {
        if (expandedSections[section.title] === void 0) {
          expandedSections[section.title] = true;
        }
      });
    }
    if (current) {
      mobileMenuOpen = false;
    }
    initials = userDisplayName ? userDisplayName.split(/[\s@]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("") : "?";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="flex h-dvh bg-background text-foreground overflow-hidden"><a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm">Skip to content</a> <aside${attr_class(`hidden md:flex flex-col border-r border-border bg-card shrink-0 sidebar-transition ${stringify(sidebarCollapsed ? "w-[64px]" : "w-[256px]")}`, "svelte-5fqf43")}><a href="/console"${attr_class(`flex items-center gap-2.5 h-16 border-b border-border hover:bg-accent/40 transition-colors ${stringify(sidebarCollapsed ? "px-4 justify-center" : "px-5")}`)}${attr("title", sidebarCollapsed ? orgName || "AtlasIT" : "")}>`);
      if (logoUrl) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<img${attr("src", logoUrl)}${attr("alt", `${stringify(orgName || "Organization")} logo`)} class="h-8 w-8 rounded-lg object-cover shrink-0 ring-1 ring-border"/>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shrink-0 shadow-sm"${attr_style(accentColor ? `background: ${accentColor}` : "")}><span class="text-primary-foreground font-semibold text-[13px]">${escape_html(orgName ? orgName[0].toUpperCase() : "A")}</span></div>`);
      }
      $$renderer3.push(`<!--]--> `);
      if (!sidebarCollapsed) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="min-w-0 flex-1"><div class="font-semibold text-[15px] tracking-tight text-foreground truncate leading-tight">${escape_html(orgName || "AtlasIT")}</div> <div class="text-2xs text-muted-foreground truncate">Compliance Platform</div></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></a> `);
      if (isImpersonating && !sidebarCollapsed) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="mx-3 mt-3 bg-destructive-muted border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2 flex items-center justify-between"><span class="font-medium">Viewing as tenant</span> <button class="text-2xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-2 py-0.5 rounded transition-colors">Exit</button></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <nav${attr_class(`flex-1 overflow-y-auto py-4 ${stringify(sidebarCollapsed ? "px-2" : "px-3")} space-y-5`)}><!--[-->`);
      const each_array = ensure_array_like(computedSections);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let section = each_array[$$index_1];
        $$renderer3.push(`<div>`);
        if (!sidebarCollapsed) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<button class="w-full flex items-center justify-between px-2 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground transition-colors group"><span>${escape_html(section.title)}</span> `);
          Chevron_down($$renderer3, {
            class: `h-3 w-3 transition-transform ${stringify(expandedSections[section.title] ? "" : "-rotate-90")}`
          });
          $$renderer3.push(`<!----></button>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (expandedSections[section.title] || sidebarCollapsed) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="space-y-0.5"><!--[-->`);
          const each_array_1 = ensure_array_like(section.items);
          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
            let item = each_array_1[$$index];
            const active = isActive(item.href, current);
            $$renderer3.push(`<a${attr("href", item.href)}${attr("title", sidebarCollapsed ? item.label : "")}${attr_class(
              clsx(cn("group relative flex items-center rounded-lg text-sm font-medium transition-all duration-fast", sidebarCollapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5", active ? "nav-active bg-primary-muted text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")),
              "svelte-5fqf43"
            )}${attr_style(active && accentColor ? `color: ${accentColor}; background-color: color-mix(in srgb, ${accentColor} 12%, transparent)` : "")}>`);
            if (active && !sidebarCollapsed) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<span class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-primary"${attr_style(accentColor ? `background-color: ${accentColor}` : "")} aria-hidden="true"></span>`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (item.icon) {
              $$renderer3.push("<!--[-->");
              item.icon($$renderer3, {
                class: cn("h-[17px] w-[17px] shrink-0 transition-colors", active ? "" : "text-muted-foreground/70 group-hover:text-foreground"),
                strokeWidth: active ? 2.25 : 1.85
              });
              $$renderer3.push("<!--]-->");
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push("<!--]-->");
            }
            $$renderer3.push(` `);
            if (!sidebarCollapsed) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<span class="truncate">${escape_html(item.label)}</span>`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]--></a>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></nav> <div${attr_class(`border-t border-border ${stringify(sidebarCollapsed ? "px-2" : "px-3")} py-2`)}><button${attr_class(`flex items-center ${stringify(sidebarCollapsed ? "justify-center" : "gap-2.5 px-2.5")} w-full rounded-lg py-1.5 text-2xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors`)}${attr("title", sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}${attr("aria-label", sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}>`);
      Chevron_down($$renderer3, {
        class: `h-3.5 w-3.5 shrink-0 ${stringify(sidebarCollapsed ? "rotate-[-90deg]" : "rotate-90")} transition-transform`
      });
      $$renderer3.push(`<!----> `);
      if (!sidebarCollapsed) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<span>Collapse</span>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></button></div> <div${attr_class(`border-t border-border ${stringify(sidebarCollapsed ? "p-2" : "p-3")}`)}><a href="/console/profile"${attr_class(`flex items-center ${stringify(sidebarCollapsed ? "justify-center" : "gap-2.5 px-2")} rounded-lg py-2 hover:bg-accent transition-colors group`)}${attr("title", sidebarCollapsed ? userDisplayName : "")}>`);
      Avatar($$renderer3, { initials, size: "sm" });
      $$renderer3.push(`<!----> `);
      if (!sidebarCollapsed) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="flex-1 min-w-0"><div class="text-sm font-medium truncate text-foreground">${escape_html(userDisplayName || "User")}</div> `);
        if (userEmail && userEmail !== userDisplayName) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="text-2xs text-muted-foreground truncate">${escape_html(userEmail)}</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></a></div></aside> `);
      if (mobileMenuOpen) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="fixed inset-0 z-40 md:hidden"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div> <aside class="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] flex flex-col bg-card border-r shadow-xl overflow-y-auto"><div class="flex items-center justify-between gap-2 px-4 h-16 border-b shrink-0"><a href="/console" class="flex items-center gap-2">`);
        if (logoUrl) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<img${attr("src", logoUrl)}${attr("alt", `${stringify(orgName || "Organization")} logo`)} class="h-8 w-8 rounded-lg object-cover"/>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"${attr_style(accentColor ? `background-color: ${accentColor}` : "")}><span class="text-primary-foreground font-bold text-sm">${escape_html(orgName ? orgName[0].toUpperCase() : "A")}</span></div>`);
        }
        $$renderer3.push(`<!--]--> <span class="font-semibold text-lg tracking-tight">${escape_html(orgName || "AtlasIT")}</span></a> <button class="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Close navigation menu">`);
        X($$renderer3, { class: "h-5 w-5" });
        $$renderer3.push(`<!----></button></div> `);
        if (isImpersonating) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="mx-3 mt-3 bg-destructive text-destructive-foreground text-xs rounded-md px-3 py-2 flex items-center justify-between"><span>Viewing as tenant</span> <button class="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded">Exit</button></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6"><!--[-->`);
        const each_array_2 = ensure_array_like(computedSections);
        for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
          let section = each_array_2[$$index_3];
          $$renderer3.push(`<div><div class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">${escape_html(section.title)}</div> <div class="space-y-0.5"><!--[-->`);
          const each_array_3 = ensure_array_like(section.items);
          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
            let item = each_array_3[$$index_2];
            const active = isActive(item.href, current);
            $$renderer3.push(`<a${attr("href", item.href)}${attr_class(
              clsx(cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors border-l-2", active ? "bg-[color-mix(in_srgb,var(--accent-brand,hsl(var(--primary)))_10%,transparent)] border-l-[var(--accent-brand,hsl(var(--primary)))]" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent")),
              "svelte-5fqf43"
            )}${attr_style(active && accentColor ? `color: ${accentColor}` : "")}>`);
            if (item.icon) {
              $$renderer3.push("<!--[-->");
              item.icon($$renderer3, { class: "h-4 w-4 shrink-0" });
              $$renderer3.push("<!--]-->");
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push("<!--]-->");
            }
            $$renderer3.push(` ${escape_html(item.label)}</a>`);
          }
          $$renderer3.push(`<!--]--></div></div>`);
        }
        $$renderer3.push(`<!--]--></nav> <div class="border-t p-3 shrink-0"><a href="/console/profile" class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors">`);
        Avatar($$renderer3, { initials, size: "sm" });
        $$renderer3.push(`<!----> <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">${escape_html(userDisplayName || "User")}</div> `);
        if (userEmail && userEmail !== userDisplayName) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="text-xs text-muted-foreground truncate">${escape_html(userEmail)}</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div></a></div></aside></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="flex-1 min-w-0 flex flex-col"><header class="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-5 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"><div class="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0"><button class="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors -ml-1" aria-label="Toggle navigation menu"${attr("aria-expanded", mobileMenuOpen)}>`);
      if (mobileMenuOpen) {
        $$renderer3.push("<!--[0-->");
        X($$renderer3, { class: "h-5 w-5" });
      } else {
        $$renderer3.push("<!--[-1-->");
        Menu($$renderer3, { class: "h-5 w-5" });
      }
      $$renderer3.push(`<!--]--></button> `);
      Breadcrumb($$renderer3, { segments: breadcrumbSegments });
      $$renderer3.push(`<!----></div> <div class="flex items-center gap-0.5"><a href="/notifications" class="relative inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Notifications" aria-label="Notifications">`);
      Bell($$renderer3, { class: "h-[17px] w-[17px]", strokeWidth: 1.85 });
      $$renderer3.push(`<!----> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></a> `);
      if (demoMode) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="mx-1.5">`);
        DemoModePill($$renderer3);
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$complianceScore", complianceScore)) {
        $$renderer3.push("<!--[0-->");
        const score = store_get($$store_subs ??= {}, "$complianceScore", complianceScore).overallScore;
        const tone = score >= 80 ? "success" : score >= 60 ? "warning" : "destructive";
        $$renderer3.push(`<a href="/console/compliance" data-tour="compliance-pill"${attr_class(`hidden md:inline-flex items-center gap-1.5 h-7 px-2.5 mx-1.5 rounded-full text-xs font-medium transition-all duration-fast ${stringify(tone === "success" ? "bg-success-muted text-success hover:bg-success-muted/80" : "")} ${stringify(tone === "warning" ? "bg-warning-muted text-warning hover:bg-warning-muted/80" : "")} ${stringify(tone === "destructive" ? "bg-destructive-muted text-destructive hover:bg-destructive-muted/80" : "")}`)}${attr("title", `Compliance: ${stringify(store_get($$store_subs ??= {}, "$complianceScore", complianceScore).frameworks.map((f) => `${f.framework} ${f.grade} (${f.score}%)`).join(", "))}`)}${attr("aria-label", `Compliance score: ${stringify(store_get($$store_subs ??= {}, "$complianceScore", complianceScore).grade)} ${stringify(store_get($$store_subs ??= {}, "$complianceScore", complianceScore).overallScore)}%`)}><span${attr_class(`h-1.5 w-1.5 rounded-full ${stringify(tone === "success" ? "bg-success" : "")} ${stringify(tone === "warning" ? "bg-warning" : "")} ${stringify(tone === "destructive" ? "bg-destructive" : "")}`)}></span> <span class="font-semibold">${escape_html(store_get($$store_subs ??= {}, "$complianceScore", complianceScore).grade)}</span> <span class="text-2xs opacity-70 tabular-nums">${escape_html(score)}%</span></a>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <button${attr_class(`inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${stringify(copilotOpen ? "bg-primary-muted text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground")}`)} title="Compliance Copilot (Cmd+K)" aria-label="Toggle compliance copilot">`);
      Sparkles($$renderer3, { class: "h-[17px] w-[17px]", strokeWidth: 1.85 });
      $$renderer3.push(`<!----></button> <button class="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Toggle theme" aria-label="Toggle theme">`);
      if (t === "dark") {
        $$renderer3.push("<!--[0-->");
        Sun($$renderer3, { class: "h-[17px] w-[17px]", strokeWidth: 1.85 });
      } else {
        $$renderer3.push("<!--[-1-->");
        Moon($$renderer3, { class: "h-[17px] w-[17px]", strokeWidth: 1.85 });
      }
      $$renderer3.push(`<!--]--></button> <div class="profile-dropdown-container relative ml-1.5 pl-1.5 border-l border-border"><button class="flex items-center gap-1.5 h-9 px-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="User menu"${attr("aria-expanded", profileOpen)}>`);
      Avatar($$renderer3, { initials, size: "sm" });
      $$renderer3.push(`<!----> `);
      Chevron_down($$renderer3, { class: "h-3 w-3 text-muted-foreground" });
      $$renderer3.push(`<!----></button> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div></div></header> <main class="flex-1 overflow-y-auto bg-background" id="main"><div class="container-page py-6 md:py-8"><!--[-->`);
      slot($$renderer3, $$props, "default", {});
      $$renderer3.push(`<!--]--></div> `);
      ToastContainer($$renderer3);
      $$renderer3.push(`<!----> <footer class="container-page py-6 mt-8 border-t border-border text-center text-2xs text-muted-foreground/80"><div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"><span>© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} AtlasIT</span> <span class="text-muted-foreground/40">·</span> <a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a> <a href="/privacy/dsar" class="hover:text-foreground transition-colors">Data Requests</a> <a href="/terms" class="hover:text-foreground transition-colors">Terms</a> <a href="/support" class="hover:text-foreground transition-colors">Support</a> <a href="https://status.atlasit.pro" class="hover:text-foreground transition-colors">Status</a></div></footer></main></div> `);
      CopilotPanel($$renderer3, {
        onClose: () => copilotOpen = false,
        get open() {
          return copilotOpen;
        },
        set open($$value) {
          copilotOpen = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (demoMode) {
        $$renderer3.push("<!--[0-->");
        DemoTour($$renderer3);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { serverSession });
  });
}
const __vite_import_meta_env__$1 = {};
const API_BASE = __vite_import_meta_env__$1?.VITE_API_URL ?? "";
const isSpaMode = !!API_BASE;
function getSessionResponse() {
  return {
    authenticated: true,
    email: DEMO_USER.email,
    roles: ["admin"],
    superAdmin: false,
    tenantId: DEMO_USER.tenantId,
    displayName: DEMO_USER.displayName,
    orgName: "Acme Corp",
    branding: { logoUrl: "", accentColor: "#6366f1" },
    billingTier: "professional"
  };
}
function getUserProfileResponse() {
  return {
    data: {
      id: DEMO_USER.userId,
      email: DEMO_USER.email,
      displayName: DEMO_USER.displayName,
      role: "admin",
      tenantId: DEMO_USER.tenantId,
      mfaEnabled: true,
      createdAt: "2025-11-15T09:00:00Z"
    }
  };
}
let counter = 0;
function uuid() {
  counter++;
  return `demo-${counter.toString().padStart(6, "0")}`;
}
function daysAgo(n) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + n % 8, n * 17 % 60, 0, 0);
  return d.toISOString();
}
function hoursAgo(n) {
  return new Date(Date.now() - n * 36e5).toISOString();
}
function minutesAgo(n) {
  return new Date(Date.now() - n * 6e4).toISOString();
}
function resetCounter() {
  counter = 0;
}
function getDashboardResponse() {
  return {
    data: {
      tenant: {
        id: "demo-tenant-001",
        name: "Acme Corp",
        slug: "acme-corp",
        tier: "pro",
        status: "active"
      },
      user: { id: "demo-user-001", email: "alex@acmecorp.io", role: "admin" },
      stats: {
        evidenceCount: 247,
        automationRulesTotal: 3,
        automationRulesEnabled: 3,
        openIncidents: 1
      },
      recentEvents: [
        {
          id: uuid(),
          type: "compliance.score_updated",
          source: "scheduler",
          status: "processed",
          created_at: minutesAgo(12)
        },
        {
          id: uuid(),
          type: "directory.user_synced",
          source: "okta",
          status: "processed",
          created_at: minutesAgo(28)
        },
        {
          id: uuid(),
          type: "automation.rule_executed",
          source: "engine",
          status: "processed",
          created_at: hoursAgo(1)
        },
        {
          id: uuid(),
          type: "evidence.collected",
          source: "github",
          status: "processed",
          created_at: hoursAgo(2)
        },
        {
          id: uuid(),
          type: "incident.created",
          source: "compliance-api",
          status: "processed",
          created_at: hoursAgo(4)
        }
      ]
    }
  };
}
const FRAMEWORKS = [
  {
    framework: "SOC2",
    label: "SOC 2 Type II",
    controlCount: 85,
    passCount: 70,
    failCount: 8,
    unknownCount: 7,
    score: 82
  },
  {
    framework: "ISO27001",
    label: "ISO 27001:2022",
    controlCount: 93,
    passCount: 69,
    failCount: 14,
    unknownCount: 10,
    score: 74
  },
  {
    framework: "NIST_CSF",
    label: "NIST CSF 2.0",
    controlCount: 108,
    passCount: 82,
    failCount: 15,
    unknownCount: 11,
    score: 76
  },
  {
    framework: "HIPAA",
    label: "HIPAA Security Rule",
    controlCount: 72,
    passCount: 51,
    failCount: 12,
    unknownCount: 9,
    score: 71
  },
  {
    framework: "GDPR",
    label: "GDPR",
    controlCount: 65,
    passCount: 52,
    failCount: 6,
    unknownCount: 7,
    score: 80
  }
];
function getCompliancePacksResponse() {
  return {
    data: {
      items: FRAMEWORKS.map((f, i) => ({
        id: `pack-${f.framework.toLowerCase()}`,
        label: f.label,
        framework: f.framework,
        controlCount: f.controlCount,
        installedAt: daysAgo(60 + i * 5),
        lastEvaluatedAt: hoursAgo(2),
        passCount: f.passCount,
        failCount: f.failCount,
        unknownCount: f.unknownCount
      }))
    }
  };
}
function getComplianceTrendResponse() {
  const series = [];
  for (let i = 30; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const base = 64 + (30 - i) * 14 / 30;
    const noise = Math.sin(i * 0.8) * 2;
    series.push({
      day: d.toISOString().slice(0, 10),
      avgScore: Math.round((base + noise) * 10) / 10,
      snapshotCount: 5
    });
  }
  return { data: { series } };
}
function getComplianceScoresResponse() {
  return {
    scores: FRAMEWORKS.map((f) => ({
      framework: f.framework,
      score: f.score,
      grade: f.score >= 80 ? "B" : f.score >= 70 ? "C" : "D",
      source: "evidence"
    })),
    source: "evidence"
  };
}
function getComplianceSummaryResponse() {
  return {
    data: {
      frameworks: FRAMEWORKS.map((f) => ({
        framework: f.framework,
        controlsTotal: f.controlCount,
        controlsPassing: f.passCount,
        evidenceCount: 30 + f.passCount,
        score: f.score
      })),
      totalEvidence: 247,
      lastUpdated: hoursAgo(2)
    }
  };
}
const EVIDENCE_SOURCES = ["okta", "github", "aws", "google-workspace", "jira", "slack"];
const CONTROL_PREFIXES = {
  SOC2: ["CC6.1", "CC6.2", "CC6.3", "CC7.1", "CC7.2", "CC8.1"],
  ISO27001: ["A.5.1", "A.6.1", "A.8.1", "A.9.1", "A.9.2", "A.12.1"],
  NIST_CSF: ["PR.AC-1", "PR.AC-3", "PR.DS-1", "DE.CM-1", "RS.RP-1", "ID.AM-1"],
  HIPAA: ["164.312(a)", "164.312(c)", "164.312(d)", "164.312(e)", "164.308(a)(1)"],
  GDPR: ["Art.5", "Art.25", "Art.30", "Art.32", "Art.33"]
};
const IMPACTS = ["positive", "positive", "positive", "negative", "positive"];
const REASONINGS = [
  "MFA enforcement verified for user account",
  "Access review completed within SLA",
  "Encryption at rest confirmed for data store",
  "Missing audit log configuration detected",
  "Password policy meets complexity requirements",
  "Vendor security questionnaire up to date",
  "Firewall rules reviewed and compliant",
  "User deprovisioned within 24h of offboarding"
];
function getEvidenceResponse(limit = 25) {
  const items = [];
  for (let i = 0; i < limit; i++) {
    const fw = FRAMEWORKS[i % FRAMEWORKS.length];
    const controls = CONTROL_PREFIXES[fw.framework] ?? ["CTL-1"];
    items.push({
      id: uuid(),
      framework: fw.framework,
      controlId: controls[i % controls.length],
      controlName: `Control ${controls[i % controls.length]}`,
      source: EVIDENCE_SOURCES[i % EVIDENCE_SOURCES.length],
      actor: "system",
      metadata: {
        impact: IMPACTS[i % IMPACTS.length],
        eventType: "assessment",
        reasoning: REASONINGS[i % REASONINGS.length]
      },
      createdAt: hoursAgo(i * 3 + 1)
    });
  }
  return { data: { items, nextCursor: null } };
}
function getControlsRegistryResponse() {
  const items = [];
  for (const fw of FRAMEWORKS) {
    const controls = CONTROL_PREFIXES[fw.framework] ?? [];
    for (let i = 0; i < controls.length; i++) {
      items.push({
        id: `${fw.framework}-${controls[i]}`,
        framework: fw.framework,
        controlRef: controls[i],
        title: `Control ${controls[i]}`,
        status: i < fw.passCount / (fw.controlCount / controls.length) ? "passing" : i < (fw.passCount + fw.failCount) / (fw.controlCount / controls.length) ? "failing" : "unknown"
      });
    }
  }
  return { data: { items } };
}
const USERS = [
  {
    name: "Alex Morgan",
    email: "alex@acmecorp.io",
    dept: "Engineering",
    title: "CTO",
    status: "active"
  },
  {
    name: "Jordan Lee",
    email: "jordan@acmecorp.io",
    dept: "Engineering",
    title: "Staff Engineer",
    status: "active"
  },
  {
    name: "Sam Rivera",
    email: "sam@acmecorp.io",
    dept: "Engineering",
    title: "Senior Engineer",
    status: "active"
  },
  {
    name: "Casey Kim",
    email: "casey@acmecorp.io",
    dept: "Engineering",
    title: "DevOps Lead",
    status: "active"
  },
  {
    name: "Taylor Chen",
    email: "taylor@acmecorp.io",
    dept: "Sales",
    title: "VP Sales",
    status: "active"
  },
  {
    name: "Avery Patel",
    email: "avery@acmecorp.io",
    dept: "Sales",
    title: "Account Executive",
    status: "active"
  },
  {
    name: "Riley Johnson",
    email: "riley@acmecorp.io",
    dept: "Security",
    title: "Security Engineer",
    status: "active"
  },
  {
    name: "Morgan Davis",
    email: "morgan@acmecorp.io",
    dept: "Security",
    title: "GRC Analyst",
    status: "active"
  },
  {
    name: "Quinn Wilson",
    email: "quinn@acmecorp.io",
    dept: "IT",
    title: "IT Manager",
    status: "active"
  },
  {
    name: "Drew Martinez",
    email: "drew@acmecorp.io",
    dept: "IT",
    title: "Helpdesk",
    status: "active"
  },
  {
    name: "Jamie Scott",
    email: "jamie@acmecorp.io",
    dept: "HR",
    title: "People Ops",
    status: "active"
  },
  {
    name: "Pat O'Brien",
    email: "pat@acmecorp.io",
    dept: "Finance",
    title: "Controller",
    status: "suspended"
  }
];
function getDirectoryUsersResponse() {
  return {
    data: {
      items: USERS.map((u, i) => ({
        id: `user-${i + 1}`,
        email: u.email,
        display_name: u.name,
        department: u.dept,
        title: u.title,
        status: u.status,
        external_id: `okta-${u.email.split("@")[0]}`,
        created_at: daysAgo(90 - i * 5)
      }))
    }
  };
}
function getDirectoryGroupsResponse() {
  return {
    data: {
      items: [
        {
          id: "grp-1",
          name: "Engineering",
          description: "Product & platform engineering",
          external_id: "okta-eng",
          member_count: 4
        },
        {
          id: "grp-2",
          name: "Sales",
          description: "Revenue team",
          external_id: "okta-sales",
          member_count: 2
        },
        {
          id: "grp-3",
          name: "Security",
          description: "InfoSec & GRC",
          external_id: "okta-sec",
          member_count: 2
        },
        {
          id: "grp-4",
          name: "IT",
          description: "IT operations",
          external_id: "okta-it",
          member_count: 2
        }
      ]
    }
  };
}
function getDirectorySyncStatusResponse() {
  return {
    data: {
      userCount: 12,
      groupCount: 4,
      connections: [{ provider: "okta", lastSyncAt: new Date(Date.now() - 18e5).toISOString() }]
    }
  };
}
function getAutomationRulesResponse() {
  return {
    data: [
      {
        id: "rule-mfa",
        name: "Enforce MFA on New Users",
        description: "When a new user is provisioned, verify MFA enrollment within 48 hours. Alert security team if not enrolled.",
        trigger_type: "user.created",
        enabled: true,
        run_count: 34,
        error_count: 0,
        last_run_at: hoursAgo(3),
        last_status: "success",
        created_at: daysAgo(45)
      },
      {
        id: "rule-offboard",
        name: "Auto-Revoke on Offboarding",
        description: "When a user is deactivated in the directory, automatically revoke all app access and disable SSO sessions.",
        trigger_type: "user.deactivated",
        enabled: true,
        run_count: 8,
        error_count: 1,
        last_run_at: daysAgo(3),
        last_status: "success",
        created_at: daysAgo(40)
      },
      {
        id: "rule-access-review",
        name: "Quarterly Access Review Trigger",
        description: "Every 90 days, create a new access review campaign for all active users and notify managers.",
        trigger_type: "schedule.cron",
        enabled: true,
        run_count: 2,
        error_count: 0,
        last_run_at: daysAgo(12),
        last_status: "success",
        created_at: daysAgo(60)
      }
    ]
  };
}
function getAutomationStatsResponse() {
  return {
    data: {
      summary: {
        total_rules: 3,
        total_runs: 44,
        total_errors: 1
      }
    }
  };
}
function getAutomationRunsResponse() {
  const runs = [];
  for (let i = 0; i < 10; i++) {
    runs.push({
      id: uuid(),
      definitionId: ["rule-mfa", "rule-offboard", "rule-access-review"][i % 3],
      status: i === 4 ? "failed" : "completed",
      started_at: hoursAgo(i * 6 + 1),
      completed_at: hoursAgo(i * 6)
    });
  }
  return { data: { items: runs } };
}
function getPoliciesResponse() {
  return {
    data: {
      items: [
        {
          id: "pol-access",
          tenantId: "demo-tenant-001",
          name: "Access Control Policy",
          category: "access-control",
          version: "2.1",
          status: "published",
          frameworkRefs: ["SOC2:CC6.1", "ISO27001:A.9.1"],
          createdBy: "alex@acmecorp.io",
          createdAt: daysAgo(75),
          updatedAt: daysAgo(10),
          publishedAt: daysAgo(10),
          ackCount: 9
        },
        {
          id: "pol-incident",
          tenantId: "demo-tenant-001",
          name: "Incident Response Plan",
          category: "incident-response",
          version: "1.3",
          status: "published",
          frameworkRefs: ["SOC2:CC7.2", "NIST_CSF:RS.RP-1"],
          createdBy: "riley@acmecorp.io",
          createdAt: daysAgo(60),
          updatedAt: daysAgo(15),
          publishedAt: daysAgo(15),
          ackCount: 11
        },
        {
          id: "pol-data",
          tenantId: "demo-tenant-001",
          name: "Data Protection & Encryption Policy",
          category: "data-protection",
          version: "1.0",
          status: "published",
          frameworkRefs: ["GDPR:Art.32", "HIPAA:164.312(a)"],
          createdBy: "morgan@acmecorp.io",
          createdAt: daysAgo(50),
          updatedAt: daysAgo(20),
          publishedAt: daysAgo(20),
          ackCount: 8
        },
        {
          id: "pol-vendor",
          tenantId: "demo-tenant-001",
          name: "Vendor Risk Management Policy",
          category: "vendor",
          version: "0.9",
          status: "draft",
          frameworkRefs: ["SOC2:CC9.2", "ISO27001:A.15.1"],
          createdBy: "morgan@acmecorp.io",
          createdAt: daysAgo(14),
          updatedAt: daysAgo(3),
          publishedAt: null,
          ackCount: 0
        },
        {
          id: "pol-acceptable-use",
          tenantId: "demo-tenant-001",
          name: "Acceptable Use Policy",
          category: "acceptable-use",
          version: "0.5",
          status: "draft",
          frameworkRefs: ["SOC2:CC1.1"],
          createdBy: "alex@acmecorp.io",
          createdAt: daysAgo(7),
          updatedAt: daysAgo(2),
          publishedAt: null,
          ackCount: 0
        },
        {
          id: "pol-retention",
          tenantId: "demo-tenant-001",
          name: "Data Retention Policy (Legacy)",
          category: "retention",
          version: "1.0",
          status: "archived",
          frameworkRefs: ["GDPR:Art.5"],
          createdBy: "alex@acmecorp.io",
          createdAt: daysAgo(120),
          updatedAt: daysAgo(30),
          publishedAt: daysAgo(100),
          ackCount: 6
        }
      ]
    }
  };
}
function getPolicyDetailResponse(id) {
  const contentMap = {
    "pol-access": "# Access Control Policy\n\n## Purpose\nEstablish controls for managing access to Acme Corp systems and data.\n\n## Scope\nAll employees, contractors, and third parties with access to company systems.\n\n## Policy\n1. All access must follow least-privilege principles\n2. MFA is required for all accounts\n3. Access reviews must be completed quarterly\n4. Privileged access requires manager approval\n5. Accounts are deactivated within 24 hours of termination",
    "pol-incident": "# Incident Response Plan\n\n## Purpose\nDefine procedures for identifying, responding to, and recovering from security incidents.\n\n## Severity Levels\n- **Critical**: Data breach, ransomware, account compromise\n- **High**: Unauthorized access, policy violation\n- **Medium**: Suspicious activity, failed controls\n- **Low**: Minor anomaly, informational\n\n## Response Steps\n1. Detection & triage (< 15 min)\n2. Containment (< 1 hour)\n3. Investigation & remediation\n4. Post-incident review within 72 hours",
    "pol-data": "# Data Protection & Encryption Policy\n\n## Purpose\nEnsure all sensitive data is properly classified, encrypted, and handled.\n\n## Requirements\n1. Data at rest: AES-256 encryption\n2. Data in transit: TLS 1.2+\n3. PII must be classified and tagged\n4. Encryption keys rotated annually\n5. Backups encrypted with separate keys"
  };
  return {
    data: {
      content: contentMap[id] ?? "# Policy Document\n\nContent is being drafted."
    }
  };
}
function getAccessReviewItemsResponse() {
  return {
    campaign: { id: "demo-campaign", name: "Q1 2026 Access Review", status: "active" },
    items: [
      {
        id: uuid(),
        userEmail: "jordan.lee@acmecorp.io",
        resource: "AWS Production",
        currentAccess: "Admin",
        decision: null,
        decidedBy: null,
        notes: null
      },
      {
        id: uuid(),
        userEmail: "taylor.chen@acmecorp.io",
        resource: "GitHub",
        currentAccess: "Write",
        decision: "approved",
        decidedBy: "admin@acmecorp.io",
        notes: null
      },
      {
        id: uuid(),
        userEmail: "morgan.patel@acmecorp.io",
        resource: "Salesforce",
        currentAccess: "Read",
        decision: null,
        decidedBy: null,
        notes: null
      },
      {
        id: uuid(),
        userEmail: "quinn.martinez@acmecorp.io",
        resource: "Slack",
        currentAccess: "Member",
        decision: "approved",
        decidedBy: "admin@acmecorp.io",
        notes: null
      },
      {
        id: uuid(),
        userEmail: "casey.williams@acmecorp.io",
        resource: "Datadog",
        currentAccess: "Admin",
        decision: "revoked",
        decidedBy: "admin@acmecorp.io",
        notes: "No longer on security team"
      },
      {
        id: uuid(),
        userEmail: "alex.nguyen@acmecorp.io",
        resource: "AWS Staging",
        currentAccess: "Read",
        decision: null,
        decidedBy: null,
        notes: null
      }
    ]
  };
}
function getAccessReviewsResponse() {
  const today = /* @__PURE__ */ new Date();
  const q1DueDate = new Date(today.getFullYear(), 2, 31);
  const q4DueDate = new Date(today.getFullYear() - 1, 11, 31);
  return {
    data: {
      items: [
        {
          id: uuid(),
          name: "Q1 2026 Access Review",
          scope: "all_users",
          dueDate: q1DueDate.toISOString(),
          status: "active",
          totalItems: 48,
          decidedItems: 29
        },
        {
          id: uuid(),
          name: "Q4 2025 Access Review",
          scope: "privileged_access",
          dueDate: q4DueDate.toISOString(),
          status: "completed",
          totalItems: 45,
          decidedItems: 45
        }
      ]
    }
  };
}
function getAccessRequestsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          requester: "jordan.lee@acmecorp.io",
          resource: "AWS Production Account",
          justification: "Need to debug production issue with customer-facing API",
          status: "pending",
          createdAt: hoursAgo(3)
        },
        {
          id: uuid(),
          requester: "taylor.chen@acmecorp.io",
          resource: "GitHub Admin Access",
          justification: "Repository migration project requires elevated permissions",
          status: "approved",
          createdAt: daysAgo(1)
        },
        {
          id: uuid(),
          requester: "morgan.patel@acmecorp.io",
          resource: "Production Database Read Access",
          justification: "Analytics query development and testing",
          status: "approved",
          createdAt: daysAgo(3)
        },
        {
          id: uuid(),
          requester: "quinn.martinez@acmecorp.io",
          resource: "Salesforce Admin Console",
          justification: "Need to configure new sales workflow automation",
          status: "denied",
          createdAt: daysAgo(5)
        },
        {
          id: uuid(),
          requester: "casey.williams@acmecorp.io",
          resource: "Security Audit Logs",
          justification: "Quarterly security audit and compliance review",
          status: "approved",
          createdAt: daysAgo(7)
        }
      ]
    }
  };
}
function getIncidentsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          title: "Critical CVE detected in production dependency",
          severity: "high",
          status: "open",
          source: "github-security-advisories",
          createdAt: hoursAgo(4),
          resolvedAt: null
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          title: "Multiple failed login attempts from unusual location",
          severity: "medium",
          status: "investigating",
          source: "okta-security-events",
          createdAt: daysAgo(2),
          resolvedAt: null
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          title: "S3 bucket with overly permissive public access policy",
          severity: "critical",
          status: "resolved",
          source: "aws-config",
          createdAt: daysAgo(8),
          resolvedAt: daysAgo(7)
        }
      ]
    }
  };
}
const CONNECTED_APP_IDS = [
  "okta",
  "aws",
  "github",
  "jira",
  "google-workspace",
  "slack",
  "microsoft365",
  "zoom",
  "bamboohr",
  "datadog",
  "pagerduty",
  "confluence"
];
function getIntegrationsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          provider: "okta",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(6)
        },
        {
          id: uuid(),
          provider: "aws",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(12)
        },
        {
          id: uuid(),
          provider: "github",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(3)
        },
        {
          id: uuid(),
          provider: "jira",
          status: "connected",
          created_at: daysAgo(150),
          updated_at: hoursAgo(24)
        },
        {
          id: uuid(),
          provider: "google-workspace",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(8)
        },
        {
          id: uuid(),
          provider: "slack",
          status: "connected",
          created_at: daysAgo(120),
          updated_at: hoursAgo(2)
        },
        {
          id: uuid(),
          provider: "microsoft365",
          status: "connected",
          created_at: daysAgo(90),
          updated_at: hoursAgo(18)
        },
        {
          id: uuid(),
          provider: "zoom",
          status: "connected",
          created_at: daysAgo(60),
          updated_at: daysAgo(1)
        },
        {
          id: uuid(),
          provider: "bamboohr",
          status: "connected",
          created_at: daysAgo(30),
          updated_at: daysAgo(2)
        },
        {
          id: uuid(),
          provider: "datadog",
          status: "connected",
          created_at: daysAgo(45),
          updated_at: hoursAgo(4)
        },
        {
          id: uuid(),
          provider: "pagerduty",
          status: "warning",
          created_at: daysAgo(75),
          updated_at: hoursAgo(36)
        },
        {
          id: uuid(),
          provider: "confluence",
          status: "connected",
          created_at: daysAgo(100),
          updated_at: daysAgo(3)
        }
      ]
    }
  };
}
function getAppsStatusResponse() {
  return {
    applications: CONNECTED_APP_IDS.map((id, index) => ({
      id,
      connected: true,
      healthy: id !== "pagerduty"
      // PagerDuty has warning status
    }))
  };
}
function getSettingsResponse() {
  const currentPeriodEnd = /* @__PURE__ */ new Date();
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 15);
  return {
    data: {
      tenant: {
        id: DEMO_USER.tenantId,
        name: "Acme Corp",
        slug: "acme-corp",
        tier: "pro",
        status: "active",
        industry: "Technology",
        size: "51-200"
      },
      preferences: {
        theme: "dark",
        language: "en",
        timezone: "America/Los_Angeles"
      }
    }
  };
}
function getBillingResponse() {
  const currentPeriodEnd = /* @__PURE__ */ new Date();
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 15);
  return {
    data: {
      plan: "pro",
      status: "active",
      seats: {
        used: 12,
        limit: 50
      },
      currentPeriodEnd: currentPeriodEnd.toISOString()
    }
  };
}
function getNotificationsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          type: "incident",
          title: "New critical security incident detected",
          message: "A critical CVE has been detected in a production dependency",
          read: false,
          createdAt: hoursAgo(4)
        },
        {
          id: uuid(),
          type: "access_request",
          title: "Access request pending approval",
          message: "Jordan Lee has requested access to AWS Production Account",
          read: false,
          createdAt: hoursAgo(3)
        },
        {
          id: uuid(),
          type: "compliance",
          title: "Compliance score improved",
          message: "Your SOC2 compliance score has increased to 82%",
          read: false,
          createdAt: daysAgo(1)
        },
        {
          id: uuid(),
          type: "automation",
          title: "Automation rule execution failed",
          message: "Auto-Revoke on Offboarding rule encountered an error",
          read: false,
          createdAt: daysAgo(2)
        },
        {
          id: uuid(),
          type: "access_review",
          title: "Access review due soon",
          message: "Q1 2026 Access Review campaign is 60% complete with 10 days remaining",
          read: true,
          createdAt: daysAgo(3)
        },
        {
          id: uuid(),
          type: "integration",
          title: "Integration health warning",
          message: "PagerDuty integration health check detected connectivity issues",
          read: true,
          createdAt: daysAgo(5)
        }
      ],
      unreadCount: 4
    }
  };
}
function getAuditLogResponse() {
  const entries = [
    {
      id: uuid(),
      actorId: DEMO_USER.userId,
      actorType: "user",
      action: "policy.published",
      resourceType: "policy",
      resourceId: "demo-000001",
      details: { policyName: "Data Protection and Privacy Policy", version: "3.0" },
      ipAddress: "192.168.1.100",
      correlationId: uuid(),
      createdAt: minutesAgo(30)
    },
    {
      id: uuid(),
      actorId: "demo-user-002",
      actorType: "user",
      action: "access.request.created",
      resourceType: "access_request",
      resourceId: uuid(),
      details: { resource: "AWS Production Account", status: "pending" },
      ipAddress: "192.168.1.105",
      correlationId: uuid(),
      createdAt: hoursAgo(3)
    },
    {
      id: uuid(),
      actorId: "system",
      actorType: "service",
      action: "automation.rule.executed",
      resourceType: "automation_rule",
      resourceId: "demo-000001",
      details: { ruleName: "Enforce MFA on New Users", status: "success", duration_ms: 1240 },
      ipAddress: "10.0.1.50",
      correlationId: uuid(),
      createdAt: hoursAgo(6)
    },
    {
      id: uuid(),
      actorId: "demo-user-005",
      actorType: "user",
      action: "incident.status.changed",
      resourceType: "incident",
      resourceId: uuid(),
      details: { from: "open", to: "investigating" },
      ipAddress: "192.168.1.110",
      correlationId: uuid(),
      createdAt: hoursAgo(8)
    },
    {
      id: uuid(),
      actorId: DEMO_USER.userId,
      actorType: "user",
      action: "user.mfa.enabled",
      resourceType: "user",
      resourceId: "demo-user-012",
      details: { method: "totp" },
      ipAddress: "192.168.1.100",
      correlationId: uuid(),
      createdAt: hoursAgo(12)
    },
    {
      id: uuid(),
      actorId: "demo-user-009",
      actorType: "user",
      action: "integration.connected",
      resourceType: "integration",
      resourceId: uuid(),
      details: { provider: "datadog" },
      ipAddress: "192.168.1.120",
      correlationId: uuid(),
      createdAt: hoursAgo(18)
    },
    {
      id: uuid(),
      actorId: "system",
      actorType: "service",
      action: "compliance.score.calculated",
      resourceType: "compliance_score",
      resourceId: uuid(),
      details: { framework: "SOC2", score: 82, previousScore: 80 },
      ipAddress: "10.0.1.50",
      correlationId: uuid(),
      createdAt: daysAgo(1)
    },
    {
      id: uuid(),
      actorId: DEMO_USER.userId,
      actorType: "user",
      action: "directory.user.deactivated",
      resourceType: "user",
      resourceId: "demo-user-012",
      details: { email: "pat.obrien@acmecorp.io", reason: "offboarding" },
      ipAddress: "192.168.1.100",
      correlationId: uuid(),
      createdAt: daysAgo(1)
    },
    {
      id: uuid(),
      actorId: "demo-user-005",
      actorType: "user",
      action: "access_review.campaign.created",
      resourceType: "access_review",
      resourceId: "demo-000001",
      details: { name: "Q1 2026 Access Review", scope: "all_users", totalItems: 48 },
      ipAddress: "192.168.1.110",
      correlationId: uuid(),
      createdAt: daysAgo(2)
    },
    {
      id: uuid(),
      actorId: "system",
      actorType: "service",
      action: "evidence.collected",
      resourceType: "evidence",
      resourceId: uuid(),
      details: { source: "okta", framework: "SOC2", controlId: "AC-01" },
      ipAddress: "10.0.1.50",
      correlationId: uuid(),
      createdAt: daysAgo(2)
    },
    {
      id: uuid(),
      actorId: "demo-user-002",
      actorType: "user",
      action: "policy.updated",
      resourceType: "policy",
      resourceId: "demo-000004",
      details: { policyName: "Incident Response Plan", changes: ["section_3_updated"] },
      ipAddress: "192.168.1.105",
      correlationId: uuid(),
      createdAt: daysAgo(2)
    },
    {
      id: uuid(),
      actorId: DEMO_USER.userId,
      actorType: "user",
      action: "access.request.approved",
      resourceType: "access_request",
      resourceId: uuid(),
      details: { requester: "taylor.chen@acmecorp.io", resource: "GitHub Admin Access" },
      ipAddress: "192.168.1.100",
      correlationId: uuid(),
      createdAt: daysAgo(3)
    },
    {
      id: uuid(),
      actorId: "demo-user-006",
      actorType: "user",
      action: "incident.created",
      resourceType: "incident",
      resourceId: uuid(),
      details: { title: "Multiple failed login attempts", severity: "medium", source: "okta" },
      ipAddress: "192.168.1.115",
      correlationId: uuid(),
      createdAt: daysAgo(3)
    },
    {
      id: uuid(),
      actorId: "system",
      actorType: "service",
      action: "directory.sync.completed",
      resourceType: "directory_sync",
      resourceId: uuid(),
      details: { source: "okta", usersUpdated: 2, groupsUpdated: 0 },
      ipAddress: "10.0.1.50",
      correlationId: uuid(),
      createdAt: daysAgo(3)
    },
    {
      id: uuid(),
      actorId: "demo-user-009",
      actorType: "user",
      action: "settings.updated",
      resourceType: "tenant_settings",
      resourceId: DEMO_USER.tenantId,
      details: { changes: ["theme", "timezone"] },
      ipAddress: "192.168.1.120",
      correlationId: uuid(),
      createdAt: daysAgo(4)
    },
    {
      id: uuid(),
      actorId: DEMO_USER.userId,
      actorType: "user",
      action: "compliance_pack.installed",
      resourceType: "compliance_pack",
      resourceId: uuid(),
      details: { framework: "GDPR", controlCount: 65 },
      ipAddress: "192.168.1.100",
      correlationId: uuid(),
      createdAt: daysAgo(5)
    },
    {
      id: uuid(),
      actorId: "demo-user-005",
      actorType: "user",
      action: "incident.resolved",
      resourceType: "incident",
      resourceId: uuid(),
      details: {
        title: "S3 bucket with overly permissive access",
        resolution: "Bucket policy updated to restrict access"
      },
      ipAddress: "192.168.1.110",
      correlationId: uuid(),
      createdAt: daysAgo(7)
    },
    {
      id: uuid(),
      actorId: "system",
      actorType: "service",
      action: "automation.rule.failed",
      resourceType: "automation_rule",
      resourceId: "demo-000002",
      details: {
        ruleName: "Auto-Revoke on Offboarding",
        error: "Timeout waiting for downstream service"
      },
      ipAddress: "10.0.1.50",
      correlationId: uuid(),
      createdAt: daysAgo(8)
    },
    {
      id: uuid(),
      actorId: DEMO_USER.userId,
      actorType: "user",
      action: "directory.user.created",
      resourceType: "user",
      resourceId: "demo-user-004",
      details: { email: "morgan.patel@acmecorp.io", department: "Engineering" },
      ipAddress: "192.168.1.100",
      correlationId: uuid(),
      createdAt: daysAgo(10)
    },
    {
      id: uuid(),
      actorId: "demo-user-002",
      actorType: "user",
      action: "access_review.decision.submitted",
      resourceType: "access_review",
      resourceId: "demo-000002",
      details: { campaign: "Q4 2025 Access Review", decision: "approved", itemsReviewed: 12 },
      ipAddress: "192.168.1.105",
      correlationId: uuid(),
      createdAt: daysAgo(12)
    }
  ];
  return {
    data: {
      items: entries,
      nextCursor: null,
      total: 20,
      facets: {
        actions: [
          { value: "policy.published", count: 3 },
          { value: "access.request.created", count: 5 },
          { value: "automation.rule.executed", count: 12 },
          { value: "incident.created", count: 4 },
          { value: "compliance.score.calculated", count: 8 },
          { value: "directory.user.created", count: 6 }
        ],
        resourceTypes: [
          { value: "policy", count: 8 },
          { value: "access_request", count: 7 },
          { value: "automation_rule", count: 15 },
          { value: "incident", count: 6 },
          { value: "user", count: 12 },
          { value: "compliance_score", count: 9 }
        ]
      }
    }
  };
}
function getMarketplaceResponse() {
  return {
    data: {
      items: CONNECTED_APP_IDS.map((id) => ({
        id,
        installed: true
      }))
    }
  };
}
const MUTATE_SUCCESS = { status: "ok", data: { success: true } };
const routes = [
  { pattern: "/api/v1/auth/validate", handler: () => getSessionResponse() },
  { pattern: "/api/auth/session", handler: () => getSessionResponse() },
  { pattern: "/api/v1/user/profile", handler: () => getUserProfileResponse() },
  { pattern: "/api/user/preferences", handler: () => getUserProfileResponse() },
  { pattern: "/api/user", handler: () => getUserProfileResponse() },
  { pattern: "/api/v1/dashboard", handler: () => getDashboardResponse() },
  {
    pattern: "/api/compliance/api/v1/compliance-packs/history/aggregate",
    handler: () => getComplianceTrendResponse()
  },
  {
    pattern: "/api/compliance/api/v1/compliance-packs/registry/controls",
    handler: () => getControlsRegistryResponse()
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/compliance-packs\/([^/]+)\/evaluate$/,
    handler: () => ({
      status: "success",
      data: {
        packId: "soc2",
        controlCount: 42,
        passCount: 38,
        failCount: 2,
        unknownCount: 2,
        score: 90,
        durationMs: 234
      }
    })
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/compliance-packs\/([^/]+)$/,
    handler: (url) => {
      const match = url.match(/\/compliance-packs\/([^/?]+)/);
      const packId = match?.[1] ?? "soc2";
      const packs = getCompliancePacksResponse();
      const pack = packs.data?.installed?.find((p) => p.id === packId);
      return { status: "success", data: pack ?? null };
    }
  },
  {
    pattern: "/api/compliance/api/v1/compliance-packs",
    handler: () => getCompliancePacksResponse()
  },
  {
    pattern: "/api/compliance/api/v1/compliance/summary",
    handler: () => getComplianceSummaryResponse()
  },
  { pattern: "/api/compliance/api/v1/evidence", handler: () => getEvidenceResponse() },
  { pattern: "/api/tenant-compliance/scores", handler: () => getComplianceScoresResponse() },
  {
    pattern: "/api/compliance/api/v1/policies/coverage",
    handler: () => getComplianceScoresResponse()
  },
  {
    pattern: "/api/compliance/api/v1/compliance-packs/history",
    handler: () => getComplianceTrendResponse()
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/policies\/([^/]+)\/acknowledgements/,
    handler: () => ({
      status: "success",
      data: {
        items: [
          {
            id: "att-1",
            policy_id: "demo-pol-1",
            acknowledged_by: "alex@acmecorp.io",
            acknowledged_at: "2026-04-01T10:00:00Z",
            version: "1.0"
          }
        ]
      }
    })
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/policies\/([^/]+)/,
    handler: (url) => {
      const match = url.match(/\/policies\/([^/?]+)/);
      return getPolicyDetailResponse(match?.[1] ?? "");
    }
  },
  { pattern: "/api/compliance/api/v1/policies", handler: () => getPoliciesResponse() },
  { pattern: "/api/v1/directory/users", handler: () => getDirectoryUsersResponse() },
  { pattern: "/api/v1/directory/groups", handler: () => getDirectoryGroupsResponse() },
  { pattern: "/api/v1/directory/sync/status", handler: () => getDirectorySyncStatusResponse() },
  { pattern: "/orchestrator/api/v1/automation/stats", handler: () => getAutomationStatsResponse() },
  {
    pattern: "/orchestrator/api/v1/automation/rules",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAutomationRulesResponse();
    }
  },
  { pattern: "/orchestrator/api/v1/automation/runs", handler: () => getAutomationRunsResponse() },
  {
    pattern: "/api/compliance/api/v1/access-reviews",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessReviewsResponse();
    }
  },
  {
    pattern: "/api/compliance/api/v1/access-requests",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessRequestsResponse();
    }
  },
  {
    pattern: /^\/api\/access-reviews\/[^/]+\/items/,
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessReviewItemsResponse();
    }
  },
  {
    pattern: /^\/api\/access-reviews\/[^/]+\/decisions/,
    handler: () => MUTATE_SUCCESS
  },
  {
    pattern: "/api/access-reviews",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessReviewsResponse();
    }
  },
  {
    pattern: "/api/access-requests",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessRequestsResponse();
    }
  },
  {
    pattern: "/api/compliance/api/v1/incidents",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getIncidentsResponse();
    }
  },
  { pattern: "/api/v1/apps/integrations", handler: () => getIntegrationsResponse() },
  { pattern: "/api/v1/apps/status", handler: () => getAppsStatusResponse() },
  { pattern: "/api/apps/status", handler: () => getAppsStatusResponse() },
  { pattern: "/api/v1/apps/connect", handler: () => MUTATE_SUCCESS },
  { pattern: "/api/v1/apps/disconnect", handler: () => MUTATE_SUCCESS },
  { pattern: "/api/v1/apps/test", handler: () => ({ data: { healthy: true } }) },
  {
    pattern: "/api/v1/adapters/stripe/evidence/collect",
    handler: () => ({
      status: "success",
      data: {
        collected: 52,
        controls: ["SOC2-CC6.1", "SOC2-CC6.6", "SOC2-CC7.2", "SOC2-CC7.3", "PCI-10.2", "PCI-12.8"],
        frameworks: ["SOC2", "PCI-DSS"],
        items: [
          {
            type: "api_key_permissions",
            controlRefs: ["SOC2-CC6.1"],
            status: "pass",
            details: {
              totalKeys: 5,
              testKeys: 3,
              liveKeys: 2,
              note: "API keys managed via Stripe Dashboard"
            }
          },
          {
            type: "webhook_security",
            controlRefs: ["SOC2-CC6.6"],
            status: "pass",
            details: {
              totalWebhooks: 2,
              allHttps: true,
              allActive: true
            }
          },
          {
            type: "payment_events",
            controlRefs: ["SOC2-CC7.2", "PCI-10.2"],
            status: "pass",
            details: {
              totalEvents: 37,
              successfulPayments: 34,
              failedPayments: 3,
              periodDays: 90
            }
          },
          {
            type: "dispute_tracking",
            controlRefs: ["SOC2-CC7.3"],
            status: "pass",
            details: {
              totalDisputes: 8,
              openDisputes: 0,
              closedDisputes: 8,
              periodDays: 90
            }
          },
          {
            type: "pci_compliance",
            controlRefs: ["PCI-12.8"],
            status: "pass",
            details: {
              provider: "Stripe",
              complianceLevel: "PCI DSS Level 1 Service Provider",
              attestation: "Stripe maintains PCI DSS Level 1 certification"
            }
          }
        ]
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    })
  },
  { pattern: "/api/v1/marketplace", handler: () => getMarketplaceResponse() },
  { pattern: "/api/marketplace", handler: () => getMarketplaceResponse() },
  {
    pattern: "/api/v1/marketplace/installs",
    handler: () => ({
      status: "success",
      data: [
        {
          id: "install-1",
          tenant_id: "demo-tenant-001",
          app_id: "github",
          status: "active",
          config: null,
          installed_by: null,
          installed_at: "2026-04-01T10:00:00Z",
          activated_at: "2026-04-01T10:05:00Z",
          uninstalled_at: null,
          updated_at: "2026-04-20T08:00:00Z"
        },
        {
          id: "install-2",
          tenant_id: "demo-tenant-001",
          app_id: "okta",
          status: "active",
          config: null,
          installed_by: null,
          installed_at: "2026-04-05T14:30:00Z",
          activated_at: "2026-04-05T14:35:00Z",
          uninstalled_at: null,
          updated_at: "2026-04-20T07:45:00Z"
        },
        {
          id: "install-3",
          tenant_id: "demo-tenant-001",
          app_id: "google-workspace",
          status: "active",
          config: null,
          installed_by: null,
          installed_at: "2026-04-10T09:15:00Z",
          activated_at: "2026-04-10T09:20:00Z",
          uninstalled_at: null,
          updated_at: "2026-04-20T08:30:00Z"
        }
      ],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    })
  },
  {
    pattern: "/api/v1/tenant/settings",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getSettingsResponse();
    }
  },
  { pattern: "/api/v1/tenant/sso", handler: () => ({ data: { enabled: false, provider: null } }) },
  { pattern: "/api/v1/billing", handler: () => getBillingResponse() },
  { pattern: "/api/v1/billing/seats", handler: () => getBillingResponse() },
  { pattern: "/api/compliance/api/v1/notifications", handler: () => getNotificationsResponse() },
  { pattern: "/api/notifications", handler: () => getNotificationsResponse() },
  { pattern: "/api/v1/audit-log", handler: () => getAuditLogResponse() },
  { pattern: "/api/tenant/audit-log", handler: () => getAuditLogResponse() },
  {
    pattern: "/api/v1/auth/mfa/status",
    handler: () => ({ data: { enabled: true, method: "totp" } })
  },
  {
    pattern: "/api/v1/auth/forgot-password",
    handler: () => ({ status: "success", message: "Reset link sent" })
  },
  { pattern: "/orchestrator/api/v1/events", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/nhi/discover", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/nhi", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/jml/changelog", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/jml/policy", handler: () => ({ data: { policy: null } }) },
  { pattern: "/orchestrator/api/v1/jml/runs", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/jml", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/automation/runs", handler: () => getAutomationRunsResponse() },
  { pattern: "/orchestrator/api/v1/dead-letter", handler: () => ({ data: { items: [] } }) },
  { pattern: "/api/health", handler: () => ({ status: "healthy" }) },
  { pattern: "/api/v1/platform/health-deep", handler: () => ({ status: "healthy", services: {} }) },
  // Questionnaire AI
  {
    pattern: "/api/v1/trust/questionnaire/list",
    handler: () => ({
      status: "success",
      questionnaires: [
        {
          id: "demo-q-1",
          name: "Acme Corp Vendor Security Review",
          question_count: 12,
          source_format: "text",
          created_at: "2026-04-15T14:30:00Z"
        },
        {
          id: "demo-q-2",
          name: "BigBank Third-Party Risk Assessment",
          question_count: 8,
          source_format: "csv",
          created_at: "2026-04-10T09:00:00Z"
        }
      ]
    })
  },
  {
    pattern: "/api/v1/trust/questionnaire/parse",
    handler: () => ({
      mappings: [
        {
          questionIndex: 0,
          questionText: "Do you enforce multi-factor authentication for all users?",
          section: "ACCESS CONTROL",
          mappedControls: ["CC6.2", "A.9.4.2"],
          confidence: 0.6
        },
        {
          questionIndex: 1,
          questionText: "How do you handle access removal upon employee termination?",
          section: "ACCESS CONTROL",
          mappedControls: ["CC6.3"],
          confidence: 0.3
        },
        {
          questionIndex: 2,
          questionText: "Describe your vulnerability management and scanning process.",
          section: "SECURITY OPERATIONS",
          mappedControls: ["CC7.1", "CC7.2"],
          confidence: 0.6
        },
        {
          questionIndex: 3,
          questionText: "What incident response procedures are in place?",
          section: "SECURITY OPERATIONS",
          mappedControls: ["CC7.3"],
          confidence: 0.3
        },
        {
          questionIndex: 4,
          questionText: "How is sensitive data encrypted at rest and in transit?",
          section: "DATA PROTECTION",
          mappedControls: ["Art.5(1)(f)"],
          confidence: 0.3
        }
      ],
      questionnaireId: "demo-q-new"
    })
  },
  {
    pattern: "/api/v1/trust/questionnaire/generate",
    handler: () => ({
      responses: [
        {
          questionIndex: 0,
          questionText: "Do you enforce multi-factor authentication for all users?",
          response: "Yes. All users are required to authenticate using TOTP-based multi-factor authentication. Our platform enforces MFA at login for all roles including administrators. 47 MFA enrollment records collected in the last 90 days confirm active enforcement.",
          evidenceRefs: ["CC6.2", "A.9.4.2"],
          mappedControls: ["CC6.2", "A.9.4.2"]
        },
        {
          questionIndex: 1,
          questionText: "How do you handle access removal upon employee termination?",
          response: "Access is revoked within 24 hours of termination through automated JML (Joiner/Mover/Leaver) workflows. Our system integrates with Okta and Azure AD to automatically disable accounts and revoke all access grants when an employee's status changes to terminated.",
          evidenceRefs: ["CC6.3"],
          mappedControls: ["CC6.3"]
        },
        {
          questionIndex: 2,
          questionText: "Describe your vulnerability management and scanning process.",
          response: "We run continuous vulnerability scans via CrowdStrike and Qualys integrations. Configuration changes are monitored in real-time, with alerts triggered for any deviation from baseline. 23 configuration audit records from the last 90 days.",
          evidenceRefs: ["CC7.1", "CC7.2"],
          mappedControls: ["CC7.1", "CC7.2"]
        },
        {
          questionIndex: 3,
          questionText: "What incident response procedures are in place?",
          response: "We maintain a documented incident response plan with defined severity levels, escalation paths, and communication templates. Incidents are tracked through our compliance platform with SLA-based resolution targets. Post-incident reviews are conducted for all P1/P2 incidents.",
          evidenceRefs: ["CC7.3"],
          mappedControls: ["CC7.3"]
        },
        {
          questionIndex: 4,
          questionText: "How is sensitive data encrypted at rest and in transit?",
          response: "All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Database encryption is managed through AWS KMS with automatic key rotation. Evidence of encryption configuration is continuously collected from our infrastructure adapters.",
          evidenceRefs: ["Art.5(1)(f)"],
          mappedControls: ["Art.5(1)(f)"]
        }
      ]
    })
  },
  { pattern: "/api/v1/trust/questionnaire/feedback", handler: () => MUTATE_SUCCESS },
  // Tenant info (for trust settings page)
  {
    pattern: /^\/api\/v1\/tenants\//,
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return {
        data: {
          id: "demo-tenant-001",
          name: "Acme Corp",
          slug: "acme-corp",
          config: { trust_center_public: true }
        }
      };
    }
  },
  // Trust center access requests
  { pattern: "/api/compliance/api/v1/trust/access-requests", handler: () => ({ requests: [] }) },
  // Catch-all for compliance-packs operations (install/uninstall)
  {
    pattern: /^\/api\/compliance\/api\/v1\/compliance-packs\/[^/]+\/(install|uninstall)$/,
    handler: () => MUTATE_SUCCESS
  },
  // Catch-all for any unmapped POST/PUT/PATCH/DELETE operations
  {
    pattern: /.*/,
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return { status: "success", data: null, items: [] };
    }
  }
];
function getDemoResponse(url, method) {
  resetCounter();
  const urlPath = url.split("?")[0];
  for (const route of routes) {
    let matched = false;
    if (typeof route.pattern === "string") {
      matched = urlPath === route.pattern || urlPath.startsWith(route.pattern + "/") || urlPath.startsWith(route.pattern + "?");
    } else {
      matched = route.pattern.test(urlPath);
    }
    if (matched) {
      const body = route.handler(url, method);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  }
  return null;
}
const __vite_import_meta_env__ = {};
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isBare, serverSession;
    if (typeof window !== "undefined" && isSpaMode) {
      const API_BASE2 = __vite_import_meta_env__?.VITE_API_URL ?? "";
      const originalFetch = window.fetch.bind(window);
      if (isDemoMode()) initDemo();
      const stubMap = {
        // Public health (API Gateway /health already returns 200)
        "/api/health": { status: "healthy" }
      };
      const pathMap = {
        // Dashboard / Analytics
        "/api/tenant/dashboard": "/api/v1/dashboard",
        "/api/platform/dashboard": "/api/v1/dashboard",
        "/api/analytics/dashboard": "/api/v1/dashboard",
        "/api/dashboard/views": "/api/v1/dashboard",
        // Audit log
        "/api/tenant/audit-log": "/api/v1/audit-log",
        // Compliance
        "/api/tenant-compliance/scores": "/api/compliance/api/v1/policies/coverage",
        "/api/tenant-compliance/controls": "/api/compliance/api/v1/compliance-packs/registry/controls",
        "/api/evidence-feed": "/api/compliance/api/v1/evidence",
        "/api/evidence-collection/collect": "/api/compliance/api/v1/evidence/collect",
        "/api/incidents": "/api/compliance/api/v1/incidents",
        "/api/compliance-intelligence/gaps": "/api/compliance/api/v1/policies/coverage",
        "/api/compliance-intelligence/drift": "/api/compliance/api/v1/compliance-packs/history/aggregate",
        // Notifications
        "/api/notifications": "/api/compliance/api/v1/notifications",
        // Access
        "/api/access-reviews": "/api/compliance/api/v1/access-reviews",
        "/api/access-requests": "/api/compliance/api/v1/access-requests",
        // Automation / Orchestrator
        "/api/automation/executions": "/orchestrator/api/v1/automation/rules",
        "/api/automation/rules": "/orchestrator/api/v1/automation/rules",
        "/api/automation/nl": "/orchestrator/api/v1/automation/nl",
        "/api/dead-letter": "/orchestrator/api/v1/dead-letter",
        "/api/jml/runs": "/orchestrator/api/v1/jml/runs",
        "/api/jml/policy": "/orchestrator/api/v1/jml/policy",
        "/api/jml/changelog": "/orchestrator/api/v1/jml/changelog",
        "/api/nhi": "/orchestrator/api/v1/nhi/discover",
        // Directory / Tenant / Users
        "/api/directory/groups": "/api/v1/directory/groups",
        "/api/directory/users": "/api/v1/directory/users",
        "/api/admin/tenants": "/api/v1/tenants",
        "/api/admin/users/reset-password": "/api/v1/admin/users/reset-password",
        "/api/tenant/settings": "/api/v1/tenant/settings",
        "/api/tenant/security": "/api/v1/tenant/settings",
        "/api/tenants/preferences": "/api/v1/tenant/settings",
        "/api/user/preferences": "/api/v1/user/profile",
        // Apps / Integrations
        "/api/apps/status": "/api/v1/apps/integrations",
        "/api/apps/connect": "/api/v1/apps/connect",
        "/api/apps/disconnect": "/api/v1/apps/disconnect",
        "/api/apps/test": "/api/v1/apps/test",
        "/api/apps/credentials": "/api/v1/apps/credentials",
        // Auth / MFA (Tier 2)
        "/api/auth/mfa/status": "/api/v1/auth/mfa/status",
        "/api/auth/mfa/setup": "/api/v1/auth/mfa/setup",
        "/api/auth/mfa/confirm": "/api/v1/auth/mfa/confirm",
        "/api/auth/mfa/disable": "/api/v1/auth/mfa/disable",
        // SSO config (Tier 2)
        "/api/tenant/sso": "/api/v1/tenant/sso",
        // Directory mappings (Tier 2)
        "/api/directory/mappings": "/api/v1/directory/mappings",
        // Support + DSAR (Tier 2)
        "/api/support": "/api/v1/support",
        "/api/privacy/dsar": "/api/v1/privacy/dsar",
        // Compliance anomalies (Tier 2)
        "/api/compliance-intelligence/anomalies": "/api/compliance/api/v1/compliance-intelligence/anomalies",
        // Trust Center / Questionnaires
        "/api/v1/trust/questionnaire/list": "/api/compliance/api/v1/trust/questionnaire/list",
        "/api/v1/trust/questionnaire/parse": "/api/compliance/api/v1/trust/questionnaire/parse",
        "/api/v1/trust/questionnaire/generate": "/api/compliance/api/v1/trust/questionnaire/generate",
        "/api/v1/trust/questionnaire/feedback": "/api/compliance/api/v1/trust/questionnaire/feedback",
        "/api/v1/trust/questionnaire/export": "/api/compliance/api/v1/trust/questionnaire/export",
        // Marketplace catalog
        "/api/marketplace": "/api/v1/marketplace",
        "/api/marketplace/installs": "/api/v1/marketplace/installs",
        // Platform / operations
        "/api/platform/health-deep": "/api/v1/platform/health-deep",
        "/api/incidents/sla-config": "/api/v1/incidents/sla-config",
        "/api/operations/metrics": "/orchestrator/api/v1/operations/metrics",
        "/api/platform/journey-metrics": "/orchestrator/api/v1/platform/journey-metrics",
        "/api/analytics/report": "/orchestrator/api/v1/analytics/report",
        // Events
        "/api/analytics/events": "/orchestrator/api/v1/events",
        // Auth session
        "/api/auth/session": "/api/v1/auth/validate",
        // Billing (Tier 3 — wired to Stripe when STRIPE_API_KEY is set)
        "/api/billing": "/api/v1/billing",
        "/api/billing/seats": "/api/v1/billing/seats",
        "/api/billing/checkout": "/api/v1/billing/checkout",
        "/api/billing/portal": "/api/v1/billing/portal"
      };
      window.fetch = function(input, init) {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("__data.json")) {
          return Promise.resolve(new Response(JSON.stringify({ type: "data", nodes: [null, null, null] }), { status: 200, headers: { "content-type": "application/json" } }));
        }
        if (isDemoMode() && (url.startsWith("/api/") || url.startsWith("/orchestrator/") || url.startsWith("/adapters/"))) {
          const method = init?.method?.toUpperCase() ?? "GET";
          const demoRes = getDemoResponse(url, method);
          if (demoRes) return Promise.resolve(demoRes);
          return Promise.resolve(new Response(JSON.stringify({ status: "success", data: null, items: [] }), { status: 200, headers: { "content-type": "application/json" } }));
        }
        if (!url.startsWith("/api/") && !url.startsWith("/orchestrator/") && !url.startsWith("/adapters/")) {
          return originalFetch(input, init);
        }
        const [urlPath, urlQuery] = url.split("?");
        for (const [from, stubBody] of Object.entries(stubMap)) {
          if (urlPath === from || urlPath.startsWith(from + "/")) {
            return Promise.resolve(new Response(JSON.stringify(stubBody), { status: 200, headers: { "content-type": "application/json" } }));
          }
        }
        const headers = new Headers(init?.headers ?? {});
        const token = sessionStorage.getItem("atlasit_token");
        if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
        try {
          const user = JSON.parse(sessionStorage.getItem("atlasit_user") ?? "{}");
          if (user.tenantId && !headers.has("x-tenant-id")) headers.set("x-tenant-id", user.tenantId);
        } catch {
        }
        if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", crypto.randomUUID());
        let mappedPath = "";
        for (const [from, to] of Object.entries(pathMap)) {
          if (urlPath === from || urlPath.startsWith(from + "/")) {
            mappedPath = to + urlPath.substring(from.length) + (urlQuery ? "?" + urlQuery : "");
            break;
          }
        }
        if (!mappedPath && (urlPath.startsWith("/api/v1/") || urlPath.startsWith("/api/compliance/") || urlPath.startsWith("/api/onboarding/") || urlPath.startsWith("/orchestrator/") || urlPath.startsWith("/adapters/"))) {
          mappedPath = url;
        }
        if (!mappedPath) {
          return Promise.resolve(new Response(JSON.stringify({ authenticated: false, data: null, items: [] }), { status: 200, headers: { "content-type": "application/json" } }));
        }
        return originalFetch(`${API_BASE2}${mappedPath}`, { ...init, headers });
      };
    }
    const PUBLIC_ROUTES = [
      "/login",
      "/signup",
      "/demo",
      "/interactive-demo",
      "/see-atlasit-live",
      "/support",
      "/status",
      "/trust",
      "/console/login",
      "/console/onboarding",
      "/faq",
      "/privacy",
      "/developers",
      "/accept-invite"
    ];
    isBare = store_get($$store_subs ??= {}, "$page", page).url.pathname === "/" || PUBLIC_ROUTES.some((r) => store_get($$store_subs ??= {}, "$page", page).url.pathname === r || store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith(r + "/"));
    serverSession = store_get($$store_subs ??= {}, "$page", page).data?.session;
    head("14v227l", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>AtlasIT Console</title>`);
      });
      $$renderer3.push(`<meta name="viewport" content="width=device-width, initial-scale=1"/>`);
    });
    if (isBare) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      AppFrame($$renderer2, {
        serverSession,
        children: ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          slot($$renderer3, $$props, "default", {});
          $$renderer3.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-DvqwG63H.js.map
