import { af as fallback, aj as attr_class, ap as clsx, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Card_title($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<h3${attr_class(clsx(cn("text-2xl font-semibold leading-none tracking-tight", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></h3>`);
    bind_props($$props, { class: className });
  });
}

export { Card_title as C };
//# sourceMappingURL=card-title-CntIWcKQ.js.map
