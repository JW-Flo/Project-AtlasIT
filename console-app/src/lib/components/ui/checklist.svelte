<script lang="ts">
  export let items: Array<{
    id: string;
    label: string;
    completed: boolean;
    href?: string;
  }>;
</script>

<ul class="space-y-2">
  {#each items as item}
    <li class="flex items-start gap-3">
      <input
        type="checkbox"
        checked={item.completed}
        disabled
        class="mt-1 rounded border-input"
        aria-label={item.label}
      />
      {#if item.href}
        <a href={item.href} class="text-sm text-foreground hover:underline">
          {item.label}
        </a>
      {:else}
        <span class="text-sm text-foreground">{item.label}</span>
      {/if}
    </li>
  {/each}
</ul>
