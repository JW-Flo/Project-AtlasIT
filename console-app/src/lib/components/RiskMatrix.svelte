<script lang="ts">
  export let risks: Array<{ id: string; title: string; severity: string; likelihood: number; impact: number; owner?: string }>=[];
  const sevClass = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-400 text-black';
      default: return 'bg-green-600';
    }
  };
</script>
<section>
  <h2 class="text-lg font-semibold mb-3">Risk Matrix</h2>
  <div class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
    {#each risks as r}
      <div class="bg-[#1e2733] rounded-lg px-3 py-3">
        <div class="flex items-center justify-between">
          <strong class="text-[13px] font-medium tracking-tight">{r.title}</strong>
          <span class={`text-[10px] px-2 py-0.5 rounded-full capitalize text-white ${sevClass(r.severity)}`}>{r.severity}</span>
        </div>
        <div class="text-[11px] text-white/70 mt-1.5">L:{r.likelihood} / I:{r.impact}</div>
        {#if r.owner}<div class="text-[11px] mt-1 text-white/80">Owner: {r.owner}</div>{/if}
      </div>
    {/each}
  </div>
</section>
