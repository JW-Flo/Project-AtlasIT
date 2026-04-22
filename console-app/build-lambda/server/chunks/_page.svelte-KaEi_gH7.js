import { ac as head, ao as ensure_array_like } from './renderer-CwxN8JkH.js';
import { B as Button } from './button-BXPyX210.js';
import { P as Page_header } from './page-header-BaRCucb6.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import { P as Plus } from './plus-DyzDQ7SN.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let integrations = [];
    integrations.filter((i) => i.status === "active").length;
    integrations.filter((i) => i.status === "inactive" || i.status === "disabled").length;
    head("ph29p7", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Connected Apps · AtlasIT</title>`);
      });
    });
    $$renderer2.push(`<div class="animate-fade-in">`);
    Page_header($$renderer2, {
      title: "Connected Apps",
      description: "Manage integrations that feed your compliance evidence pipeline",
      $$slots: {
        actions: ($$renderer3) => {
          {
            Button($$renderer3, {
              variant: "primary",
              size: "sm",
              href: "/console/marketplace",
              children: ($$renderer4) => {
                Plus($$renderer4, { class: "h-3.5 w-3.5", strokeWidth: 2.25 });
                $$renderer4.push(`<!----> Connect app`);
              },
              $$slots: { default: true }
            });
          }
        }
      }
    });
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"><!--[-->`);
      const each_array = ensure_array_like(Array(3));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-24 skeleton rounded-xl"></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="h-64 skeleton rounded-xl"></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-KaEi_gH7.js.map
