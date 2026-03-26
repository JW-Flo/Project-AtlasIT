<script lang="ts">
  import { cn } from "$lib/utils";
  export let value: number = 0;
  export let max: number = 100;
  let className: string = "";
  export { className as class };
  export let indicatorClass: string = "";

  $: percentage = Math.min(Math.max((value / max) * 100, 0), 100);
</script>

<div
  role="progressbar"
  aria-valuenow={value}
  aria-valuemin={0}
  aria-valuemax={max}
  class={cn("relative h-3 w-full overflow-hidden rounded-full bg-secondary", className)}
>
  <div
    class={cn("h-full rounded-full bg-primary transition-all duration-500", indicatorClass)}
    style="width: {percentage}%"
  ></div>
</div>
