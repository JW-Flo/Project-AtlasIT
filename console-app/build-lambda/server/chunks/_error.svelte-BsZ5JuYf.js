import { an as escape_html, ab as store_get, ae as unsubscribe_stores } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';

function _error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<div class="min-h-screen flex items-center justify-center bg-background"><div class="max-w-md w-full space-y-4 px-4 text-center"><h1 class="text-2xl font-semibold">Something went wrong</h1> <p class="text-sm text-muted-foreground">${escape_html(store_get($$store_subs ??= {}, "$page", page).error?.message || "An unexpected error occurred")}</p> <p class="text-xs text-muted-foreground">Path: ${escape_html(store_get($$store_subs ??= {}, "$page", page).url.pathname)}</p> <div class="flex gap-2 justify-center"><button class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">Reload page</button> <a href="/console" class="px-4 py-2 rounded-md border text-sm hover:bg-muted">Go to dashboard</a></div></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _error as default };
//# sourceMappingURL=_error.svelte-BsZ5JuYf.js.map
