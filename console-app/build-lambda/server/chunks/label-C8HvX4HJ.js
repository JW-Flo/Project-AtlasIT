import { af as fallback, al as attr, aj as attr_class, ap as clsx, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Label($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let htmlFor = fallback($$props["htmlFor"], "");
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<label${attr("for", htmlFor)}${attr_class(clsx(cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></label>`);
    bind_props($$props, { htmlFor, class: className });
  });
}

export { Label as L };
//# sourceMappingURL=label-C8HvX4HJ.js.map
