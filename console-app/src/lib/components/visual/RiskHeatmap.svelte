<script lang="ts" context="module">
  export interface RiskPoint { id:string; title:string; severity:string; likelihood:number; impact:number; }
</script>
<script lang="ts">
  export let risks: RiskPoint[] = [];
  // Grid 1-5 for likelihood (x) and impact (y)
  const size = 44;
  function cellRisks(x:number, y:number){
    return risks.filter(r => r.likelihood === x && r.impact === y);
  }
  function sevColor(sev:string){
    if(sev === 'critical') return 'var(--color-critical)';
    if(sev === 'high') return 'var(--color-warning)';
    if(sev === 'medium') return 'var(--color-accent)';
    return 'var(--color-success)';
  }
</script>

<div class="heatmap-wrapper">
  <div class="axes-label y-label">Impact ↑</div>
  <div class="grid" role="table" aria-label="Risk heatmap likelihood by impact">
    {#each Array.from({ length:5 }, (_,i) => 5 - i) as impact}
      <div class="row" role="row">
        {#each [1,2,3,4,5] as likelihood}
          <div class="cell" style={`width:${size}px;height:${size}px;`} role="cell">
            {#each cellRisks(likelihood, impact) as r}
              <div class="dot" style={`background:${sevColor(r.severity)}`} title={`${r.title} (${r.severity})`} aria-label={`${r.title} severity ${r.severity}`}></div>
            {/each}
          </div>
        {/each}
      </div>
    {/each}
  </div>
  <div class="x-axis">Likelihood →</div>
</div>

<style>
.heatmap-wrapper { position:relative; padding:10px 10px 26px 32px; display:inline-block; background:var(--color-surface-alt); border:1px solid var(--color-border); border-radius:8px; }
.grid { display:flex; flex-direction:column; gap:4px; }
.row { display:flex; gap:4px; }
.cell { background:var(--color-surface); border:1px solid var(--color-border); border-radius:4px; position:relative; display:flex; align-items:center; justify-content:center; }
.dot { width:14px; height:14px; border-radius:50%; box-shadow:0 0 0 2px rgba(0,0,0,.25); }
.axes-label, .x-axis { font-size:11px; color:var(--color-text-dim); font-weight:500; }
.y-label { position:absolute; left:4px; top:8px; writing-mode:vertical-rl; transform:rotate(180deg); }
.x-axis { position:absolute; left:48px; bottom:6px; }
</style>
