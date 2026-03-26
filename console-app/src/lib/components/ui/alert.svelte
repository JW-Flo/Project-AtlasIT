<script lang="ts">
  import { cn } from "$lib/utils";

  type Variant = "default" | "destructive" | "success" | "warning";

  export let variant: Variant = "default";
  let className: string = "";
  export { className as class };

  const variantClasses: Record<Variant, string> = {
    default: "bg-background text-foreground",
    destructive: "border-destructive/50 text-destructive [&>svg]:text-destructive",
    success: "border-success/50 text-success bg-success/5 [&>svg]:text-success",
    warning: "border-warning/50 text-warning bg-warning/5 [&>svg]:text-warning",
  };
</script>

<div
  role="alert"
  class={cn(
    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    variantClasses[variant],
    className,
  )}
>
  <slot />
</div>
