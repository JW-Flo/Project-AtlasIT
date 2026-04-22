import { ab as store_get, ae as unsubscribe_stores } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import './toastStore-X6rW096m.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { A as Arrow_left } from './arrow-left-26Np_Hiw.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import './index-C1X1AO8K.js';
import './utils2-BgZmMgq3.js';
import './Icon-DQFqITWq.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let groups = [];
    let allGroups = [];
    store_get($$store_subs ??= {}, "$page", page).params.id;
    allGroups.filter((g) => !groups.some((m) => m.id === g.id));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><a href="/console/directory" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">`);
      Arrow_left($$renderer3, { class: "h-4 w-4" });
      $$renderer3.push(`<!----> Back to Directory</a> `);
      {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="space-y-4">`);
        Skeleton($$renderer3, { class: "h-8 w-64" });
        $$renderer3.push(`<!----> `);
        Skeleton($$renderer3, { class: "h-64 w-full rounded-lg" });
        $$renderer3.push(`<!----></div>`);
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-f51Xr8cE.js.map
