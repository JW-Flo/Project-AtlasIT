<script lang="ts">
  import { cn } from "$lib/utils";
  export let htmlFor: string = "";
  let className: string = "";
  export { className as class };
</script>

<label
  for={htmlFor}
  class={cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className,
  )}
>
  <slot />
</label>
