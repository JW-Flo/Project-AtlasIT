<script lang="ts">
  import { cn } from "$lib/utils";
  let className: string = "";
  export { className as class };
</script>

<div class={cn("", className)}>
  <slot />
</div>
