import { ao as ensure_array_like, af as fallback, aj as attr_class, ap as clsx, ad as slot, ag as bind_props, an as escape_html, ah as sanitize_props, ai as spread_props } from './renderer-CwxN8JkH.js';
import './toastStore-X6rW096m.js';
import { B as Button } from './button-BXPyX210.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { A as Alert } from './alert-CV56Qv_m.js';
import { c as cn } from './utils2-BgZmMgq3.js';
import { A as Activity } from './activity-BZT1Fpfp.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { T as Triangle_alert } from './triangle-alert-BIxAVWgG.js';
import './index-C1X1AO8K.js';

function Circle_x($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "m15 9-6 6" }],
    ["path", { "d": "m9 9 6 6" }]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-x" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleX
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJtMTUgOS02IDYiIC8+CiAgPHBhdGggZD0ibTkgOSA2IDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/circle-x
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
function Rotate_cw($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      { "d": "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }
    ],
    ["path", { "d": "M21 3v5h-5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "rotate-cw" },
    $$sanitized_props,
    {
      /**
       * @component @name RotateCw
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgMTJhOSA5IDAgMSAxLTktOWMyLjUyIDAgNC45MyAxIDYuNzQgMi43NEwyMSA4IiAvPgogIDxwYXRoIGQ9Ik0yMSAzdjVoLTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/rotate-cw
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
function Tabs($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<div${attr_class(clsx(cn("", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { class: className });
  });
}
function Tabs_list($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<div${attr_class(clsx(cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { class: className });
  });
}
function Tabs_trigger($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let active = fallback($$props["active"], false);
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<button type="button"${attr_class(clsx(cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      className
    )))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></button>`);
    bind_props($$props, { active, class: className });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activeTab = "dashboard";
    let dlqLoading = true;
    let runsLoading = true;
    let alerts = [];
    function alertSeverityVariant(severity) {
      if (severity === "critical") return "destructive";
      if (severity === "warning") return "warning";
      return "default";
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><div class="flex items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">Operations</h1> <p class="text-sm text-muted-foreground">Pipeline health, workflow runs, and dead letter queue</p></div> <div class="flex items-center gap-2 shrink-0">`);
      Activity($$renderer3, { class: "h-5 w-5 text-primary" });
      $$renderer3.push(`<!----></div></div> `);
      if (alerts.length > 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="space-y-2"><!--[-->`);
        const each_array = ensure_array_like(alerts);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let alert = each_array[$$index];
          Alert($$renderer3, {
            variant: alertSeverityVariant(alert.severity),
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-start gap-2">`);
              if (alert.severity === "critical") {
                $$renderer4.push("<!--[0-->");
                Circle_x($$renderer4, { class: "h-4 w-4 mt-0.5 shrink-0" });
              } else {
                $$renderer4.push("<!--[-1-->");
                Triangle_alert($$renderer4, { class: "h-4 w-4 mt-0.5 shrink-0" });
              }
              $$renderer4.push(`<!--]--> <div class="pl-1"><p class="text-sm font-medium">${escape_html(alert.message)}</p> `);
              if (alert.detail) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<p class="text-xs opacity-80 mt-0.5">${escape_html(alert.detail)}</p>`);
              } else {
                $$renderer4.push("<!--[-1-->");
              }
              $$renderer4.push(`<!--]--></div></div>`);
            },
            $$slots: { default: true }
          });
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      Tabs($$renderer3, {
        get value() {
          return activeTab;
        },
        set value($$value) {
          activeTab = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Tabs_list($$renderer4, {
            children: ($$renderer5) => {
              Tabs_trigger($$renderer5, {
                value: "dashboard",
                active: activeTab === "dashboard",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Dashboard`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Tabs_trigger($$renderer5, {
                value: "evidence",
                active: activeTab === "evidence",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Evidence Health`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Tabs_trigger($$renderer5, {
                value: "runs",
                active: activeTab === "runs",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Workflow Runs`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Tabs_trigger($$renderer5, {
                value: "dlq",
                active: activeTab === "dlq",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Dead Letter Queue`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!---->`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      if (activeTab === "dashboard") {
        $$renderer3.push("<!--[0-->");
        {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="grid gap-4 md:grid-cols-4"><!--[-->`);
          const each_array_1 = ensure_array_like([1, 2, 3, 4]);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            each_array_1[$$index_1];
            Skeleton($$renderer3, { class: "h-24 rounded-lg" });
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (activeTab === "evidence") {
        $$renderer3.push("<!--[0-->");
        {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="space-y-3"><!--[-->`);
          const each_array_4 = ensure_array_like([1, 2, 3]);
          for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
            each_array_4[$$index_4];
            Skeleton($$renderer3, { class: "h-20 rounded-lg" });
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (activeTab === "dlq") {
        $$renderer3.push("<!--[0-->");
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="space-y-3"><!--[-->`);
          const each_array_6 = ensure_array_like([1, 2, 3]);
          for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
            each_array_6[$$index_6];
            Skeleton($$renderer3, { class: "h-16 rounded-lg" });
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]--> <div class="flex justify-end">`);
        Button($$renderer3, {
          variant: "outline",
          size: "sm",
          disabled: dlqLoading,
          children: ($$renderer4) => {
            Rotate_cw($$renderer4, { class: "h-3 w-3 mr-1" });
            $$renderer4.push(`<!----> Refresh`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (activeTab === "runs") {
        $$renderer3.push("<!--[0-->");
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="space-y-3"><!--[-->`);
          const each_array_8 = ensure_array_like([1, 2, 3]);
          for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
            each_array_8[$$index_8];
            Skeleton($$renderer3, { class: "h-16 rounded-lg" });
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]--> <div class="flex justify-end">`);
        Button($$renderer3, {
          variant: "outline",
          size: "sm",
          disabled: runsLoading,
          children: ($$renderer4) => {
            Rotate_cw($$renderer4, { class: "h-3 w-3 mr-1" });
            $$renderer4.push(`<!----> Refresh`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----></div>`);
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
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-D9O-OtAj.js.map
