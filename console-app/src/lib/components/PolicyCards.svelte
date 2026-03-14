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
      class="text-xs bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded text-white no-underline"
    >
      Generate New
    </a>
  </div>
  <div
    class="grid gap-3"
    style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))"
  >
    {#each policies as p}
      <div class="bg-[#202a36] rounded-lg px-4 py-3">
        <strong class="text-[13px] font-medium tracking-tight">{p.name}</strong>
        <div class="text-[11px] mt-1">
          <span
            class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium {p.status === 'approved'
              ? 'bg-green-600/20 text-green-300'
              : p.status === 'draft'
                ? 'bg-yellow-600/20 text-yellow-300'
                : 'bg-red-600/20 text-red-300'}"
          >
            {p.status}
          </span>
        </div>
        <div class="text-[10px] text-white/40 mt-1">
          Updated: {new Date(p.updated).toLocaleDateString()}
        </div>
      </div>
    {/each}
  </div>
</section>
