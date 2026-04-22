import { ao as ensure_array_like, aj as attr_class, ak as stringify, an as escape_html, al as attr } from './renderer-CwxN8JkH.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './toastStore-X6rW096m.js';
import { i as integrations, c as categories, a as iconMap } from './integrations-C0eSUhV4.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { I as Input } from './input-JvKuIRs1.js';
import { D as Dialog } from './dialog-Cs6T-I4e.js';
import { E as External_link } from './external-link-B8q-9MyH.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';
import './index-server-C1ubzO3x.js';
import './x-BmTrGS3K.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let filtered, connectedCount;
    let apps = integrations.map((i) => ({ ...i }));
    let activeCategory = "all";
    let searchQuery = "";
    let wizardOpen = false;
    function authLabel(auth) {
      if (auth === "platform_oauth") return "OAuth 2.0";
      if (auth === "tenant_oauth") return "OAuth 2.0";
      if (auth === "api_key") return "API Key";
      if (auth === "service_account") return "Service Account";
      return auth;
    }
    filtered = apps.filter((i) => {
      if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    connectedCount = apps.filter((a) => a.connected).length;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6" data-tour="marketplace"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Marketplace</h1> <p class="text-sm text-muted-foreground">Connect your business apps to AtlasIT for automated compliance and IT management</p></div> <div class="flex items-center gap-3">`);
      if (connectedCount > 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<a href="/console/integrations">`);
        Badge($$renderer3, {
          variant: "success",
          class: "cursor-pointer",
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->${escape_html(connectedCount)} Connected → Connected Apps`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----></a>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div></div> `);
      Input($$renderer3, {
        type: "text",
        placeholder: "Search integrations...",
        class: "max-w-md",
        get value() {
          return searchQuery;
        },
        set value($$value) {
          searchQuery = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div class="flex flex-wrap gap-2"><!--[-->`);
      const each_array = ensure_array_like(categories);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let cat = each_array[$$index];
        $$renderer3.push(`<button type="button"${attr_class(`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${stringify(activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}`)}>${escape_html(cat.label)}</button>`);
      }
      $$renderer3.push(`<!--]--></div> <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"><!--[-->`);
      const each_array_1 = ensure_array_like(filtered);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let integration = each_array_1[$$index_1];
        Card($$renderer3, {
          class: `${stringify(integration.connected ? "border-green-500/30" : "")} cursor-pointer hover:shadow-md transition-shadow`,
          children: ($$renderer4) => {
            Card_content($$renderer4, {
              class: "pt-5 flex flex-col h-full",
              children: ($$renderer5) => {
                $$renderer5.push(`<div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"${attr("d", iconMap[integration.category] || iconMap.productivity)}></path></svg></div> `);
                Badge($$renderer5, {
                  variant: integration.connected ? "success" : integration.status === "stable" ? "default" : integration.status === "beta" ? "warning" : "secondary",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(integration.connected ? "Connected" : integration.status)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div> <h3 class="text-sm font-semibold mb-1 flex items-center gap-1.5">${escape_html(integration.name)} `);
                if (integration.connected) {
                  $$renderer5.push("<!--[0-->");
                  $$renderer5.push(`<span${attr_class(`inline-block w-2 h-2 rounded-full ${stringify(integration.healthy === true ? "bg-success" : integration.healthy === false ? "bg-destructive" : "bg-gray-400")}`)}${attr("title", integration.healthy === true ? "Healthy" : integration.healthy === false ? "Unhealthy" : "Not tested")}></span>`);
                } else {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--></h3> <div class="text-xs text-muted-foreground mb-1">${escape_html(integration.category)} · ${escape_html(authLabel(integration.auth))} · ${escape_html(integration.tier)}</div> <div class="text-xs text-muted-foreground/70 mb-4 line-clamp-2">${escape_html(integration.description)}</div> <div class="mt-auto space-y-2">`);
                if (integration.connected) {
                  $$renderer5.push("<!--[0-->");
                  $$renderer5.push(`<a href="/console/integrations">`);
                  Button($$renderer5, {
                    variant: "outline",
                    size: "sm",
                    class: "w-full",
                    children: ($$renderer6) => {
                      External_link($$renderer6, { class: "h-3 w-3 mr-1.5" });
                      $$renderer6.push(`<!----> Manage in Connected Apps`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----></a> `);
                  Button($$renderer5, {
                    variant: "destructive",
                    size: "sm",
                    class: "w-full",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Disconnect`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!---->`);
                } else if (integration.status === "planned") {
                  $$renderer5.push("<!--[1-->");
                  Button($$renderer5, {
                    size: "sm",
                    class: "w-full",
                    disabled: true,
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Coming Soon`);
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$renderer5.push("<!--[-1-->");
                  Button($$renderer5, {
                    size: "sm",
                    class: "w-full",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Connect`);
                    },
                    $$slots: { default: true }
                  });
                }
                $$renderer5.push(`<!--]--></div>`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
      }
      $$renderer3.push(`<!--]--></div> `);
      if (filtered.length === 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="text-center py-12 text-muted-foreground"><p class="text-lg">No integrations found</p> <p class="text-sm mt-1">Try a different search or category</p></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div> `);
      Dialog($$renderer3, {
        open: wizardOpen,
        onClose: () => wizardOpen = false,
        title: `Connect ${stringify("")}`,
        children: ($$renderer4) => {
          {
            $$renderer4.push("<!--[-1-->");
          }
          $$renderer4.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!---->`);
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
//# sourceMappingURL=_page.svelte-DN2jLw4U.js.map
