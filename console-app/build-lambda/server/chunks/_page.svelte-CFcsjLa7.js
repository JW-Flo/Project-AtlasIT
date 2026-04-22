import { ab as store_get, ac as head, aj as attr_class, ap as clsx, am as attr_style, ae as unsubscribe_stores, ak as stringify } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let theme, compact;
    store_get($$store_subs ??= {}, "$page", page).params.slug;
    theme = (store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("theme") ?? "light").toLowerCase() === "dark" ? "dark" : "light";
    compact = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("size") === "compact";
    head("1onuu39", $$renderer2, ($$renderer3) => {
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      $$renderer3.push(`<style>
    /* Embed pages are sandbox iframes — set self-contained body styles */
    html, body { background: transparent; margin: 0; padding: 0; font-family: Inter, -apple-system, system-ui, sans-serif; }
  </style>`);
    });
    $$renderer2.push(`<div${attr_class(clsx(theme === "dark" ? "dark" : ""))}${attr_style(`color-scheme: ${stringify(theme)};`)}><div${attr_class(compact ? "p-2" : "p-3")}>`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse"><div class="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 rounded mb-2"></div> <div class="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 rounded"></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CFcsjLa7.js.map
