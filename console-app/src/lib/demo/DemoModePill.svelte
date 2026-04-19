<script lang="ts">
  import { onDestroy } from "svelte";
  import { tourState, startTour, skipTour, type TourState } from "./tour-store";
  import { TOUR_STEPS } from "./tour-steps";
  import { exitDemo } from "./state";
  import { Play, X, LogOut } from "lucide-svelte";

  let state: TourState = { active: false, currentStep: 0, completed: false };
  const unsub = tourState.subscribe((s) => (state = s));
  onDestroy(unsub);
</script>

<div class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary-muted border border-primary/20 text-xs font-medium text-primary">
  <span class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
  <span>Demo Mode</span>

  {#if state.active}
    <span class="text-primary/60 tabular-nums">&middot; {state.currentStep + 1}/{TOUR_STEPS.length}</span>
  {/if}

  {#if !state.active && !state.completed}
    <button
      on:click={startTour}
      class="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-2xs font-semibold"
      title="Start guided tour"
    >
      <Play class="h-2.5 w-2.5" strokeWidth={3} />
      Tour
    </button>
  {:else if state.active}
    <button
      on:click={skipTour}
      class="ml-0.5 inline-flex items-center justify-center h-4 w-4 rounded hover:bg-primary/20 transition-colors"
      title="Skip tour"
    >
      <X class="h-3 w-3" strokeWidth={2.5} />
    </button>
  {/if}

  <span class="text-primary/20">|</span>
  <button
    on:click={exitDemo}
    class="inline-flex items-center gap-0.5 hover:text-destructive transition-colors text-2xs"
    title="Exit demo mode"
  >
    <LogOut class="h-3 w-3" strokeWidth={2} />
    Exit
  </button>
</div>
