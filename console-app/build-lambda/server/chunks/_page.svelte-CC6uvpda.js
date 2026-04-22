import { an as escape_html, ao as ensure_array_like, aj as attr_class, ak as stringify } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let filterStatus = "all";
    $$renderer2.push(`<div class="p-8 max-w-7xl mx-auto space-y-6"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 class="text-2xl font-bold text-foreground">Access Requests</h1> <p class="mt-1 text-sm text-muted-foreground">Review and manage resource access requests for your tenant.</p></div> <button class="shrink-0 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md">${escape_html("New Request")}</button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex gap-2 flex-wrap"><!--[-->`);
    const each_array_1 = ensure_array_like([
      { value: "all", label: "All" },
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "denied", label: "Denied" }
    ]);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let pill = each_array_1[$$index_1];
      $$renderer2.push(`<button${attr_class(`px-3 py-1.5 text-sm rounded-full border transition-colors ${stringify(filterStatus === pill.value ? "bg-blue-600 border-blue-600 text-white" : "border-input text-foreground/80 hover:border-primary")}`)}>${escape_html(pill.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array_2 = ensure_array_like([1, 2, 3]);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        each_array_2[$$index_2];
        $$renderer2.push(`<div class="h-14 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CC6uvpda.js.map
