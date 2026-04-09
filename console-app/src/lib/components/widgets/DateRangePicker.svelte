<script lang="ts">
  import { dashboardContext, setDateRange, type DateRangePreset } from "$lib/stores/dashboard-context";
  import { Calendar } from "lucide-svelte";

  const ranges: { value: DateRangePreset; label: string }[] = [
    { value: "7", label: "7 days" },
    { value: "30", label: "30 days" },
    { value: "90", label: "90 days" },
    { value: "365", label: "12 months" },
  ];
</script>

<div class="flex items-center gap-1 rounded-md border border-border bg-background p-1">
  <Calendar class="ml-1 h-4 w-4 text-muted-foreground" />
  {#each ranges as range}
    <button
      class="rounded px-3 py-1 text-xs font-medium transition-colors
        {$dashboardContext.dateRange === range.value
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
      on:click={() => setDateRange(range.value)}
    >
      {range.label}
    </button>
  {/each}
</div>
