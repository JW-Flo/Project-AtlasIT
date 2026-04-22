import { an as escape_html, ao as ensure_array_like } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<div class="p-8 max-w-7xl mx-auto space-y-6" data-tour="access-reviews"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 class="text-2xl font-bold text-foreground">Access Reviews</h1> <p class="mt-1 text-sm text-muted-foreground">Periodically recertify who has access to what across your connected applications.</p></div> <button class="shrink-0 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md">${escape_html("New Campaign")}</button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-14 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-C0qBGuFk.js.map
