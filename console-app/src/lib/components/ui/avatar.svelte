<script lang="ts">
  import { cn } from "$lib/utils";
  export let initials: string = "?";
  export let size: "sm" | "md" | "lg" = "md";
  let className: string = "";
  export { className as class };

  const sizeClasses: Record<string, string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };
</script>

<div class={cn(
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground font-semibold",
  sizeClasses[size],
  className,
)}>
  {initials}
</div>
