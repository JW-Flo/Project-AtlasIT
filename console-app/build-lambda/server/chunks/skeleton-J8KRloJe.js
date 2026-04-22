import { af as fallback, aj as attr_class, ap as clsx, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Skeleton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props["class"], "");
    $$renderer2.push(`<div${attr_class(clsx(cn("animate-pulse rounded-md bg-muted", className)))}></div>`);
    bind_props($$props, { class: className });
  });
}

export { Skeleton as S };
//# sourceMappingURL=skeleton-J8KRloJe.js.map
