<script lang="ts">
  import { cn } from "$lib/utils";
  let className: string = "";
  export { className as class };
</script>

<h2 class={cn("text-lg font-semibold leading-none tracking-tight", className)}>
  <slot />
</h2>
