import { ag as bind_props, an as escape_html, ao as ensure_array_like, af as fallback, am as attr_style, ak as stringify, al as attr, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { p as push } from './toastStore-X6rW096m.js';
import { i as installApp } from './marketplace-CZLQH-xI.js';
import { s as session } from './session-B8MDMP-a.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { I as Input } from './input-JvKuIRs1.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';

function Package($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      }
    ],
    ["path", { "d": "M12 22V12" }],
    ["polyline", { "points": "3.29 7 12 12 20.71 7" }],
    ["path", { "d": "m7.5 4.27 9 5.15" }]
  ];
  Icon($$renderer, spread_props([
    { name: "package" },
    $$sanitized_props,
    {
      /**
       * @component @name Package
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgMjEuNzNhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M3oiIC8+CiAgPHBhdGggZD0iTTEyIDIyVjEyIiAvPgogIDxwb2x5bGluZSBwb2ludHM9IjMuMjkgNyAxMiAxMiAyMC43MSA3IiAvPgogIDxwYXRoIGQ9Im03LjUgNC4yNyA5IDUuMTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/package
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
function AppCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let status, statusLabel, statusColor, statusBg;
    let app = $$props["app"];
    let install = fallback($$props["install"], null);
    let loading = fallback($$props["loading"], false);
    let onInstall = fallback($$props["onInstall"], void 0);
    function categoryColor(cat) {
      const map = {
        identity: "#8b5cf6",
        security: "#ef4444",
        productivity: "#3b82f6",
        communication: "#06b6d4",
        hr: "#f59e0b",
        finance: "#10b981",
        infrastructure: "#6366f1"
      };
      return map[cat] ?? "#6b7280";
    }
    status = install?.status ?? "available";
    statusLabel = status === "active" ? "Active" : status === "installed" ? "Installed" : status === "configuring" ? "Configuring" : status === "error" ? "Error" : "Available";
    statusColor = status === "active" ? "#22c55e" : status === "installed" ? "#3b82f6" : status === "configuring" ? "#eab308" : status === "error" ? "#ef4444" : "var(--color-text-dim)";
    statusBg = status === "active" ? "rgba(34,197,94,0.15)" : status === "installed" ? "rgba(59,130,246,0.15)" : status === "configuring" ? "rgba(234,179,8,0.15)" : status === "error" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)";
    $$renderer2.push(`<a${attr("href", `/marketplace/${stringify(app.id)}`)} class="group block rounded-lg p-5 flex flex-col transition-all duration-200 hover:-translate-y-0.5"${attr_style(`background: var(--color-surface); border: 1px solid ${stringify(install ? "rgba(34,197,94,0.2)" : "var(--color-border)")};`)}><div class="flex items-start justify-between mb-3"><div class="flex items-center gap-3">`);
    if (app.logo_url) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<img${attr("src", app.logo_url)}${attr("alt", `${stringify(app.name)} logo`)} class="w-10 h-10 rounded-lg object-contain" style="background: rgba(255,255,255,0.05);"/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"${attr_style(`background: ${stringify(categoryColor(app.category))}20; color: ${stringify(categoryColor(app.category))};`)}>${escape_html(app.name.charAt(0))}</div>`);
    }
    $$renderer2.push(`<!--]--></div> <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"${attr_style(`background: ${stringify(statusBg)}; color: ${stringify(statusColor)};`)}>${escape_html(statusLabel)}</span></div> <h3 class="text-sm font-semibold mb-1" style="color: var(--color-text);">${escape_html(app.name)}</h3> <div class="flex items-center gap-1.5 mb-2"><span class="text-[10px] px-1.5 py-0.5 rounded font-medium"${attr_style(`background: ${stringify(categoryColor(app.category))}15; color: ${stringify(categoryColor(app.category))};`)}>${escape_html(app.category)}</span> `);
    if (app.auth_model) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="text-[10px] px-1.5 py-0.5 rounded" style="background: rgba(255,255,255,0.05); color: var(--color-text-dim);">${escape_html(app.auth_model)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <p class="text-xs line-clamp-2 mb-4 flex-1" style="color: var(--color-text-dim);">${escape_html(app.description || "No description available")}</p> <div class="mt-auto">`);
    if (install) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="block w-full py-2 text-xs font-medium rounded text-center transition-colors group-hover:brightness-110" style="background: rgba(59,130,246,0.15); color: #3b82f6;">View Details</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<button type="button"${attr("disabled", loading, true)} class="w-full py-2 text-xs font-medium rounded text-white transition-colors disabled:opacity-50" style="background: var(--color-accent);">`);
      if (loading) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Installing...`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`Install`);
      }
      $$renderer2.push(`<!--]--></button>`);
    }
    $$renderer2.push(`<!--]--></div></a>`);
    bind_props($$props, { app, install, loading, onInstall });
  });
}
function CategoryFilter($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let categories = fallback($$props["categories"], () => [], true);
    let active = fallback($$props["active"], "all");
    let onChange = fallback($$props["onChange"], void 0);
    $$renderer2.push(`<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"><button type="button" class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap"${attr_style(`background: ${stringify(active === "all" ? "var(--color-accent)" : "var(--color-surface)")}; color: ${stringify(active === "all" ? "#fff" : "var(--color-text-dim)")};`)}>All</button> <!--[-->`);
    const each_array = ensure_array_like(categories);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let cat = each_array[$$index];
      $$renderer2.push(`<button type="button" class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize whitespace-nowrap"${attr_style(`background: ${stringify(active === cat ? "var(--color-accent)" : "var(--color-surface)")}; color: ${stringify(active === cat ? "#fff" : "var(--color-text-dim)")};`)}>${escape_html(cat)}</button>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { categories, active, onChange });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let categories, installMap, filtered, installedCount;
    let data = $$props["data"];
    let apps = data.apps;
    let installs = data.installs;
    let searchQuery = "";
    let activeCategory = "all";
    let installingId = null;
    async function handleInstall(app) {
      let tenantId;
      session.subscribe((s) => tenantId = s?.tenantId)();
      if (!tenantId) {
        push({ message: "No tenant found. Please log in.", variant: "error" });
        return;
      }
      installingId = app.id;
      try {
        const install = await installApp(tenantId, app.id);
        installs = [...installs, install];
        push({
          message: `${app.name} installed successfully`,
          variant: "success"
        });
      } catch (e) {
        push({
          message: e?.message || `Failed to install ${app.name}`,
          variant: "error"
        });
      }
      installingId = null;
    }
    categories = [...new Set(apps.map((a) => a.category).filter(Boolean))].sort();
    installMap = new Map(installs.filter((i) => i.status !== "uninstalled").map((i) => [i.app_id, i]));
    filtered = apps.filter((app) => {
      if (activeCategory !== "all" && app.category !== activeCategory) return false;
      if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(app.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    installedCount = installs.filter((i) => i.status === "active" || i.status === "installed").length;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6 px-5 py-5 max-w-[1400px] mx-auto"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">Marketplace</h1> <p class="text-sm text-muted-foreground">Browse and install apps to extend your IT automation platform</p></div> <div class="flex items-center gap-3">`);
      if (installedCount > 0) {
        $$renderer3.push("<!--[0-->");
        Badge($$renderer3, {
          variant: "success",
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->${escape_html(installedCount)} Installed`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <a href="/console">`);
      Button($$renderer3, {
        variant: "outline",
        size: "sm",
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->Back to Dashboard`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></a></div></div> `);
      Input($$renderer3, {
        type: "text",
        placeholder: "Search apps...",
        class: "max-w-md",
        get value() {
          return searchQuery;
        },
        set value($$value) {
          searchQuery = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div>`);
      CategoryFilter($$renderer3, {
        categories,
        active: activeCategory,
        onChange: (cat) => activeCategory = cat
      });
      $$renderer3.push(`<!----></div> `);
      if (filtered.length === 0 && !searchQuery && activeCategory === "all") {
        $$renderer3.push("<!--[2-->");
        Card($$renderer3, {
          class: "py-16 text-center",
          children: ($$renderer4) => {
            Card_content($$renderer4, {
              children: ($$renderer5) => {
                Package($$renderer5, { class: "w-12 h-12 mx-auto mb-4 text-muted-foreground/30" });
                $$renderer5.push(`<!----> <p class="text-lg mb-1">No apps available yet</p> <p class="text-sm text-muted-foreground">The marketplace catalog is being populated. Check back soon.</p>`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
      } else if (filtered.length === 0) {
        $$renderer3.push("<!--[3-->");
        $$renderer3.push(`<div class="text-center py-12 text-muted-foreground"><p class="text-lg">No apps found</p> <p class="text-sm mt-1">Try a different search term or category</p></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"><!--[-->`);
        const each_array_1 = ensure_array_like(filtered);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let app = each_array_1[$$index_1];
          AppCard($$renderer3, {
            app,
            install: installMap.get(app.id) ?? null,
            loading: installingId === app.id,
            onInstall: handleInstall
          });
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { data });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Ctgws3Fv.js.map
