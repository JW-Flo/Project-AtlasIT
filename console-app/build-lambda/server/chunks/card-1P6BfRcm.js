import { af as fallback, aj as attr_class, ap as clsx, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Card($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let classes;
    let variant = fallback($$props["variant"], "default");
    let padding = fallback($$props["padding"], "md");
    let className = fallback($$props["class"], "");
    const variants = {
      default: "bg-card border border-border shadow-xs",
      elevated: "bg-card border border-border shadow-md",
      ghost: "bg-transparent",
      outline: "bg-transparent border border-border"
    };
    const paddings = { none: "", sm: "p-3", md: "p-5", lg: "p-7" };
    classes = cn("rounded-xl text-card-foreground", variants[variant], paddings[padding], className);
    $$renderer2.push(`<div${attr_class(clsx(classes))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { variant, padding, class: className });
  });
}

export { Card as C };
//# sourceMappingURL=card-1P6BfRcm.js.map
