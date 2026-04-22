import { ac as head, ao as ensure_array_like } from './renderer-CwxN8JkH.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './toastStore-X6rW096m.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1oc4mga", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Compliance Insights | AtlasIT</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6"><div><h1 class="text-2xl font-bold tracking-tight">Compliance Intelligence</h1> <p class="text-muted-foreground">Proactive gap analysis, drift detection, and risk anomaly monitoring</p></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 md:grid-cols-4 gap-4"><!--[-->`);
      const each_array = ensure_array_like(Array(4));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        Card($$renderer2, {
          children: ($$renderer3) => {
            Card_content($$renderer3, {
              class: "p-4",
              children: ($$renderer4) => {
                Skeleton($$renderer4, { class: "h-16 w-full" });
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
//# sourceMappingURL=_page.svelte-ZyKZyFIw.js.map
