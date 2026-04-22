import { aw as sanitize_slots, af as fallback, aj as attr_class, ap as clsx, an as escape_html, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Empty_state($$renderer, $$props) {
  const $$slots = sanitize_slots($$props);
  $$renderer.component(($$renderer2) => {
    let title = $$props["title"];
    let description = fallback($$props["description"], void 0);
    let icon = fallback($$props["icon"], void 0);
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<div${attr_class(clsx(cn("flex flex-col items-center justify-center text-center px-6 py-14 sm:py-20", className)))}>`);
    if (icon) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary-muted mb-4">`);
      if (icon) {
        $$renderer2.push("<!--[-->");
        icon($$renderer2, { class: "w-6 h-6 text-primary", strokeWidth: 1.75 });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(`</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <h3 class="text-base font-semibold text-foreground">${escape_html(title)}</h3> `);
    if (description) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-1.5 text-sm text-muted-foreground max-w-md">${escape_html(description)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if ($$slots.action) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mt-5"><!--[-->`);
      slot($$renderer2, $$props, "action", {});
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { title, description, icon, class: className });
  });
}

export { Empty_state as E };
//# sourceMappingURL=empty-state-BGCoXdYN.js.map
