import { af as fallback, al as attr, aj as attr_class, ap as clsx, ad as slot, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let classes;
    let variant = fallback($$props["variant"], "primary");
    let size = fallback($$props["size"], "md");
    let href = fallback($$props["href"], void 0);
    let target = fallback($$props["target"], void 0);
    let rel = fallback($$props["rel"], void 0);
    let disabled = fallback($$props["disabled"], false);
    let loading = fallback($$props["loading"], false);
    let type = fallback($$props["type"], "button");
    let fullWidth = fallback($$props["fullWidth"], false);
    let className = fallback($$props["class"], "");
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-hover/90 focus-visible:shadow-ring-primary",
      secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:border-border-strong",
      outline: "bg-transparent text-foreground border border-border hover:bg-accent hover:border-border-strong",
      ghost: "bg-transparent text-foreground hover:bg-accent",
      destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
      success: "bg-success text-success-foreground shadow-xs hover:bg-success/90",
      link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto"
    };
    const sizes = {
      xs: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
      sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-5 text-md gap-2.5",
      "icon-sm": "h-7 w-7 rounded-md",
      icon: "h-9 w-9",
      "icon-lg": "h-11 w-11"
    };
    classes = cn("inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium", "transition-all duration-fast ease-out-quart", "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed", "focus-visible:outline-none", fullWidth && "w-full", variants[variant], sizes[size], className);
    if (href) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<a${attr("href", href)}${attr("target", target)}${attr("rel", rel)}${attr_class(clsx(classes))}${attr("aria-disabled", disabled)}>`);
      if (loading) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3"></circle><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path></svg>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--></a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<button${attr("type", type)}${attr("disabled", disabled || loading, true)}${attr_class(clsx(classes))}>`);
      if (loading) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3"></circle><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path></svg>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--></button>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      variant,
      size,
      href,
      target,
      rel,
      disabled,
      loading,
      type,
      fullWidth,
      class: className
    });
  });
}

export { Button as B };
//# sourceMappingURL=button-BXPyX210.js.map
