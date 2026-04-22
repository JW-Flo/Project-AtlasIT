import { ao as ensure_array_like } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let installedPacks;
    let packs = [];
    installedPacks = packs.filter((p) => p.installedAt);
    installedPacks.reduce((s, p) => s + (p.controlCount ?? 0), 0);
    installedPacks.reduce((s, p) => s + (p.passCount ?? 0), 0);
    installedPacks.reduce((s, p) => s + (p.failCount ?? 0), 0);
    installedPacks.reduce((s, p) => s + (p.unknownCount ?? 0), 0);
    $$renderer2.push(`<div class="animate-fade-in" data-tour="compliance-packs"><div class="mb-6"><h1 class="text-3xl font-bold text-foreground">Compliance Packs</h1> <p class="mt-1 text-sm text-muted-foreground">CDT-backed framework packs. Installing a pack binds its controls to your tenant; evaluation runs the live rule engine against your recent evidence.</p></div> `);
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
      $$renderer2.push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array = ensure_array_like([1, 2, 3, 4, 5]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-44 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DNvJqic9.js.map
