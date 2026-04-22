import './toastStore-X6rW096m.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import './index-C1X1AO8K.js';
import './renderer-CwxN8JkH.js';
import './utils2-BgZmMgq3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<div class="animate-fade-in"><div class="mb-6"><h1 class="text-3xl font-bold text-foreground">Interface Preferences</h1> <p class="mt-1 text-sm text-muted-foreground">Customize how the platform displays information and guidance.</p></div> `);
    {
      $$renderer2.push("<!--[0-->");
      Card($$renderer2, {
        children: ($$renderer3) => {
          Card_content($$renderer3, {
            class: "py-6",
            children: ($$renderer4) => {
              Skeleton($$renderer4, { class: "h-8 w-3/4 mb-4" });
              $$renderer4.push(`<!----> `);
              Skeleton($$renderer4, { class: "h-4 w-full mb-2" });
              $$renderer4.push(`<!----> `);
              Skeleton($$renderer4, { class: "h-4 w-5/6" });
              $$renderer4.push(`<!---->`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Mhu0heIA.js.map
