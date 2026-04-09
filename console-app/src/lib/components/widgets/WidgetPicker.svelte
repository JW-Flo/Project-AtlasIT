<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { WIDGET_REGISTRY, type WidgetId } from "./index";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import { Plus, X } from "lucide-svelte";

  export let open = false;
  /** Currently active widget IDs. */
  export let activeWidgets: WidgetId[] = [];

  const dispatch = createEventDispatcher<{ change: WidgetId[] }>();

  let selected: Set<WidgetId> = new Set();

  $: if (open) {
    selected = new Set(activeWidgets);
  }

  const entries = Object.entries(WIDGET_REGISTRY) as [WidgetId, (typeof WIDGET_REGISTRY)[WidgetId]][];
  const categories = [...new Set(entries.map(([, v]) => v.category))];

  function toggle(id: WidgetId) {
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    selected = new Set(selected);
  }

  function apply() {
    // Preserve order of existing widgets, append new ones
    const ordered: WidgetId[] = [];
    for (const id of activeWidgets) {
      if (selected.has(id)) ordered.push(id);
    }
    for (const id of selected) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    dispatch("change", ordered);
    open = false;
  }
</script>

<Dialog bind:open title="Customize Widgets">
  <div class="space-y-4 max-h-[60vh] overflow-y-auto">
    {#each categories as cat}
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</h3>
        <div class="space-y-1">
          {#each entries.filter(([, v]) => v.category === cat) as [id, meta]}
            <button
              class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50
                {selected.has(id) ? 'border-primary/40 bg-primary/5' : 'border-border'}"
              on:click={() => toggle(id)}
            >
              <span class="font-medium">{meta.title}</span>
              <div class="flex items-center gap-2">
                <Badge variant="secondary" class="text-[10px]">{meta.defaultSize}</Badge>
                {#if selected.has(id)}
                  <X class="h-3.5 w-3.5 text-muted-foreground" />
                {:else}
                  <Plus class="h-3.5 w-3.5 text-muted-foreground" />
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-4 flex items-center justify-between border-t pt-4">
    <span class="text-xs text-muted-foreground">{selected.size} widgets selected</span>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" on:click={() => (open = false)}>Cancel</Button>
      <Button size="sm" on:click={apply}>Apply</Button>
    </div>
  </div>
</Dialog>
