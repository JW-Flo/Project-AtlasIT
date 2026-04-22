import { ao as ensure_array_like, aj as attr_class, an as escape_html, ak as stringify } from './renderer-CwxN8JkH.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const SEVERITIES = ["critical", "high", "medium", "low"];
    let incidents = [];
    let severityFilter = "all";
    let statusFilter = "all";
    incidents.filter((i) => i.status === "open").length;
    incidents.filter((i) => i.status === "resolved").length;
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6 flex items-start justify-between gap-4 flex-wrap"><div><h1 class="text-3xl font-bold text-foreground">Incidents</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <button class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors">New Incident</button></div> <div class="mb-5 flex flex-wrap items-center gap-3"><div class="flex gap-1"><!--[-->`);
    const each_array = ensure_array_like(["all", ...SEVERITIES]);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let sev = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${stringify(severityFilter === sev ? "bg-blue-600 text-white border-blue-600" : "bg-card text-foreground/80 border-input hover:border-primary")}`)}>${escape_html(sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1))}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    $$renderer2.select(
      {
        value: statusFilter,
        class: "px-3 py-1 text-xs border border-input rounded-md bg-card text-foreground/80"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All statuses`);
        });
        $$renderer3.option({ value: "open" }, ($$renderer4) => {
          $$renderer4.push(`Open`);
        });
        $$renderer3.option({ value: "investigating" }, ($$renderer4) => {
          $$renderer4.push(`Investigating`);
        });
        $$renderer3.option({ value: "resolved" }, ($$renderer4) => {
          $$renderer4.push(`Resolved`);
        });
      }
    );
    $$renderer2.push(`</div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array_2 = ensure_array_like([1, 2, 3, 4]);
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
//# sourceMappingURL=_page.svelte-CCRpVaTt.js.map
