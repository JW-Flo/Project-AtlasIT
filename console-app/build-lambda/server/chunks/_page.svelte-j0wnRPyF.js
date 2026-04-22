import { ao as ensure_array_like, aj as attr_class, ak as stringify, an as escape_html } from './renderer-CwxN8JkH.js';
import './toastStore-X6rW096m.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { C as Calendar } from './calendar-5wZWtuQ3.js';
import { D as Download } from './download-BKS59Bcj.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let dateRange = "30";
    let exporting = false;
    $$renderer2.push(`<div class="flex flex-col gap-6 p-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 class="text-2xl font-bold text-foreground">Analytics &amp; Reporting</h1> <p class="text-sm text-muted-foreground mt-1">Compliance posture, automation performance, and security trends</p></div> <div class="flex items-center gap-2"><div class="flex items-center gap-1 rounded-md border border-border bg-background p-1">`);
    Calendar($$renderer2, { class: "ml-1 h-4 w-4 text-muted-foreground" });
    $$renderer2.push(`<!----> <!--[-->`);
    const each_array = ensure_array_like([
      { value: "7", label: "7 days" },
      { value: "30", label: "30 days" },
      { value: "90", label: "90 days" },
      { value: "365", label: "12 months" }
    ]);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let range = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`rounded px-3 py-1 text-xs font-medium transition-colors ${stringify(dateRange === range.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}`)}>${escape_html(range.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    Button($$renderer2, {
      variant: "outline",
      size: "sm",
      disabled: exporting,
      children: ($$renderer3) => {
        Download($$renderer3, { class: "mr-2 h-4 w-4" });
        $$renderer3.push(`<!----> ${escape_html("Download Report")}`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><!--[-->`);
      const each_array_1 = ensure_array_like([0, 1, 2, 3]);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        each_array_1[$$index_1];
        Card($$renderer2, {
          children: ($$renderer3) => {
            Card_content($$renderer3, {
              class: "p-6",
              children: ($$renderer4) => {
                Skeleton($$renderer4, { class: "h-4 w-32 mb-2" });
                $$renderer4.push(`<!----> `);
                Skeleton($$renderer4, { class: "h-8 w-20 mb-1" });
                $$renderer4.push(`<!----> `);
                Skeleton($$renderer4, { class: "h-3 w-24" });
                $$renderer4.push(`<!---->`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-j0wnRPyF.js.map
