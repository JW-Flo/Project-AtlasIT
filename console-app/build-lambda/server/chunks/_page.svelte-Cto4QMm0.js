import { ab as store_get, ao as ensure_array_like, al as attr, aj as attr_class, ak as stringify, an as escape_html, ae as unsubscribe_stores } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import './toastStore-X6rW096m.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let current;
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
    current = store_get($$store_subs ??= {}, "$page", page).url.pathname;
    $$renderer2.push(`<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Incident Settings</h1> <div class="flex gap-1 border-b"><!--[-->`);
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
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3">`);
      Skeleton($$renderer2, { class: "h-10 rounded-lg" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { class: "h-48 rounded-lg" });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Cto4QMm0.js.map
