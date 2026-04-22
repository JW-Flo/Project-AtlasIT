import { ao as ensure_array_like, an as escape_html } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { R as Refresh_cw } from './refresh-cw-Bn83BloP.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let total = 0;
    let filterAction = "";
    let evidenceSummary = { totalEvidence: 0, controlsCovered: 0 };
    $$renderer2.push(`<div class="space-y-6"><div class="flex items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">JML Changelog</h1> <p class="text-sm text-muted-foreground">Joiners, movers, and leavers with linked compliance evidence.</p></div> `);
    Button($$renderer2, {
      variant: "secondary",
      size: "sm",
      children: ($$renderer3) => {
        Refresh_cw($$renderer3, { class: "h-3.5 w-3.5 mr-1.5" });
        $$renderer3.push(`<!----> Refresh`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div> `);
    Card($$renderer2, {
      class: "border-primary/20 bg-primary/5",
      children: ($$renderer3) => {
        Card_content($$renderer3, {
          class: "pt-5",
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="text-sm text-muted-foreground">Evidence Pipeline (7 days)</div> <div class="text-lg font-semibold mt-1">${escape_html(total)} lifecycle events generated ${escape_html(evidenceSummary.totalEvidence)} evidence items across ${escape_html(evidenceSummary.controlsCovered)} controls this week</div>`);
          },
          $$slots: { default: true }
        });
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> <div class="flex gap-2"><!--[-->`);
    const each_array = ensure_array_like([
      { value: "", label: "All" },
      { value: "joiner", label: "Joiner" },
      { value: "mover", label: "Mover" },
      { value: "leaver", label: "Leaver" }
    ]);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let opt = each_array[$$index];
      Button($$renderer2, {
        variant: filterAction === opt.value ? "default" : "outline",
        size: "sm",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->${escape_html(opt.label)}`);
        },
        $$slots: { default: true }
      });
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array_1 = ensure_array_like([1, 2, 3, 4, 5]);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        each_array_1[$$index_1];
        Skeleton($$renderer2, { class: "h-14 rounded-lg" });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CKJdnW3k.js.map
