<script lang="ts">
  import { diffLines } from "diff";

  export let oldContent: string;
  export let newContent: string;
  export let oldLabel = "Previous Version";
  export let newLabel = "Current Version";

  $: changes = diffLines(oldContent, newContent);
</script>

<div class="grid grid-cols-2 gap-4 text-xs">
  <div class="border border-border rounded-lg p-4 bg-card overflow-auto max-h-96">
    <h4 class="font-semibold mb-2 text-sm text-foreground">{oldLabel}</h4>
    <pre
      class="whitespace-pre-wrap font-mono text-muted-foreground">{#each changes as change}{#if !change.added}<span
            class:bg-red-50={change.removed}
            class:dark:bg-red-950={change.removed}
            class:line-through={change.removed}>{change.value}</span
          >{/if}{/each}</pre>
  </div>

  <div class="border border-border rounded-lg p-4 bg-card overflow-auto max-h-96">
    <h4 class="font-semibold mb-2 text-sm text-foreground">{newLabel}</h4>
    <pre
      class="whitespace-pre-wrap font-mono text-muted-foreground">{#each changes as change}{#if !change.removed}<span
            class:bg-green-50={change.added}
            class:dark:bg-green-950={change.added}
            class:font-semibold={change.added}>{change.value}</span
          >{/if}{/each}</pre>
  </div>
</div>
