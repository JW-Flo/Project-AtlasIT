<script lang="ts">
  export let policies: Array<{
    id: string;
    name: string;
    status: string;
    updated: string;
  }> = [];
</script>

<section>
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-lg font-semibold">Policies</h2>
    <a
      href="/console/policies"
      class="text-xs bg-primary hover:bg-primary-hover px-2.5 py-1 rounded text-primary-foreground no-underline"
    >
      Generate New
    </a>
  </div>
  <div
    class="grid gap-3"
    style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))"
  >
    {#each policies as p}
      <div class="bg-card rounded-lg px-4 py-3 border border-border">
        <strong class="text-[13px] font-medium tracking-tight text-foreground">{p.name}</strong>
        <div class="text-[11px] mt-1">
          <span
            class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium {p.status === 'approved'
              ? 'bg-success-muted text-success'
              : p.status === 'draft'
                ? 'bg-warning-muted text-warning'
                : 'bg-destructive-muted text-destructive'}"
          >
            {p.status}
          </span>
        </div>
        <div class="text-[10px] text-muted-foreground mt-1">
          Updated: {new Date(p.updated).toLocaleDateString()}
        </div>
      </div>
    {/each}
  </div>
</section>
