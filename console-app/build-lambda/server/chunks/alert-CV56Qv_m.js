import { af as fallback, aj as attr_class, ap as clsx, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Alert($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let variant = fallback($$props["variant"], "default");
    let className = fallback($$props["class"], "");
    const variantClasses = {
      default: "bg-background text-foreground",
      destructive: "border-destructive/50 text-destructive [&>svg]:text-destructive",
      success: "border-success/50 text-success bg-success/5 [&>svg]:text-success",
      warning: "border-warning/50 text-warning bg-warning/5 [&>svg]:text-warning"
    };
    $$renderer2.push(`<div role="alert"${attr_class(clsx(cn("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", variantClasses[variant], className)))}><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { variant, class: className });
  });
}

export { Alert as A };
//# sourceMappingURL=alert-CV56Qv_m.js.map
