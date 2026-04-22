import { af as fallback, aj as attr_class, ap as clsx, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Card_header($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<div${attr_class(clsx(cn("flex flex-col space-y-1.5 p-6", className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { class: className });
  });
}

export { Card_header as C };
//# sourceMappingURL=card-header-DkXf0dG2.js.map
