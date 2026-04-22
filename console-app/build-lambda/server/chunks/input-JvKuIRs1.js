import { af as fallback, al as attr, aj as attr_class, ap as clsx, ag as bind_props } from './renderer-CwxN8JkH.js';
import { c as cn } from './utils2-BgZmMgq3.js';

function Input($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let value = fallback($$props["value"], "");
    let type = fallback($$props["type"], "text");
    let placeholder = fallback($$props["placeholder"], "");
    let disabled = fallback($$props["disabled"], false);
    let readonly = fallback($$props["readonly"], false);
    let required = fallback($$props["required"], false);
    let id = fallback($$props["id"], "");
    let name = fallback($$props["name"], "");
    let autocomplete = fallback($$props["autocomplete"], void 0);
    let inputmode = fallback($$props["inputmode"], void 0);
    let min = fallback($$props["min"], void 0);
    let max = fallback($$props["max"], void 0);
    let step = fallback($$props["step"], void 0);
    let invalid = fallback($$props["invalid"], false);
    let size = fallback($$props["size"], "md");
    let className = fallback($$props["class"], "");
    const sizes = {
      sm: "h-8 px-2.5 text-xs rounded-md",
      md: "h-9 px-3 text-sm",
      lg: "h-11 px-4 text-base"
    };
    $$renderer2.push(`<input${attr("id", id)}${attr("name", name)}${attr("type", type)}${attr("placeholder", placeholder)}${attr("disabled", disabled, true)}${attr("readonly", readonly, true)}${attr("required", required, true)}${attr("autocomplete", autocomplete)}${attr("inputmode", inputmode)}${attr("min", min)}${attr("max", max)}${attr("step", step)}${attr("value", value)}${attr("aria-invalid", invalid || void 0)}${attr_class(clsx(cn(
      "flex w-full rounded-lg border bg-background text-foreground",
      "transition-colors duration-fast",
      "placeholder:text-muted-foreground/70",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground file:mr-3",
      "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-ring-primary focus-visible:text-foreground",
      "focus:text-foreground dark:focus:text-white",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
      "read-only:bg-muted read-only:cursor-not-allowed",
      invalid ? "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_3px_hsl(var(--destructive)/0.18)]" : "border-input",
      sizes[size],
      className
    )))}/>`);
    bind_props($$props, {
      value,
      type,
      placeholder,
      disabled,
      readonly,
      required,
      id,
      name,
      autocomplete,
      inputmode,
      min,
      max,
      step,
      invalid,
      size,
      class: className
    });
  });
}

export { Input as I };
//# sourceMappingURL=input-JvKuIRs1.js.map
