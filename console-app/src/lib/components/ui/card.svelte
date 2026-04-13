<script lang="ts">
  import { cn } from "$lib/utils";

  type Variant = "default" | "elevated" | "ghost" | "outline";
  export let variant: Variant = "default";
  export let padding: "none" | "sm" | "md" | "lg" = "md";
  let className: string = "";
  export { className as class };

  const variants: Record<Variant, string> = {
    default: "bg-card border border-border shadow-xs",
    elevated: "bg-card border border-border shadow-md",
    ghost: "bg-transparent",
    outline: "bg-transparent border border-border",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-7",
  };

  $: classes = cn(
    "rounded-xl text-card-foreground",
    variants[variant],
    paddings[padding],
    className,
  );
</script>

<div class={classes} on:click on:keydown>
  <slot />
</div>
