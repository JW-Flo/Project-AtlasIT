<script lang="ts">
  import { cn } from "$lib/utils";

  export let active: boolean = false;
  let className: string = "";
  export { className as class };
</script>

<button
  type="button"
  class={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
    className,
  )}
  on:click
>
  <slot />
</button>
