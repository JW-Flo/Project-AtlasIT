<script lang="ts">
  import { cn } from "$lib/utils";
  import { TrendingUp, TrendingDown, Minus } from "lucide-svelte";

  export let label: string;
  export let value: string | number;
  export let hint: string | undefined = undefined;
  export let trend: { delta: number; suffix?: string } | undefined = undefined;
  export let intent: "default" | "success" | "warning" | "danger" = "default";
  export let icon: typeof import("lucide-svelte").Activity | undefined = undefined;
  let className: string = "";
  export { className as class };

  $: trendIcon = trend ? (trend.delta > 0 ? TrendingUp : trend.delta < 0 ? TrendingDown : Minus) : null;
  $: trendColor = trend
    ? trend.delta > 0
      ? "text-success"
      : trend.delta < 0
        ? "text-destructive"
        : "text-muted-foreground"
    : "";

  const intentRing: Record<typeof intent, string> = {
    default: "",
    success: "ring-1 ring-success/20",
    warning: "ring-1 ring-warning/20",
    danger: "ring-1 ring-destructive/20",
  };
  const iconBg: Record<typeof intent, string> = {
    default: "bg-primary-muted text-primary",
    success: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
    danger: "bg-destructive-muted text-destructive",
  };
</script>

<div
  class={cn(
    "bg-card border border-border rounded-xl p-5 shadow-xs",
    "transition-all duration-fast hover:shadow-sm hover:border-border-strong",
    intentRing[intent],
    className,
  )}
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {#if hint}
        <p class="mt-1 text-xs text-muted-foreground">{hint}</p>
      {/if}
    </div>
    {#if icon}
      <div class={cn("shrink-0 flex items-center justify-center w-9 h-9 rounded-lg", iconBg[intent])}>
        <svelte:component this={icon} class="w-4.5 h-4.5" strokeWidth={2} />
      </div>
    {/if}
  </div>
  {#if trend && trendIcon}
    <div class="mt-3 flex items-center gap-1 text-xs">
      <svelte:component this={trendIcon} class={cn("w-3 h-3", trendColor)} />
      <span class={cn("font-medium tabular-nums", trendColor)}>
        {trend.delta > 0 ? "+" : ""}{trend.delta}{trend.suffix ?? "%"}
      </span>
      <span class="text-muted-foreground">vs last period</span>
    </div>
  {/if}
</div>
