import { ao as ensure_array_like, ak as stringify } from './renderer-CwxN8JkH.js';
import './toastStore-X6rW096m.js';
import { c as categories } from './integrations-C0eSUhV4.js';
import { B as Button } from './button-BXPyX210.js';
import { D as Dialog } from './dialog-Cs6T-I4e.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { P as Plus } from './plus-DyzDQ7SN.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';
import './index-server-C1ubzO3x.js';
import './x-BmTrGS3K.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let apps = [];
    let editOpen = false;
    categories.filter((c) => c.id !== "all").map((c) => ({ ...c, apps: apps.filter((a) => a.category === c.id) })).filter((c) => c.apps.length > 0);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold tracking-tight">API Manager</h1> <p class="text-sm text-muted-foreground">Manage credentials and connection health for your connected apps</p></div> <a href="/console/marketplace">`);
      Button($$renderer3, {
        children: ($$renderer4) => {
          Plus($$renderer4, { class: "h-4 w-4 mr-1.5" });
          $$renderer4.push(`<!----> Add App`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></a></div> `);
      {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="space-y-4"><!--[-->`);
        const each_array = ensure_array_like([1, 2, 3]);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          each_array[$$index];
          Skeleton($$renderer3, { class: "h-20 rounded-lg" });
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></div> `);
      Dialog($$renderer3, {
        open: editOpen,
        onClose: () => editOpen = false,
        title: `${stringify("")} -- Credentials`,
        children: ($$renderer4) => {
          {
            $$renderer4.push("<!--[-1-->");
          }
          $$renderer4.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CEZu_LV0.js.map
