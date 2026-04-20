<script lang="ts">
  export let versions: Array<{ version: string; createdAt: string }>;
  export let selected: string;
  export let onSelect: (version: string) => void;
</script>

<div class="flex items-center gap-2">
  <label for="version-select" class="text-sm font-medium text-muted-foreground">
    Compare version:
  </label>
  <select
    id="version-select"
    bind:value={selected}
    on:change={() => onSelect(selected)}
    class="px-3 py-1.5 text-sm border border-input rounded-md bg-background text-foreground"
  >
    {#each versions as v}
      <option value={v.version}>
        v{v.version} ({new Date(v.createdAt).toLocaleDateString()})
      </option>
    {/each}
  </select>
</div>
