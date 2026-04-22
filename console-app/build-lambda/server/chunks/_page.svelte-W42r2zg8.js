import { al as attr, an as escape_html, aj as attr_class, ak as stringify } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let scanning = false;
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6 flex items-start justify-between gap-4 flex-wrap"><div><h1 class="text-3xl font-bold text-foreground">App Discovery</h1> <p class="mt-1 text-sm text-muted-foreground">Detect shadow IT via OAuth grant scanning</p></div> <button type="button"${attr("disabled", scanning, true)} class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">${escape_html("Scan Now")}</button></div> <div class="flex gap-1 border-b border-border mb-6"><button type="button"${attr_class(`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${stringify(
      "text-foreground border-b-2 border-blue-600"
    )}`)}>Discovered Apps</button> <button type="button"${attr_class(`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${stringify("text-muted-foreground hover:text-gray-900 dark:hover:text-white")}`)}>OAuth Grants</button></div> `);
    {
      $$renderer2.push("<!--[0-->");
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="h-64 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-W42r2zg8.js.map
