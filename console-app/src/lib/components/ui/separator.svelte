<script lang="ts">
  import { cn } from "$lib/utils";
  export let orientation: "horizontal" | "vertical" = "horizontal";
  let className: string = "";
  export { className as class };
</script>

<div
  role="separator"
  class={cn(
    "shrink-0 bg-border",
    orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
    className,
  )}
></div>
