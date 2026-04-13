<script lang="ts">
  import { cn } from "$lib/utils";

  type Variant =
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "info"
    | "muted";
  type Size = "sm" | "md";

  export let variant: Variant = "default";
  export let size: Size = "sm";
  export let dot: boolean = false;
  let className: string = "";
  export { className as class };

  const variants: Record<Variant, string> = {
    default: "bg-primary-muted text-primary",
    secondary: "bg-secondary text-secondary-foreground border border-border",
    outline: "border border-border text-foreground",
    success: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
    destructive: "bg-destructive-muted text-destructive",
    info: "bg-info-muted text-info",
    muted: "bg-muted text-muted-foreground",
  };

  const dotColors: Record<Variant, string> = {
    default: "bg-primary",
    secondary: "bg-foreground",
    outline: "bg-foreground",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    info: "bg-info",
    muted: "bg-muted-foreground",
  };

  const sizes: Record<Size, string> = {
    sm: "text-2xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };
</script>

<span
  class={cn(
    "inline-flex items-center rounded-full font-medium leading-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    className,
  )}
>
  {#if dot}
    <span class={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} aria-hidden="true"></span>
  {/if}
  <slot />
</span>
