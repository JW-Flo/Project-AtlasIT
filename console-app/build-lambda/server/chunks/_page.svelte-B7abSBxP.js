import { ab as store_get, ac as head, ao as ensure_array_like, ae as unsubscribe_stores } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import { S as Shield_check } from './shield-check-DC5MZnbP.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    store_get($$store_subs ??= {}, "$page", page).params.slug;
    head("1pxr8wf", $$renderer2, ($$renderer3) => {
      {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Trust Center · AtlasIT</title>`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`<div class="min-h-dvh bg-background"><div class="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none"><div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/8 blur-3xl"></div></div> <header class="container-page py-5 flex items-center justify-between border-b border-border"><a href="/" class="flex items-center gap-2 group"><div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm">`);
    Shield_check($$renderer2, {
      class: "h-4.5 w-4.5 text-primary-foreground",
      strokeWidth: 2.5
    });
    $$renderer2.push(`<!----></div> <span class="font-semibold text-lg tracking-tight">AtlasIT</span></a> <div class="text-2xs uppercase tracking-wider text-muted-foreground font-medium">Trust Center</div></header> <main class="container-content py-10">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-4 animate-pulse"><div class="h-12 w-64 bg-muted rounded-lg"></div> <div class="h-48 bg-muted rounded-2xl"></div> <div class="grid grid-cols-2 sm:grid-cols-5 gap-3"><!--[-->`);
      const each_array = ensure_array_like(Array(5));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-32 bg-muted rounded-xl"></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--></main></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B7abSBxP.js.map
