import { aw as sanitize_slots, af as fallback, aj as attr_class, ap as clsx, an as escape_html, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Page_header($$renderer, $$props) {
  const $$slots = sanitize_slots($$props);
  $$renderer.component(($$renderer2) => {
    let title = $$props["title"];
    let description = fallback($$props["description"], void 0);
    let eyebrow = fallback($$props["eyebrow"], void 0);
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<header${attr_class(clsx(cn("mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4", className)))}><div class="min-w-0 flex-1">`);
    if (eyebrow) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">${escape_html(eyebrow)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <h1 class="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">${escape_html(title)}</h1> `);
    if (description) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1.5 text-sm text-muted-foreground max-w-2xl">${escape_html(description)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if ($$slots.actions) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center gap-2 shrink-0"><!--[-->`);
      slot($$renderer2, $$props, "actions", {});
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></header>`);
    bind_props($$props, { title, description, eyebrow, class: className });
  });
}

export { Page_header as P };
//# sourceMappingURL=page-header-BaRCucb6.js.map
