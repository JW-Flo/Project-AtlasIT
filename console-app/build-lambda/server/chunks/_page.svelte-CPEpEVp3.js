import { ak as stringify, an as escape_html } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Button } from './button-BXPyX210.js';
import { R as Refresh_cw } from './refresh-cw-Bn83BloP.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = true;
    $$renderer2.push(`<div class="space-y-6"><div class="flex justify-between items-center"><div><h1 class="text-2xl font-semibold tracking-tight">Platform Status</h1> <p class="text-sm text-muted-foreground">Service health and usage metrics</p></div> `);
    Button($$renderer2, {
      variant: "outline",
      size: "sm",
      disabled: loading,
      children: ($$renderer3) => {
        Refresh_cw($$renderer3, {
          class: `h-4 w-4 mr-1.5 ${stringify("animate-spin")}`
        });
        $$renderer3.push(`<!----> ${escape_html("Refreshing...")}`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <section><h2 class="text-lg font-semibold mb-4">Service Health</h2> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section> <section><h2 class="text-lg font-semibold mb-4">Usage Summary</h2> `);
    {
      $$renderer2.push("<!--[-1-->");
      Card($$renderer2, {
        children: ($$renderer3) => {
          Card_content($$renderer3, {
            class: "py-4",
            children: ($$renderer4) => {
              $$renderer4.push(`<p class="text-sm text-muted-foreground">Usage data unavailable (configuration required)</p>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
    }
    $$renderer2.push(`<!--]--></section> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CPEpEVp3.js.map
