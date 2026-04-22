import { an as escape_html, ao as ensure_array_like, aj as attr_class, ak as stringify } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let runs = [];
    ({
      running: runs.filter((r) => r.status === "running" || r.status === "pending").length,
      completed: runs.filter((r) => r.status === "completed").length,
      failed: runs.filter((r) => r.status === "failed" || r.status === "cancelled").length
    });
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6 flex items-start justify-between"><div><h1 class="text-3xl font-bold text-foreground">Workflows</h1> <p class="mt-1 text-sm text-muted-foreground">JML automation runs and directory change history</p></div> <button class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors">${escape_html("Start Workflow")}</button></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"><!--[-->`);
      const each_array = ensure_array_like(Array(4));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-20 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="border-b border-border mb-6"><nav class="-mb-px flex gap-6"><button${attr_class(`pb-3 text-sm font-medium border-b-2 transition-colors ${stringify(
      "border-blue-600 text-primary"
    )}`)}>Runs</button> <button${attr_class(`pb-3 text-sm font-medium border-b-2 transition-colors ${stringify("border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-200")}`)}>JML Changelog</button></nav></div> `);
    {
      $$renderer2.push("<!--[0-->");
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="space-y-2"><!--[-->`);
        const each_array_1 = ensure_array_like(Array(5));
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          each_array_1[$$index_1];
          $$renderer2.push(`<div class="h-14 bg-muted rounded-lg animate-pulse"></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
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
//# sourceMappingURL=_page.svelte-D_qoIs8c.js.map
