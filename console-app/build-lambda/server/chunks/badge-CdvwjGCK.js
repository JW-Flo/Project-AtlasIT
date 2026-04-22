import { af as fallback, aj as attr_class, ap as clsx, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Badge($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let variant = fallback($$props["variant"], "default");
    let size = fallback($$props["size"], "sm");
    let dot = fallback($$props["dot"], false);
    let className = fallback($$props["class"], "");
    const variants = {
      default: "bg-primary-muted text-primary",
      secondary: "bg-secondary text-secondary-foreground border border-border",
      outline: "border border-border text-foreground",
      success: "bg-success-muted text-success",
      warning: "bg-warning-muted text-warning",
      destructive: "bg-destructive-muted text-destructive",
      info: "bg-info-muted text-info",
      muted: "bg-muted text-muted-foreground"
    };
    const dotColors = {
      default: "bg-primary",
      secondary: "bg-foreground",
      outline: "bg-foreground",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      info: "bg-info",
      muted: "bg-muted-foreground"
    };
    const sizes = {
      sm: "text-2xs px-2 py-0.5 gap-1",
      md: "text-xs px-2.5 py-1 gap-1.5"
    };
    $$renderer2.push(`<span${attr_class(clsx(cn("inline-flex items-center rounded-full font-medium leading-none whitespace-nowrap", variants[variant], sizes[size], className)))}>`);
    if (dot) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span${attr_class(clsx(cn("w-1.5 h-1.5 rounded-full", dotColors[variant])))} aria-hidden="true"></span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></span>`);
    bind_props($$props, { variant, size, dot, class: className });
  });
}

export { Badge as B };
//# sourceMappingURL=badge-CdvwjGCK.js.map
