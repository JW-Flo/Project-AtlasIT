<script lang="ts">
  export let frameworks: Array<{ framework: string; coveragePercent: number; passing: number; total: number }> = [];
</script>
<div class="flex flex-wrap gap-3">
  {#each frameworks as f}
    <div class="bg-card rounded-lg px-4 py-3 flex-1 basis-[220px] min-w-[220px] border border-border">
      <strong class="text-sm tracking-tight text-foreground">{f.framework}</strong>
      <div class="text-[11px] text-muted-foreground mt-1 mb-2">{f.coveragePercent.toFixed(1)}% coverage</div>
      <div class="h-1.5 bg-muted rounded overflow-hidden">
        <div class="h-full bg-primary" style={`width:${f.coveragePercent.toFixed(1)}%`}></div>
      </div>
      <div class="text-[10px] text-muted-foreground mt-2">{f.passing}/{f.total} controls passing</div>
    </div>
  {/each}
</div>
