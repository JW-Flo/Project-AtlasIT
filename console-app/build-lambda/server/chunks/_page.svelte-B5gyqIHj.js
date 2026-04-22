import { ab as store_get, ao as ensure_array_like, aj as attr_class, an as escape_html, ae as unsubscribe_stores, ak as stringify } from './renderer-CwxN8JkH.js';
import { s as session } from './session-B8MDMP-a.js';
import 'diff';
import './index-C1X1AO8K.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isAdmin;
    const CATEGORIES = [
      { value: "access-control", label: "Access Control" },
      { value: "incident-response", label: "Incident Response" },
      { value: "data-protection", label: "Data Protection" },
      { value: "vendor", label: "Vendor Management" },
      { value: "acceptable-use", label: "Acceptable Use" },
      { value: "byod", label: "BYOD" },
      { value: "retention", label: "Data Retention" },
      { value: "other", label: "Other" }
    ];
    let statusFilter = "all";
    let categoryFilter = "all";
    isAdmin = (store_get($$store_subs ??= {}, "$session", session)?.roles ?? []).includes("admin");
    $$renderer2.push(`<div class="animate-fade-in" data-tour="policies"><div class="mb-6 flex items-start justify-between gap-4 flex-wrap"><div><h1 class="text-3xl font-bold text-foreground">Policies</h1> <p class="mt-1 text-sm text-muted-foreground">Manage compliance policies and track team acknowledgements.</p></div> `);
    if (
      // ── Data loading ──────────────────────────────────────────────────────────
      // ── Create ────────────────────────────────────────────────────────────────
      // ── Update ────────────────────────────────────────────────────────────────
      // ── Acknowledge ────────────────────────────────────────────────────────────
      // Refresh selected policy ackCount
      // ── Helpers ────────────────────────────────────────────────────────────────
      isAdmin
    ) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors">New Policy</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-5 flex flex-wrap items-center gap-3"><div class="flex items-center gap-1 flex-wrap"><!--[-->`);
    const each_array_1 = ensure_array_like([
      ["all", "All"],
      ["draft", "Draft"],
      ["published", "Published"],
      ["archived", "Archived"]
    ]);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let [val, label] = each_array_1[$$index_1];
      $$renderer2.push(`<button${attr_class(`px-3 py-1 rounded-full text-xs font-medium transition-colors ${stringify(statusFilter === val ? "bg-blue-600 text-white" : "bg-muted text-foreground/80 hover:bg-gray-200 dark:hover:bg-gray-600")}`)}>${escape_html(label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    $$renderer2.select(
      {
        value: categoryFilter,
        class: "rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All categories`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array_2 = ensure_array_like(CATEGORIES);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let cat = each_array_2[$$index_2];
          $$renderer3.option({ value: cat.value }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(cat.label)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</div> <div class="flex gap-6"><div class="flex-1 min-w-0">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array_3 = ensure_array_like([1, 2, 3, 4]);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        each_array_3[$$index_3];
        $$renderer2.push(`<div class="h-16 bg-muted rounded-lg animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B5gyqIHj.js.map
