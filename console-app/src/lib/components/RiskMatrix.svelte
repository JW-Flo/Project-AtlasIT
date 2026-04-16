<script lang="ts">
  export let risks: Array<{ id: string; title: string; severity: string; likelihood: number; impact: number; owner?: string }>=[];
  const sevClass = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-warning/70 text-warning-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };
</script>
<section>
  <h2 class="text-lg font-semibold mb-3">Risk Matrix</h2>
  <div class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
    {#each risks as r}
      <div class="bg-card rounded-lg px-3 py-3 border border-border">
        <div class="flex items-center justify-between">
          <strong class="text-[13px] font-medium tracking-tight text-foreground">{r.title}</strong>
          <span class={`text-[10px] px-2 py-0.5 rounded-full capitalize ${sevClass(r.severity)}`}>{r.severity}</span>
        </div>
        <div class="text-[11px] text-muted-foreground mt-1.5">L:{r.likelihood} / I:{r.impact}</div>
        {#if r.owner}<div class="text-[11px] mt-1 text-muted-foreground">Owner: {r.owner}</div>{/if}
      </div>
    {/each}
  </div>
</section>
