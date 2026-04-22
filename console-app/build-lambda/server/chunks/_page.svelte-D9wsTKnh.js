import { ab as store_get, ao as ensure_array_like, al as attr, aj as attr_class, ak as stringify, an as escape_html, ae as unsubscribe_stores, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import { B as Button } from './button-BXPyX210.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { D as Download } from './download-BKS59Bcj.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './utils2-BgZmMgq3.js';

function Funnel($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "funnel" },
    $$sanitized_props,
    {
      /**
       * @component @name Funnel
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMjBhMSAxIDAgMCAwIC41NTMuODk1bDIgMUExIDEgMCAwIDAgMTQgMjF2LTdhMiAyIDAgMCAxIC41MTctMS4zNDFMMjEuNzQgNC42N0ExIDEgMCAwIDAgMjEgM0gzYTEgMSAwIDAgMC0uNzQyIDEuNjdsNy4yMjUgNy45ODlBMiAyIDAgMCAxIDEwIDE0eiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/funnel
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let current, hasActiveFilters;
    const settingsTabs = [
      { href: "/console/settings", label: "General" },
      { href: "/console/settings/users", label: "Users" },
      { href: "/console/settings/audit-log", label: "Audit Log" },
      { href: "/console/settings/billing", label: "Billing" },
      { href: "/console/settings/trust", label: "Trust Center" },
      { href: "/console/settings/incidents", label: "Incidents" },
      { href: "/console/settings/security", label: "Security" },
      {
        href: "/console/settings/notifications",
        label: "Notifications"
      }
    ];
    let filterTo = "";
    let exporting = false;
    current = store_get($$store_subs ??= {}, "$page", page).url.pathname;
    hasActiveFilters = filterTo;
    $$renderer2.push(`<div class="space-y-6"><div class="flex items-center justify-between"><h1 class="text-2xl font-semibold tracking-tight">Audit Log</h1> <div class="flex gap-2">`);
    Button($$renderer2, {
      variant: "outline",
      size: "sm",
      children: ($$renderer3) => {
        Funnel($$renderer3, { class: "h-4 w-4 mr-1" });
        $$renderer3.push(`<!----> Filters `);
        if (hasActiveFilters) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<span class="ml-1 h-2 w-2 rounded-full bg-primary inline-block"></span>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    Button($$renderer2, {
      variant: "outline",
      size: "sm",
      disabled: exporting,
      children: ($$renderer3) => {
        Download($$renderer3, { class: "h-4 w-4 mr-1" });
        $$renderer3.push(`<!----> CSV`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    Button($$renderer2, {
      variant: "outline",
      size: "sm",
      disabled: exporting,
      children: ($$renderer3) => {
        Download($$renderer3, { class: "h-4 w-4 mr-1" });
        $$renderer3.push(`<!----> JSON`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></div> <div class="flex gap-1 border-b"><!--[-->`);
    const each_array = ensure_array_like(settingsTabs);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tab = each_array[$$index];
      $$renderer2.push(`<a${attr("href", tab.href)}${attr_class(`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${stringify(current === tab.href ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}`)}>${escape_html(tab.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array_1 = ensure_array_like([1, 2, 3]);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        each_array_1[$$index_1];
        Skeleton($$renderer2, { class: "h-12 rounded-lg" });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-D9wsTKnh.js.map
