import { ab as store_get, ae as unsubscribe_stores, an as escape_html, ao as ensure_array_like, af as fallback, al as attr, aj as attr_class, ap as clsx, am as attr_style, ak as stringify, ag as bind_props } from './renderer-CwxN8JkH.js';
import { p as page } from './stores-emli2svW.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { S as Skeleton } from './skeleton-J8KRloJe.js';
import { c as cn } from './utils2-BgZmMgq3.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';

function Progress($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let percentage;
    let value = fallback($$props["value"], 0);
    let max = fallback($$props["max"], 100);
    let className = fallback($$props["class"], "");
    let indicatorClass = fallback($$props["indicatorClass"], "");
    percentage = Math.min(Math.max(value / max * 100, 0), 100);
    $$renderer2.push(`<div role="progressbar"${attr("aria-valuenow", value)}${attr("aria-valuemin", 0)}${attr("aria-valuemax", max)}${attr_class(clsx(cn("relative h-3 w-full overflow-hidden rounded-full bg-secondary", className)))}><div${attr_class(clsx(cn("h-full rounded-full bg-primary transition-all duration-500", indicatorClass)))}${attr_style(`width: ${stringify(percentage)}%`)}></div></div>`);
    bind_props($$props, { value, max, class: className, indicatorClass });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let pendingCount, reviewedCount, progressPercent;
    let items = [];
    let campaignName = "Access Review Campaign";
    let campaignStatus = "active";
    function statusVariant(status) {
      return "warning";
    }
    store_get($$store_subs ??= {}, "$page", page).params.id;
    pendingCount = items.filter((item) => item.status === "pending").length;
    reviewedCount = items.length - pendingCount;
    progressPercent = items.length === 0 ? 0 : Math.round(reviewedCount / items.length * 100);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="space-y-6"><div class="flex items-center justify-between gap-4"><div><h1 class="text-2xl font-semibold tracking-tight">${escape_html(campaignName)}</h1> <p class="text-sm text-muted-foreground">Review each user-to-app entitlement and approve or revoke access.</p></div> `);
      Badge($$renderer3, {
        variant: statusVariant(),
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->${escape_html(campaignStatus)}`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></div> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "py-5 space-y-3",
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">Review progress</span> <span class="font-medium">${escape_html(reviewedCount)}/${escape_html(items.length)} reviewed (${escape_html(progressPercent)}%)</span></div> `);
              Progress($$renderer5, { value: progressPercent, max: 100 });
              $$renderer5.push(`<!----> <div class="text-xs text-muted-foreground">${escape_html(pendingCount)} pending decisions</div>`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="space-y-3"><!--[-->`);
        const each_array = ensure_array_like([1, 2, 3]);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          each_array[$$index];
          Skeleton($$renderer3, { class: "h-14 rounded-lg" });
        }
        $$renderer3.push(`<!--]--></div>`);
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
//# sourceMappingURL=_page.svelte-h6HOclZS.js.map
