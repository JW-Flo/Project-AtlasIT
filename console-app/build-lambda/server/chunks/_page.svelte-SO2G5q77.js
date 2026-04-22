import { al as attr, ao as ensure_array_like, an as escape_html } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let facets = { actions: [], resourceTypes: [] };
    let actorFilter = "";
    let actionFilter = "";
    let resourceTypeFilter = "";
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6"><h1 class="text-3xl font-bold text-foreground">Audit Log</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="mb-5 bg-card border border-border rounded-lg p-4 flex flex-wrap items-end gap-3"><div class="flex-1 min-w-[200px]"><label class="block text-xs font-medium text-muted-foreground mb-1" for="f-actor">Actor</label> <input id="f-actor" type="text"${attr("value", actorFilter)} placeholder="user_id, email, or 'system'" class="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/></div> <div class="flex-1 min-w-[200px]"><label class="block text-xs font-medium text-muted-foreground mb-1" for="f-action">Action</label> <input id="f-action" type="text"${attr("value", actionFilter)} placeholder="e.g. policy.created" list="action-list" class="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/> <datalist id="action-list"><!--[-->`);
    const each_array = ensure_array_like(facets.actions);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let a = each_array[$$index];
      $$renderer2.option({ value: a }, ($$renderer3) => {
        $$renderer3.push(`${escape_html(a)}`);
      });
    }
    $$renderer2.push(`<!--]--></datalist></div> <div class="min-w-[180px]"><label class="block text-xs font-medium text-muted-foreground mb-1" for="f-rt">Resource type</label> `);
    $$renderer2.select(
      {
        id: "f-rt",
        value: resourceTypeFilter,
        class: "w-full px-3 py-1.5 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground/80"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`Any`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(facets.resourceTypes);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let rt = each_array_1[$$index_1];
          $$renderer3.option({ value: rt }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(rt)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</div> <button class="px-4 py-1.5 text-sm bg-primary hover:bg-primary-hover text-white rounded-md font-medium">Apply</button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-2"><!--[-->`);
      const each_array_2 = ensure_array_like([1, 2, 3, 4, 5]);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        each_array_2[$$index_2];
        $$renderer2.push(`<div class="h-14 bg-muted rounded animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-SO2G5q77.js.map
