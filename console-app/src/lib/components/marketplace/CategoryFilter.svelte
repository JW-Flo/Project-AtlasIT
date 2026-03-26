<script lang="ts">
  export let categories: string[] = [];
  export let active: string = "all";
  export let onChange: ((category: string) => void) | undefined = undefined;

  function handleClick(cat: string) {
    active = cat;
    onChange?.(cat);
  }
</script>

<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
  <button
    type="button"
    class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap"
    style="background: {active === 'all'
      ? 'var(--color-accent)'
      : 'var(--color-surface)'}; color: {active === 'all'
      ? '#fff'
      : 'var(--color-text-dim)'};"
    on:click={() => handleClick("all")}
  >
    All
  </button>
  {#each categories as cat}
    <button
      type="button"
      class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize whitespace-nowrap"
      style="background: {active === cat
        ? 'var(--color-accent)'
        : 'var(--color-surface)'}; color: {active === cat
        ? '#fff'
        : 'var(--color-text-dim)'};"
      on:click={() => handleClick(cat)}
    >
      {cat}
    </button>
  {/each}
</div>
