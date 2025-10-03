<script lang="ts">
  export let policies: Array<{
    id: string;
    name: string;
    status: string;
    updated: string;
  }> = [];
</script>

<section>
  <h2 class="text-lg font-semibold mb-3">Policies</h2>
  <div
    class="grid gap-3"
    style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))"
  >
    {#each policies as p}
      <div class="bg-[#202a36] rounded-lg px-4 py-3">
        <strong class="text-[13px] font-medium tracking-tight">{p.name}</strong>
        <div class="text-[11px] text-white/60 mt-1">Status: {p.status}</div>
        <div class="text-[10px] text-white/40 mt-1">
          Updated: {new Date(p.updated).toLocaleDateString()}
        </div>
      </div>
    {/each}
  </div>
</section>
